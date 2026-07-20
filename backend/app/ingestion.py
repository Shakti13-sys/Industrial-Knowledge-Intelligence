"""
Document ingestion: loading raw bytes into clean text chunks.

Security note: the original implementation joined the *user-supplied*
filename directly onto the upload directory (`os.path.join(UPLOAD_DIR,
file.filename)`), which allows a path-traversal filename such as
`../../etc/passwd` to escape the uploads directory. `safe_filename()` below
closes that hole by stripping any path component and disallowing empty or
dotfile names.
"""
from __future__ import annotations

import os
import re
import uuid
from typing import List

from pypdf import PdfReader

from app.config import get_settings
from app.storage import Chunk

settings = get_settings()

_UNSAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]")


def safe_filename(original: str) -> str:
    """Return a filesystem-safe, collision-resistant filename derived from
    the user-supplied name, discarding any directory components."""
    base = os.path.basename(original or "upload")
    base = _UNSAFE_CHARS.sub("_", base).strip("._") or "upload"
    name, ext = os.path.splitext(base)
    return f"{name[:80]}-{uuid.uuid4().hex[:8]}{ext.lower()}"


def validate_extension(filename: str) -> None:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in settings.allowed_extensions:
        raise ValueError(
            f"Unsupported file type '{ext}'. Allowed types: {', '.join(settings.allowed_extensions)}"
        )


def load_pdf(filepath: str) -> str:
    reader = PdfReader(filepath)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def load_txt(filepath: str) -> str:
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def load_text_for(filepath: str) -> str:
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".pdf":
        return load_pdf(filepath)
    if ext == ".txt":
        return load_txt(filepath)
    raise ValueError(f"Unsupported extension: {ext}")


def split_text(text: str, chunk_size: int | None = None, overlap: int | None = None) -> List[str]:
    chunk_size = chunk_size or settings.chunk_size
    overlap = overlap or settings.chunk_overlap
    text = text.strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start += chunk_size - overlap
    return chunks


def chunk_document(filename: str, text: str) -> List[Chunk]:
    return [
        Chunk(content=piece, source=filename, chunk_index=i)
        for i, piece in enumerate(split_text(text))
    ]


def ingest_and_check_document(filename: str, filepath: str) -> dict:
    """
    1. Text extract karta hai
    2. Chunks banata hai
    3. Proactive Warning Agent chala kar compliance/historical warnings check karta hai
    """
    # 1. Text load aur chunking
    full_text = load_text_for(filepath)
    chunks = chunk_document(filename, full_text)
    
    # 2. Proactive Warning Check (Dynamic Import to avoid import error/circular dependency)
    warnings = []
    try:
        from app.llm import generate_proactive_warnings
        warnings = generate_proactive_warnings(full_text)
    except Exception as e:
        print(f"Warning generation bypassed or failed: {e}")
        warnings = []

    return {
        "chunks": chunks,
        "warnings": warnings,
        "total_chunks": len(chunks)
    }