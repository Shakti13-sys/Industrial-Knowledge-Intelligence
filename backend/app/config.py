"""
Centralized application configuration.

All tunables are read from environment variables (see .env.example) so the
same codebase can move from a laptop demo to a real deployment without code
changes -- only environment configuration changes.
"""
from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- App metadata -------------------------------------------------
    app_name: str = "IKIP API"
    environment: str = Field(default="development")  # development | production
    api_prefix: str = "/api"

    # --- CORS -----------------------------------------------------------
    # Comma separated list of allowed origins. Never use "*" together with
    # credentials in a browser context -- that combination is rejected by
    # browsers and is a common source of "CORS silently fails" bugs.
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # --- Auth -------------------------------------------------------------
    # Lightweight demo auth: a signed JWT issued to anyone who supplies the
    # correct demo credentials / API key. This is intentionally simple (the
    # PRD explicitly scopes out multi-tenant auth) but it is real: requests
    # to mutating or data-returning endpoints require a valid bearer token.
    jwt_secret: str = Field(default="change-me-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 12
    demo_username: str = "demo"
    demo_password: str = "ikip-demo"

    # --- LLM provider -------------------------------------------------
    groq_api_key: str = Field(default="")
    llm_model: str = "llama-3.3-70b-versatile"
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_timeout_seconds: int = 30

    # --- Storage --------------------------------------------------------
    upload_dir: str = "uploads"
    entities_file: str = "data/entities.json"
    documents_file: str = "data/documents.json"
    max_upload_mb: int = 15
    allowed_extensions: List[str] = [".pdf", ".txt"]

    # --- Retrieval --------------------------------------------------------
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k_chunks: int = 4

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
