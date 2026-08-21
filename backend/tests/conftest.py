"""pytest fixtures shared across all tests."""
import pytest

SAMPLE_SCHEMA = """
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

SAMPLE_QUERIES = [
    # Simple single-table query (not broken)
    "SELECT id, email, name FROM users WHERE id = 1;",

    # Cross-service query (users + orders) — broken
    "SELECT u.name, o.total, o.status FROM users u JOIN orders o ON u.id = o.user_id WHERE u.id = 5;",

    # Fully intra-service (order + order_items) — not broken
    "SELECT o.id, oi.product_id, oi.quantity FROM orders o JOIN order_items oi ON o.id = oi.order_id;",

    # Cross-service (order_items + products) — broken
    """
    SELECT oi.quantity, p.name, p.price
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = 10;
    """,

    # INSERT
    "INSERT INTO orders (user_id, total, status) VALUES (1, 99.99, 'pending');",
]


@pytest.fixture
def sample_schema():
    return SAMPLE_SCHEMA


@pytest.fixture
def sample_queries():
    return SAMPLE_QUERIES
