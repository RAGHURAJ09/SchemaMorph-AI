"""
Graph Clusterer Module
Uses Louvain community detection to identify natural service boundaries.

DETERMINISTIC — uses fixed random seed 42 for reproducibility.
Input:  networkx.Graph with weighted edges
Output: partition dict {table_name: cluster_id}, modularity score
"""
import networkx as nx
from collections import defaultdict
from typing import Dict, List, Tuple

# python-louvain installs as the 'community' package
try:
    import community as community_louvain
    LOUVAIN_AVAILABLE = True
except ImportError:
    LOUVAIN_AVAILABLE = False


def cluster_graph(G: nx.Graph, min_cluster_size: int = 2) -> Tuple[Dict[str, int], float]:
    """
    Partition the graph using Louvain community detection.

    Args:
        G: Weighted networkx graph (tables as nodes)
        min_cluster_size: Clusters smaller than this are merged into neighbours

    Returns:
        (partition, modularity)
        partition: {table_name: cluster_id}  — cluster_ids are consecutive from 0
        modularity: float — quality metric (higher = better separation)
    """
    if len(G.nodes) == 0:
        return {}, 0.0

    if len(G.nodes) == 1:
        node = list(G.nodes)[0]
        return {node: 0}, 0.0

    # Isolated nodes (no edges) will each form their own community — that's fine,
    # they'll be merged by _merge_small_clusters if min_cluster_size > 1.
    if not LOUVAIN_AVAILABLE:
        # Fallback: simple connected-components partition
        partition = _connected_components_partition(G)
    else:
        partition = community_louvain.best_partition(
            G, weight="weight", random_state=42
        )

    partition = _merge_small_clusters(G, partition, min_cluster_size)
    partition = _renumber_partition(partition)

    if LOUVAIN_AVAILABLE and len(set(partition.values())) > 1:
        try:
            modularity = community_louvain.modularity(partition, G, weight="weight")
        except Exception:
            modularity = 0.0
    else:
        modularity = 0.0

    return partition, round(modularity, 4)


def get_cluster_summary(partition: Dict[str, int], schema_result: dict) -> List[dict]:
    """
    Build a human-readable summary of each cluster.
    This is passed to the AI engine as context.
    """
    cluster_members: Dict[int, List[str]] = defaultdict(list)
    for table, cluster in partition.items():
        cluster_members[cluster].append(table)

    tables = schema_result.get("tables", {})
    foreign_keys = schema_result.get("foreign_keys", [])

    summaries = []
    for cluster_id in sorted(cluster_members.keys()):
        members = cluster_members[cluster_id]

        cross_fks, intra_fks = [], []
        for fk in foreign_keys:
            fc = partition.get(fk["from_table"])
            tc = partition.get(fk["to_table"])
            if fc == cluster_id or tc == cluster_id:
                if fc != tc:
                    cross_fks.append(fk)
                elif fc == cluster_id:
                    intra_fks.append(fk)

        total_columns = sum(
            tables.get(t, {}).get("column_count", 0) for t in members
        )
        hub_tables = [t for t in members if tables.get(t, {}).get("is_hub", False)]

        summaries.append({
            "cluster_id": cluster_id,
            "tables": sorted(members),
            "table_count": len(members),
            "total_columns": total_columns,
            "hub_tables": hub_tables,
            "intra_fk_count": len(intra_fks),
            "cross_fk_count": len(cross_fks),
            "cross_fks": cross_fks[:10],  # Cap at 10 to keep prompt size reasonable
        })

    return summaries


# ── Private helpers ──────────────────────────────────────────────────────────

def _merge_small_clusters(
    G: nx.Graph, partition: Dict[str, int], min_size: int
) -> Dict[str, int]:
    """Merge clusters smaller than min_size into the most-connected neighbour cluster."""
    cluster_members: Dict[int, List[str]] = defaultdict(list)
    for node, cluster in partition.items():
        cluster_members[cluster].append(node)

    small = {c for c, m in cluster_members.items() if len(m) < min_size}
    new_partition = dict(partition)

    for small_cluster in small:
        for member in cluster_members[small_cluster]:
            best_cluster, best_weight = None, -1.0
            for neighbour in G.neighbors(member):
                nc = new_partition.get(neighbour)
                if nc is not None and nc != small_cluster:
                    w = G[member][neighbour].get("weight", 1.0)
                    if w > best_weight:
                        best_weight, best_cluster = w, nc
            if best_cluster is not None:
                new_partition[member] = best_cluster

    return new_partition


def _renumber_partition(partition: Dict[str, int]) -> Dict[str, int]:
    """Renumber cluster IDs to be consecutive starting from 0."""
    unique = sorted(set(partition.values()))
    mapping = {old: new for new, old in enumerate(unique)}
    return {node: mapping[cluster] for node, cluster in partition.items()}


def _connected_components_partition(G: nx.Graph) -> Dict[str, int]:
    """Fallback: use connected components as clusters when Louvain is unavailable."""
    partition = {}
    for cluster_id, component in enumerate(nx.connected_components(G)):
        for node in component:
            partition[node] = cluster_id
    return partition
