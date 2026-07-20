"""
Pydantic schemas -- the single source of truth for the API's JSON contract.

Keeping every response shape defined here (rather than returning ad-hoc
dicts) gives us automatic OpenAPI docs, request/response validation, and a
contract the frontend team can code against without ever reading backend
logic -- exactly the "contract-first" split the PRD calls for.
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    username: str


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------
class DocumentStatus(str, Enum):
    uploaded = "uploaded"
    ingested = "ingested"
    failed = "failed"


class DocumentSummary(BaseModel):
    id: str
    filename: str
    uploaded_at: datetime
    size_bytes: int
    status: DocumentStatus
    entity_count: int = 0
    chunk_count: int = 0


class EntityMatch(BaseModel):
    entity: str
    previously_found_in: List[str]


class ProactiveAlert(BaseModel):
    triggered: bool
    message: Optional[str] = None
    matches: List[EntityMatch] = Field(default_factory=list)


class UploadResponse(BaseModel):
    document: DocumentSummary
    entities_extracted: List[str]
    proactive_alert: ProactiveAlert


class DocumentListResponse(BaseModel):
    documents: List[DocumentSummary]
    total_chunks: int


class IngestResponse(BaseModel):
    message: str
    documents_ingested: int
    chunks_loaded: int


# ---------------------------------------------------------------------------
# Query / Assistant
# ---------------------------------------------------------------------------
class QueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class SourceExcerpt(BaseModel):
    doc_name: str
    excerpt: str
    relevance_score: float


class QueryResponse(BaseModel):
    answer: str
    confidence: int = Field(ge=0, le=100)
    confidence_note: str
    needs_verification: bool
    sources: List[SourceExcerpt]
    reasoning_trace: List[str]


# ---------------------------------------------------------------------------
# Entities
# ---------------------------------------------------------------------------
class EntitySummary(BaseModel):
    name: str
    documents: List[str]
    mention_count: int
    first_seen: datetime
    last_seen: datetime
    related: List[str]
    cross_referenced: bool


class EntityListResponse(BaseModel):
    entities: List[EntitySummary]
    cross_referenced_count: int


# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    environment: str
    documents_loaded: int
    chunks_indexed: int
    llm_model: str
    retrieval_top_k: int
    chunk_size: int


class ErrorResponse(BaseModel):
    detail: str
    error_code: str
