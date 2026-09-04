import numpy as np


def detect_anomalies(G, threshold=0.55):
    """
    Detect anomalous referral edges in the graph using a weighted scoring system.

    Scoring Parameters:
    1. concentration_ratio  (w=0.30) — % of FKTP's referrals going to one specific FKRTL
    2. mild_diagnosis_ratio (w=0.30) — % of mild diagnoses (J00, A09) in this edge
    3. distance_anomaly     (w=0.20) — How far above median distance this edge's avg is
    4. volume_spike         (w=0.20) — How far above mean volume this edge is

    Returns list of anomaly dicts and set of anomaly edge tuples.
    """
    W_CONCENTRATION = 0.30
    W_MILD_DIAG = 0.30
    W_DISTANCE = 0.20
    W_VOLUME = 0.20

    # Collect all edge metrics for normalization
    all_counts = []
    all_distances = []

    for s, t, attrs in G.edges(data=True):
        all_counts.append(attrs.get('count', 0))
        all_distances.append(attrs.get('avg_distance', 0))

    if not all_counts:
        return [], set()

    mean_count = np.mean(all_counts)
    std_count = np.std(all_counts) if np.std(all_counts) > 0 else 1
    median_distance = np.median(all_distances)
    max_distance = max(all_distances) if all_distances else 1

    anomalies = []
    anomaly_edges = set()

    for source, target, attrs in G.edges(data=True):
        count = attrs.get('count', 0)
        concentration = attrs.get('concentration', 0)
        mild_ratio = attrs.get('mild_ratio', 0)
        avg_distance = attrs.get('avg_distance', 0)

        # Score 1: Concentration (0-1, higher = more suspicious)
        score_concentration = min(concentration, 1.0)

        # Score 2: Mild diagnosis ratio (0-1)
        score_mild = mild_ratio

        # Score 3: Distance anomaly (normalized, 0-1)
        distance_diff = max(0, avg_distance - median_distance)
        score_distance = min(distance_diff / max_distance, 1.0) if max_distance > 0 else 0

        # Score 4: Volume spike (z-score based, clamped to 0-1)
        z_score = (count - mean_count) / std_count
        score_volume = min(max(z_score / 3, 0), 1.0)  # Normalize z-score to 0-1 range

        # Weighted fraud score
        fraud_score = round(
            W_CONCENTRATION * score_concentration +
            W_MILD_DIAG * score_mild +
            W_DISTANCE * score_distance +
            W_VOLUME * score_volume,
            4
        )

        # Store fraud score on the edge
        G[source][target]['fraud_score'] = fraud_score

        if fraud_score >= threshold:
            anomaly_edges.add((source, target))
            anomalies.append({
                "source": source,
                "target": target,
                "fraud_score": fraud_score,
                "count": count,
                "concentration": round(concentration * 100, 1),
                "mild_ratio": round(mild_ratio * 100, 1),
                "avg_distance": avg_distance,
                "icd_breakdown": attrs.get('icd_breakdown', {}),
                "detail_scores": {
                    "concentration": round(score_concentration, 4),
                    "mild_diagnosis": round(score_mild, 4),
                    "distance": round(score_distance, 4),
                    "volume": round(score_volume, 4),
                },
                "risk_level": "CRITICAL" if fraud_score >= 0.75 else "HIGH" if fraud_score >= 0.6 else "MEDIUM"
            })

    # Sort by fraud score descending
    anomalies.sort(key=lambda x: x['fraud_score'], reverse=True)

    return anomalies, anomaly_edges
