import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    BigInteger,
    ForeignKey,
    DateTime,
    Float,
    JSON,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    """Standard user account table."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    """A workspace for a specific database transformation."""
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    source_schema_sql = Column(Text, nullable=True)  # Merged raw uploaded schema
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    user = relationship("User", back_populates="projects")
    tables = relationship("ParsedTable", back_populates="project", cascade="all, delete-orphan")
    queries = relationship("WorkloadQuery", back_populates="project", cascade="all, delete-orphan")
    analysis_runs = relationship("AnalysisRun", back_populates="project", cascade="all, delete-orphan")
    dependencies = relationship("TableDependency", back_populates="project", cascade="all, delete-orphan")


class ParsedTable(Base):
    """The structural metadata of the uploaded schema."""
    __tablename__ = "parsed_tables"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    table_name = Column(String(255), nullable=False)
    columns_metadata = Column(JSON, nullable=False, default=list)  # Compatible with Postgres & SQLite
    row_count_estimate = Column(BigInteger, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="tables")
    # For dependencies where this is the source
    outgoing_dependencies = relationship("TableDependency", foreign_keys="TableDependency.source_table_id", back_populates="source_table")
    # For dependencies where this is the target
    incoming_dependencies = relationship("TableDependency", foreign_keys="TableDependency.target_table_id", back_populates="target_table")


class TableDependency(Base):
    """The edges of your graph (foreign keys or AI-inferred logical JOINs)."""
    __tablename__ = "table_dependencies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    source_table_id = Column(String(36), ForeignKey("parsed_tables.id", ondelete="CASCADE"), nullable=False)
    target_table_id = Column(String(36), ForeignKey("parsed_tables.id", ondelete="CASCADE"), nullable=False)
    dependency_type = Column(String(50), nullable=False)  # 'FOREIGN_KEY', 'JOIN', etc.
    meta_data = Column("metadata", JSON, nullable=True)  # Store specific keys (e.g. {"from_cols": ["id"], "to_cols": ["user_id"]})

    # Relationships
    project = relationship("Project", back_populates="dependencies")
    source_table = relationship("ParsedTable", foreign_keys=[source_table_id], back_populates="outgoing_dependencies")
    target_table = relationship("ParsedTable", foreign_keys=[target_table_id], back_populates="incoming_dependencies")


class WorkloadQuery(Base):
    """The SQL queries the user submits to represent their app's behavior."""
    __tablename__ = "workload_queries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    query_text = Column(Text, nullable=False)
    query_type = Column(String(50), nullable=True)  # 'READ', 'WRITE'
    frequency_weight = Column(Integer, default=1)

    # Relationships
    project = relationship("Project", back_populates="queries")
    refactorings = relationship("QueryRefactoring", back_populates="original_query", cascade="all, delete-orphan")


class AnalysisRun(Base):
    """A record of the AI attempting to break down the monolith."""
    __tablename__ = "analysis_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)  # 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    validation_summary = Column(JSON, nullable=True)  # High-level validation output
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    project = relationship("Project", back_populates="analysis_runs")
    service_boundaries = relationship("ServiceBoundary", back_populates="run", cascade="all, delete-orphan")
    query_refactorings = relationship("QueryRefactoring", back_populates="run", cascade="all, delete-orphan")


class ServiceBoundary(Base):
    """The resulting microservices recommended by the AI."""
    __tablename__ = "service_boundaries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("analysis_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    included_tables = Column(JSON, nullable=False, default=list)  # Array of table names/IDs
    target_schema_sql = Column(Text, nullable=True)  # Merged localized target schema

    # Relationships
    run = relationship("AnalysisRun", back_populates="service_boundaries")


class QueryRefactoring(Base):
    """How the AI solved cross-boundary queries."""
    __tablename__ = "query_refactorings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("analysis_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    original_query_id = Column(String(36), ForeignKey("workload_queries.id", ondelete="CASCADE"), nullable=False)
    refactored_sql = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)

    # Relationships
    run = relationship("AnalysisRun", back_populates="query_refactorings")
    original_query = relationship("WorkloadQuery", back_populates="refactorings")
