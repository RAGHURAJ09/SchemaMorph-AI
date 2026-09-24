"""
FastAPI Dependencies for Database Access.
"""
import os
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from app.models.database import Base

DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///./schemamorph.db"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

try:
    Base.metadata.create_all(bind=engine)
    # Keep existing deployments compatible when models gain JSON report data.
    inspector = inspect(engine)
    if "analysis_runs" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("analysis_runs")}
        if "report_data" not in columns:
            with engine.begin() as connection:
                dialect = engine.dialect.name
                column_type = "JSONB" if dialect == "postgresql" else "JSON"
                connection.execute(
                    text(f"ALTER TABLE analysis_runs ADD COLUMN report_data {column_type}")
                )
except Exception as e:
    print(f"Warning: Could not auto-create tables: {e}")

def get_db():
    """FastAPI dependency to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
