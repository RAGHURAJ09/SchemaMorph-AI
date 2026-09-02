"""Query upload and parsing endpoint."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session

from app.parsers.query_parser import parse_queries
from app.api.dependencies import get_db
from app.core.security import get_current_user_id
from app.models.database import Project, WorkloadQuery

router = APIRouter()


class QueryUploadRequest(BaseModel):
    session_id: str
    queries: List[str]


@router.post("/upload-queries")
async def upload_queries(
    request: QueryUploadRequest, 
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Parse SQL queries, extract table access patterns, and save to Postgres.
    Requires a valid project ID (session_id) owned by the current user.
    """
    project = db.query(Project).filter(
        Project.id == request.session_id,
        Project.user_id == current_user_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project (Session) not found. Upload a schema first via /upload-schema.",
        )

    if not request.queries:
        raise HTTPException(status_code=400, detail="queries list is empty.")

    # Strip empty strings
    queries = [q.strip() for q in request.queries if q.strip()]
    if not queries:
        raise HTTPException(status_code=400, detail="All provided queries are empty strings.")

    # We still parse them to return analysis to the UI, 
    # but we also persist the raw queries to Postgres
    result = parse_queries(queries)
    
    # Persist to database
    for q_text in queries:
        # Very simple query typing heuristic
        q_type = "WRITE" if q_text.upper().startswith(("INSERT", "UPDATE", "DELETE")) else "READ"
        db_query = WorkloadQuery(
            project_id=project.id,
            query_text=q_text,
            query_type=q_type,
            frequency_weight=1
        )
        db.add(db_query)
        
    db.commit()

    return {
        "session_id": request.session_id,
        "query_count": len(result),
        "query_analysis": result,
        "message": f"Saved {len(queries)} queries.",
    }
