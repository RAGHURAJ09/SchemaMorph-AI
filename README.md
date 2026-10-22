# SchemaMorph AI

> **Intelligent Monolith-to-Microservices Database Decomposition Platform**  
> Analyzes monolithic PostgreSQL schemas to extract modular, production-ready microservice boundaries using deterministic graph clustering and Google Gemini AI.

---

## Overview

Decomposing a legacy monolithic database into independently deployable microservices is notoriously difficult. Relying solely on generative LLMs introduces non-deterministic outputs and hallucinated schemas, while manual decomposition takes weeks of cross-dependency auditing.

SchemaMorph AI solves this with a **deterministic-first, hybrid architecture**:

1. **Mathematical Partitioning**: Extracts schema definitions and query logs via `sqlglot`, models structural relationships in `NetworkX`, and partitions the database using **Louvain Community Detection** based on explicit foreign keys and query co-access frequencies.
2. **AI Semantic Narration**: Google Gemini AI inspects the deterministic clusters to assign domain-driven service names, generate architectural rationale, and suggest API boundaries for cross-cutting queries.
3. **Automated Validation**: An independent rule-based engine verifies partition completeness, checks for circular dependencies, flags orphaned tables, and detects broken foreign-key constraints before producing output.

---

## Technical Foundations

Most AI-assisted database refactoring tools struggle with repeatability. SchemaMorph AI separates structural decomposition from semantic explanation:

- **Graph Partitioning First, LLM Second**: Service boundaries are computed deterministically through graph modularity optimization. The LLM is strictly used downstream to document domain context and explain trade-offs.
- **Deterministic and Reproducible**: Because clustering relies on graph mathematics with a fixed random seed (`random_state=42`), the same input schema consistently produces identical partition boundaries.
- **Workload-Aware Optimization**: Beyond static foreign-key constraints, the parser analyzes transaction logs (`SELECT` and `JOIN` statements). Highly co-accessed tables are grouped together to minimize distributed transactions and network latency.
- **Integrity Constraints**: The validation engine enforces structural rules, identifying foreign-key crossings and cyclical service dependencies prior to DDL export.

---

## Key Features

- **Deterministic Graph Clustering**: Foreign-key dependencies (weighted 2.0) and query co-access patterns (weighted 1.0) are modeled as a weighted graph and partitioned using Louvain modularity optimization.
- **AI-Assisted Domain Narration**: Gemini AI provides architectural rationale for each cluster, suggests microservice naming, and identifies queries requiring API composition.
- **Rule-Based Integrity Validation**: Automated validation checks for orphan tables, cross-service dependencies, and cyclic relations with remediation notes.
- **Per-Service DDL Generation**: Generates clean, isolated SQL schemas for each identified service with external foreign keys decoupled.
- **Dual Interactive Visualizations**: Side-by-side **Monolith Graph View** and **Microservice Graph View** powered by `@xyflow/react` and `@dagrejs/dagre` auto-layout for structural inspection.
- **Modern Web Interface**: Built with React 18, Vite, Tailwind CSS, Framer Motion, and Three.js canvas backgrounds.
- **Authentication & Access Control**: JWT token authentication with bcrypt password hashing, password complexity checks, email domain filtering, custom canvas-based CAPTCHA verification, and protected sessions.
- **Persistent Project Management**: Project history tracking with session caching, metric overviews, and project deletion support.
- **Exportable Documentation**: Comprehensive Markdown reports with structural metrics, service breakdowns, and query diff analysis.

---

## System Architecture

```mermaid
flowchart TD
    A[Monolithic PostgreSQL DDL / SQL Queries] --> B[1. SQL Parsing with sqlglot]
    B --> C[2. Weighted Dependency Graph NetworkX]
    C --> D[3. Louvain Community Detection]
    D --> E[4. Gemini AI Semantic Narration]
    E --> F[5. Rule-Based Integrity Validation]
    F --> G[6. Per-Service DDL & Report Generation]
    G --> H[7. Interactive React Flow Dashboard & Markdown Export]
```

### Pipeline Stages

1. **DDL Parsing**: Extracts table schemas, column types, primary keys, and foreign keys using `sqlglot` (PostgreSQL dialect).
2. **Workload Analysis**: Parses query logs to identify table co-access frequencies in transactions, categorizing operations by read/write patterns.
3. **Graph Construction**: Constructs an undirected graph in `NetworkX` where nodes represent tables and edge weights reflect relational and query coupling.
4. **Community Detection**: Executes Louvain modularity optimization to find optimal natural service boundaries without requiring a predefined cluster count.
5. **Semantic Narration**: Gemini assigns domain names (e.g., `Order Service`, `User Service`) and generates technical justifications, with an automatic rule-based fallback if the API is unreachable.
6. **Integrity Validation**: Evaluates service boundaries against dependency rules, flagging cross-boundary queries and cyclic service references.
7. **Export & UI**: Generates per-service DDL files, downloadable Markdown reports, and interactive React Flow visualization graphs.

---

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+) + Uvicorn
- **SQL Parsing**: `sqlglot` (PostgreSQL dialect parser)
- **Graph & Algorithms**: `networkx`, `python-louvain`
- **AI / LLM**: Google Gemini via Google GenAI SDK (with deterministic fallback)
- **Database**: Supabase PostgreSQL (production) / SQLite (local dev) — SQLAlchemy 2.0 ORM with connection pooling support
- **Authentication**: `python-jose` (JWT / HS256), `passlib` (bcrypt)
- **Validation**: Pydantic v2
- **Testing**: `pytest`, `pytest-asyncio`, `pytest-cov`

### Frontend
- **Framework**: React 18 + Vite 8
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion
- **Graph Visualization**: `@xyflow/react` (React Flow) + `@dagrejs/dagre` auto-layout
- **3D Graphics**: `Three.js`, `@react-three/fiber`, `@react-three/drei`
- **State Management**: Zustand (auth + analysis stores)
- **UI Components**: `react-hot-toast`, `react-syntax-highlighter`, `recharts`
- **Routing & HTTP**: `react-router-dom` v7, `axios` with JWT interceptor

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database Hosting**: Supabase PostgreSQL (transaction pooler)
- **Configuration**: Environment-based CORS and application settings

---

## Project Structure

```
SchemaMorph-AI/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── ai/                    # Gemini AI engine and prompt templates
│   │   │   ├── engine.py          #   LLM invocation with fallback logic
│   │   │   └── prompts.py         #   Structured prompt templates
│   │   ├── api/                   # FastAPI routers & dependencies
│   │   │   ├── dependencies.py    #   Database session lifecycle
│   │   │   └── v1/
│   │   │       ├── analysis.py    #   Pipeline execution & project sessions
│   │   │       ├── auth.py        #   Authentication endpoints
│   │   │       ├── queries.py     #   Query log ingestion
│   │   │       ├── router.py      #   API v1 root router
│   │   │       └── schema.py      #   DDL file upload & processing
│   │   ├── core/                  # Security utilities
│   │   │   └── security.py        #   Password hashing, token generation, complexity checks
│   │   ├── graph/                 # Graph construction & partitioning
│   │   │   ├── builder.py         #   Weighted dependency graph construction
│   │   │   └── clusterer.py       #   Louvain modularity clustering
│   │   ├── models/                # Database models & Pydantic schemas
│   │   │   ├── database.py        #   SQLAlchemy ORM models
│   │   │   └── schemas.py         #   Pydantic request & response schemas
│   │   ├── parsers/               # SQL parsing engine
│   │   │   ├── query_parser.py    #   Query co-access analyzer
│   │   │   └── schema_parser.py   #   DDL schema parser
│   │   ├── reports/               # Output generation
│   │   │   └── generator.py       #   Per-service DDL & report synthesis
│   │   ├── validation/            # Structural integrity verification
│   │   │   └── validator.py       #   Boundary & dependency validation
│   │   └── main.py                # FastAPI entry point
│   ├── tests/                     # Automated test suites (91 tests)
│   │   ├── fixtures/              # Sample schemas and SQL test files
│   │   ├── integration/           # API and end-to-end integration tests
│   │   └── unit/                  # Parser, graph builder, AI engine, and security unit tests
│   ├── requirements.txt           # Python dependencies
│   └── run.py                     # Local development runner
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js          # Axios client with JWT interceptor
│   │   ├── components/
│   │   │   ├── AppLayout.jsx      # Protected layout wrapper
│   │   │   ├── Background3D.jsx   # Three.js background canvas
│   │   │   ├── Captcha.jsx        # Custom canvas CAPTCHA component
│   │   │   ├── FloatingNav.jsx    # Floating header navigation
│   │   │   ├── HolographicOverlay.jsx # 3D background holographic layer
│   │   │   ├── MicroserviceGraphView.jsx # Clustered service graph view
│   │   │   ├── MonolithGraphView.jsx    # Pre-split monolithic graph view
│   │   │   ├── Navbar.jsx         # Main navigation bar
│   │   │   ├── QueryDiff.jsx      # Cross-service query viewer
│   │   │   ├── ServicePanel.jsx   # Service details sidebar
│   │   │   ├── Sidebar.jsx        # Navigation drawer
│   │   │   ├── ValidationBadge.jsx # Validation status badge
│   │   │   └── WebGLLoader.jsx    # Initial WebGL loading transition
│   │   ├── data/
│   │   │   └── sampleSchemas.js   # Preloaded sample schemas
│   │   ├── lib/                   # Utility helpers
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Partition visualization & metrics
│   │   │   ├── History.jsx        # Analysis run history
│   │   │   ├── Landing.jsx        # Product landing page
│   │   │   ├── Login.jsx          # Login view
│   │   │   ├── ProfileSettings.jsx# User settings
│   │   │   ├── Register.jsx       # User registration
│   │   │   ├── Team.jsx           # Project contributors
│   │   │   └── Upload.jsx         # Schema & query ingestion page
│   │   ├── store/
│   │   │   ├── authStore.js       # Zustand auth store
│   │   │   └── useAnalysisStore.js# Zustand session state
│   │   ├── App.jsx                # Application router
│   │   ├── index.css              # Global styles & theme definitions
│   │   └── main.jsx               # React entry point
│   ├── components.json            # Component registry config
│   ├── jsconfig.json              # Path aliases
│   ├── package.json               # Frontend dependencies
│   ├── tailwind.config.js         # Tailwind configuration
│   └── vite.config.js             # Vite configuration
│
├── docker-compose.yml             # Local multi-service orchestration
├── .env                           # Environment variables
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
- **Python**: 3.11+
- **Node.js**: 18+ (with `npm`)
- **Gemini API Key**: Available from [Google AI Studio](https://aistudio.google.com)

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
# Windows:
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux:
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```env
# Database connection (PostgreSQL or local SQLite for testing)
DATABASE_URL=postgresql://user:password@host:port/dbname

# Google Gemini API
GEMINI_API_KEY=your-google-ai-api-key

# JWT Signing Key
SECRET_KEY=your-random-secret-key-minimum-32-bytes

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Start the FastAPI application:
```bash
python run.py
```
- API server: `http://localhost:8000`
- Interactive OpenAPI documentation: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
- Web application: `http://localhost:5173`

---

### 3. Docker Deployment (Optional)

```bash
# Build and run containers
docker-compose up --build
```
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:80`

---

## API Reference

All application endpoints are versioned under `/api/v1`. Protected routes require a Bearer token in the `Authorization` header.

| Method | Endpoint | Auth Required | Description |
|---|---|:---:|---|
| `POST` | `/api/v1/auth/register` | No | Register new user account with domain and complexity checks |
| `POST` | `/api/v1/auth/login` | No | Authenticate user and issue JWT token (24-hour expiration) |
| `GET`  | `/api/v1/auth/me` | No | Health check for authentication subsystem |
| `POST` | `/api/v1/upload-schema` | Yes | Upload monolithic SQL DDL (file or raw text) |
| `POST` | `/api/v1/upload-queries` | Yes | Attach query logs to an active analysis session |
| `POST` | `/api/v1/analyze` | Yes | Run the complete 7-step decomposition pipeline |
| `GET`  | `/api/v1/session/{id}` | Yes | Fetch cached analysis results and graph models |
| `GET`  | `/api/v1/projects` | Yes | List all projects belonging to authenticated user |
| `DELETE` | `/api/v1/projects/{id}` | Yes | Delete a saved project and associated records |
| `GET`  | `/health` | No | Service health check |

---

## Security Controls

| Control | Description |
|---|---|
| **Password Hashing** | Uses `bcrypt` through `passlib` with configurable rounds. |
| **Password Complexity** | Enforces minimum 8 characters with lowercase, uppercase, digit, and symbol constraints. |
| **Domain Allowlisting** | Restricts registrations to recognized educational and institutional domains (`gmail.com`, `gla.ac.in`, etc.). |
| **CAPTCHA Verification** | Canvas-rendered visual distortion with noise lines to deter automated submissions. |
| **Token Authentication** | Signed HS256 JWT tokens with 24-hour lifespan. |
| **CORS Policy** | Whitelist-based origin filtering via environment configuration. |
| **Payload Validation** | Strict schema validation on all incoming request bodies using Pydantic v2. |

---

## Testing

The project maintains comprehensive unit and integration test coverage across the decomposition engine, parser edge cases, graph construction, and security modules.

### Backend Test Coverage (91 Tests)

```bash
cd backend
pytest tests/ -v
```

| Test Suite | File / Scope | Tests |
|---|---|:---:|
| **API Pipeline Integration** | `tests/integration/test_api_pipeline.py` | 14 |
| **Password Policy & Auth** | `tests/integration/test_auth_password.py` | 1 |
| **Query Parser** | `tests/test_query_parser.py` | 10 |
| **AI Engine & Fallback** | `tests/unit/test_ai_engine.py` | 9 |
| **Graph Builder & Louvain** | `tests/unit/test_graph_builder.py` | 20 |
| **Schema Parser (FK & Edge Cases)** | `tests/unit/test_schema_parser.py` | 29 |
| **Password & Security Rules** | `tests/unit/test_security.py` | 8 |
| **Total Passed** | | **91** |

### Frontend Build Verification

```bash
cd frontend
npm run build
```

---

## Application Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page with 3D visualization |
| `/login` | Public | User authentication |
| `/register` | Public | Account creation with CAPTCHA validation |
| `/upload` | Protected | DDL and workload query ingestion |
| `/dashboard/:sessionId` | Protected | Interactive graph viewer, partition breakdown, and report download |
| `/history` | Protected | Previous analysis run management |
| `/profile` | Protected | Account profile settings |
| `/team` | Protected | Project contributor details |

---

## Team & Contributors

- **Raghuraj Pratap Rajpoot** — *Lead & Architect* (Graph analysis engine, AI pipeline, backend architecture)
- **Samridhi Singh** — *Frontend Engineer* (React Flow visualization, UI design, Zustand state management)
- **Samridhi Jaiswal** — *Backend Engineer* (SQL parsing, database schema, validation pipeline)

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.
