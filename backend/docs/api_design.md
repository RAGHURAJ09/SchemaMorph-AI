# SchemaMorph AI - REST API Design

This document outlines the REST API endpoints required for the frontend to interact with the PostgreSQL-backed SchemaMorph backend.

## Base URL
`/api/v1`

---

## 1. Projects (Workspaces)

### `POST /projects`
**Description:** Create a new project workspace and upload the source database schema.
**Request Body:**
```json
{
  "name": "E-Commerce App",
  "source_schema_sql": "CREATE TABLE users (id UUID PRIMARY KEY...);"
}
```
**Response (201 Created):**
Returns the created project details, plus the count of tables and foreign keys parsed from the SQL.
```json
{
  "id": "uuid-here",
  "name": "E-Commerce App",
  "table_count": 15,
  "fk_count": 12,
  "created_at": "2026-08-21T10:00:00Z"
}
```

### `GET /projects/{project_id}`
**Description:** Fetch the details of a project, including all parsed tables and relationships (useful for rendering the initial graph UI).
**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "name": "E-Commerce App",
  "tables": [
    {
      "id": "uuid-here",
      "table_name": "users",
      "columns_metadata": [{"name": "id", "type": "uuid", "is_pk": true}],
      "row_count_estimate": null
    }
  ],
  "dependencies": [
    {
      "source_table_id": "uuid-a",
      "target_table_id": "uuid-b",
      "dependency_type": "FOREIGN_KEY"
    }
  ]
}
```

---

## 2. Workload Queries

### `POST /projects/{project_id}/queries`
**Description:** Upload application queries to build the workload profile.
**Request Body:**
```json
{
  "queries": [
    "SELECT * FROM users WHERE id = $1;",
    "SELECT o.id, u.email FROM orders o JOIN users u ON o.user_id = u.id;"
  ]
}
```
**Response (201 Created):**
```json
{
  "inserted_count": 2,
  "message": "Queries successfully ingested."
}
```

---

## 3. AI Analysis

### `POST /projects/{project_id}/analyze`
**Description:** Trigger the AI engine to generate microservice boundaries.
**Request Body:** *(Optional)* configuration parameters for the AI.
```json
{
  "max_services": 5,
  "focus_area": "performance"
}
```
**Response (202 Accepted):**
Because analysis takes time (LLM chaining), this returns a `run_id` to poll.
```json
{
  "run_id": "uuid-here",
  "status": "PENDING"
}
```

### `GET /analysis/{run_id}`
**Description:** Poll for the status of an analysis run, and retrieve the results if completed.
**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "status": "COMPLETED",
  "validation_summary": {
    "passed": true,
    "warnings": []
  },
  "service_boundaries": [
    {
      "id": "uuid-here",
      "name": "User Service",
      "included_tables": ["users", "user_preferences"],
      "target_schema_sql": "CREATE TABLE users (...);"
    }
  ],
  "query_refactorings": [
    {
      "original_query_id": "uuid-here",
      "refactored_sql": "API Call to User Service -> API Call to Order Service",
      "explanation": "Removed JOIN across service boundaries."
    }
  ]
}
```
