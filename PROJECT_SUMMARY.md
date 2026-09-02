# SchemaMorph AI — Complete Project Summary

## What It Does

SchemaMorph AI analyzes monolithic PostgreSQL database schemas and discovers natural microservice boundaries using graph analysis and AI. You upload a SQL schema + optional queries, and it tells you how to split your database into independent microservices.

---

## Tech Stack

### Backend
- **Framework:** FastAPI + Uvicorn (Python 3.11)
- **Database:** Supabase PostgreSQL (SQLAlchemy 2.0 ORM)
- **Auth:** JWT (python-jose) + bcrypt (passlib)
- **AI Engine:** LangChain + Gemini 1.5 Flash
- **Parsing:** sqlglot (PostgreSQL dialect)
- **Graph Analysis:** NetworkX + python-louvain
- **Password:** psycopg2-binary

### Frontend
- **Framework:** React 18 + Vite
- **Graph Rendering:** @xyflow/react (React Flow) + dagre layout
- **State:** Zustand (persisted to localStorage)
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios with JWT interceptor
- **Other:** react-hot-toast, react-syntax-highlighter, recharts

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Deployment:** Vercel (frontend), Render (backend), Supabase (database)

---

## Project Structure

```
SchemaMorph-AI/
├── .env                          # Root env for docker-compose
├── .gitignore
├── docker-compose.yml            # 2 services: backend + frontend
├── README.md
│
├── backend/
│   ├── .env                      # Backend env (secrets, DB URL, API keys)
│   ├── Dockerfile                # Python 3.11-slim + psycopg2
│   ├── requirements.txt          # ~90 Python packages
│   ├── pytest.ini                # Test config
│   ├── run.py                    # Dev server entry (uvicorn reload)
│   │
│   └── app/
│       ├── main.py               # FastAPI app factory, CORS, routes
│       │
│       ├── core/
│       │   └── security.py       # JWT auth, password hashing, OAuth2
│       │
│       ├── models/
│       │   ├── database.py       # SQLAlchemy ORM models (8 tables)
│       │   └── schemas.py        # Pydantic request/response models
│       │
│       ├── parsers/
│       │   ├── schema_parser.py  # DDL parser (sqlglot)
│       │   └── query_parser.py   # SQL query parser
│       │
│       ├── graph/
│       │   ├── builder.py        # NetworkX graph builder
│       │   └── clusterer.py      # Louvain community detection
│       │
│       ├── ai/
│       │   ├── engine.py         # LangChain + Gemini integration
│       │   └── prompts.py        # System/human prompt templates
│       │
│       ├── validation/
│       │   └── validator.py      # Orphan/FK/cycle/broken query checks
│       │
│       ├── reports/
│       │   └── generator.py      # Final report + per-service DDL
│       │
│       ├── api/
│       │   ├── dependencies.py   # DB session injection
│       │   └── v1/
│       │       ├── router.py     # Aggregates all v1 routers
│       │       ├── auth.py       # Register, Login, Me
│       │       ├── schema.py     # Upload schema
│       │       ├── queries.py    # Upload queries
│       │       └── analysis.py   # Run analysis, get session
│       │
│       └── tests/
│           ├── unit/
│           │   ├── test_schema_parser.py
│           │   ├── test_query_parser.py
│           │   ├── test_graph_builder.py
│           │   └── test_ai_engine.py
│           └── integration/
│               └── test_api_pipeline.py
│
├── frontend/
│   ├── Dockerfile                # Multi-stage Node + Nginx
│   ├── nginx.conf                # SPA routing + /api/ proxy
│   ├── package.json              # React 18, Vite, Tailwind
│   ├── vite.config.js            # Dev proxy to :8000
│   ├── vercel.json               # Vercel SPA rewrites
│   ├── tailwind.config.js        # Brand colors, fonts
│   ├── index.html
│   │
│   └── src/
│       ├── main.jsx              # React entry (BrowserRouter, Toaster)
│       ├── App.jsx               # Routes + ProtectedRoute wrapper
│       ├── index.css             # Global Tailwind styles
│       │
│       ├── api/
│       │   └── client.js         # Axios client + all API functions
│       │
│       ├── store/
│       │   ├── authStore.js      # Zustand: token, user, login/logout
│       │   └── useAnalysisStore.js  # Zustand: analysis data, 24h cache
│       │
│       ├── pages/
│       │   ├── Login.jsx         # Login form
│       │   ├── Register.jsx      # Registration form
│       │   ├── Upload.jsx        # Schema upload (file/text/demo)
│       │   └── Dashboard.jsx     # Results: graph, services, queries
│       │
│       └── components/
│           ├── GraphView.jsx     # Interactive dependency graph
│           ├── ServicePanel.jsx  # Per-service detail sidebar
│           ├── ValidationBadge.jsx  # Pass/fail indicator
│           ├── QueryDiff.jsx     # Broken query before/after diff
│           └── StatsBar.jsx      # Summary statistics bar
```

---

## Backend API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | No | Create account (email + password) |
| POST | `/api/v1/auth/login` | No | Login, returns JWT token |
| GET | `/api/v1/auth/me` | Yes | Health check |
| POST | `/api/v1/upload-schema` | Yes | Upload `.sql` file or paste DDL text |
| POST | `/api/v1/upload-queries` | Yes | Upload SQL workload queries |
| POST | `/api/v1/analyze` | Yes | Run full analysis pipeline |
| GET | `/api/v1/session/{id}` | Yes | Fetch latest analysis results |
| GET | `/health` | No | Server health check |

---

## Database Schema (8 Tables)

| Table | Purpose |
|-------|---------|
| `users` | User accounts (id, email, password_hash) |
| `projects` | Analysis workspaces (name, source SQL) |
| `parsed_tables` | Parsed table metadata (columns, row counts) |
| `table_dependencies` | Graph edges (FK + co-access) |
| `workload_queries` | User-submitted SQL queries |
| `analysis_runs` | Pipeline execution records |
| `service_boundaries` | AI-detected microservice groups |
| `query_refactorings` | Broken query solutions |

---

## Analysis Pipeline (7 Steps)

```
1. UPLOAD    → User uploads DDL schema (.sql file or text)
     ↓
2. PARSE     → sqlglot parses DDL → tables, columns, FKs (deterministic)
     ↓
3. QUERIES   → sqlglot parses SQL queries → table access patterns
     ↓
4. GRAPH     → NetworkX builds weighted graph:
               FK edges (weight 2.0) + co-access edges (weight 1.0)
     ↓
5. CLUSTER   → Louvain community detection → microservice groups
     ↓
6. AI NARRATE→ Gemini names services, writes rationale, flags broken queries
     ↓
7. VALIDATE  → Orphan check, FK integrity, cycle detection, broken query report
```

**Key principle:** AI is downstream of all decisions. Clustering happens first deterministically; AI only narrates the results.

---

## Frontend Pages

### `/login` — Login
- Email + password form
- Calls `POST /api/v1/auth/login`
- Stores JWT token + user in Zustand persist
- Redirects to `/` on success

### `/register` — Register
- Email + password form (min 6 chars)
- Calls `POST /api/v1/auth/register`
- Redirects to `/login` on success

### `/` — Upload (Protected)
- Toggle between "Paste SQL" and "Upload File" mode
- Quick-load demo schemas
- Optional: paste workload queries
- 3-step pipeline: Upload Schema → Upload Queries → Run Analysis
- Redirects to `/dashboard/:sessionId` when done

### `/dashboard/:sessionId` — Dashboard (Protected)
- **Tab 1: Dependency Graph** — Interactive ReactFlow visualization with:
  - Color-coded service clusters
  - Node size = table importance
  - Edge weight = dependency strength
  - Click node for table details
- **Tab 2: Target Schemas** — Per-service DDL with syntax highlighting
- **Tab 3: Queries** — Broken query diff view (before/after)
- **Sidebar:** ServicePanel with service details
- **Top bar:** ValidationBadge (pass/fail), StatsBar (tables, services, edges)

---

## Key Files Explained

### `backend/app/parsers/schema_parser.py`
- Parses PostgreSQL DDL using sqlglot
- Handles: CREATE TABLE, ALTER TABLE ADD CONSTRAINT FK, CREATE TYPE AS ENUM
- Extracts: tables, columns (name, type, nullable, default, PK), FK relationships
- Computes metrics: hub tables (many FKs), isolated tables (no FKs)
- Dialect: `postgres`

### `backend/app/parsers/query_parser.py`
- Parses SQL workload queries using sqlglot
- Extracts: which tables each query reads/writes
- Classifies: READ vs WRITE queries
- Builds co-access patterns (tables queried together)

### `backend/app/graph/builder.py`
- Builds NetworkX graph from parsed tables + dependencies
- Edge weights: FK = 2.0, co-access = 1.0
- Computes: degree centrality, betweenness centrality
- Serializes to ReactFlow JSON with cluster colors + dagre layout

### `backend/app/graph/clusterer.py`
- Runs Louvain community detection on the graph
- Timeout wrapper (10 seconds) with fallback to connected components
- Merges small clusters (< 2 nodes) into nearest neighbor
- Re-numbers cluster IDs for consistent coloring

### `backend/app/ai/engine.py`
- LangChain + Gemini 1.5 Flash integration
- Pydantic output parser: `AIAnalysisResult`
- Input: cluster summaries + cross-cluster queries
- Output: service names, rationale, broken query refactoring
- Fallback: generic service names if no API key or parse failure

### `backend/app/validation/validator.py`
- Orphan tables (no FK connections)
- Cross-boundary FKs (FK references table in different service)
- Broken queries (query accesses tables from multiple services)
- Circular service dependencies (DFS cycle detection)
- AI completeness check

### `backend/app/reports/generator.py`
- Assembles final report from all pipeline outputs
- Generates per-service DDL (removes cross-service FKs, adds comments)
- Marks broken queries with fix patterns

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Both `.env` | Supabase PostgreSQL connection string |
| `GEMINI_API_KEY` | Both `.env` | Google Gemini AI for LLM narration |
| `SECRET_KEY` | Both `.env` | JWT token signing |
| `ALLOWED_ORIGINS` | `backend/.env` | CORS origins |
| `APP_ENV` | `backend/.env` | development/production |

---

## How to Run

### Local Development
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py
# Runs on http://localhost:8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Docker
```bash
docker-compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:80
```

---

## Frontend Components

### `GraphView.jsx`
- Renders interactive dependency graph using ReactFlow
- Custom `TableNode` component with service color coding
- Dagre auto-layout (top-to-bottom, ranksep=80, nodesep=40)
- Click node → shows table details
- Zoom, pan, minimap controls

### `ServicePanel.jsx`
- Sidebar listing identified microservices
- Color-coded dots per service
- Shows: name, rationale, responsibilities, included tables
- Click service → highlights its nodes in graph

### `QueryDiff.jsx`
- Shows broken queries with BEFORE/AFTER diff
- Syntax-highlighted SQL
- Explanation of what changed and why

### `StatsBar.jsx`
- Summary statistics: total tables, services, edges, validation status

### `ValidationBadge.jsx`
- Green checkmark = all validations pass
- Red warning = issues found
- Tooltip with validation details

---

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | schemamorph-ai.vercel.app |
| Backend | Render | schemamorph-api.onrender.com |
| Database | Supabase | postgresql://postgres.xxx@aws-0-...pooler.supabase.com:6543/postgres |

### Vercel Config (`vercel.json`)
- SPA rewrites: `/*` → `/index.html`
- API proxy: `/api/*` → Render backend URL

### Nginx Config (`nginx.conf`)
- SPA fallback: `try_files $uri $uri/ /index.html`
- API proxy: `/api/` → `backend:8000`
