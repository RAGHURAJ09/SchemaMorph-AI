"""
Graph Builder Module
Builds a weighted networkx graph from schema + query analysis results.

DETERMINISTIC — no AI involved.
Nodes = tables
Edges = FK relationships (weight 2.0) + query co-access (weight 1.0 per occurrence)
"""
import networkx as nx
from typing import Dict, List


def build_graph(schema_result: dict, query_analyses: List[dict]) -> nx.Graph:
    """
    Build a weighted undirected graph.

    FK edges have higher weight than query co-access edges because structural
    coupling is harder to break than runtime coupling.
    """
    G = nx.Graph()
    tables = schema_result.get("tables", {})
    foreign_keys = schema_result.get("foreign_keys", [])

    # ── Add nodes ────────────────────────────────────────────────────────────
    for tname, tdata in tables.items():
        G.add_node(
            tname,
            column_count=tdata.get("column_count", 0),
            is_hub=tdata.get("is_hub", False),
            is_isolated=tdata.get("is_isolated", False),
            incoming_fk_count=tdata.get("incoming_fk_count", 0),
        )

    # ── FK edges (weight 2.0 — structural coupling) ──────────────────────────
    for fk in foreign_keys:
        from_t = fk["from_table"]
        to_t = fk["to_table"]
        if from_t not in G or to_t not in G:
            continue  # FK references a table outside this schema dump — skip
        if G.has_edge(from_t, to_t):
            G[from_t][to_t]["weight"] += 2.0
            G[from_t][to_t]["fk_count"] += 1
        else:
            G.add_edge(from_t, to_t, weight=2.0, fk_count=1, co_access_count=0)

    # ── Co-access edges from query analysis (weight 1.0 per shared query) ────
    for qa in query_analyses:
        if qa.get("parse_error"):
            continue
        accessed = [t for t in qa.get("all_tables", []) if t in G]
        for i in range(len(accessed)):
            for j in range(i + 1, len(accessed)):
                t1, t2 = accessed[i], accessed[j]
                if G.has_edge(t1, t2):
                    G[t1][t2]["weight"] += 1.0
                    G[t1][t2]["co_access_count"] += 1
                else:
                    G.add_edge(t1, t2, weight=1.0, fk_count=0, co_access_count=1)

    # ── Compute graph centrality metrics ─────────────────────────────────────
    if len(G.nodes) > 0:
        deg_centrality = nx.degree_centrality(G)
        try:
            betweenness = nx.betweenness_centrality(G, weight="weight")
        except Exception:
            betweenness = {n: 0.0 for n in G.nodes}

        for node in G.nodes:
            G.nodes[node]["degree_centrality"] = round(deg_centrality.get(node, 0.0), 4)
            G.nodes[node]["betweenness_centrality"] = round(betweenness.get(node, 0.0), 4)

    return G


def serialize_graph(G: nx.Graph, partition: Dict[str, int]) -> dict:
    """
    Serialize graph to JSON-compatible format for React Flow rendering.
    Cross-service edges are flagged separately so the frontend can color them red.
    """
    CLUSTER_COLORS = [
        "#6366f1",  # indigo
        "#22d3ee",  # cyan
        "#f59e0b",  # amber
        "#10b981",  # emerald
        "#ec4899",  # pink
        "#8b5cf6",  # violet
        "#f97316",  # orange
        "#14b8a6",  # teal
        "#ef4444",  # red
        "#84cc16",  # lime
    ]

    nodes = []
    for tname, attrs in G.nodes(data=True):
        cluster_id = partition.get(tname, 0)
        nodes.append({
            "id": tname,
            "label": tname,
            "cluster_id": cluster_id,
            "color": CLUSTER_COLORS[cluster_id % len(CLUSTER_COLORS)],
            "is_hub": attrs.get("is_hub", False),
            "is_isolated": attrs.get("is_isolated", False),
            "column_count": attrs.get("column_count", 0),
            "incoming_fk_count": attrs.get("incoming_fk_count", 0),
            "degree_centrality": attrs.get("degree_centrality", 0.0),
            "betweenness_centrality": attrs.get("betweenness_centrality", 0.0),
        })

    edges = []
    for u, v, data in G.edges(data=True):
        from_cluster = partition.get(u, -1)
        to_cluster = partition.get(v, -2)
        edges.append({
            "id": f"{u}__{v}",
            "source": u,
            "target": v,
            "weight": round(data.get("weight", 1.0), 2),
            "fk_count": data.get("fk_count", 0),
            "co_access_count": data.get("co_access_count", 0),
            "is_cross_service": from_cluster != to_cluster,
        })

    return {"nodes": nodes, "edges": edges}
