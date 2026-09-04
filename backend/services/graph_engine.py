import networkx as nx
import pandas as pd


# Known FKTP list (clinics/puskesmas)
FKTP_LIST = [
    "Klinik Pratama Sehat Sejahtera",
    "Puskesmas Melati",
    "Puskesmas Mawar",
    "Klinik Pratama Kasih Ibu",
    "Puskesmas Harapan Bangsa",
    "Klinik Pratama Medika Utama",
    "Puskesmas Sukamaju",
    "Klinik Pratama Sehat Bersama",
    "Puskesmas Cempaka",
    "Klinik Pratama Nusantara",
]

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

    for (source, target), group in edge_groups:
        count = int(len(group))
        avg_distance = round(float(group['jarak_km'].mean()), 2)
        min_distance = round(float(group['jarak_km'].min()), 1)
        max_distance = round(float(group['jarak_km'].max()), 1)

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
                "mild_ratio": attrs.get("mild_ratio", 0),
                "concentration": attrs.get("concentration", 0),
                "anomaly": is_anomaly,
                "fraud_score": attrs.get("fraud_score", 0),
            }
        })

    return {"nodes": nodes, "edges": edges}
