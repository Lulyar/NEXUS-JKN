import networkx as nx
import pandas as pd


MILD_ICD10 = {"J00", "A09"}  # Diagnoses considered "mild" / should be handled at FKTP


def build_referral_graph(df):
    """
    Build a directed graph from referral data.
    Nodes = Faskes (FKTP / FKRTL)
    Edges = Referral flow with aggregated attributes.
    """
    G = nx.DiGraph()

    # --- Build Nodes ---
    for faskes in df['faskes_asal'].unique():
        ftype = "FKTP"
        total_out = int(len(df[df['faskes_asal'] == faskes]))
        G.add_node(faskes, node_type=ftype, total_referrals=total_out, tingkat="-")

    for faskes in df['faskes_tujuan'].unique():
        ftype = "FKRTL"
        tingkat = df[df['faskes_tujuan'] == faskes]['tingkat_faskes_tujuan'].iloc[0]
        total_in = int(len(df[df['faskes_tujuan'] == faskes]))
        if faskes in G:
            G.nodes[faskes]['total_referrals_in'] = total_in
        else:
            G.add_node(faskes, node_type=ftype, total_referrals=0, total_referrals_in=total_in, tingkat=tingkat)

    # --- Build Edges ---
    edge_groups = df.groupby(['faskes_asal', 'faskes_tujuan'])

    # Pre-calculate nearest hospital per FKTP source
    source_min_dist = {}
    for (source, target), group in edge_groups:
        d = float(group['jarak_km'].mean())
        if source not in source_min_dist or d < source_min_dist[source][1]:
            source_min_dist[source] = (target, d)

    for (source, target), group in edge_groups:
        count = int(len(group))
        avg_distance = round(float(group['jarak_km'].mean()), 2)
        min_distance = round(float(group['jarak_km'].min()), 1)
        max_distance = round(float(group['jarak_km'].max()), 1)

        # Real road distance & urban travel time (average speed 28 km/h in urban traffic)
        real_dist = round(avg_distance * 1.25, 1)
        travel_time = max(6, int(round((real_dist / 28.0) * 60)))

        # Nearest alternative hospital comparison
        nearest_rs, nearest_raw_d = source_min_dist.get(source, (target, avg_distance))
        nearest_real_d = round(nearest_raw_d * 1.25, 1)
        nearest_time = max(6, int(round((nearest_real_d / 28.0) * 60)))
        time_penalty = max(0, travel_time - nearest_time)

        # ICD-10 breakdown
        icd_counts = group['kode_icd10'].value_counts().to_dict()
        icd_breakdown = {k: int(v) for k, v in icd_counts.items()}

        # Mild diagnosis ratio
        mild_count = int(group[group['kode_icd10'].isin(MILD_ICD10)].shape[0])
        mild_ratio = round(mild_count / count, 4) if count > 0 else 0

        # Concentration ratio: what % of source's total referrals go to this target?
        source_total = G.nodes[source].get('total_referrals', 1)
        concentration = round(count / source_total, 4) if source_total > 0 else 0

        G.add_edge(
            source, target,
            count=count,
            avg_distance=avg_distance,
            real_distance_km=real_dist,
            travel_time_minutes=travel_time,
            nearest_hospital=nearest_rs,
            nearest_distance_km=nearest_real_d,
            nearest_travel_time_min=nearest_time,
            time_penalty_minutes=time_penalty,
            min_distance=min_distance,
            max_distance=max_distance,
            icd_breakdown=icd_breakdown,
            mild_count=mild_count,
            mild_ratio=mild_ratio,
            concentration=concentration,
        )

    return G


def graph_to_cytoscape(G, anomaly_edges=None):
    """
    Convert NetworkX graph to Cytoscape.js compatible JSON format.
    anomaly_edges: set of (source, target) tuples flagged as anomalies.
    """
    if anomaly_edges is None:
        anomaly_edges = set()

    anomaly_nodes = set()
    for s, t in anomaly_edges:
        anomaly_nodes.add(s)
        anomaly_nodes.add(t)

    nodes = []
    for node_id, attrs in G.nodes(data=True):
        nodes.append({
            "data": {
                "id": node_id,
                "label": node_id,
                "node_type": attrs.get("node_type", "FKTP"),
                "tingkat": attrs.get("tingkat", "-"),
                "total_referrals": attrs.get("total_referrals", 0),
                "anomaly": node_id in anomaly_nodes,
            }
        })

    edges = []
    for source, target, attrs in G.edges(data=True):
        is_anomaly = (source, target) in anomaly_edges
        edges.append({
            "data": {
                "id": f"{source}_to_{target}",
                "source": source,
                "target": target,
                "count": attrs.get("count", 0),
                "avg_distance": attrs.get("avg_distance", 0),
                "real_distance_km": attrs.get("real_distance_km", round(attrs.get("avg_distance", 0) * 1.25, 1)),
                "travel_time_minutes": attrs.get("travel_time_minutes", 15),
                "nearest_hospital": attrs.get("nearest_hospital", target),
                "nearest_distance_km": attrs.get("nearest_distance_km", 3.0),
                "nearest_travel_time_min": attrs.get("nearest_travel_time_min", 8),
                "time_penalty_minutes": attrs.get("time_penalty_minutes", 0),
                "mild_ratio": attrs.get("mild_ratio", 0),
                "concentration": attrs.get("concentration", 0),
                "anomaly": is_anomaly,
                "fraud_score": attrs.get("fraud_score", 0),
            }
        })

    return {"nodes": nodes, "edges": edges}
