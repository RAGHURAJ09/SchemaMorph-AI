"""
FastAPI Dependencies for Database Access.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.database import Base

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./schemamorph.db"
)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Auto-create tables on import so dev never encounters missing tables!
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not auto-create tables: {e}")

def get_db():
    """FastAPI dependency to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
