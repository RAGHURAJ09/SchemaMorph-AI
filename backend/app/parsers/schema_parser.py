"""
Schema Parser Module
Parses PostgreSQL DDL into structured data using sqlglot.

DETERMINISTIC — no AI involved.
Input:  raw SQL DDL text (CREATE TABLE statements)
Output: tables dict, foreign_keys list, parse_errors list
"""
import sqlglot
from sqlglot import exp
from typing import List, Dict, Any


def parse_schema(sql_text: str) -> dict:
    """
    Parse PostgreSQL DDL and extract tables, columns, FK relationships.

    Returns:
        {
          tables: {name: {name, columns, primary_keys, foreign_keys,
                          column_count, is_hub, is_isolated, incoming_fk_count}},
          foreign_keys: [{from_table, from_columns, to_table, to_columns}],
          enums: {name: [values]},
          parse_errors: [{error, line}],
          table_count: int,
          fk_count: int
        }
    """
    tables: Dict[str, dict] = {}
    foreign_keys: List[dict] = []
    enums: Dict[str, list] = {}
    parse_errors: List[dict] = []

    if not sql_text or not sql_text.strip():
        return _empty_result()

    # sqlglot.parse() handles multiple statements separated by semicolons
    try:
        statements = sqlglot.parse(sql_text, dialect="postgres")
    except Exception as e:
        return {**_empty_result(), "parse_errors": [{"error": str(e), "line": None}]}

    for stmt in statements:
        if stmt is None:
            continue

        # ── CREATE TABLE ────────────────────────────────────────────────────
        if isinstance(stmt, exp.Create):
            kind = stmt.args.get("kind")
            kind_str = str(kind).upper() if kind else ""

            if kind_str == "TABLE":
                _process_create_table(stmt, tables, foreign_keys, parse_errors)

            elif kind_str == "TYPE":
                _process_create_type(stmt, enums)

        # ── ALTER TABLE ADD CONSTRAINT ... FOREIGN KEY ───────────────────────
        elif isinstance(stmt, exp.AlterTable):
            _process_alter_table(stmt, tables, foreign_keys, parse_errors)

    # ── Post-process: compute graph metrics ──────────────────────────────────
    _compute_table_metrics(tables, foreign_keys)

    return {
        "tables": tables,
        "foreign_keys": foreign_keys,
        "enums": enums,
        "parse_errors": parse_errors,
        "table_count": len(tables),
        "fk_count": len(foreign_keys),
    }


# ── Private helpers ──────────────────────────────────────────────────────────

def _process_create_table(stmt, tables, foreign_keys, parse_errors):
    try:
        # Get table name
        table_expr = stmt.find(exp.Table)
        if not table_expr:
            return
        tname = table_expr.name.lower()

        columns: List[dict] = []
        primary_keys: List[str] = []
        table_fks: List[dict] = []
        unique_constraints: List[List[str]] = []

        schema_expr = stmt.args.get('this')  # Schema is directly at stmt.args['this'] in sqlglot 23.x
        if not schema_expr:
            # Table with no body — skip
            return

        # ── Column definitions ───────────────────────────────────────────────
        for col_def in schema_expr.find_all(exp.ColumnDef):
            col_name = col_def.name.lower()
            col_type_expr = col_def.args.get("kind")
            type_str = str(col_type_expr) if col_type_expr else "unknown"

            nullable = True
            default = None
            is_pk = False

            for constraint in col_def.find_all(exp.ColumnConstraint):
                ck = constraint.args.get("kind")
                if isinstance(ck, exp.NotNullColumnConstraint):
                    nullable = False
                elif isinstance(ck, exp.PrimaryKeyColumnConstraint):
                    nullable = False
                    is_pk = True
                    if col_name not in primary_keys:
                        primary_keys.append(col_name)
                elif isinstance(ck, exp.DefaultColumnConstraint):
                    default = str(ck.this)

            columns.append({
                "name": col_name,
                "type": type_str,
                "nullable": nullable,
                "default": default,
                "is_primary_key": is_pk,
            })

        # ── Table-level constraints (sqlglot 23.x puts these directly in schema.expressions) ──
        for expr in schema_expr.expressions:
            # Primary Key table constraint
            if isinstance(expr, exp.PrimaryKey):
                for pk_col in expr.find_all(exp.Column):
                    pk_name = pk_col.name.lower()
                    if pk_name not in primary_keys:
                        primary_keys.append(pk_name)

            # Foreign Key — ForeignKey node sits directly in expressions
            elif isinstance(expr, exp.ForeignKey):
                fk_cols = [i.name.lower() for i in expr.expressions if isinstance(i, exp.Identifier)]
                ref_expr = expr.args.get('reference')
                if ref_expr:
                    # ref_expr.this is a Schema node whose .this is the Table
                    ref_schema = ref_expr.args.get('this')
                    ref_table_node = None
                    ref_cols = []
                    if ref_schema:
                        if isinstance(ref_schema, exp.Schema):
                            ref_table_node = ref_schema.args.get('this')
                            ref_cols = [
                                i.name.lower()
                                for i in ref_schema.expressions
                                if isinstance(i, (exp.Identifier, exp.Column))
                            ]
                        elif isinstance(ref_schema, exp.Table):
                            ref_table_node = ref_schema
                    if ref_table_node:
                        fk_entry = {
                            "from_table": tname,
                            "from_columns": fk_cols,
                            "to_table": ref_table_node.name.lower(),
                            "to_columns": ref_cols,
                        }
                        foreign_keys.append(fk_entry)
                        table_fks.append(fk_entry)

            # Unique constraint
            elif isinstance(expr, exp.UniqueColumnConstraint):
                unique_cols = [c.name.lower() for c in expr.find_all(exp.Column)]
                if unique_cols:
                    unique_constraints.append(unique_cols)

        # Also handle legacy Constraint wrapper (belt-and-suspenders)
        for constraint in schema_expr.find_all(exp.Constraint):
            pk_expr = constraint.find(exp.PrimaryKey)
            if pk_expr:
                for pk_col in pk_expr.find_all(exp.Column):
                    pk_name = pk_col.name.lower()
                    if pk_name not in primary_keys:
                        primary_keys.append(pk_name)

        tables[tname] = {
            "name": tname,
            "columns": columns,
            "primary_keys": primary_keys,
            "foreign_keys": table_fks,
            "unique_constraints": unique_constraints,
            "column_count": len(columns),
            # Filled in by _compute_table_metrics below
            "incoming_fk_count": 0,
            "is_hub": False,
            "is_isolated": False,
        }

    except Exception as e:
        parse_errors.append({"error": f"Failed to parse table: {e}", "line": None})


def _process_create_type(stmt, enums):
    """Handle CREATE TYPE ... AS ENUM (...)."""
    try:
        type_name = stmt.find(exp.UserDefinedType)
        if not type_name:
            return
        enum_values = [
            str(v).strip("'") for v in stmt.find_all(exp.Literal)
        ]
        if enum_values:
            enums[type_name.name.lower()] = enum_values
    except Exception:
        pass


def _process_alter_table(stmt, tables, foreign_keys, parse_errors):
    """
    Handle ALTER TABLE <table> ADD CONSTRAINT <name> FOREIGN KEY (...) REFERENCES <table>(...).

    Many pg_dump outputs use ALTER TABLE instead of inline FK constraints.
    """
    try:
        # Get the table being altered
        table_expr = stmt.find(exp.Table)
        if not table_expr:
            return
        from_tname = table_expr.name.lower()

        # Walk all AlterColumn / AddConstraint actions inside the ALTER
        for action in stmt.find_all(exp.AddConstraint):
            fk_expr = action.find(exp.ForeignKey)
            if not fk_expr:
                continue

            # Columns on the referencing side
            fk_cols = [
                i.name.lower()
                for i in fk_expr.expressions
                if isinstance(i, exp.Identifier)
            ]

            # REFERENCES <table>(<cols>)
            ref_expr = fk_expr.args.get("reference")
            if not ref_expr:
                continue

            ref_schema = ref_expr.args.get("this")
            ref_table_node = None
            ref_cols = []

            if ref_schema:
                if isinstance(ref_schema, exp.Schema):
                    ref_table_node = ref_schema.args.get("this")
                    ref_cols = [
                        i.name.lower()
                        for i in ref_schema.expressions
                        if isinstance(i, (exp.Identifier, exp.Column))
                    ]
                elif isinstance(ref_schema, exp.Table):
                    ref_table_node = ref_schema

            if not ref_table_node:
                continue

            to_tname = ref_table_node.name.lower()

            # Only add if both tables are known (ALTER can come before CREATE in dump order)
            # We'll do a post-pass to add any we missed
            fk_entry = {
                "from_table": from_tname,
                "from_columns": fk_cols,
                "to_table": to_tname,
                "to_columns": ref_cols,
            }
            foreign_keys.append(fk_entry)

            # Also attach to the source table's FK list if the table is known
            if from_tname in tables:
                tables[from_tname]["foreign_keys"].append(fk_entry)

    except Exception as e:
        parse_errors.append({"error": f"Failed to parse ALTER TABLE: {e}", "line": None})


def _compute_table_metrics(tables: dict, foreign_keys: list):
    """Compute hub/isolated flags and incoming FK counts."""
    fk_target_counts: Dict[str, int] = {}
    for fk in foreign_keys:
        t = fk["to_table"]
        fk_target_counts[t] = fk_target_counts.get(t, 0) + 1

    max_refs = max(fk_target_counts.values()) if fk_target_counts else 0
    hub_threshold = max(3, int(max_refs * 0.5))

    for tname, tdata in tables.items():
        ref_count = fk_target_counts.get(tname, 0)
        tdata["incoming_fk_count"] = ref_count
        tdata["is_hub"] = ref_count >= hub_threshold
        tdata["is_isolated"] = (
            len(tdata["foreign_keys"]) == 0 and ref_count == 0
        )


def _empty_result() -> dict:
    return {
        "tables": {},
        "foreign_keys": [],
        "enums": {},
        "parse_errors": [],
        "table_count": 0,
        "fk_count": 0,
    }
