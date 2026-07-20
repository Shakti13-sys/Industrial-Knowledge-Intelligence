from fastapi import APIRouter, Depends

from app.schemas import EntityListResponse, EntitySummary
from app.security import get_current_user
from app.storage import get_store

router = APIRouter(prefix="/entities", tags=["entities"])


@router.get("", response_model=EntityListResponse)
async def list_entities(user: str = Depends(get_current_user)) -> EntityListResponse:
    """Real, computed entity intelligence -- no fabricated type/confidence/
    risk fields. Every value here is derived directly from stored documents
    and their extracted entities (see Store.entity_summaries)."""
    store = get_store()
    summaries = [EntitySummary(**s) for s in store.entity_summaries()]
    return EntityListResponse(
        entities=summaries,
        cross_referenced_count=sum(1 for s in summaries if s.cross_referenced),
    )
