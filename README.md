# SchemaMorph AI

> Analyze monolithic PostgreSQL schemas and discover natural microservice boundaries — powered by graph analysis and Gemini AI.

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### Backend

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY

python run.py
# → http://localhost:8000
# → API docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## How It Works

1. **Upload Schema** — paste or upload your PostgreSQL DDL (`.sql` file)
2. **Input Queries** — optionally paste SQL queries for cross-service analysis
3. **Analyze** — the system runs a 7-step deterministic + AI pipeline:
   - Schema parsed with `sqlglot` → structured table/FK data
   - Queries parsed with `sqlglot` → table access patterns
   - `networkx` builds a weighted dependency graph (FK edges + co-access edges)
   - Louvain algorithm clusters the graph into natural service communities
   - Gemini AI names each cluster, writes rationale, flags broken queries
   - Validator checks consistency — table coverage, FK crossings, cycle detection
   - Report generator assembles the final output
4. **Explore** — interactive graph, per-service target schemas, query analysis

---

## Architecture Principles

| Principle | How it's enforced |
|---|---|
| AI is downstream of all decisions | Louvain clusters first, AI narrates second |
| SQL parsing is deterministic | `sqlglot` — not LLM — extracts tables from queries |
| Validation is independent of AI | Validator re-checks partition consistency before using AI output |
| Reproducible clustering | Louvain runs with `random_state=42` |

---

## API Reference

```
POST /api/v1/upload-schema      Upload schema (file or text)
POST /api/v1/upload-queries     Add queries to a session
POST /api/v1/analyze            Run full analysis pipeline
GET  /api/v1/session/{id}       Retrieve cached result
GET  /api/v1/export/{id}/markdown  Download Markdown report
```

Full interactive docs: `http://localhost:8000/docs`

---

## Project Structure

```
SchemaMorph-AI/
├── backend/
│   ├── app/
│   │   ├── parsers/      schema_parser.py, query_parser.py
│   │   ├── graph/        builder.py, clusterer.py
│   │   ├── ai/           engine.py, prompts.py
│   │   ├── validation/   validator.py
│   │   ├── reports/      generator.py
│   │   └── api/v1/       schema.py, queries.py, analysis.py
│   └── tests/
└── frontend/
    └── src/
        ├── pages/        Upload.jsx, Dashboard.jsx
        └── components/   GraphView.jsx, ServicePanel.jsx, QueryDiff.jsx, ...
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | FastAPI + Python | Direct access to graph/ML/NLP libs |
| Schema/Query parsing | sqlglot | Pure Python, handles all PostgreSQL DDL/DML |
| Graph | networkx | Standard; has Louvain via python-louvain |
| Clustering | Louvain algorithm | Maximizes modularity, interpretable, no need to specify k |
| AI | Gemini 1.5 Flash | Generous free tier, JSON mode enforced |
| Frontend | React + Vite + React Flow | Component model, purpose-built graph rendering |
| Styling | Tailwind CSS | Fast iteration for a student team |

---

## Running Tests

```bash
cd backend
.\venv\Scripts\activate
pytest tests/ -v
```
