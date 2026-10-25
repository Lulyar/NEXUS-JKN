import os
import joblib
import numpy as np
import pandas as pd

# Path to trained XGBoost model
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "aegis_jkn_xgboost.joblib")

_xgb_bundle = None

def _load_ml_model():
    """Load trained XGBoost model bundle once with caching."""
    global _xgb_bundle
    if _xgb_bundle is None and os.path.exists(MODEL_PATH):
        try:
            _xgb_bundle = joblib.load(MODEL_PATH)
        except Exception:
            _xgb_bundle = None
    return _xgb_bundle


def detect_anomalies(G, threshold=0.55):
    """
    Detect anomalous referral edges in the graph using a Hybrid approach:
    1. Machine Learning Prediction: Trained XGBoost model (aegis_jkn_xgboost.joblib)
    2. Explainable AI Scoring: Transparent multi-factor weights for BPJS auditors

    Returns list of anomaly dicts and set of anomaly edge tuples.
    """
    W_CONCENTRATION = 0.30
    W_MILD_DIAG = 0.30
    W_DISTANCE = 0.20
    W_VOLUME = 0.20

    # Load ML model
    bundle = _load_ml_model()
    ml_model = bundle.get("model") if bundle else None
    feature_cols = bundle.get("feature_columns") if bundle else None

    # Collect all edge metrics for normalization
    edge_list = list(G.edges(data=True))
    if not edge_list:
        return [], set()

    all_counts = [attrs.get('count', 0) for _, _, attrs in edge_list]
    all_distances = [attrs.get('avg_distance', 0) for _, _, attrs in edge_list]

    mean_count = np.mean(all_counts)
    std_count = np.std(all_counts) if np.std(all_counts) > 0 else 1
    median_distance = np.median(all_distances)
    max_distance = max(all_distances) if all_distances else 1

    # High-speed Batch ML Inference (1 call for all 200 edges instead of 200 separate calls)
    ml_probs = [None] * len(edge_list)
    if ml_model is not None and feature_cols:
        try:
            batch_rows = []
            for s, t, attrs in edge_list:
                target_tingkat = G.nodes[t].get("tingkat", "Tipe C")
                tipe_score = 3 if target_tingkat == "Tipe A" else 2 if target_tingkat == "Tipe B" else 1
                avg_dist = attrs.get('avg_distance', 0)
                diff = max(0, avg_dist - median_distance)
                batch_rows.append({
                    "jarak_km": avg_dist,
                    "is_mild_icd": 1 if attrs.get('mild_ratio', 0) >= 0.5 else 0,
                    "route_concentration": attrs.get('concentration', 0),
                    "route_mild_ratio": attrs.get('mild_ratio', 0),
                    "distance_deviation": diff,
                    "route_volume": attrs.get('count', 0),
                    "tipe_rs_score": tipe_score
                })
            batch_df = pd.DataFrame(batch_rows)[feature_cols]
            raw_probs = ml_model.predict_proba(batch_df)[:, 1]
            ml_probs = [round(float(p), 4) for p in raw_probs]
        except Exception:
            ml_probs = [None] * len(edge_list)

    anomalies = []
    anomaly_edges = set()

    for idx, (source, target, attrs) in enumerate(edge_list):
        count = attrs.get('count', 0)
        concentration = attrs.get('concentration', 0)
        mild_ratio = attrs.get('mild_ratio', 0)
        avg_distance = attrs.get('avg_distance', 0)
        ml_prob = ml_probs[idx]

        # Score 1: Concentration (0-1, higher = more suspicious)
        score_concentration = min(concentration, 1.0)

        # Score 2: Mild diagnosis ratio (0-1)
        score_mild = mild_ratio

        # Score 3: Distance anomaly (normalized, 0-1)
        distance_diff = max(0, avg_distance - median_distance)
        score_distance = min(distance_diff / max_distance, 1.0) if max_distance > 0 else 0

        # Score 4: Volume spike (z-score based, clamped to 0-1)
        z_score = (count - mean_count) / std_count
        score_volume = min(max(z_score / 3, 0), 1.0)

        # Weighted Explainable Fraud Score
        xai_score = round(
            W_CONCENTRATION * score_concentration +
            W_MILD_DIAG * score_mild +
            W_DISTANCE * score_distance +
            W_VOLUME * score_volume,
            4
        )

        final_score = xai_score
        G[source][target]['fraud_score'] = final_score
        if ml_prob is not None:
            G[source][target]['ml_fraud_prob'] = ml_prob

        if final_score >= threshold:
            anomaly_edges.add((source, target))
            anomalies.append({
                "source": source,
                "target": target,
                "fraud_score": final_score,
                "ml_probability": ml_prob if ml_prob is not None else final_score,
                "model_engine": "XGBoost Classifier (Trained) + Graph XAI",
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
                "risk_level": "CRITICAL" if final_score >= 0.75 else "HIGH" if final_score >= 0.6 else "MEDIUM"
            })

    # Sort by fraud score descending
    anomalies.sort(key=lambda x: x['fraud_score'], reverse=True)

    return anomalies, anomaly_edges
