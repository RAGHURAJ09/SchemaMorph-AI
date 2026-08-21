"""
Validator Module
Checks internal consistency of the analysis output.

DETERMINISTIC — no AI involved.
Catches: orphan tables, cross-boundary FKs, broken queries, circular service deps.
"""
from typing import Dict, List


def validate_analysis(
    partition: Dict[str, int],
    ai_result: dict,
    query_analyses: List[dict],
    schema_result: dict,
) -> dict:
    """
    Validate the analysis output for internal consistency.

    Returns:
        {passed, error_count, warning_count, errors, warnings,
         cross_boundary_fk_count, broken_query_count, broken_query_ids}
    """
    warnings: List[str] = []
    errors: List[str] = []

    all_tables = set(schema_result.get("tables", {}).keys())
    partitioned_tables = set(partition.keys())

    # ── Check 1: No orphan tables ────────────────────────────────────────────
    orphans = all_tables - partitioned_tables
    if orphans:
        errors.append(
            f"Tables not assigned to any service: {sorted(orphans)}. "
            "This likely means they appeared after graph construction."
        )

    # ── Check 2: Cross-boundary FKs ─────────────────────────────────────────
    foreign_keys = schema_result.get("foreign_keys", [])
    cross_fks = [
        fk for fk in foreign_keys
        if partition.get(fk["from_table"]) != partition.get(fk["to_table"])
        and partition.get(fk["from_table"]) is not None
        and partition.get(fk["to_table"]) is not None
    ]

    if cross_fks:
        warnings.append(
            f"{len(cross_fks)} foreign key(s) cross service boundaries. "
            "These must be replaced by API calls or resolved via denormalization."
        )
        for fk in cross_fks[:10]:
            from_svc = partition.get(fk["from_table"], "?")
            to_svc = partition.get(fk["to_table"], "?")
            warnings.append(
                f"  ⚠ {fk['from_table']} (Service {from_svc}) "
                f"→ {fk['to_table']} (Service {to_svc}): "
                f"{fk['from_columns']} references {fk['to_columns']}"
            )

    # ── Check 3: Verify broken queries ──────────────────────────────────────
    broken_query_ids: List[str] = []
    for qa in query_analyses:
        if qa.get("parse_error"):
            continue
        clusters_touched = set(
            partition[t]
            for t in qa.get("all_tables", [])
            if t in partition
        )
        if len(clusters_touched) > 1:
            broken_query_ids.append(qa["query_id"])

    if broken_query_ids:
        warnings.append(
            f"{len(broken_query_ids)} query/queries span multiple service boundaries: "
            f"{broken_query_ids}"
        )

    # ── Check 4: AI output completeness ─────────────────────────────────────
    expected_clusters = len(set(partition.values()))
    actual_clusters = len(ai_result.get("services", []))
    if actual_clusters != expected_clusters and ai_result.get("ai_used"):
        warnings.append(
            f"AI returned {actual_clusters} service definitions but graph found "
            f"{expected_clusters} clusters. Some services may be unnamed."
        )

    # ── Check 5: Circular service dependencies ───────────────────────────────
    service_deps: Dict[int, set] = {}
    for fk in cross_fks:
        from_s = partition.get(fk["from_table"])
        to_s = partition.get(fk["to_table"])
        if from_s is not None and to_s is not None:
            service_deps.setdefault(from_s, set()).add(to_s)

    cycles = _detect_cycles(service_deps)
    if cycles:
        for cycle in cycles:
            warnings.append(f"Circular service dependency detected: {cycle}")

    return {
        "passed": len(errors) == 0,
        "error_count": len(errors),
        "warning_count": len(warnings),
        "errors": errors,
        "warnings": warnings,
        "cross_boundary_fk_count": len(cross_fks),
        "broken_query_count": len(broken_query_ids),
        "broken_query_ids": broken_query_ids,
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

def _detect_cycles(deps: Dict[int, set]) -> List[str]:
    """Simple DFS cycle detection on the service-level dependency graph."""
    visited: set = set()
    path: set = set()
    found_cycles: List[str] = []

    def dfs(node: int):
        visited.add(node)
        path.add(node)
        for neighbour in deps.get(node, set()):
            if neighbour not in visited:
                dfs(neighbour)
            elif neighbour in path:
                found_cycles.append(f"Service {node} ↔ Service {neighbour}")
        path.discard(node)

    for node in list(deps.keys()):
        if node not in visited:
            dfs(node)

    return found_cycles
