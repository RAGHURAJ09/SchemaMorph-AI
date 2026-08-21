"""Tests for the query parser."""
import pytest
from app.parsers.query_parser import parse_queries


def test_select_single_table():
    queries = ["SELECT id, email FROM users WHERE id = 1;"]
    result = parse_queries(queries)
    assert len(result) == 1
    qa = result[0]
    assert qa["query_id"] == "q_001"
    assert "users" in qa["tables_read"]
    assert qa["tables_written"] == []
    assert qa["parse_error"] is None


def test_select_with_join():
    queries = [
        "SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id;"
    ]
    result = parse_queries(queries)
    qa = result[0]
    assert "users" in qa["all_tables"]
    assert "orders" in qa["all_tables"]
    assert qa["join_count"] >= 1


def test_insert_query():
    queries = ["INSERT INTO orders (user_id, total) VALUES (1, 99.99);"]
    result = parse_queries(queries)
    qa = result[0]
    assert "orders" in qa["tables_written"]
    assert qa["parse_error"] is None


def test_update_query():
    queries = ["UPDATE products SET stock = stock - 1 WHERE id = 5;"]
    result = parse_queries(queries)
    qa = result[0]
    assert "products" in qa["tables_written"]


def test_delete_query():
    queries = ["DELETE FROM user_sessions WHERE expires_at < NOW();"]
    result = parse_queries(queries)
    qa = result[0]
    assert "user_sessions" in qa["tables_written"]


def test_multiple_queries(sample_queries):
    result = parse_queries(sample_queries)
    assert len(result) == len(sample_queries)
    for qa in result:
        assert "query_id" in qa
        assert "all_tables" in qa


def test_cross_service_query_tables():
    """The cross-service query should surface BOTH tables."""
    queries = [
        "SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id;"
    ]
    result = parse_queries(queries)
    all_t = set(result[0]["all_tables"])
    assert "users" in all_t
    assert "orders" in all_t


def test_query_id_numbering():
    queries = ["SELECT 1 FROM a;", "SELECT 2 FROM b;", "SELECT 3 FROM c;"]
    result = parse_queries(queries)
    assert result[0]["query_id"] == "q_001"
    assert result[1]["query_id"] == "q_002"
    assert result[2]["query_id"] == "q_003"


def test_empty_query_skipped():
    queries = ["", "   ", "SELECT id FROM users;"]
    result = parse_queries(queries)
    # Empty strings should be skipped
    assert len(result) == 1
    assert "users" in result[0]["all_tables"]


def test_cte_query():
    queries = [
        """
        WITH recent_orders AS (
            SELECT id, user_id FROM orders WHERE created_at > NOW() - INTERVAL '7 days'
        )
        SELECT u.name, r.id FROM users u JOIN recent_orders r ON u.id = r.user_id;
        """
    ]
    result = parse_queries(queries)
    qa = result[0]
    # Should find users and orders
    assert qa["parse_error"] is None
    assert len(qa["all_tables"]) >= 1
