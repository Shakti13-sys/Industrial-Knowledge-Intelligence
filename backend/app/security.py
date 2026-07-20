"""
Lightweight JWT-based auth.

The original prototype had zero authentication -- every endpoint was wide
open. The PRD explicitly (and reasonably) scopes out multi-tenant auth for a
2-person hackathon build, but "no auth at all" is a real production and demo
risk (anyone on the network can upload files or exhaust the LLM quota).

This module adds a minimal but real auth layer: a single demo account issues
a signed, expiring JWT; protected routes require it. It is intentionally
small -- swapping in SSO/OAuth later only means replacing `login()`, not the
dependency contract other routers rely on.
"""
from datetime import datetime, timedelta, timezone
import hashlib

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Return a SHA-256 hash for secure user password storage and lookup."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def create_access_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expires_minutes)
    payload = {"sub": username, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        username = payload.get("sub")
        if not username:
            raise ValueError("Token missing subject")
        return username
    except (JWTError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decode_access_token(credentials.credentials)