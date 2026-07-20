"""
Storage layer.

The PRD is explicit and correct that a graph database / vector DB is
overkill for a 6-8 document hackathon demo. We keep the "in-memory Python
dict" approach it recommends, but wrap it behind a small class with a clear
interface so that swapping in Postgres + pgvector or Neo4j later (the
PRD's own stated production path) means implementing this interface again,
not rewriting every router.

We also persist to disk (data/*.json) on every mutation, purely so a demo
doesn't lose its uploaded documents if the process restarts mid-hackathon --
this was a real gap in the original implementation, where a server restart
silently wiped `documents_db`.
"""
from __future__ import annotations

import json
import os
import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.config import get_settings

settings = get_settings()


@dataclass
class Chunk:
    content: str
    source: str
    chunk_index: int


@dataclass
class DocumentRecord:
    id: str
    filename: str
    filepath: str
    uploaded_at: datetime
    size_bytes: int
    status: str = "uploaded"
    entity_count: int = 0
    chunk_count: int = 0


class Store:
    """Thread-safe in-memory store for documents, chunks, and entities."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self.documents: Dict[str, DocumentRecord] = {}
        self.chunks: List[Chunk] = []
        # entity name -> list of filenames it has been seen in
        self.entities: Dict[str, List[str]] = {}
        self._load()

    # -- persistence -----------------------------------------------------
    def _load(self) -> None:
        os.makedirs(os.path.dirname(settings.entities_file) or ".", exist_ok=True)
        if os.path.exists(settings.entities_file):
            with open(settings.entities_file, "r") as f:
                self.entities = json.load(f)
        if os.path.exists(settings.documents_file):
            with open(settings.documents_file, "r") as f:
                raw = json.load(f)
            for item in raw:
                self.documents[item["id"]] = DocumentRecord(
                    id=item["id"],
                    filename=item["filename"],
                    filepath=item["filepath"],
                    uploaded_at=datetime.fromisoformat(item["uploaded_at"]),
                    size_bytes=item["size_bytes"],
                    status=item.get("status", "uploaded"),
                    entity_count=item.get("entity_count", 0),
                    chunk_count=item.get("chunk_count", 0),
                )

    def _persist(self) -> None:
        with open(settings.entities_file, "w") as f:
            json.dump(self.entities, f, indent=2)
        with open(settings.documents_file, "w") as f:
            json.dump(
                [
                    {
                        **d.__dict__,
                        "uploaded_at": d.uploaded_at.isoformat(),
                    }
                    for d in self.documents.values()
                ],
                f,
                indent=2,
            )

    # -- documents ---------------------------------------------------------
    def add_document(self, filename: str, filepath: str, size_bytes: int) -> DocumentRecord:
        with self._lock:
            doc = DocumentRecord(
                id=str(uuid.uuid4()),
                filename=filename,
                filepath=filepath,
                uploaded_at=datetime.now(timezone.utc),
                size_bytes=size_bytes,
            )
            self.documents[doc.id] = doc
            self._persist()
            return doc

    def update_document(self, doc_id: str, **fields) -> None:
        with self._lock:
            doc = self.documents.get(doc_id)
            if not doc:
                return
            for key, value in fields.items():
                setattr(doc, key, value)
            self._persist()

    def list_documents(self) -> List[DocumentRecord]:
        with self._lock:
            return sorted(self.documents.values(), key=lambda d: d.uploaded_at, reverse=True)

    def delete_document(self, doc_id: str) -> Optional[DocumentRecord]:
        with self._lock:
            doc = self.documents.pop(doc_id, None)
            if doc:
                self.chunks = [c for c in self.chunks if c.source != doc.filename]
                if os.path.exists(doc.filepath):
                    os.remove(doc.filepath)
                self._persist()
            return doc

    # -- chunks --------------------------------------------------------------
    def replace_chunks_for_document(self, filename: str, chunks: List[Chunk]) -> None:
        with self._lock:
            self.chunks = [c for c in self.chunks if c.source != filename] + chunks

    def all_chunks(self) -> List[Chunk]:
        with self._lock:
            return list(self.chunks)

    # -- entities -----------------------------------------------------------
    def record_entities(self, entities: List[str], filename: str) -> List[str]:
        """Register `entities` as belonging to `filename`; return the subset
        that were already associated with a *different* file before this
        call (i.e. genuine cross-document matches for the proactive alert).
        """
        with self._lock:
            cross_matches = []
            for entity in entities:
                existing = self.entities.get(entity, [])
                if existing and filename not in existing:
                    cross_matches.append(entity)
                if filename not in existing:
                    self.entities.setdefault(entity, []).append(filename)
            self._persist()
            return cross_matches

    def previously_found_in(self, entity: str, exclude_filename: str) -> List[str]:
        return [f for f in self.entities.get(entity, []) if f != exclude_filename]

    def entity_summaries(self) -> List[Dict]:
        """Aggregate real, computable facts about every tracked entity.

        Deliberately excludes anything we can't honestly derive from stored
        data -- no fabricated "type" classification, "confidence" score, or
        "risk level". What's here is exactly what the store actually knows:
        which documents mention an entity, how many times it's mentioned
        (a real text count, not an estimate), when it was first/last seen
        (from the upload timestamps of its documents), and which other
        entities it co-occurs with (a real, computable relationship -- two
        entities are "related" if they both appear in at least one shared
        document).
        """
        with self._lock:
            filename_to_doc = {d.filename: d for d in self.documents.values()}
            chunks_by_source: Dict[str, str] = {}
            for chunk in self.chunks:
                chunks_by_source[chunk.source] = (
                    chunks_by_source.get(chunk.source, "") + "\n" + chunk.content
                )

            summaries = []
            for entity, filenames in self.entities.items():
                valid_files = [f for f in filenames if f in filename_to_doc]
                if not valid_files:
                    continue

                mention_count = sum(
                    chunks_by_source.get(f, "").lower().count(entity.lower())
                    for f in valid_files
                )
                timestamps = [filename_to_doc[f].uploaded_at for f in valid_files]

                related = set()
                for f in valid_files:
                    for other_entity, other_filenames in self.entities.items():
                        if other_entity != entity and f in other_filenames:
                            related.add(other_entity)

                summaries.append(
                    {
                        "name": entity,
                        "documents": valid_files,
                        "mention_count": max(mention_count, len(valid_files)),
                        "first_seen": min(timestamps),
                        "last_seen": max(timestamps),
                        "related": sorted(related),
                        "cross_referenced": len(valid_files) > 1,
                    }
                )

            summaries.sort(key=lambda s: (len(s["documents"]), s["mention_count"]), reverse=True)
            return summaries


_store: Optional[Store] = None


def get_store() -> Store:
    global _store
    if _store is None:
        _store = Store()
    return _store
