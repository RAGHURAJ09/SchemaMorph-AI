# PART 10 — Testing, Risks & Development Roadmap

---

## 1. Testing Strategy

### What Actually Needs Tests

For a university project at this scale, **test only what can fail silently and kill your demo**. Skip coverage theater. Here's the honest breakdown:

---

### Unit Tests — YES, Non-Negotiable

**Framework:** `pytest` + `pytest-cov`

**Coverage target: 70% on backend logic, 0% on boilerplate** (routes, model constructors, config loading — these don't need tests).

#### `app/parsers/schema_parser.py` — Highest Priority

This is the most fragile piece. SQL dialects are inconsistent and edge cases are numerous.

```python
# tests/unit/test_schema_parser.py
import pytest
from app.parsers.schema_parser import parse_schema

class TestParseSchema:
    def test_inline_fk(self):
        sql = """CREATE TABLE orders (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id)
        );"""
        result = parse_schema(sql)
        assert "orders" in result["tables"]
        assert len(result["foreign_keys"]) == 1
        assert result["foreign_keys"][0]["from_table"] == "orders"
        assert result["foreign_keys"][0]["to_table"] == "users"

    def test_alter_table_fk(self):
        """pg_dump produces ALTER TABLE ADD CONSTRAINT, not inline FKs."""
        sql = """
        CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INT);
        ALTER TABLE orders ADD CONSTRAINT fk_user
            FOREIGN KEY (user_id) REFERENCES users(id);
        """
        result = parse_schema(sql)
        assert len(result["foreign_keys"]) == 1

    def test_schema_prefix_stripped(self):
        """public.users should parse as users."""
        sql = "CREATE TABLE public.users (id SERIAL PRIMARY KEY);"
        result = parse_schema(sql)
        assert "users" in result["tables"]
        assert "public.users" not in result["tables"]

    def test_composite_fk(self):
        sql = """
        CREATE TABLE order_items (
            order_id INT, product_id INT,
            FOREIGN KEY (order_id, product_id) REFERENCES orders(id, product_id)
        );"""
        result = parse_schema(sql)
        fk = result["foreign_keys"][0]
        assert len(fk["from_columns"]) == 2

    def test_parse_error_doesnt_explode(self):
        """Parser must be resilient — bad SQL should return partial results."""
        sql = "CREATE TABLE users (id INT); THIS IS GARBAGE;"
        result = parse_schema(sql)
        assert "users" in result["tables"]
        assert len(result["parse_errors"]) > 0

    def test_empty_input(self):
        result = parse_schema("")
        assert result["table_count"] == 0
        assert result["foreign_keys"] == []
```

#### `app/graph/builder.py` — High Priority

```python
# tests/unit/test_graph_builder.py
from app.graph.builder import build_graph, cluster_graph

def test_graph_has_correct_edge_count():
    schema_result = {
        "tables": {"users": {}, "orders": {}, "products": {}},
        "foreign_keys": [
            {"from_table": "orders", "to_table": "users",
             "from_columns": ["user_id"], "to_columns": ["id"]},
        ]
    }
    G, graph_data = build_graph(schema_result, [])
    assert G.number_of_nodes() == 3
    assert G.number_of_edges() == 1

def test_isolated_table_gets_own_cluster():
    schema_result = {
        "tables": {"logs": {}},
        "foreign_keys": []
    }
    G, _ = build_graph(schema_result, [])
    partition, _ = cluster_graph(G)
    assert "logs" in partition

def test_fully_connected_schema_clusters_sensibly():
    """6 tables in a hub-and-spoke pattern should produce >= 2 clusters."""
    schema_result = {
        "tables": {t: {} for t in ["users", "orders", "items",
                                    "products", "categories", "reviews"]},
        "foreign_keys": [
            {"from_table": "orders",    "to_table": "users",      "from_columns": [], "to_columns": []},
            {"from_table": "items",     "to_table": "orders",     "from_columns": [], "to_columns": []},
            {"from_table": "items",     "to_table": "products",   "from_columns": [], "to_columns": []},
            {"from_table": "reviews",   "to_table": "products",   "from_columns": [], "to_columns": []},
            {"from_table": "products",  "to_table": "categories", "from_columns": [], "to_columns": []},
        ]
    }
    G, _ = build_graph(schema_result, [])
    partition, modularity = cluster_graph(G)
    unique_clusters = set(partition.values())
    assert len(unique_clusters) >= 2
```

#### `app/ai/engine.py` — Medium Priority (Mock the LLM)

```python
# tests/unit/test_ai_engine.py
from unittest.mock import patch, MagicMock
from app.ai.engine import run_analysis

def test_ai_returns_valid_structure_on_success():
    mock_response = '''{
        "services": [
            {"cluster_id": 0, "service_name": "UserService",
             "rationale": "Handles user data.", "responsibilities": ["User management"]},
            {"cluster_id": 1, "service_name": "OrderService",
             "rationale": "Handles orders.", "responsibilities": ["Order processing"]}
        ],
        "affected_queries": [],
        "general_recommendations": ["Use event-driven comms for cross-service data."],
        "ai_used": true
    }'''
    with patch("app.ai.engine.ChatGoogleGenerativeAI") as MockLLM:
        mock_instance = MagicMock()
        mock_instance.invoke.return_value.content = mock_response
        MockLLM.return_value = mock_instance
        result = run_analysis(partition={0: "users", 1: "orders"},
                              schema_result={"tables": {}, "foreign_keys": []},
                              query_analyses=[])
    assert "services" in result
    assert result["ai_used"] == True

def test_ai_falls_back_gracefully_on_bad_json():
    with patch("app.ai.engine.ChatGoogleGenerativeAI") as MockLLM:
        mock_instance = MagicMock()
        mock_instance.invoke.return_value.content = "Sorry, I cannot do that."
        MockLLM.return_value = mock_instance
        result = run_analysis(partition={0: "users"},
                              schema_result={"tables": {}, "foreign_keys": []},
                              query_analyses=[])
    assert result["ai_used"] == False
    assert "services" in result
```

---

### Integration Tests — YES, 3 Key Flows

**Framework:** `pytest` + `httpx` (async test client for FastAPI)

```python
# tests/integration/test_api_pipeline.py
import pytest
from httpx import AsyncClient
from app.main import app

SIMPLE_SCHEMA = """
CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL);
CREATE TABLE posts (id SERIAL PRIMARY KEY, user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id));
CREATE TABLE comments (id SERIAL PRIMARY KEY, post_id INT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id));
"""

@pytest.mark.asyncio
async def test_upload_schema_returns_session_id():
    async with AsyncClient(app=app, base_url="http://test") as client:
        resp = await client.post("/api/v1/upload-schema",
                                 data={"schema_text": SIMPLE_SCHEMA})
    assert resp.status_code == 200
    assert "session_id" in resp.json()

@pytest.mark.asyncio
async def test_full_pipeline_returns_services(mock_llm):
    """Test the entire pipeline: upload → analyze → result."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        upload_resp = await client.post("/api/v1/upload-schema",
                                        data={"schema_text": SIMPLE_SCHEMA})
        session_id = upload_resp.json()["session_id"]

        analyze_resp = await client.post("/api/v1/analyze",
                                         json={"session_id": session_id})
    assert analyze_resp.status_code == 200
    body = analyze_resp.json()
    assert body["summary"]["total_tables"] == 3
    assert len(body["services"]) >= 1
    assert len(body["graph"]["nodes"]) == 3

@pytest.mark.asyncio
async def test_analyze_invalid_session_returns_404():
    async with AsyncClient(app=app, base_url="http://test") as client:
        resp = await client.post("/api/v1/analyze",
                                  json={"session_id": "does-not-exist"})
    assert resp.status_code == 404
```

---

### E2E Tests — Conditional

**Worth it?** Partially. Don't set up Cypress or Playwright for a university project. What IS worth it:

- One **smoke test script** (`backend/smoke_test.py`) that hits the real running server with a real 15-table schema and asserts the pipeline doesn't 500. **You already have this.**
- Run it as a GitHub Actions check before you submit.

**Skip:** Full browser E2E automation. It's brittle, slow to write, and the browser subagent validated the UI manually already.

---

### Sample Test Data You Need

Create `tests/fixtures/schemas/`:

| Filename | Purpose |
|---|---|
| `simple_3table.sql` | Basic happy path: 3 tables, 2 FKs |
| `pg_dump_style.sql` | Real `pg_dump` output with ALTER TABLE FK syntax |
| `15table_ecommerce.sql` | Your Definition of Done schema — 15 tables |
| `edge_cases.sql` | Self-referencing FK, composite keys, views, enums |
| `no_fks.sql` | Schema with zero foreign keys (should still cluster) |
| `empty.sql` | Empty input — parser must not crash |

---

### Running Coverage

```bash
cd backend
pytest tests/ --cov=app --cov-report=term-missing --cov-report=html
# Open htmlcov/index.html
```

---

## 2. Real Failure Modes & Specific Mitigations

### Risk 1: SQL Edge Cases Break the Parser

**Real examples that fail parsers:**
- `pg_dump` uses `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY` (not inline)
- Schema-qualified names: `public.users`, `myschema.orders`
- `CREATE TABLE IF NOT EXISTS`
- Quoted identifiers: `"User"`, `"order"` (reserved word)
- Enum types: `CREATE TYPE status AS ENUM ('active', 'inactive')`
- Inheritance: `CREATE TABLE employee () INHERITS (person)`

**Mitigation — already partially done, needs hardening:**
```python
# In schema_parser.py — the normalization block before parsing
sql_normalized = re.sub(r'\bIF NOT EXISTS\b', '', sql, flags=re.IGNORECASE)
sql_normalized = re.sub(r'\bpublic\.', '', sql_normalized, flags=re.IGNORECASE)
```
- **Decision:** Use `sqlglot` with dialect=`postgres` explicitly on every parse call. Never use auto-detect.
- **Decision:** Wrap every statement parse in `try/except` and log to `parse_errors[]` instead of raising. A schema with 15 tables where 2 fail partial parsing is more useful than one that crashes entirely.
- **Decision:** Add the `edge_cases.sql` fixture to CI. If it runs without a 500, ship it.

---

### Risk 2: LLM Response Doesn't Match Expected Schema

**Real ways this fails:**
- Model returns markdown: ` ```json\n{...}\n``` ` instead of raw JSON
- Model returns partial JSON (truncated by token limit)
- Model adds extra commentary before/after the JSON block
- `cluster_id` in the response doesn't match any actual cluster (hallucinated)

**Mitigation — specific decisions:**

```python
# In app/ai/engine.py — response extraction
import re, json

def _extract_json(raw: str) -> dict:
    # Strip markdown code fences
    cleaned = re.sub(r'```(?:json)?\n?', '', raw).strip()
    cleaned = re.sub(r'```$', '', cleaned).strip()
    
    # Try to find first complete JSON object
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Find the largest valid JSON substring
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise

def _validate_ai_response(ai_dict: dict, real_clusters: set) -> dict:
    """Ensure cluster_ids in response match actual cluster_ids from graph."""
    valid_services = []
    for svc in ai_dict.get("services", []):
        if svc.get("cluster_id") in real_clusters:
            valid_services.append(svc)
    ai_dict["services"] = valid_services
    return ai_dict
```

- **Decision:** If JSON parsing fails after 2 attempts, `ai_used = False` and fall back to the deterministic fallback labels already in `generator.py`. **Never block the pipeline on AI.**
- **Decision:** Add schema validation (Pydantic `AIAnalysisResponse` model) on the parsed AI response before it touches `generate_report`. Coerce rather than reject where possible.

---

### Risk 3: Graph Algorithm Too Slow on Large Schemas

**Real scale problem:** NetworkX Louvain on a fully connected 100-table schema can take 3–5 seconds. At 500 tables (a real enterprise pg_dump) it can hit 30+ seconds.

**Mitigation — specific decisions:**
- **Decision:** Set a hard table count limit in the upload endpoint: reject schemas > 100 tables with a clear error message. This is a university project, not production tooling.
- **Decision:** Add `timeout=10` on the `cluster_graph` call via `threading.Thread` + `Thread.join(timeout)`. If it times out, fall back to single-cluster (everything in one service) and report it in `general_recommendations`.
- **Decision:** Cache the partition result in the `AnalysisRun.result_payload` column. Re-requesting `/session/:id` never recomputes the graph.

```python
# In graph/builder.py
import threading

def cluster_graph_with_timeout(G, timeout=10):
    result = {}
    def _run():
        result['partition'], result['modularity'] = cluster_graph(G)
    t = threading.Thread(target=_run)
    t.start()
    t.join(timeout)
    if not result:
        # Timeout — all in one cluster
        return {n: 0 for n in G.nodes()}, 0.0
    return result['partition'], result['modularity']
```

---

### Risk 4: UI State Out of Sync With Backend

**Real scenarios:**
- User navigates back, uploads a new schema, clicks Analyze — Dashboard shows the old session's Zustand state
- User opens two tabs with different analyses
- User hard-refreshes the Dashboard page — Zustand + localStorage loads stale data from a 2-day-old analysis

**Mitigation — specific decisions:**

This is exactly why the Zustand store compares `analysisData.session_id !== sessionId` before rendering. But that only handles the redirect flow. We need two more guards:

```javascript
// In Dashboard.jsx useEffect (add this)
useEffect(() => {
  if (analysisData && analysisData.session_id !== sessionId) {
    clearAnalysisData()  // Stale session — wipe the store
  }
}, [sessionId])
```

- **Decision:** Persist Zustand with a TTL. Add `timestamp` to the stored payload and reject payloads older than 24 hours.
```javascript
// In useAnalysisStore.js
setAnalysisData: (data) => set({ 
  analysisData: { ...data, _storedAt: Date.now() }
}),
// In Dashboard.jsx check:
const isStale = Date.now() - analysisData._storedAt > 24 * 60 * 60 * 1000
if (!analysisData || isStale || analysisData.session_id !== sessionId) { ... }
```

- **Decision:** Keep the `GET /session/:id` endpoint. If Zustand cache is stale, fall back to fetching from it. This requires storing the full report in the DB (not just `AnalysisRun.status`).

---

### Risk 5: AI API Key Unavailable at Demo Time

**Real scenario:** Rate limit, network issue, key expired during the live demo.

**Mitigation:**
- **Decision:** The `ai_used: false` fallback path is already implemented. Ensure the UI clearly labels AI-generated vs. deterministic content (a small badge is enough).
- **Decision:** Pre-run the analysis on your demo schema the night before. The results are stored in SQLite. Demo from the stored result, not a live API call.

---

## 3. Development Roadmap — 12 Weeks

> **Assumption:** ~10–15 hours/week of actual dev time. Adjust by factor if different.

---

### Phase 1 — Foundation (Weeks 1–3)
**Theme:** Core parsing pipeline working end-to-end with a dumb UI.

| Week | Milestone |
|---|---|
| 1 | `schema_parser.py` handles all fixture files. Unit tests pass. No graph yet. |
| 2 | `graph/builder.py` builds NetworkX graph from parsed schema. Louvain clustering works. |
| 3 | `POST /upload-schema` + `POST /analyze` (no AI) returns valid JSON with services. React UI shows table list + raw JSON dump. |

**Definition of Done — Phase 1:**
- Upload a `.sql` file → see a list of detected tables and FK counts.
- Clustering produces at least 2 groups on a 6-table test schema.
- No crashes on the `pg_dump_style.sql` fixture.
- Zero frontend routing — single page is fine.

---

### Phase 2 — AI Layer (Weeks 4–6)
**Theme:** LLM names services, provides rationale. Graph is rendered visually.

| Week | Milestone |
|---|---|
| 4 | LangChain + Gemini integrated. `run_analysis` returns service names and rationale. Fallback path on LLM failure. |
| 5 | `GraphView` React component renders nodes/edges using `react-flow` or `force-graph`. Colors by cluster. |
| 6 | `ServicePanel` renders LLM-generated service name, rationale, and table list per cluster. `StatsBar` shows metrics. |

**Definition of Done — Phase 2:**
- Upload 10-table schema → AI names at least 2 services with real rationale text (not "ServiceA").
- Graph renders without overlapping nodes. FK edges visible.
- If Gemini is down, fallback labels render without error.

---

### Phase 3 — Query & Validation Layer (Weeks 7–9)
**Theme:** Cross-boundary query detection and target DDL generation.

| Week | Milestone |
|---|---|
| 7 | `query_parser.py` extracts table reads/writes per SQL query. `POST /upload-queries` endpoint works. |
| 8 | `validate_analysis.py` identifies broken joins. `generate_report.py` generates per-service DDL with removed FKs annotated. |
| 9 | `QueryDiff` component shows broken queries with `BEFORE`/`AFTER` diff view. `ValidationBadge` shows pass/fail. Export to Markdown works. |

**Definition of Done — Phase 3:**
- Upload 3 SQL queries on a 10-table schema → at least 1 detected as broken (spanning two services).
- Target DDL for each service is downloadable and valid SQL.
- Cross-service FKs are documented as comments in the generated DDL, not silently dropped.

---

### Phase 4 — Polish, Testing, Deployment (Weeks 10–12)
**Theme:** Demo-ready. No rough edges. Actually runs on the internet.

| Week | Milestone |
|---|---|
| 10 | Full unit + integration test suite. `pytest` runs clean. `smoke_test.py` passes on 15-table fixture. |
| 11 | Docker Compose works locally. Deploy backend to Render, frontend to Vercel. Environment variables injected from platform UI. |
| 12 | README complete with architecture diagram, setup instructions, screenshots. Demo video recorded. Final presentation polished. |

**Definition of Done — Phase 4:**
- `pytest tests/ -v` exits 0.
- `https://your-app.vercel.app` loads in a browser without VPN.
- The 15-table `ecommerce.sql` fixture runs end-to-end in under 30 seconds, total.
- The Markdown export contains service names, DDL, and broken query list.

---

## 4. Definition of Done — Complete Project

The system is **done** when all of the following pass simultaneously with no mocks, no hardcoded data, and the Gemini API key active:

| # | Requirement | Measurable Threshold |
|---|---|---|
| 1 | Parse a real PostgreSQL schema | ≥ 10 tables detected with correct FK count |
| 2 | Build visible dependency graph | All tables appear as nodes; all FKs appear as edges |
| 3 | Recommend service boundaries | ≥ 2 distinct services with AI-written names |
| 4 | AI-generated explanation | Each service has ≥ 2 sentence rationale, not placeholder text |
| 5 | Generate target schemas | Per-service DDL downloadable, all intra-service FKs intact |
| 6 | Identify affected queries | ≥ 3 uploaded queries → at least 1 flagged as cross-boundary |
| 7 | Show refactored diffs | Broken queries show BEFORE/AFTER diff in the UI |
| 8 | Display validation results | ValidationBadge shows pass/fail with error/warning counts |
| 9 | Downloadable report | Export produces a non-empty `.md` file with all sections |
| 10 | Live deployment | Public URL accessible without local setup |

**The 15-table ecommerce schema to test against:**

```sql
-- Paste this into your demo to verify DoD
CREATE TABLE users       (id SERIAL PRIMARY KEY, email VARCHAR(255), created_at TIMESTAMP);
CREATE TABLE addresses   (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), street TEXT, city VARCHAR(100));
CREATE TABLE categories  (id SERIAL PRIMARY KEY, name VARCHAR(100), parent_id INT REFERENCES categories(id));
CREATE TABLE products    (id SERIAL PRIMARY KEY, name VARCHAR(255), category_id INT REFERENCES categories(id), price NUMERIC(10,2));
CREATE TABLE inventory   (id SERIAL PRIMARY KEY, product_id INT REFERENCES products(id), quantity INT, warehouse VARCHAR(50));
CREATE TABLE orders      (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), status VARCHAR(50), created_at TIMESTAMP);
CREATE TABLE order_items (id SERIAL PRIMARY KEY, order_id INT REFERENCES orders(id), product_id INT REFERENCES products(id), quantity INT, unit_price NUMERIC(10,2));
CREATE TABLE payments    (id SERIAL PRIMARY KEY, order_id INT REFERENCES orders(id), amount NUMERIC(10,2), method VARCHAR(50));
CREATE TABLE reviews     (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), product_id INT REFERENCES products(id), rating INT, body TEXT);
CREATE TABLE tags        (id SERIAL PRIMARY KEY, name VARCHAR(50));
CREATE TABLE product_tags(product_id INT REFERENCES products(id), tag_id INT REFERENCES tags(id), PRIMARY KEY (product_id, tag_id));
CREATE TABLE coupons     (id SERIAL PRIMARY KEY, code VARCHAR(50) UNIQUE, discount NUMERIC(5,2));
CREATE TABLE order_coupons(order_id INT REFERENCES orders(id), coupon_id INT REFERENCES coupons(id));
CREATE TABLE notifications(id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), message TEXT, read BOOLEAN DEFAULT FALSE);
CREATE TABLE audit_log   (id SERIAL PRIMARY KEY, table_name VARCHAR(100), record_id INT, action VARCHAR(20), changed_at TIMESTAMP);
```

**Expected output:**
- ≥ 3 services: roughly `UserService`, `CatalogService`, `OrderService`
- `audit_log` and `notifications` isolated or grouped with User
- Cross-boundary FK: `order_items.product_id → products` (Order → Catalog boundary)
- Broken query example: `SELECT o.*, p.name FROM orders o JOIN products p ON ...`
