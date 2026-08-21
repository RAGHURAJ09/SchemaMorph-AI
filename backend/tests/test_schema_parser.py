"""Tests for the schema parser."""
import pytest
from app.parsers.schema_parser import parse_schema


def test_parse_basic_table(sample_schema):
    result = parse_schema(sample_schema)
    assert result["table_count"] == 6
    assert "users" in result["tables"]
    assert "orders" in result["tables"]
    assert "order_items" in result["tables"]
    assert "products" in result["tables"]
    assert "categories" in result["tables"]
    assert "user_sessions" in result["tables"]


def test_columns_extracted(sample_schema):
    result = parse_schema(sample_schema)
    users = result["tables"]["users"]
    col_names = [c["name"] for c in users["columns"]]
    assert "id" in col_names
    assert "email" in col_names
    assert "name" in col_names
    assert "created_at" in col_names
    assert users["column_count"] == 4


def test_primary_keys_extracted(sample_schema):
    result = parse_schema(sample_schema)
    assert "id" in result["tables"]["users"]["primary_keys"]
    assert "id" in result["tables"]["orders"]["primary_keys"]


def test_foreign_keys_extracted(sample_schema):
    result = parse_schema(sample_schema)
    fk_pairs = {
        (fk["from_table"], fk["to_table"])
        for fk in result["foreign_keys"]
    }
    assert ("user_sessions", "users") in fk_pairs
    assert ("orders", "users") in fk_pairs
    assert ("order_items", "orders") in fk_pairs
    assert ("order_items", "products") in fk_pairs
    assert ("products", "categories") in fk_pairs


def test_fk_count(sample_schema):
    result = parse_schema(sample_schema)
    # categories self-referencing + 5 others = 6 total
    assert result["fk_count"] == 6


def test_hub_table_detection(sample_schema):
    result = parse_schema(sample_schema)
    # users is referenced by user_sessions and orders (2 incoming FKs)
    users = result["tables"]["users"]
    assert users["incoming_fk_count"] >= 2


def test_isolated_table_detection():
    isolated_schema = """
    CREATE TABLE standalone (
        id SERIAL PRIMARY KEY,
        value TEXT
    );
    """
    result = parse_schema(isolated_schema)
    assert result["tables"]["standalone"]["is_isolated"] is True


def test_empty_input():
    result = parse_schema("")
    assert result["table_count"] == 0
    assert result["parse_errors"] == []


def test_malformed_sql():
    result = parse_schema("THIS IS NOT SQL AT ALL")
    # Should not crash — may return empty or with errors
    assert isinstance(result, dict)
    assert "tables" in result


def test_nullable_flag(sample_schema):
    result = parse_schema(sample_schema)
    users = result["tables"]["users"]
    email_col = next(c for c in users["columns"] if c["name"] == "email")
    assert email_col["nullable"] is False
    name_col = next(c for c in users["columns"] if c["name"] == "name")
    assert name_col["nullable"] is True
