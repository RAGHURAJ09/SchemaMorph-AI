"""
JWT Authentication & Security Utilities.
Handles password hashing, token creation, and current user extraction.
"""
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, List
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY") or "schemamorph-dev-secret-key-32-bytes-minimum"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours — generous for demo use

# ── Password hashing ──────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── OAuth2 bearer scheme ──────────────────────────────────────────────────────
# tokenUrl points to the login endpoint in the Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def validate_password_complexity(password: str) -> Tuple[bool, List[str]]:
    """
    Validate that password meets complexity requirements:
    - At least 8 characters
    - At least one uppercase / capital letter (A-Z)
    - At least one lowercase / small letter (a-z)
    - At least one number (0-9)
    - At least one special character
    """
    errors = []
    if len(password) < 8:
        errors.append("At least 8 characters")
    if not re.search(r"[A-Z]", password):
        errors.append("At least one uppercase / capital letter")
    if not re.search(r"[a-z]", password):
        errors.append("At least one lowercase / small letter")
    if not re.search(r"[0-9]", password):
        errors.append("At least one number")
    if not re.search(r"[^A-Za-z0-9]", password):
        errors.append("At least one special character")
    return len(errors) == 0, errors


def hash_password(password: str, enforce_rules: bool = False) -> str:
    """Hash a plain-text password using bcrypt. If enforce_rules is True, validates strength."""
    if enforce_rules:
        is_valid, errors = validate_password_complexity(password)
        if not is_valid:
            raise ValueError(f"Password requirement not met: {', '.join(errors)}")
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    if not hashed_password or not plain_password:
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    """Create a signed JWT access token for the given user ID."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    """Decode a JWT and return the user_id (sub claim), or None if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    """
    FastAPI dependency — extracts and validates the bearer token.
    Inject via: Depends(get_current_user_id)
    """
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = decode_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id


def get_optional_user_id(token: str = Depends(oauth2_scheme)) -> Optional[str]:
    """
    Optional auth dependency — returns user_id or None.
    Use for endpoints that work both authenticated and anonymous (e.g. demo mode).
    """
    if token is None:
        return None
    return decode_token(token)
