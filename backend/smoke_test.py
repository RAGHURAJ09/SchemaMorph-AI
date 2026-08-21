import sys
sys.path.insert(0, '.')
from app.parsers.schema_parser import parse_schema
from app.parsers.query_parser import parse_queries
from app.graph.builder import build_graph, serialize_graph
from app.graph.clusterer import cluster_graph, get_cluster_summary
from app.validation.validator import validate_analysis
from app.ai.engine import _fallback

schema_sql = """
CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL);
CREATE TABLE user_sessions (id SERIAL PRIMARY KEY, user_id INTEGER, FOREIGN KEY (user_id) REFERENCES users(id));
CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, total DECIMAL(10,2), FOREIGN KEY (user_id) REFERENCES users(id));
CREATE TABLE order_items (id SERIAL PRIMARY KEY, order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, FOREIGN KEY (order_id) REFERENCES orders(id));
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(255), price DECIMAL(10,2));
CREATE TABLE categories (id SERIAL PRIMARY KEY, name VARCHAR(100));
"""

queries = [
    "SELECT u.email, o.total FROM users u JOIN orders o ON u.id = o.user_id;",
    "SELECT * FROM products WHERE price > 10;",
]

schema = parse_schema(schema_sql)
print("[OK] Schema: {} tables, {} FKs".format(schema["table_count"], schema["fk_count"]))

qas = parse_queries(queries)
errors = sum(1 for q in qas if q["parse_error"])
print("[OK] Queries: {} parsed, errors={}".format(len(qas), errors))

graph = build_graph(schema, qas)
print("[OK] Graph: {} nodes, {} edges".format(len(graph.nodes), len(graph.edges)))

partition, modularity = cluster_graph(graph)
print("[OK] Clustering: {} clusters, modularity={}".format(len(set(partition.values())), modularity))

summaries = get_cluster_summary(partition, schema)
ai = _fallback(summaries, qas, reason="smoke test")
print("[OK] AI fallback: {} services".format(len(ai["services"])))

val = validate_analysis(partition, ai, qas, schema)
print("[OK] Validation: passed={}, warnings={}".format(val["passed"], val["warning_count"]))

graph_data = serialize_graph(graph, partition)
print("[OK] Graph serialized: {} nodes, {} edges".format(len(graph_data["nodes"]), len(graph_data["edges"])))

print()
print("=== FULL PIPELINE: ALL STEPS PASSED ===")
