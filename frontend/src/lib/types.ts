// Mirrors backend/app/schemas.py field-for-field. If a field isn't here,
// the backend doesn't provide it -- don't invent one in a component.

export type DocumentStatus = 'uploaded' | 'ingested' | 'failed';

export interface DocumentSummary {
  id: string;
  filename: string;
  uploaded_at: string;
  size_bytes: number;
  status: DocumentStatus;
  entity_count: number;
  chunk_count: number;
}

export interface EntityMatch {
  entity: string;
  previously_found_in: string[];
}

export interface ProactiveAlert {
  triggered: boolean;
  message: string | null;
  matches: EntityMatch[];
}

export interface UploadResponse {
  document: DocumentSummary;
  entities_extracted: string[];
  proactive_alert: ProactiveAlert;
}

export interface DocumentListResponse {
  documents: DocumentSummary[];
  total_chunks: number;
}

export interface SourceExcerpt {
  doc_name: string;
  excerpt: string;
  relevance_score: number;
}

export interface QueryResponse {
  answer: string;
  confidence: number;
  confidence_note: string;
  needs_verification: boolean;
  sources: SourceExcerpt[];
  reasoning_trace: string[];
}

export interface EntitySummary {
  name: string;
  documents: string[];
  mention_count: number;
  first_seen: string;
  last_seen: string;
  related: string[];
  cross_referenced: boolean;
}

export interface EntityListResponse {
  entities: EntitySummary[];
  cross_referenced_count: number;
}

export interface HealthResponse {
  status: string;
  environment: string;
  documents_loaded: number;
  chunks_indexed: number;
  llm_model: string;
  retrieval_top_k: number;
  chunk_size: number;
}

export interface ApiErrorBody {
  detail: string;
  error_code: string;
}

// -- Client-side only (not backend fields; derived/tracked in the browser) --
export interface SessionQuery {
  id: string;
  question: string;
  confidence: number;
  sourceCount: number;
  latencyMs: number;
  timestamp: string;
}

export interface SessionEvent {
  id: string;
  type: 'login' | 'upload' | 'alert' | 'query' | 'delete';
  title: string;
  description: string;
  timestamp: string;
}
