from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.schemas import LoginRequest, TokenResponse
from app.security import create_access_token, hash_password
from app.storage import get_store

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    """Issue a demo bearer token."""
    # Demo credentials check
    if payload.username != settings.demo_username or payload.password != settings.demo_password:
        # Also check in-memory store if user was newly registered
        store = get_store()
        if hasattr(store, "users") and payload.username in store.users:
            stored_user = store.users[payload.username]
            # Simple check if password matches
            if stored_user.get("password_hash") != hash_password(payload.password):
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        else:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(payload.username)
    return TokenResponse(
        access_token=token,
        expires_in_minutes=settings.jwt_expires_minutes,
        username=payload.username,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(payload: LoginRequest):
    """Register a new user in the in-memory store and return an access token."""
    store = get_store()

    # Initialize users dict in store if missing
    if not hasattr(store, "users"):
        store.users = {}

    if payload.username in store.users or payload.username == settings.demo_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists. Please login or choose another.",
        )

    hashed = hash_password(payload.password)
    store.users[payload.username] = {"password_hash": hashed}

    token = create_access_token(payload.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": payload.username,
        "expires_in_minutes": settings.jwt_expires_minutes,
    }