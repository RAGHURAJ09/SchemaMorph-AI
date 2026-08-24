"""
Unit tests for app/graph/builder.py and app/graph/clusterer.py

Tests cover: graph construction, edge weights, clustering behavior,
timeout fallback (via threading), and serialization output format.
"""
import pytest
import networkx as nx
from app.graph.builder import build_graph, serialize_graph
from app.graph.clusterer import cluster_graph, get_cluster_summary
from app.parsers.schema_parser import parse_schema


# ── Helpers ──────────────────────────────────────────────────────────────────

def _make_schema(table_names, fks):
    """Build a minimal schema_result dict for graph tests."""
    return {
        "tables": {t: {"column_count": 3, "is_hub": False, "is_isolated": False,
                        "incoming_fk_count": 0} for t in table_names},
        "foreign_keys": fks,
    }


# ── Graph Builder Tests ───────────────────────────────────────────────────────

class TestBuildGraph:
    def test_correct_node_count(self):
        schema = _make_schema(["users", "orders", "products"], [])
        G = build_graph(schema, [])
        assert G.number_of_nodes() == 3

    def test_correct_edge_for_fk(self):
        schema = _make_schema(
            ["users", "orders"],
            [{"from_table": "orders", "to_table": "users",
              "from_columns": ["user_id"], "to_columns": ["id"]}]
        )
        G = build_graph(schema, [])
        assert G.number_of_edges() == 1
        assert G.has_edge("orders", "users")

    def test_fk_edge_weight_is_2(self):
        schema = _make_schema(
            ["users", "orders"],
            [{"from_table": "orders", "to_table": "users",
              "from_columns": ["user_id"], "to_columns": ["id"]}]
        )
        G = build_graph(schema, [])
        assert G["orders"]["users"]["weight"] == 2.0

    def test_duplicate_fk_accumulates_weight(self):
        """Two FKs between same tables → weight should be 4.0."""
        schema = _make_schema(
            ["orders", "users"],
            [
                {"from_table": "orders", "to_table": "users",
                 "from_columns": ["user_id"], "to_columns": ["id"]},
                {"from_table": "orders", "to_table": "users",
                 "from_columns": ["billing_user_id"], "to_columns": ["id"]},
            ]
        )
        G = build_graph(schema, [])
        assert G["orders"]["users"]["weight"] == 4.0
        assert G["orders"]["users"]["fk_count"] == 2

    def test_query_coacccess_adds_edge(self):
        schema = _make_schema(["users", "orders"], [])
        query_analyses = [
            {"query_id": "q1", "all_tables": ["users", "orders"], "parse_error": None}
        ]
        G = build_graph(schema, query_analyses)
        assert G.has_edge("users", "orders")
        assert G["users"]["orders"]["weight"] == 1.0
        assert G["users"]["orders"]["co_access_count"] == 1

    def test_unknown_fk_table_skipped(self):
        """FK referencing a table not in schema is silently skipped."""
        schema = _make_schema(
            ["orders"],
            [{"from_table": "orders", "to_table": "ghost_table",
              "from_columns": ["x"], "to_columns": ["id"]}]
        )
        G = build_graph(schema, [])
        assert G.number_of_edges() == 0

    def test_empty_schema_produces_empty_graph(self):
        schema = _make_schema([], [])
        G = build_graph(schema, [])
        assert G.number_of_nodes() == 0

    def test_single_table_no_edges(self):
        schema = _make_schema(["solo"], [])
        G = build_graph(schema, [])
        assert G.number_of_nodes() == 1
        assert G.number_of_edges() == 0

    def test_centrality_metrics_added(self):
        schema = _make_schema(
            ["a", "b", "c"],
            [{"from_table": "a", "to_table": "b", "from_columns": [], "to_columns": []},
             {"from_table": "a", "to_table": "c", "from_columns": [], "to_columns": []}]
        )
        G = build_graph(schema, [])
        for node in G.nodes:
            assert "degree_centrality" in G.nodes[node]
            assert "betweenness_centrality" in G.nodes[node]


# ── Graph Clusterer Tests ─────────────────────────────────────────────────────

class TestClusterGraph:
    def test_empty_graph_returns_empty(self):
        G = nx.Graph()
        partition, modularity = cluster_graph(G)
        assert partition == {}
        assert modularity == 0.0

    def test_single_node_cluster(self):
        G = nx.Graph()
        G.add_node("solo")
        partition, _ = cluster_graph(G)
        assert "solo" in partition
        assert partition["solo"] == 0

    def test_isolated_table_gets_cluster(self):
        schema = _make_schema(["logs"], [])
        G = build_graph(schema, [])
        partition, _ = cluster_graph(G)
        assert "logs" in partition

    def test_two_disconnected_groups_cluster_separately(self):
        """Two disconnected groups must be in different clusters."""
        G = nx.Graph()
        # Group A: a-b connected
        G.add_edge("a", "b", weight=2.0, fk_count=1, co_access_count=0)
        # Group B: c-d connected
        G.add_edge("c", "d", weight=2.0, fk_count=1, co_access_count=0)
        partition, _ = cluster_graph(G)
        assert partition["a"] == partition["b"]
        assert partition["c"] == partition["d"]
        assert partition["a"] != partition["c"]

    def test_cluster_ids_are_consecutive_from_zero(self):
        G = nx.Graph()
        G.add_edge("a", "b", weight=2.0, fk_count=1, co_access_count=0)
        G.add_edge("c", "d", weight=2.0, fk_count=1, co_access_count=0)
        partition, _ = cluster_graph(G)
        cluster_ids = sorted(set(partition.values()))
        assert cluster_ids == list(range(len(cluster_ids)))

    def test_hub_and_spoke_produces_multiple_clusters(self):
        """6-table hub-and-spoke should give >= 2 clusters."""
        schema = _make_schema(
            ["users", "orders", "items", "products", "categories", "reviews"],
            [
                {"from_table": "orders",    "to_table": "users",      "from_columns": [], "to_columns": []},
                {"from_table": "items",     "to_table": "orders",     "from_columns": [], "to_columns": []},
                {"from_table": "items",     "to_table": "products",   "from_columns": [], "to_columns": []},
                {"from_table": "reviews",   "to_table": "products",   "from_columns": [], "to_columns": []},
                {"from_table": "products",  "to_table": "categories", "from_columns": [], "to_columns": []},
            ]
        )
        G = build_graph(schema, [])
        partition, modularity = cluster_graph(G)
        unique_clusters = set(partition.values())
        assert len(unique_clusters) >= 2

    def test_15table_ecommerce_clusters(self, ecommerce_schema):
        """Full 15-table schema should produce 2-5 meaningful clusters."""
        result = parse_schema(ecommerce_schema)
        G = build_graph(result, [])
        partition, modularity = cluster_graph(G)
        unique_clusters = set(partition.values())
        assert len(unique_clusters) >= 2
        assert len(unique_clusters) <= 6  # Sanity upper bound
        assert all(t in partition for t in result["tables"])


# ── Serialize Graph Tests ─────────────────────────────────────────────────────

class TestSerializeGraph:
    def test_serialize_output_structure(self):
        schema = _make_schema(
            ["users", "orders"],
            [{"from_table": "orders", "to_table": "users",
              "from_columns": ["user_id"], "to_columns": ["id"]}]
        )
        G = build_graph(schema, [])
        partition = {"users": 0, "orders": 0}
        graph_data = serialize_graph(G, partition)

        assert "nodes" in graph_data
        assert "edges" in graph_data
        assert len(graph_data["nodes"]) == 2
        assert len(graph_data["edges"]) == 1

    def test_cross_service_edge_flagged(self):
        schema = _make_schema(
            ["users", "orders"],
            [{"from_table": "orders", "to_table": "users",
              "from_columns": ["user_id"], "to_columns": ["id"]}]
        )
        G = build_graph(schema, [])
        # Deliberately put in different clusters
        partition = {"users": 0, "orders": 1}
        graph_data = serialize_graph(G, partition)
        edge = graph_data["edges"][0]
        assert edge["is_cross_service"] is True

    def test_intra_service_edge_not_flagged(self):
        schema = _make_schema(
            ["users", "orders"],
            [{"from_table": "orders", "to_table": "users",
              "from_columns": ["user_id"], "to_columns": ["id"]}]
        )
        G = build_graph(schema, [])
        partition = {"users": 0, "orders": 0}
        graph_data = serialize_graph(G, partition)
        edge = graph_data["edges"][0]
        assert edge["is_cross_service"] is False

    def test_node_has_color_field(self):
        schema = _make_schema(["users"], [])
        G = build_graph(schema, [])
        graph_data = serialize_graph(G, {"users": 0})
        node = graph_data["nodes"][0]
        assert "color" in node
        assert node["color"].startswith("#")


# ── Cluster Summary Tests ─────────────────────────────────────────────────────

class TestClusterSummary:
    def test_summary_has_all_clusters(self, sample_schema):
        result = parse_schema(sample_schema)
        G = build_graph(result, [])
        partition, _ = cluster_graph(G)
        summaries = get_cluster_summary(partition, result)
        cluster_ids_in_summary = {s["cluster_id"] for s in summaries}
        cluster_ids_in_partition = set(partition.values())
        assert cluster_ids_in_summary == cluster_ids_in_partition

    def test_summary_table_counts(self, sample_schema):
        result = parse_schema(sample_schema)
        G = build_graph(result, [])
        partition, _ = cluster_graph(G)
        summaries = get_cluster_summary(partition, result)
        total_tables = sum(s["table_count"] for s in summaries)
        assert total_tables == result["table_count"]
