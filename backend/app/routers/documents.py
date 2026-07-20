"""
Document management endpoints.

UX change from the original build: uploading a document used to leave it
inert until the user clicked a separate "Ingest Documents" button, which
rebuilt the *entire* corpus from disk on every click (O(all documents) work
for every new file, and an extra manual step in the middle of a demo). Here,
each upload is chunked and indexed immediately as part of the same request --
one action, one clear result. A `/reindex` endpoint is kept for recovering
from a corrupt index or bulk-loading files dropped directly into the uploads
directory, which is the only scenario the old `/ingest` behavior was really
useful for.
"""
from __future__ import annotations

import logging
import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.config import get_settings
from app.ingestion import (
    chunk_document,
    load_text_for,
    safe_filename,
    validate_extension,
)
from app.schemas import (
    DocumentListResponse,
    DocumentStatus,
    DocumentSummary,
    EntityMatch,
    IngestResponse,
    ProactiveAlert,
    UploadResponse,
)
from app.security import get_current_user
from app.storage import get_store

logger = logging.getLogger("ikip.documents")
router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()


def _to_summary(doc) -> DocumentSummary:
    return DocumentSummary(
        id=doc.id,
        filename=doc.filename,
        uploaded_at=doc.uploaded_at,
        size_bytes=doc.size_bytes,
        status=DocumentStatus(doc.status),
        entity_count=doc.entity_count,
        chunk_count=doc.chunk_count,
    )


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    user: str = Depends(get_current_user),
) -> UploadResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    try:
        validate_extension(file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.max_upload_mb:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Max is {settings.max_upload_mb} MB.",
        )
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    os.makedirs(settings.upload_dir, exist_ok=True)
    stored_name = safe_filename(file.filename)
    filepath = os.path.join(settings.upload_dir, stored_name)
    with open(filepath, "wb") as f:
        f.write(contents)

    store = get_store()
    doc = store.add_document(filename=file.filename, filepath=filepath, size_bytes=len(contents))

    proactive_alert = ProactiveAlert(triggered=False)
    entities: list[str] = []

    try:
        text = load_text_for(filepath)
    except Exception as exc:  # noqa: BLE001 - surface as a failed doc, not a crash
        logger.exception("Failed to extract text from %s", file.filename)
        store.update_document(doc.id, status="failed")
        raise HTTPException(status_code=422, detail=f"Could not read file contents: {exc}") from exc

    if text.strip():
        from app.llm import extract_entities, generate_proactive_warnings, LLMUnavailableError

        try:
            entities = await extract_entities(text, file.filename)
        except LLMUnavailableError as exc:
            logger.warning("Entity extraction unavailable: %s", exc)
            entities = []

        cross_matches = store.record_entities(entities, file.filename)
        
        # --- PROACTIVE WARNING & COMPLIANCE AGENT INTEGRATION ---
        ai_warnings = []
        try:
            ai_warnings = generate_proactive_warnings(text)
        except Exception as warn_exc:
            logger.warning("Proactive AI warning generation bypassed: %s", warn_exc)

        if cross_matches or ai_warnings:
            matches = [
                EntityMatch(
                    entity=entity,
                    previously_found_in=store.previously_found_in(entity, file.filename),
                )
                for entity in cross_matches
            ]
            
            # Combine Entity Cross-Match & AI Compliance Warnings
            alert_msg = ""
            if cross_matches:
                alert_msg += (
                    f"Entity Linked: {cross_matches[0]} also appears in "
                    f"{', '.join(matches[0].previously_found_in)}."
                )
            if ai_warnings:
                if alert_msg:
                    alert_msg += " | "
                alert_msg += f"⚠️ AI Warning: {ai_warnings[0].get('message', 'Potential issue detected in history/compliance.')}"

            proactive_alert = ProactiveAlert(
                triggered=True,
                message=alert_msg,
                matches=matches,
            )

        chunks = chunk_document(file.filename, text)
        store.replace_chunks_for_document(file.filename, chunks)
        store.update_document(
            doc.id,
            status="ingested",
            entity_count=len(entities),
            chunk_count=len(chunks),
        )
    else:
        store.update_document(doc.id, status="failed")

    updated_doc = store.documents[doc.id]
    return UploadResponse(
        document=_to_summary(updated_doc),
        entities_extracted=entities,
        proactive_alert=proactive_alert,
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(user: str = Depends(get_current_user)) -> DocumentListResponse:
    store = get_store()
    docs = store.list_documents()
    return DocumentListResponse(
        documents=[_to_summary(d) for d in docs],
        total_chunks=len(store.all_chunks()),
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_document(document_id: str, user: str = Depends(get_current_user)) -> None:
    store = get_store()
    doc = store.delete_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")


@router.post("/reindex", response_model=IngestResponse)
async def reindex_documents(user: str = Depends(get_current_user)) -> IngestResponse:
    """Rebuild the chunk index from every file currently on disk in the
    upload directory. Useful for recovering state or bulk-loading files that
    were copied in directly rather than uploaded through the API."""
    store = get_store()
    if not os.path.isdir(settings.upload_dir):
        raise HTTPException(status_code=400, detail="Upload directory does not exist")

    total_chunks = 0
    docs_processed = 0
    for filename in os.listdir(settings.upload_dir):
        filepath = os.path.join(settings.upload_dir, filename)
        if not os.path.isfile(filepath):
            continue
        try:
            text = load_text_for(filepath)
        except ValueError:
            continue
        chunks = chunk_document(filename, text)
        store.replace_chunks_for_document(filename, chunks)
        total_chunks += len(chunks)
        docs_processed += 1

    return IngestResponse(
        message="Reindex complete",
        documents_ingested=docs_processed,
        chunks_loaded=total_chunks,
    )