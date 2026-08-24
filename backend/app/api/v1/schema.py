"""
Schema upload endpoint.
Accepts: multipart file upload OR raw SQL text in form field.
Persists structural metadata to PostgreSQL via SQLAlchemy.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.parsers.schema_parser import parse_schema
from app.api.dependencies import get_db
from app.models.database import User, Project, ParsedTable, TableDependency

router = APIRouter()


@router.post("/upload-schema")
async def upload_schema(
    file: Optional[UploadFile] = File(None),
    schema_text: Optional[str] = Form(None),
    project_name: str = Form("My Project"),
    db: Session = Depends(get_db)
):
    """
    Parse a PostgreSQL schema dump and save to Supabase/PostgreSQL.
    """
    # ── Get raw SQL ──────────────────────────────────────────────────────────
    if file is not None:
        raw = await file.read()
        try:
            sql_text = raw.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File must be valid UTF-8 text.")
    elif schema_text:
        sql_text = schema_text
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide either a .sql file (field: file) or raw SQL text (field: schema_text).",
        )

    if not sql_text.strip():
        raise HTTPException(status_code=400, detail="Schema text is empty.")

    # ── Parse ────────────────────────────────────────────────────────────────
    result = parse_schema(sql_text)

    if result["table_count"] == 0:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "No CREATE TABLE statements found in the provided schema.",
                "parse_errors": result["parse_errors"],
            },
        )

    # ── Persist to Database ──────────────────────────────────────────────────
    
    # 1. Ensure a dummy user exists for dev (Replace with JWT Auth later)
    user = db.query(User).first()
    if not user:
        user = User(email="demo@schemamorph.ai", password_hash="dummy")
        db.add(user)
        db.commit()
        db.refresh(user)

    # 2. Create Project
    project = Project(
        user_id=user.id,
        name=project_name,
        source_schema_sql=sql_text
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # 3. Create ParsedTables
    table_models = {}
    for tname, tdata in result["tables"].items():
        pt = ParsedTable(
            project_id=project.id,
            table_name=tname,
            columns_metadata=tdata["columns"],
            row_count_estimate=1000 # Dummy heuristic
        )
        db.add(pt)
        table_models[tname] = pt
    
    db.commit()
    for pt in table_models.values():
        db.refresh(pt)

    # 4. Create TableDependencies
    for fk in result["foreign_keys"]:
        from_table = table_models.get(fk["from_table"])
        to_table = table_models.get(fk["to_table"])
        
        if from_table and to_table:
            dep = TableDependency(
                project_id=project.id,
                source_table_id=from_table.id,
                target_table_id=to_table.id,
                dependency_type="FOREIGN_KEY",
                meta_data={
                    "from_cols": fk.get("from_columns", ["unknown"]),
                    "to_cols": fk.get("to_columns", ["unknown"])
                }
            )
            db.add(dep)
    
    db.commit()

    return {
        "session_id": project.id, # The frontend uses session_id conceptually as project_id
        "project_id": project.id,
        "table_count": result["table_count"],
        "fk_count": result["fk_count"],
        "tables": sorted(result["tables"].keys()),
        "parse_errors": result["parse_errors"],
        "message": f"Parsed {result['table_count']} tables and {result['fk_count']} foreign keys.",
    }
