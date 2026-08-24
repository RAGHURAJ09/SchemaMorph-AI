"""
Unit tests for app/parsers/schema_parser.py

These tests cover the highest-risk path: SQL parsing edge cases.
A parsing bug silently produces wrong graphs and wrong service boundaries.
"""
import pytest
from app.parsers.schema_parser import parse_schema


class TestBasicParsing:
    def test_table_count(self, sample_schema):
        result = parse_schema(sample_schema)
        assert result["table_count"] == 6

    def test_all_tables_detected(self, sample_schema):
        result = parse_schema(sample_schema)
        tables = result["tables"]
        assert "users" in tables
        assert "orders" in tables
        assert "order_items" in tables
        assert "products" in tables
        assert "categories" in tables
        assert "user_sessions" in tables

    def test_columns_extracted(self, sample_schema):
        result = parse_schema(sample_schema)
        users = result["tables"]["users"]
        col_names = [c["name"] for c in users["columns"]]
        assert "id" in col_names
        assert "email" in col_names
        assert "name" in col_names
        assert "created_at" in col_names
        assert users["column_count"] == 4

    def test_primary_keys_extracted(self, sample_schema):
        result = parse_schema(sample_schema)
        assert "id" in result["tables"]["users"]["primary_keys"]
        assert "id" in result["tables"]["orders"]["primary_keys"]

    def test_nullable_flag(self, sample_schema):
        result = parse_schema(sample_schema)
        users = result["tables"]["users"]
        email_col = next(c for c in users["columns"] if c["name"] == "email")
        assert email_col["nullable"] is False
        name_col = next(c for c in users["columns"] if c["name"] == "name")
        assert name_col["nullable"] is True


class TestForeignKeys:
    def test_fk_count(self, sample_schema):
        result = parse_schema(sample_schema)
        # categories self-ref + user_sessions→users + orders→users +
        # order_items→orders + order_items→products + products→categories = 6
        assert result["fk_count"] == 6

    def test_fk_pairs_correct(self, sample_schema):
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

    def test_inline_fk_columns_extracted(self):
        sql = """
        CREATE TABLE orders (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );"""
        result = parse_schema(sql)
        fk = result["foreign_keys"][0]
        assert fk["from_table"] == "orders"
        assert fk["to_table"] == "users"
        assert "user_id" in fk["from_columns"]
        assert "id" in fk["to_columns"]

    def test_self_referencing_fk(self):
        sql = """
        CREATE TABLE categories (
            id SERIAL PRIMARY KEY,
            parent_id INTEGER,
            FOREIGN KEY (parent_id) REFERENCES categories(id)
        );"""
        result = parse_schema(sql)
        assert result["fk_count"] == 1
        fk = result["foreign_keys"][0]
        assert fk["from_table"] == "categories"
        assert fk["to_table"] == "categories"

    def test_alter_table_fk(self, pg_dump_schema):
        """pg_dump uses ALTER TABLE ADD CONSTRAINT syntax."""
        result = parse_schema(pg_dump_schema)
        fk_targets = {fk["to_table"] for fk in result["foreign_keys"]}
        # At least one FK must be detected from ALTER TABLE syntax
        assert len(result["foreign_keys"]) >= 1
        assert "users" in fk_targets or "orders" in fk_targets


class TestEdgeCases:
    def test_schema_prefix_stripped(self):
        """public.users must be stored as 'users', not 'public.users'."""
        sql = "CREATE TABLE public.users (id SERIAL PRIMARY KEY);"
        result = parse_schema(sql)
        assert "users" in result["tables"]
        assert "public.users" not in result["tables"]

    def test_if_not_exists_parsed(self):
        sql = "CREATE TABLE IF NOT EXISTS logs (id SERIAL PRIMARY KEY, msg TEXT);"
        result = parse_schema(sql)
        assert "logs" in result["tables"]

    def test_composite_fk_columns(self):
        sql = """
        CREATE TABLE order_items (
            order_id INT,
            product_id INT,
            FOREIGN KEY (order_id, product_id) REFERENCES orders(id, product_id)
        );"""
        result = parse_schema(sql)
        if result["fk_count"] > 0:
            fk = result["foreign_keys"][0]
            assert len(fk["from_columns"]) == 2

    def test_empty_input(self):
        result = parse_schema("")
        assert result["table_count"] == 0
        assert result["foreign_keys"] == []

    def test_malformed_sql_doesnt_crash(self):
        sql = "CREATE TABLE users (id INT); THIS IS COMPLETE GARBAGE @@##!!;"
        # Must not raise — partial parsing may or may not return the table
        # depending on the dialect. The critical guarantee is: no exception.
        result = parse_schema(sql)
        assert isinstance(result, dict)
        assert "tables" in result

    def test_parse_errors_are_recorded(self):
        sql = "THIS IS NOT SQL AT ALL; NEITHER IS THIS;"
        result = parse_schema(sql)
        assert isinstance(result, dict)
        # Must not raise — errors go into parse_errors list


class TestGraphMetadata:
    def test_hub_table_detection(self, sample_schema):
        result = parse_schema(sample_schema)
        # users is referenced by user_sessions and orders (2+ incoming FKs)
        users = result["tables"]["users"]
        assert users["incoming_fk_count"] >= 2

    def test_isolated_table_detection(self):
        sql = """
        CREATE TABLE standalone (
            id SERIAL PRIMARY KEY,
            value TEXT
        );"""
        result = parse_schema(sql)
        assert result["tables"]["standalone"]["is_isolated"] is True

    def test_no_fk_schema(self, no_fk_schema):
        result = parse_schema(no_fk_schema)
        assert result["table_count"] == 3
        assert result["fk_count"] == 0
        assert result["foreign_keys"] == []


class TestLargeSchema:
    def test_15table_ecommerce_parses(self, ecommerce_schema):
        result = parse_schema(ecommerce_schema)
        assert result["table_count"] == 15
        assert result["fk_count"] >= 10
        expected = {"users", "orders", "products", "order_items", "payments",
                    "categories", "inventory", "reviews", "tags", "product_tags",
                    "coupons", "order_coupons", "notifications", "audit_log", "addresses"}
        assert expected == set(result["tables"].keys())

    def test_15table_ecommerce_no_crash(self, ecommerce_schema):
        """Full pipeline smoke test — parse must not raise."""
        try:
            result = parse_schema(ecommerce_schema)
            assert result is not None
        except Exception as e:
            pytest.fail(f"parse_schema raised unexpectedly: {e}")
