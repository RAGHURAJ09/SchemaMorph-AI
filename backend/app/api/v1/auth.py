"""
Authentication endpoints: register and login.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.database import User
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


ALLOWED_DOMAINS = {"gmail.com", "gla.ac.in", "yahoo.com", "outlook.com", "hotmail.com"}

def normalize_email(email: str) -> str:
    return email.strip().lower()

@router.post("/register", status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new user account."""
    email = normalize_email(req.email)
    domain = email.split("@")[-1]
    if domain not in ALLOWED_DOMAINS:
        raise HTTPException(
            status_code=422,
            detail=f"Email domain '@{domain}' is not allowed. Please use a supported provider."
        )

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email already registered.")
    if len(req.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters.")

    user = User(email=email, password_hash=hash_password(req.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered.")
    db.refresh(user)
    return {"id": user.id, "email": user.email, "created_at": user.created_at}


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Exchange credentials for a JWT access token."""
    email = normalize_email(req.email)
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(user_id=user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def get_me(db: Session = Depends(get_db)):
    """Quick health check for the auth system (open for demo)."""
    return {"status": "auth system online"}
