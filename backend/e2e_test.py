"""
HTTP end-to-end test — calls the live FastAPI server at localhost:8000.
Run: python e2e_test.py
"""
import http.client, json

BASE_HOST = "localhost"
BASE_PORT = 8000

SCHEMA_SQL = """
CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL);
CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, total DECIMAL(10,2), FOREIGN KEY (user_id) REFERENCES users(id));
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(255), price DECIMAL(10,2));
CREATE TABLE categories (id SERIAL PRIMARY KEY, name VARCHAR(100));
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
"""

QUERIES = [
    "SELECT u.email, o.total FROM users u JOIN orders o ON u.id = o.user_id;",
    "SELECT * FROM products WHERE price > 10;",
    "INSERT INTO orders (user_id, total) VALUES (1, 99.99);",
]


def post_json(path, payload):
    body = json.dumps(payload).encode()
    conn = http.client.HTTPConnection(BASE_HOST, BASE_PORT, timeout=30)
    conn.request("POST", path, body, {"Content-Type": "application/json"})
    resp = conn.getresponse()
    data = resp.read()
    conn.close()
    return resp.status, json.loads(data)


def post_multipart_text(path, field, text):
    boundary = "----SchemaMorphBoundary"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{field}"\r\n\r\n'
        f"{text}\r\n"
        f"--{boundary}--\r\n"
    ).encode()
    conn = http.client.HTTPConnection(BASE_HOST, BASE_PORT, timeout=30)
    conn.request(
        "POST", path, body,
        {"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    resp = conn.getresponse()
    data = resp.read()
    conn.close()
    return resp.status, json.loads(data)


if __name__ == "__main__":
    # Step 1: Upload schema
    status, data = post_multipart_text("/api/v1/upload-schema", "schema_text", SCHEMA_SQL)
    assert status == 200, f"Upload schema failed: {status} {data}"
    session_id = data["session_id"]
    print(f"[1] Upload Schema: {status} | tables={data['table_count']} fks={data['fk_count']} session={session_id[:8]}...")

    # Step 2: Upload queries
    status2, data2 = post_json("/api/v1/upload-queries", {"session_id": session_id, "queries": QUERIES})
    assert status2 == 200, f"Upload queries failed: {status2} {data2}"
    print(f"[2] Upload Queries: {status2} | parsed={data2['query_count']}")

    # Step 3: Run analysis
    status3, data3 = post_json("/api/v1/analyze", {"session_id": session_id})
    assert status3 == 200, f"Analyze failed: {status3} {data3}"
    s = data3["summary"]
    print(f"[3] Analyze: {status3}")
    print(f"    tables={s['total_tables']} | services={s['service_count']} | modularity={s['modularity_score']}")
    print(f"    broken_queries={s['broken_query_count']} | cross_fks={s['cross_boundary_fk_count']}")
    print(f"    validation_passed={s['validation_passed']} | ai_used={s['ai_used']}")

    # Step 4: Retrieve cached session
    conn = http.client.HTTPConnection(BASE_HOST, BASE_PORT, timeout=30)
    conn.request("GET", f"/api/v1/session/{session_id}")
    resp4 = conn.getresponse()
    conn.close()
    assert resp4.status == 200, f"Session GET failed: {resp4.status}"
    print(f"[4] Session GET: {resp4.status}")

    print()
    print("=== HTTP END-TO-END: ALL STEPS PASSED ===")
    print(f"    Services identified: {[svc['service_name'] for svc in data3['services']]}")
    print(f"    Broken query IDs: {data3['validation']['broken_query_ids']}")
