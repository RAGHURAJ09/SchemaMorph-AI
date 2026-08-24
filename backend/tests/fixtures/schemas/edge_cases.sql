-- Edge cases: self-referencing FK, composite FK, quoted identifiers, schema prefix
-- Self-referencing FK (categories tree)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Schema-qualified table name (should be stripped to just 'products')
CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Composite primary key
CREATE TABLE order_items (
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (order_id, product_id)
);

-- Quoted identifier (reserved word as table name)
CREATE TABLE "order" (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50)
);

-- IF NOT EXISTS syntax
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    action VARCHAR(20),
    changed_at TIMESTAMP DEFAULT NOW()
);
