"""
Shared pytest fixtures for unit and integration tests.
"""
import os
import pytest
from pathlib import Path

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "schemas"


# ── Schema fixture helpers ───────────────────────────────────────────────────

def _load_fixture(filename: str) -> str:
    return (FIXTURE_DIR / filename).read_text(encoding="utf-8")


@pytest.fixture
def sample_schema():
    """Standard 6-table schema used in most unit tests."""
    return """
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    total DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
"""


@pytest.fixture
def simple_3table_schema():
    return _load_fixture("simple_3table.sql")


@pytest.fixture
def pg_dump_schema():
    return _load_fixture("pg_dump_style.sql")


@pytest.fixture
def edge_case_schema():
    return _load_fixture("edge_cases.sql")


@pytest.fixture
def no_fk_schema():
    return _load_fixture("no_fks.sql")


@pytest.fixture
def ecommerce_schema():
    """Full 15-table Definition of Done schema."""
    return _load_fixture("15table_ecommerce.sql")


# ── Query fixtures ───────────────────────────────────────────────────────────

@pytest.fixture
def sample_queries():
    return [
        "SELECT id, email, name FROM users WHERE id = 1;",
        "SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE u.id = 5;",
        "SELECT o.id, oi.product_id FROM orders o JOIN order_items oi ON o.id = oi.order_id;",
        "SELECT oi.quantity, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id;",
        "INSERT INTO orders (user_id, total, status) VALUES (1, 99.99, 'pending');",
    ]


# ── Mock LLM fixture ─────────────────────────────────────────────────────────

@pytest.fixture
def mock_llm_response():
    """Valid AI response JSON that satisfies the AIAnalysisResult schema."""
    return """{
        "services": [
            {
                "cluster_id": 0,
                "service_name": "UserService",
                "rationale": "Handles user accounts and sessions. Isolated from order data.",
                "responsibilities": ["User management", "Session handling"]
            },
            {
                "cluster_id": 1,
                "service_name": "OrderService",
                "rationale": "Manages the order lifecycle. Tightly coupled with order_items.",
                "responsibilities": ["Order processing", "Item tracking"]
            }
        ],
        "affected_queries": [],
        "general_recommendations": [
            "Use async events for cross-service data sync.",
            "Consider API composition for user+order dashboards."
        ]
    }"""
