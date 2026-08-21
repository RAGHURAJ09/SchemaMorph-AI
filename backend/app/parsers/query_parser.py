"""
Query Parser Module
Extracts table dependencies from SQL queries using sqlglot.

DETERMINISTIC — no AI involved.
Input:  list of raw SQL query strings
Output: list of {query_id, tables_read, tables_written, joins, ...}
"""
import sqlglot
from sqlglot import exp
from typing import List


def parse_queries(queries: List[str]) -> List[dict]:
    """
    Parse a list of SQL queries and extract table access patterns.

    Args:
        queries: List of SQL query strings (SELECT / INSERT / UPDATE / DELETE)

    Returns:
        List of query analysis dicts, one per input query.
        Failed parses are returned with parse_error set (not raised).
    """
    results = []
    for idx, query_text in enumerate(queries):
        query_id = f"q_{idx + 1:03d}"
        query_text = query_text.strip()
        if not query_text:
            continue
        try:
            result = _parse_single_query(query_id, query_text)
        except Exception as e:
            result = _error_result(query_id, query_text, str(e))
        results.append(result)
    return results


# ── Private helpers ──────────────────────────────────────────────────────────

def _parse_single_query(query_id: str, query_text: str) -> dict:
    stmt = sqlglot.parse_one(query_text, dialect="postgres")

    tables_read: set = set()
    tables_written: set = set()
    joins: list = []

    if isinstance(stmt, exp.Select):
        _extract_select(stmt, tables_read, joins)

    elif isinstance(stmt, exp.Insert):
        _extract_insert(stmt, tables_read, tables_written)

    elif isinstance(stmt, exp.Update):
        _extract_update(stmt, tables_read, tables_written)

    elif isinstance(stmt, exp.Delete):
        _extract_delete(stmt, tables_read, tables_written)

    else:
        # Unknown statement type — fall back to walking all Table nodes
        for table in stmt.find_all(exp.Table):
            tables_read.add(table.name.lower())

    all_tables = sorted(tables_read | tables_written)

    return {
        "query_id": query_id,
        "query_text": query_text,
        "tables_read": sorted(tables_read),
        "tables_written": sorted(tables_written),
        "all_tables": all_tables,
        "joins": joins,
        "join_count": len(joins),
        "parse_error": None,
    }


def _extract_select(stmt: exp.Select, tables_read: set, joins: list):
    """Walk FROM + JOINs in a SELECT."""
    from_expr = stmt.args.get("from")
    if from_expr:
        for table in from_expr.find_all(exp.Table):
            tables_read.add(table.name.lower())

    for join in stmt.find_all(exp.Join):
        join_table = join.find(exp.Table)
        if join_table:
            join_name = join_table.name.lower()
            tables_read.add(join_name)
            join_kind = str(join.args.get("kind", "INNER")).upper()
            on_clause = join.args.get("on")
            joins.append({
                "table": join_name,
                "type": join_kind,
                "condition": str(on_clause) if on_clause else None,
            })

    # Subqueries in WHERE, HAVING, etc.
    for subq in stmt.find_all(exp.Subquery):
        for table in subq.find_all(exp.Table):
            tables_read.add(table.name.lower())

    # CTEs
    with_expr = stmt.args.get("with")
    if with_expr:
        for cte in with_expr.find_all(exp.CTE):
            for table in cte.find_all(exp.Table):
                tables_read.add(table.name.lower())


def _extract_insert(stmt: exp.Insert, tables_read: set, tables_written: set):
    """Extract INSERT target and any SELECT subquery sources."""
    into = stmt.args.get("this")
    if into:
        if isinstance(into, exp.Table):
            tables_written.add(into.name.lower())
        elif isinstance(into, exp.Schema):
            tbl = into.find(exp.Table)
            if tbl:
                tables_written.add(tbl.name.lower())

    # INSERT INTO ... SELECT ...
    expression = stmt.args.get("expression")
    if expression and isinstance(expression, exp.Select):
        _extract_select(expression, tables_read, [])


def _extract_update(stmt: exp.Update, tables_read: set, tables_written: set):
    """Extract UPDATE target and FROM clause."""
    target = stmt.args.get("this")
    if target and isinstance(target, exp.Table):
        tables_written.add(target.name.lower())

    from_expr = stmt.args.get("from")
    if from_expr:
        for table in from_expr.find_all(exp.Table):
            tables_read.add(table.name.lower())

    # Subqueries in SET
    for subq in stmt.find_all(exp.Subquery):
        for table in subq.find_all(exp.Table):
            tables_read.add(table.name.lower())


def _extract_delete(stmt: exp.Delete, tables_read: set, tables_written: set):
    """Extract DELETE target and USING clause."""
    target = stmt.args.get("this")
    if target and isinstance(target, exp.Table):
        tables_written.add(target.name.lower())

    using = stmt.args.get("using")
    if using:
        for table in using.find_all(exp.Table):
            tables_read.add(table.name.lower())

    # Subqueries in WHERE
    for subq in stmt.find_all(exp.Subquery):
        for table in subq.find_all(exp.Table):
            tables_read.add(table.name.lower())


def _error_result(query_id: str, query_text: str, error: str) -> dict:
    return {
        "query_id": query_id,
        "query_text": query_text,
        "tables_read": [],
        "tables_written": [],
        "all_tables": [],
        "joins": [],
        "join_count": 0,
        "parse_error": error,
    }
