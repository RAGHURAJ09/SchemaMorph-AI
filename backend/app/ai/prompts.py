"""
Prompt templates for LangChain.
"""
from langchain_core.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)

SYSTEM_TEMPLATE = """You are a senior database architect specializing in microservice decomposition.

You will receive:
1. Proposed service clusters — produced by Louvain graph analysis (these are FIXED, do not change them)
2. Foreign key relationships that cross cluster boundaries
3. SQL queries that may span multiple clusters

Your tasks:
1. Name each cluster as a service (PascalCase, ends in "Service", e.g. "UserService")
2. Write a 2-3 sentence rationale that is SPECIFIC to the tables in that cluster
3. List 2-3 concrete responsibilities for each service
4. Identify which queries are "broken" (they join tables that end up in different services)
5. For each broken query, name the architectural fix pattern and explain it concisely

CRITICAL RULES:
- Cluster assignments are FIXED. Never suggest moving a table to a different cluster.
- Service names must be PascalCase ending in "Service"
- Rationale must reference actual table names, not generic descriptions
- Fix patterns must be one of: "API Composition", "Shared Read Model", "Denormalization",
  "Event-Driven Sync", "Saga Pattern", "CQRS Read Model"

You MUST output your response matching the following JSON schema:
{format_instructions}
"""

HUMAN_TEMPLATE = """## DATABASE OVERVIEW
- Total tables: {table_count}
- Total foreign keys: {fk_count}
- Proposed service count: {cluster_count}

## PROPOSED SERVICE CLUSTERS (from Louvain graph analysis — DO NOT change these)
{clusters_text}

## SQL QUERIES TO ANALYZE
{queries_text}

## TASK
Analyze the clusters above and return the JSON response as specified.
For each query, determine if it is broken (spans multiple services).
Keep rationale concise and table-specific.
"""

def get_analysis_prompt() -> ChatPromptTemplate:
    """Return the LangChain ChatPromptTemplate for analysis."""
    return ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(SYSTEM_TEMPLATE),
        HumanMessagePromptTemplate.from_template(HUMAN_TEMPLATE),
    ])

def format_clusters(cluster_summaries: list) -> str:
    """Format the clusters into a string for the prompt."""
    parts = []
    for cluster in cluster_summaries:
        parts.append(f"\n### Cluster {cluster['cluster_id']}")
        parts.append(f"Tables ({cluster['table_count']}): {', '.join(cluster['tables'])}")
        if cluster.get("hub_tables"):
            parts.append(f"Hub tables (high connectivity): {', '.join(cluster['hub_tables'])}")
        parts.append(f"Internal FKs: {cluster.get('intra_fk_count', 0)}")
        parts.append(f"Cross-boundary FKs: {cluster.get('cross_fk_count', 0)}")
        for fk in cluster.get("cross_fks", [])[:5]:
            fc = ", ".join(fk["from_columns"])
            tc = ", ".join(fk["to_columns"])
            parts.append(f"  ⚠ {fk['from_table']}.{fc} → {fk['to_table']}.{tc}")
    return "\n".join(parts)

def format_queries(query_analyses: list) -> str:
    """Format the queries into a string for the prompt."""
    parts = []
    valid_queries = [q for q in query_analyses if not q.get("parse_error")][:20]
    if valid_queries:
        for qa in valid_queries:
            parts.append(f"\n### {qa['query_id']}")
            parts.append(f"Tables accessed: {', '.join(qa.get('all_tables', []))}")
            short_sql = qa["query_text"][:400]
            if len(qa["query_text"]) > 400:
                short_sql += "..."
            parts.append(f"SQL: {short_sql}")
    else:
        parts.append("No valid queries provided.")
    return "\n".join(parts)
