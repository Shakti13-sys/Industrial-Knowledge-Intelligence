from fastapi import APIRouter

from app.config import get_settings
from app.schemas import HealthResponse
from app.storage import get_store

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    store = get_store()
    return HealthResponse(
        status="ok",
        environment=settings.environment,
        documents_loaded=len(store.documents),
        chunks_indexed=len(store.all_chunks()),
        llm_model=settings.llm_model,
        retrieval_top_k=settings.top_k_chunks,
        chunk_size=settings.chunk_size,
    )
