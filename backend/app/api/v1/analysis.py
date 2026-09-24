"""
Analysis endpoint - orchestrates the full pipeline:
schema -> graph -> cluster -> AI -> validate -> report
Persists and reads from PostgreSQL via SQLAlchemy.

FIXES applied:
  Bug 1: column_count, primary_keys, per-table foreign_keys reconstructed from columns_metadata
  Bug 2: _compute_table_metrics called after DB reconstruction (is_hub / is_isolated)
  Bug 3: joinedload for FK deps (no N+1 lazy-load)
  Bug 4: query all_tables re-parsed with query_parser (was always [])
  Bug 5: table_count / fk_count set on schema_result (was missing -> AI prompt got 0/0)
"""
import asyncio
import os

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_db
from app.core.security import get_current_user_id
from app.models.database import (
    Project, ParsedTable, TableDependency, WorkloadQuery,
    AnalysisRun, ServiceBoundary, QueryRefactoring,
)
from app.graph.builder import build_graph, serialize_graph
from app.graph.clusterer import cluster_graph_with_timeout, get_cluster_summary
from app.ai.engine import run_analysis, _fallback
from app.validation.validator import validate_analysis
from app.reports.generator import generate_report
from app.parsers.schema_parser import _compute_table_metrics
from app.parsers.query_parser import parse_queries as _parse_queries

router = APIRouter()


class AnalyzeRequest(BaseModel):
    session_id: str


@router.post("/analyze")
async def analyze(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Run the full analysis pipeline on a project.
    """
    project = db.query(Project).filter(
        Project.id == request.session_id,
        Project.user_id == current_user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # ---- 1. Load ParsedTables from DB ----------------------------------------
    tables = db.query(ParsedTable).filter(
        ParsedTable.project_id == project.id
    ).all()

    if not tables:
        raise HTTPException(status_code=400, detail="No schema uploaded for this project.")

    TABLE_LIMIT = 100
    if len(tables) > TABLE_LIMIT:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Schema has {len(tables)} tables which exceeds the {TABLE_LIMIT}-table limit. "
                "Split your schema into smaller sections and analyze each separately."
            ),
        )

    # ---- 2. Eager-load FK dependencies (Bug 3 fix: avoids N+1 lazy-load) -----
    deps = (
        db.query(TableDependency)
        .filter(TableDependency.project_id == project.id)
        .options(
            joinedload(TableDependency.source_table),
            joinedload(TableDependency.target_table),
        )
        .all()
    )

    # Build flat FK list + per-table FK lookup for DDL generation later
    foreign_keys_list = []
    table_fk_lookup = {t.table_name: [] for t in tables}

    for dep in deps:
        if dep.dependency_type == "FOREIGN_KEY":
            meta = dep.meta_data or {}
            from_tname = dep.source_table.table_name
            to_tname   = dep.target_table.table_name
            fk_entry = {
                "from_table":   from_tname,
                "to_table":     to_tname,
                "from_columns": meta.get("from_cols", ["unknown"]),
                "to_columns":   meta.get("to_cols",   ["unknown"]),
            }
            foreign_keys_list.append(fk_entry)
            if from_tname in table_fk_lookup:
                table_fk_lookup[from_tname].append(fk_entry)

    # ---- 3. Reconstruct full schema_result (Bugs 1, 5 fix) -------------------
    # Derive column_count, primary_keys, and per-table foreign_keys from the
    # columns_metadata JSON stored in parsed_tables.  Also set table_count and
    # fk_count so the AI prompt receives real numbers (was 0/0 before).
    schema_tables = {}
    for t in tables:
        cols = t.columns_metadata or []
        col_count = len(cols)
        primary_keys = [c["name"] for c in cols if c.get("is_primary_key")]
        schema_tables[t.table_name] = {
            "name":               t.table_name,
            "columns":            cols,
            "column_count":       col_count,
            "primary_keys":       primary_keys,
            "foreign_keys":       table_fk_lookup.get(t.table_name, []),
            "unique_constraints": [],
            # Filled in by _compute_table_metrics below
            "incoming_fk_count":  0,
            "is_hub":             False,
            "is_isolated":        False,
        }

    schema_result = {
        "tables":       schema_tables,
        "foreign_keys": foreign_keys_list,
        "enums":        {},
        "parse_errors": [],
        "table_count":  len(schema_tables),
        "fk_count":     len(foreign_keys_list),
    }

    # Bug 2 fix: recompute hub / isolated / incoming_fk_count metrics
    _compute_table_metrics(schema_result["tables"], schema_result["foreign_keys"])

    # ---- 4. Reconstruct query_analyses with real all_tables (Bug 4 fix) ------
    # Re-parse each saved query text so all_tables is populated for the
    # graph builder's co-access edge weighting.
    queries = db.query(WorkloadQuery).filter(
        WorkloadQuery.project_id == project.id
    ).all()

    if queries:
        parsed = _parse_queries([q.query_text for q in queries])
        query_analyses = []
        for i, qa in enumerate(parsed):
            qa["query_id"] = queries[i].id   # use the real DB UUID
            query_analyses.append(qa)
    else:
        query_analyses = []

    # ---- 5. Build graph & Cluster --------------------------------------------
    graph = build_graph(schema_result, query_analyses)
    if len(graph.nodes) == 0:
        raise HTTPException(status_code=422, detail="Graph is empty.")

    partition, modularity, timeout_warning = cluster_graph_with_timeout(graph, timeout=10)
    cluster_summaries = get_cluster_summary(partition, schema_result)

    # ---- 6. AI narration (LangChain / Gemini) --------------------------------
    # Keep the deterministic graph result responsive when the external AI API
    # is slow or unavailable. The worker may finish later, but this request
    # returns a complete fallback report instead of hanging.
    ai_timeout = max(1, int(os.getenv("AI_ANALYSIS_TIMEOUT_SECONDS", "8")))
    try:
        ai_result = await asyncio.wait_for(
            asyncio.to_thread(
                run_analysis,
                cluster_summaries,
                query_analyses,
                schema_result,
            ),
            timeout=ai_timeout,
        )
    except asyncio.TimeoutError:
        ai_result = _fallback(
            cluster_summaries,
            query_analyses,
            reason=f"AI narration timed out after {ai_timeout} seconds",
        )
    if timeout_warning:
        ai_result["general_recommendations"] = [
            timeout_warning
        ] + ai_result.get("general_recommendations", [])

    # ---- 7. Validate & Serialize ---------------------------------------------
    validation_result = validate_analysis(partition, ai_result, query_analyses, schema_result)
    graph_data = serialize_graph(graph, partition)

    # ---- 8. Persist Results to DB --------------------------------------------
    run = AnalysisRun(
        project_id=project.id,
        status="COMPLETED",
        validation_summary=validation_result
    )
    db.add(run)
    db.flush()  # get run.id before inserting children

    for svc in ai_result.get("services", []):
        boundary = ServiceBoundary(
            run_id=run.id,
            name=svc.get("service_name"),
            included_tables=svc.get("tables", []),
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

    # ---- 9. Assemble & return report -----------------------------------------
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

    run.report_data = report
    db.commit()

    return report


@router.get("/session/{session_id}")
async def get_session_result(
    session_id: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Fetch the latest analysis run for a project."""
    project = db.query(Project).filter(
        Project.id == session_id,
        Project.user_id == current_user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    run = db.query(AnalysisRun).filter(
        AnalysisRun.project_id == session_id
    ).order_by(AnalysisRun.created_at.desc()).first()

    if not run:
        raise HTTPException(
            status_code=404,
            detail="No analysis result yet. Call POST /analyze first."
        )

    if run.report_data:
        return run.report_data

    return {"status": run.status, "run_id": run.id, "validation": run.validation_summary}


@router.get("/projects")
async def list_projects(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """List all projects for the current user, with summary stats for History page."""
    projects = db.query(Project).filter(
        Project.user_id == current_user_id
    ).order_by(Project.created_at.desc()).all()

    result = []
    for p in projects:
        table_count = db.query(ParsedTable).filter(ParsedTable.project_id == p.id).count()
        latest_run = db.query(AnalysisRun).filter(
            AnalysisRun.project_id == p.id
        ).order_by(AnalysisRun.created_at.desc()).first()

        service_count = 0
        broken_query_count = 0
        status = "PENDING"

        if latest_run:
            status = latest_run.status
            service_count = db.query(ServiceBoundary).filter(
                ServiceBoundary.run_id == latest_run.id
            ).count()
            broken_query_count = db.query(QueryRefactoring).filter(
                QueryRefactoring.run_id == latest_run.id
            ).count()

        result.append({
            "id":                 p.id,
            "name":               p.name,
            "created_at":         p.created_at.isoformat() if p.created_at else None,
            "status":             status,
            "table_count":        table_count,
            "service_count":      service_count,
            "broken_query_count": broken_query_count,
        })

    return result


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete a project and all its associated data."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully."}
