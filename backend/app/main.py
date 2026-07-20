"""
IKIP API entrypoint.

Compared to the original single-file `main.py`, this app:
- restricts CORS to explicit configured origins (the old `allow_origins=["*"]`
  combined with `allow_credentials=True` is actually rejected by browsers,
  and permissive besides),
- requires auth on every data-touching route,
- returns structured, typed error responses instead of raw tracebacks,
- logs requests/errors instead of relying on `print`/silent `except: pass`,
- is organized into routers/services instead of one 234-line file mixing
  I/O, prompting, business logic, and HTTP handling together.
"""
from __future__ import annotations

import logging
import time

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import auth, documents, entities, health, query

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("ikip")

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Industrial Knowledge Intelligence Platform API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s -> %s (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error_code": f"HTTP_{exc.status_code}"},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred.", "error_code": "INTERNAL_ERROR"},
    )


app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(documents.router, prefix=settings.api_prefix)
app.include_router(entities.router, prefix=settings.api_prefix)
app.include_router(query.router, prefix=settings.api_prefix)
app.include_router(health.router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    return {"message": f"{settings.app_name} is running", "docs": "/docs"}
