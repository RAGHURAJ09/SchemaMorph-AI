# AI Architecture & Prompt Chaining Strategy

SchemaMorph AI uses an advanced prompt chaining strategy to decompose a massive SQL monolith into independent microservices, ensuring that we don't exceed LLM context windows and that we get structured, verifiable output.

## 1. The Chaining Pipeline

Breaking down a database schema into microservices requires several distinct steps, each handled by a focused LLM prompt:

### Step 1: Initial Graph Structuring (The "Clustering" Prompt)
* **Input**: The parsed `Project` schema (tables, foreign keys, row counts) + `WorkloadQueries` (frequency and query types).
* **Objective**: Identify the logical groupings of tables.
* **Prompt Strategy**: We provide the LLM with a structural JSON representation of the database graph. We ask the LLM to act as a Staff Data Architect and assign each table to a specific domain (cluster).
* **Output format**: JSON array of clusters `[{"cluster_name": "Orders", "tables": ["orders", "order_items"]}]`

### Step 2: Target Schema Generation (The "DDL" Prompt)
* **Input**: One specific cluster from Step 1, plus its original DDL.
* **Objective**: Generate a clean, localized schema for this specific microservice.
* **Prompt Strategy**: "You are an expert Postgres DBA. Create the schema for the [Cluster Name] service. Remove any foreign keys that point to tables outside this list: [Table List]."
* **Output format**: Clean SQL DDL.

### Step 3: Query Refactoring (The "CQRS/API" Prompt)
* **Input**: The original workload queries + the boundaries defined in Step 1.
* **Objective**: Rewrite monolith queries (e.g., cross-domain JOINs) into distributed patterns.
* **Prompt Strategy**: "The following query spans the Orders and Users service. Rewrite this into pseudo-code or separate SQL queries assuming the application must now fetch data from both services over an API."
* **Output format**: JSON containing `refactored_sql` and `explanation`.

## 2. Graph UI State Management

The frontend React application relies heavily on dynamic graph rendering (using libraries like React Flow or Vis.js).

### Data Flow
1. **Initial Load**: When a project is loaded, the frontend calls `GET /projects/{id}` to fetch the `tables` and `dependencies`. This forms the initial, unclustered "hairball" graph.
2. **Analysis Polling**: When analysis is triggered, the frontend polls `GET /analysis/{run_id}`.
3. **Graph Update**: Once completed, the `service_boundaries` are returned. The frontend maps each table node to a specific service boundary (e.g., assigning a color or grouping box to the node).

### Backend Integration
The `AnalysisRun` model ties everything together. The UI relies on the fact that an `AnalysisRun` contains `service_boundaries` that directly reference the IDs or names of the `ParsedTable` models loaded in step 1.

## 3. Validation & Guardrails

The LLM is non-deterministic. To ensure quality, the backend implements validation before saving the `AnalysisRun` to the database:
- **Orphan Check**: Are any tables from the source schema missing in the service boundaries?
- **Foreign Key Integrity**: Do the generated target schemas illegally contain foreign keys pointing outside their boundary?
- **Parse Check**: Is the generated target schema valid SQL? (Tested via `sqlglot` or regex).

If validation fails, the backend will trigger a "Fix Prompt" (Step 4) asking the LLM to correct the specific errors before returning results to the user.
