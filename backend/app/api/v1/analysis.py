"""
Analysis endpoint — orchestrates the full pipeline:
schema → graph → cluster → AI → validate → report
Persists and reads from PostgreSQL via SQLAlchemy.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import json

from app.api.dependencies import get_db
from app.models.database import Project, ParsedTable, TableDependency, WorkloadQuery, AnalysisRun, ServiceBoundary, QueryRefactoring
from app.graph.builder import build_graph, serialize_graph
from app.graph.clusterer import cluster_graph_with_timeout, get_cluster_summary
from app.ai.engine import run_analysis
from app.validation.validator import validate_analysis
from app.reports.generator import generate_report

router = APIRouter()


class AnalyzeRequest(BaseModel):
    session_id: str


@router.post("/analyze")
async def analyze(request: AnalyzeRequest, db: Session = Depends(get_db)):
    """
    Run the full analysis pipeline on a project.
    """
    project = db.query(Project).filter(Project.id == request.session_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # ── 1. Reconstruct schema_result from DB ─────────────────────────────────
    tables = db.query(ParsedTable).filter(ParsedTable.project_id == project.id).all()
    deps = db.query(TableDependency).filter(TableDependency.project_id == project.id).all()
    
    if not tables:
        raise HTTPException(status_code=400, detail="No schema uploaded for this project.")

    # ── Risk Mitigation: hard cap at 100 tables ────────────────────────────────
    TABLE_LIMIT = 100
    if len(tables) > TABLE_LIMIT:
        raise HTTPException(
            status_code=422,
            detail=f"Schema has {len(tables)} tables which exceeds the {TABLE_LIMIT}-table limit. "
                   f"Split your schema into smaller sections and analyze each separately."
        )

    schema_result = {
        "tables": {t.table_name: {"name": t.table_name, "columns": t.columns_metadata, "incoming_fk_count": 0, "is_hub": False, "is_isolated": False} for t in tables},
        "foreign_keys": []
    }
    
    for dep in deps:
        if dep.dependency_type == "FOREIGN_KEY":
            meta = dep.meta_data if hasattr(dep, 'meta_data') else getattr(dep, 'metadata', {})
            schema_result["foreign_keys"].append({
                "from_table": dep.source_table.table_name,
                "to_table": dep.target_table.table_name,
                "from_columns": (meta or {}).get("from_cols", ["unknown"]),
                "to_columns": (meta or {}).get("to_cols", ["unknown"]),
            })

    # ── 2. Reconstruct query_analyses from DB ────────────────────────────────
    queries = db.query(WorkloadQuery).filter(WorkloadQuery.project_id == project.id).all()
    query_analyses = []
    for q in queries:
        query_analyses.append({
            "query_id": q.id,
            "query_text": q.query_text,
            "all_tables": [], # Normally populated by parse_queries, simplified here for graph building
            "parse_error": None
        })

    # ── 3. Build graph & Cluster ─────────────────────────────────────────────
    graph = build_graph(schema_result, query_analyses)
    if len(graph.nodes) == 0:
        raise HTTPException(status_code=422, detail="Graph is empty.")

    partition, modularity, timeout_warning = cluster_graph_with_timeout(graph, timeout=10)
    cluster_summaries = get_cluster_summary(partition, schema_result)

    # ── 4. AI narration (LangChain) ──────────────────────────────────────────
    ai_result = run_analysis(cluster_summaries, query_analyses, schema_result)
    if timeout_warning:
        ai_result["general_recommendations"] = [
            timeout_warning
        ] + ai_result.get("general_recommendations", [])

    # ── 5. Validate & Serialize ──────────────────────────────────────────────
    validation_result = validate_analysis(partition, ai_result, query_analyses, schema_result)
    graph_data = serialize_graph(graph, partition)

    # ── 6. Persist Results to DB ─────────────────────────────────────────────
    run = AnalysisRun(
        project_id=project.id,
        status="COMPLETED",
        validation_summary=validation_result
    )
    db.add(run)
    db.flush() # Get run.id

    for svc in ai_result.get("services", []):
        boundary = ServiceBoundary(
            run_id=run.id,
            name=svc.get("service_name"),
            included_tables=svc.get("tables", []), # Assuming cluster_summaries maps back to this
        )
        db.add(boundary)

    for aq in ai_result.get("affected_queries", []):
        if aq.get("is_broken"):
            refactored = QueryRefactoring(
                run_id=run.id,
                original_query_id=aq.get("query_id"),
                refactored_sql=aq.get("fix_pattern", "N/A"),
                explanation=aq.get("fix_description", "")
            )
            db.add(refactored)

    db.commit()

    # ── 7. Assemble report ───────────────────────────────────────────────────
    report = generate_report(
        session_id=request.session_id,
        schema_result=schema_result,
        query_analyses=query_analyses,
        graph=graph,
        partition=partition,
        modularity=modularity,
        cluster_summaries=cluster_summaries,
        ai_result=ai_result,
        validation_result=validation_result,
        graph_data=graph_data,
    )
    report["run_id"] = run.id
    return report


@router.get("/session/{session_id}")
async def get_session_result(session_id: str, db: Session = Depends(get_db)):
    """Fetch the latest analysis run for a project."""
    run = db.query(AnalysisRun).filter(
        AnalysisRun.project_id == session_id
    ).order_by(AnalysisRun.created_at.desc()).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="No analysis result yet. Call POST /analyze first.")
    
    return {"status": run.status, "run_id": run.id, "validation": run.validation_summary}

