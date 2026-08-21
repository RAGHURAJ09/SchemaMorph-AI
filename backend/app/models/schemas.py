"""Pydantic models for request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


# ── Schema Upload ────────────────────────────────────────────────────────────

class SchemaUploadResponse(BaseModel):
    session_id: str
    table_count: int
    fk_count: int
    tables: List[str]
    parse_errors: List[Dict[str, Any]] = []
    message: str


# ── Query Upload ─────────────────────────────────────────────────────────────

class QueryUploadRequest(BaseModel):
    session_id: str
    queries: List[str] = Field(..., min_length=1, description="List of SQL query strings")


class SingleQueryAnalysis(BaseModel):
    query_id: str
    tables_read: List[str]
    tables_written: List[str]
    all_tables: List[str]
    joins: List[Dict[str, Any]]
    join_count: int
    parse_error: Optional[str] = None


class QueryUploadResponse(BaseModel):
    session_id: str
    query_count: int
    query_analysis: List[SingleQueryAnalysis]
    message: str


# ── Analysis Request ─────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    session_id: str


# ── Analysis Response ────────────────────────────────────────────────────────

class GraphNode(BaseModel):
    id: str
    label: str
    cluster_id: int
    color: str
    is_hub: bool
    is_isolated: bool
    column_count: int
    degree_centrality: float
    betweenness_centrality: float


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    weight: float
    fk_count: int
    co_access_count: int
    is_cross_service: bool


class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class ServiceDefinition(BaseModel):
    service_id: str
    cluster_id: int
    service_name: str
    rationale: str
    responsibilities: List[str]
    tables: List[str]
    table_count: int


class TargetSchema(BaseModel):
    service_id: str
    service_name: str
    ddl: str
    removed_fks: List[Dict[str, Any]]
    removed_fk_count: int


class AffectedQuery(BaseModel):
    query_id: str
    query_text: str
    tables_read: List[str]
    tables_written: List[str]
    all_tables: List[str]
    is_broken: bool
    broken_joins: List[str]
    fix_pattern: str
    fix_description: str
    parse_error: Optional[str] = None


class ValidationResult(BaseModel):
    passed: bool
    error_count: int
    warning_count: int
    errors: List[str]
    warnings: List[str]
    cross_boundary_fk_count: int
    broken_query_count: int
    broken_query_ids: List[str]


class AnalysisSummary(BaseModel):
    total_tables: int
    total_queries_analyzed: int
    service_count: int
    broken_query_count: int
    cross_boundary_fk_count: int
    modularity_score: float
    validation_passed: bool
    ai_used: bool


class AnalysisResponse(BaseModel):
    session_id: str
    summary: AnalysisSummary
    graph: GraphData
    services: List[ServiceDefinition]
    target_schemas: List[TargetSchema]
    affected_queries: List[AffectedQuery]
    validation: ValidationResult
    general_recommendations: List[str]
