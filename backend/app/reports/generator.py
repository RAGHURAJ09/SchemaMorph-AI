"""
Report Generator
Assembles the final analysis object and generates target DDL per service.
"""
from collections import defaultdict
from typing import Dict, List
import networkx as nx


def generate_report(
    session_id: str,
    schema_result: dict,
    query_analyses: List[dict],
    graph: nx.Graph,
    partition: Dict[str, int],
    modularity: float,
    cluster_summaries: List[dict],
    ai_result: dict,
    validation_result: dict,
    graph_data: dict,
) -> dict:
    """Assemble the complete analysis report."""

    services = _build_services(partition, schema_result, ai_result)
    target_schemas = _generate_target_ddl(services, schema_result, partition)
    affected_queries = _build_affected_queries(query_analyses, partition, ai_result, validation_result)

    return {
        "session_id": session_id,
        "summary": {
            "total_tables": schema_result.get("table_count", 0),
            "total_queries_analyzed": len(query_analyses),
            "service_count": len(services),
            "broken_query_count": validation_result.get("broken_query_count", 0),
            "cross_boundary_fk_count": validation_result.get("cross_boundary_fk_count", 0),
            "modularity_score": modularity,
            "validation_passed": validation_result.get("passed", False),
            "ai_used": ai_result.get("ai_used", False),
        },
        "graph": graph_data,
        "services": services,
        "target_schemas": target_schemas,
        "affected_queries": affected_queries,
        "validation": validation_result,
        "general_recommendations": [
            r for r in ai_result.get("general_recommendations", []) if r
        ],
    }


# ── Private helpers ──────────────────────────────────────────────────────────

def _build_services(partition, schema_result, ai_result) -> List[dict]:
    cluster_members: Dict[int, List[str]] = defaultdict(list)
    for table, cluster in partition.items():
        cluster_members[cluster].append(table)

    ai_services = {s["cluster_id"]: s for s in ai_result.get("services", [])}
    tables = schema_result.get("tables", {})

    services = []
    for cluster_id in sorted(cluster_members.keys()):
        members = sorted(cluster_members[cluster_id])
        ai = ai_services.get(cluster_id, {})

        services.append({
            "service_id": f"svc_{cluster_id}",
            "cluster_id": cluster_id,
            "service_name": ai.get("service_name", f"Service{chr(65 + cluster_id)}"),
            "rationale": ai.get("rationale", "AI narration unavailable."),
            "responsibilities": ai.get("responsibilities", []),
            "tables": members,
            "table_count": len(members),
            "table_details": [
                {
                    "name": t,
                    "column_count": tables.get(t, {}).get("column_count", 0),
                    "is_hub": tables.get(t, {}).get("is_hub", False),
                }
                for t in members
            ],
        })

    return services


def _generate_target_ddl(services, schema_result, partition) -> List[dict]:
    tables = schema_result.get("tables", {})
    fk_by_table: Dict[str, list] = defaultdict(list)
    for fk in schema_result.get("foreign_keys", []):
        fk_by_table[fk["from_table"]].append(fk)

    target_schemas = []
    for svc in services:
        service_tables = set(svc["tables"])
        ddl_blocks = []
        removed_fks = []

        for tname in sorted(svc["tables"]):
            tdata = tables.get(tname)
            if not tdata:
                continue
            ddl = _table_to_ddl(tname, tdata, fk_by_table, service_tables, removed_fks)
            ddl_blocks.append(ddl)

        target_schemas.append({
            "service_id": svc["service_id"],
            "service_name": svc["service_name"],
            "ddl": "\n\n".join(ddl_blocks),
            "removed_fks": removed_fks,
            "removed_fk_count": len(removed_fks),
        })

    return target_schemas


def _table_to_ddl(tname, tdata, fk_by_table, service_tables, removed_fks_acc) -> str:
    col_lines = []
    primary_keys = set(tdata.get("primary_keys", []))

    for col in tdata.get("columns", []):
        line = f"  {col['name']} {col['type']}"
        if col["name"] in primary_keys:
            line += " PRIMARY KEY"
        elif not col.get("nullable", True):
            line += " NOT NULL"
        if col.get("default"):
            line += f" DEFAULT {col['default']}"
        col_lines.append(line)

    # FK constraints
    for fk in fk_by_table.get(tname, []):
        from_c = ", ".join(fk["from_columns"])
        to_c   = ", ".join(fk["to_columns"])

        if fk["to_table"] in service_tables:
            # ── Intra-service FK: keep as-is ─────────────────────────────────
            col_lines.append(
                f"  FOREIGN KEY ({from_c}) REFERENCES {fk['to_table']} ({to_c})"
            )
        else:
            # ── Cross-service FK: cannot be a DB-level constraint when each
            #    service owns its own database.  Show 4 implementation options
            #    so the developer can choose the right strategy. ────────────────
            service_name = fk["to_table"].replace("_", " ").title()
            col_lines.append(
                f"\n"
                f"  -- ╔══ CROSS-SERVICE RELATIONSHIP ══════════════════════════════════════╗\n"
                f"  -- ║  {from_c} → {fk['to_table']}.{to_c}\n"
                f"  -- ║  '{fk['to_table']}' belongs to a different service.\n"
                f"  -- ║  Choose ONE of the following implementation strategies:\n"
                f"  -- ╠══════════════════════════════════════════════════════════════════════╣\n"
                f"  -- ║  [1] SHARED DATABASE  — keep the FK if both services share one DB:\n"
                f"  -- ║      FOREIGN KEY ({from_c}) REFERENCES {fk['to_table']} ({to_c})\n"
                f"  -- ║\n"
                f"  -- ║  [2] API COMPOSITION  — validate via HTTP call before insert:\n"
                f"  -- ║      GET /api/{fk['to_table']}/{{id}}  → 200 OK before writing\n"
                f"  -- ║\n"
                f"  -- ║  [3] EVENT-DRIVEN     — subscribe to {service_name}Created events,\n"
                f"  -- ║      cache ids locally in a lookup table for fast validation.\n"
                f"  -- ║\n"
                f"  -- ║  [4] SAGA PATTERN     — use a distributed saga / outbox for\n"
                f"  -- ║      transactional consistency across service boundaries.\n"
                f"  -- ╚══════════════════════════════════════════════════════════════════════╝"
            )
            removed_fks_acc.append({
                "from_table":   tname,
                "from_columns": fk["from_columns"],
                "to_table":     fk["to_table"],
                "to_columns":   fk["to_columns"],
                "reason": (
                    f"Cross-service boundary: '{fk['to_table']}' belongs to a different service. "
                    f"Implement via: [1] Shared DB FK  [2] API Composition  "
                    f"[3] Event-Driven Sync  [4] Saga Pattern"
                ),
                "strategies": [
                    {
                        "id": "shared_db",
                        "name": "Shared Database",
                        "description": f"Keep the FK if both services share one database.",
                        "sql": f"FOREIGN KEY ({from_c}) REFERENCES {fk['to_table']} ({to_c})",
                    },
                    {
                        "id": "api_composition",
                        "name": "API Composition",
                        "description": f"Validate {from_c} by calling the {fk['to_table']} service REST API before any INSERT.",
                        "sql": None,
                    },
                    {
                        "id": "event_driven",
                        "name": "Event-Driven Sync",
                        "description": f"Subscribe to {service_name}Created events and cache {to_c} locally in a lookup table.",
                        "sql": None,
                    },
                    {
                        "id": "saga",
                        "name": "Saga Pattern",
                        "description": "Use a choreography or orchestration saga with compensating transactions.",
                        "sql": None,
                    },
                ],
            })

    body = ",\n".join(col_lines)
    return f"CREATE TABLE {tname} (\n{body}\n);"


def _build_affected_queries(query_analyses, partition, ai_result, validation_result) -> List[dict]:
    broken_ids = set(validation_result.get("broken_query_ids", []))
    ai_queries = {aq["query_id"]: aq for aq in ai_result.get("affected_queries", [])}

    result = []
    for qa in query_analyses:
        qid = qa["query_id"]
        ai_q = ai_queries.get(qid, {})
        result.append({
            "query_id": qid,
            "query_text": qa["query_text"],
            "tables_read": qa.get("tables_read", []),
            "tables_written": qa.get("tables_written", []),
            "all_tables": qa.get("all_tables", []),
            "is_broken": qid in broken_ids,
            "broken_joins": ai_q.get("broken_joins", []),
            "fix_pattern": ai_q.get("fix_pattern", ""),
            "fix_description": ai_q.get("fix_description", ""),
            "parse_error": qa.get("parse_error"),
        })

    return result
