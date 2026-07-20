from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import get_settings
from app.llm import LLMUnavailableError, generate_answer
from app.retrieval import get_retriever
from app.schemas import QueryRequest, QueryResponse, SourceExcerpt
from app.security import get_current_user
from app.storage import get_store

logger = logging.getLogger("ikip.query")
router = APIRouter(tags=["query"])
settings = get_settings()


@router.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest, user: str = Depends(get_current_user)) -> QueryResponse:
    store = get_store()
    chunks = store.all_chunks()
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No documents have been ingested yet. Upload a document first.",
        )

    retriever = get_retriever()
    scored = retriever.top_k(request.question, chunks, k=settings.top_k_chunks)
    if not scored:
        return QueryResponse(
            answer="I couldn't find anything in the ingested documents relevant to that question.",
            confidence=0,
            confidence_note="No matching content was found in the corpus.",
            needs_verification=True,
            sources=[],
            reasoning_trace=["Searched all ingested chunks; none shared meaningful terms with the question."],
        )

    context = "\n\n".join(f"[{s.chunk.source}] {s.chunk.content}" for s in scored)

    try:
        result = await generate_answer(request.question, context)
    except LLMUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"The language model is currently unavailable: {exc}",
        ) from exc

    confidence = max(0, min(100, result["confidence"]))
    sources = [
        SourceExcerpt(
            doc_name=s.chunk.source,
            excerpt=(s.chunk.content[:280] + "...") if len(s.chunk.content) > 280 else s.chunk.content,
            relevance_score=s.score,
        )
        for s in scored
    ]

    return QueryResponse(
        answer=result["answer"],
        confidence=confidence,
        confidence_note=result["confidence_note"],
        needs_verification=confidence < 70,
        sources=sources,
        reasoning_trace=result["reasoning_trace"],
    )
