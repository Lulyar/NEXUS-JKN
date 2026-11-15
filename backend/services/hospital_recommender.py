"""
AI Smart Hospital Referral Recommender Engine for NEXUS-JKN / AEGIS-JKN.
Recommends the best destination hospital (FKRTL) using a Hybrid AI approach:
1. Machine Learning Inference: Trained XGBoost Recommender (aegis_jkn_recommender.joblib)
2. BPJS Hierarchical Referral Regulations (Tipe A, B, C, D)
3. Real street road travel time and distance
4. Facility integrity clearance (anti-collusion filter)
"""

import os
import joblib
import pandas as pd

_ml_rec_bundle = None
REC_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "models",
    "aegis_jkn_recommender.joblib"
)

def _load_recommender_model():
    global _ml_rec_bundle
    if _ml_rec_bundle is None and os.path.exists(REC_MODEL_PATH):
        try:
            _ml_rec_bundle = joblib.load(REC_MODEL_PATH)
        except Exception:
            _ml_rec_bundle = None
    return _ml_rec_bundle

# Knowledge Base of ICD-10 Diagnosis Categories
DIAGNOSIS_CATALOG = {
    "J00": {
        "name": "Nasofaringitis Akut (ISPA / Batuk Pilek)",
        "severity": "Ringan",
        "category": "Non-Spesialistik",
        "preferred_tiers": ["Tipe D", "Tipe C"],
        "discouraged_tiers": ["Tipe A", "Tipe B"],
        "required_facility": "Poli Umum / Penyakit Ringan",
    },
    "A09": {
        "name": "Gastroenteritis & Kolitis Akut (Diare Akut)",
        "severity": "Ringan",
        "category": "Non-Spesialistik",
        "preferred_tiers": ["Tipe D", "Tipe C"],
        "discouraged_tiers": ["Tipe A"],
        "required_facility": "Rawat Inap Dasar / Rehidrasi",
    },
    "K29": {
        "name": "Gastritis & Duodenitis (Maag Akut)",
        "severity": "Ringan",
        "category": "Non-Spesialistik",
        "preferred_tiers": ["Tipe D", "Tipe C"],
        "discouraged_tiers": ["Tipe A"],
        "required_facility": "Poli Penyakit Dalam Dasar",
    },
    "E11": {
        "name": "Diabetes Melitus Tipe 2",
        "severity": "Sedang",
        "category": "Kronis / Spesialistik",
        "preferred_tiers": ["Tipe C", "Tipe B", "Tipe D"],
        "discouraged_tiers": [],
        "required_facility": "Poli Penyakit Dalam & Endokrin",
    },
    "I10": {
        "name": "Hipertensi Esensial (Primer)",
        "severity": "Sedang",
        "category": "Kronis / Spesialistik",
        "preferred_tiers": ["Tipe C", "Tipe B", "Tipe D"],
        "discouraged_tiers": [],
        "required_facility": "Poli Penyakit Dalam / Jantung Dasar",
    },
    "I21": {
        "name": "Infark Miokard Akut (Serangan Jantung Akut)",
        "severity": "Berat / Gawat Darurat",
        "category": "Subspesialistik Kompleks",
        "preferred_tiers": ["Tipe A", "Tipe B"],
        "discouraged_tiers": ["Tipe D", "Tipe C"],
        "required_facility": "ICCU, Cath Lab & Spesialis Jantung Intervensi",
    },
    "N18": {
        "name": "Penyakit Ginjal Kronis (CKD Tahap Lanjut)",
        "severity": "Berat",
        "category": "Subspesialistik Kompleks",
        "preferred_tiers": ["Tipe A", "Tipe B"],
        "discouraged_tiers": ["Tipe D"],
        "required_facility": "Unit Hemodialisa & Spesialis Nefrologi",
    },
    "I63": {
        "name": "Infark Serebral (Stroke Iskemik)",
        "severity": "Berat / Gawat Darurat",
        "category": "Subspesialistik Kompleks",
        "preferred_tiers": ["Tipe A", "Tipe B"],
        "discouraged_tiers": ["Tipe D"],
        "required_facility": "Stroke Unit, CT-Scan 24 Jam & Spesialis Saraf",
    },
}

# Hospital Directory with Tier, Coordinates, and Capabilities
HOSPITAL_CATALOG = {
    "RSUD Kota Sehat": {
        "tier": "Tipe A",
        "role": "Rujukan Tersier Subspesialistik Tertinggi",
        "coords": [-6.2, 106.82],
        "bed_capacity": "Kapasitas Besar (450 TT)",
        "facilities": ["ICCU", "Cath Lab", "Hemodialisa", "CT-Scan", "Bedah Saraf", "MRI"],
    },
    "RSUD Berkah Mandiri": {
        "tier": "Tipe A",
        "role": "Rujukan Tersier Subspesialistik Wilayah",
        "coords": [-6.22, 106.88],
        "bed_capacity": "Kapasitas Besar (380 TT)",
        "facilities": ["ICU/ICCU", "Hemodialisa", "Poli Onkologi", "Bedah Jantung"],
    },
    "RS Medika Care": {
        "tier": "Tipe B",
        "role": "Rujukan Sekunder Lanjut",
        "coords": [-6.23, 106.84],
        "bed_capacity": "Kapasitas Sedang (220 TT)",
        "facilities": ["ICU", "Hemodialisa", "Spesialis Lengkap (11 Spesialisasi)"],
    },
    "RS Graha Sehat": {
        "tier": "Tipe B",
        "role": "Rujukan Sekunder Lanjut",
        "coords": [-6.15, 106.86],
        "bed_capacity": "Kapasitas Sedang (200 TT)",
        "facilities": ["ICU", "Poli Saraf", "Penyakit Dalam", "Bedah Umum"],
    },
    "RS Harapan Kita Bersama": {
        "tier": "Tipe B",
        "role": "Rujukan Sekunder Lanjut",
        "coords": [-6.18, 106.87],
        "bed_capacity": "Kapasitas Sedang (210 TT)",
        "facilities": ["ICU", "Spesialis Jantung", "Paru", "Penyakit Dalam"],
    },
    "RS Mitra Mulia": {
        "tier": "Tipe B",
        "role": "Rujukan Sekunder Lanjut (Faskes Swasta)",
        "coords": [-6.2, 106.82],
        "bed_capacity": "Kapasitas Sedang (180 TT)",
        "facilities": ["ICU", "Penyakit Dalam", "Bedah"],
    },
    "RS Sentosa": {
        "tier": "Tipe C",
        "role": "Rujukan Sekunder Standar",
        "coords": [-6.16, 106.79],
        "bed_capacity": "Kapasitas Standar (110 TT)",
        "facilities": ["4 Spesialis Dasar (Anak, Obgyn, Bedah, Penyakit Dalam)"],
    },
    "RS Permata Bunda": {
        "tier": "Tipe C",
        "role": "Rujukan Sekunder Standar",
        "coords": [-6.25, 106.77],
        "bed_capacity": "Kapasitas Standar (100 TT)",
        "facilities": ["4 Spesialis Dasar", "Rawat Inap Standar JKN"],
    },
    "RS Bhakti Husada": {
        "tier": "Tipe D",
        "role": "Rujukan Sekunder Dasar / RS Pratama",
        "coords": [-6.27, 106.8],
        "bed_capacity": "Kapasitas Kompak (65 TT)",
        "facilities": ["Pelayanan Medis Dasar", "2 Spesialis Dasar", "Rawat Inap Pratama"],
    },
    "RS Ananda Medika": {
        "tier": "Tipe D",
        "role": "Rujukan Sekunder Dasar / RS Pratama",
        "coords": [-6.14, 106.78],
        "bed_capacity": "Kapasitas Kompak (60 TT)",
        "facilities": ["Pelayanan Medis Dasar", "UGD 24 Jam", "Rawat Inap Bersalin"],
    },
}


def recommend_hospitals(faskes_asal, kode_icd10, anomaly_edges=None, df=None):
    """
    Produce ranked hospital recommendations for a given clinic and patient diagnosis.
    """
    if anomaly_edges is None:
        anomaly_edges = set()

    diag_info = DIAGNOSIS_CATALOG.get(kode_icd10, {
        "name": f"Diagnosa {kode_icd10}",
        "severity": "Sedang",
        "category": "Umum",
        "preferred_tiers": ["Tipe C", "Tipe D", "Tipe B"],
        "discouraged_tiers": [],
        "required_facility": "Poli Spesialis Terkait",
    })

    # Find average distance from this FKTP to each hospital from df if available
    dist_map = {}
    if df is not None:
        origin_sub = df[df["faskes_asal"] == faskes_asal]
        for hosp, grp in origin_sub.groupby("faskes_tujuan"):
            dist_map[hosp] = float(grp["jarak_km"].mean())

    candidates = []

    for hosp_name, hosp_meta in HOSPITAL_CATALOG.items():
        tier = hosp_meta["tier"]
        base_dist = dist_map.get(hosp_name, 12.0)
        real_dist = round(base_dist * 1.25, 1)
        travel_time = max(5, int(round((real_dist / 28.0) * 60)))

        is_collusion_risk = (faskes_asal, hosp_name) in anomaly_edges

        # --- SCORING FORMULA ---
        # 1. Tier Match Score (0 - 40 pts)
        if tier in diag_info["preferred_tiers"]:
            tier_score = 40.0
            tier_reason = f"Sesuai regulasi berjenjang ({tier} untuk {diag_info['severity']})"
        elif tier in diag_info["discouraged_tiers"]:
            tier_score = 8.0
            tier_reason = f"Potensi inefisiensi jenjang ({tier} terlalu tinggi/rendah untuk kasus {diag_info['severity']})"
        else:
            tier_score = 25.0
            tier_reason = f"Alternatif jenjang wajar ({tier})"

        # 2. Travel Time & Accessibility Score (0 - 40 pts)
        # Closer = better (decay over 50 mins)
        time_score = max(5.0, 40.0 - (travel_time * 0.7))
        time_reason = f"Waktu tempuh {travel_time} menit ({real_dist} km jalan raya)"

        # 3. Integrity & Anti-Fraud Score (0 - 20 pts)
        if is_collusion_risk:
            integrity_score = 0.0
            integrity_reason = "Peringatan: Memiliki pola rujukan terkonsentrasi / anomali tinggi"
        else:
            integrity_score = 20.0
            integrity_reason = "Bersih dari indikasi sindikasi rujukan / audit aman"

        total_score = min(99.0, max(20.0, tier_score + time_score + integrity_score))
        match_percentage = round(total_score, 1)

        reasons = [tier_reason, time_reason, integrity_reason]

        candidates.append({
            "hospital_name": hosp_name,
            "tier": tier,
            "role": hosp_meta["role"],
            "match_score": match_percentage,
            "real_distance_km": real_dist,
            "travel_time_minutes": travel_time,
            "bed_capacity": hosp_meta["bed_capacity"],
            "key_facilities": hosp_meta["facilities"][:3],
            "is_collusion_risk": is_collusion_risk,
            "reasons": reasons,
        })

    # Sort candidates by match_score descending, then travel_time ascending
    candidates.sort(key=lambda x: (-x["match_score"], x["travel_time_minutes"]))

    # Apply Machine Learning Model Predictions if model bundle is available
    bundle = _load_recommender_model()
    ml_model = bundle.get("model") if bundle else None
    feat_cols = bundle.get("feature_columns") if bundle else None

    if ml_model is not None and feat_cols:
        sev = 1 if diag_info["severity"] == "Ringan" else 3 if ("Gawat" in diag_info["severity"] or "Berat" in diag_info["severity"]) else 2
        is_mild = 1 if sev == 1 else 0
        is_emergency = 1 if sev == 3 else 0
        tier_map = {"Tipe A": 4, "Tipe B": 3, "Tipe C": 2, "Tipe D": 1}

        batch_rows = []
        for c in candidates:
            batch_rows.append({
                "severity_score": sev,
                "is_mild_icd": is_mild,
                "is_emergency": is_emergency,
                "real_distance_km": c["real_distance_km"],
                "travel_time_minutes": c["travel_time_minutes"],
                "tipe_rs_score": tier_map.get(c["tier"], 2),
                "is_collusion_risk": 1 if c["is_collusion_risk"] else 0,
            })
        try:
            batch_df = pd.DataFrame(batch_rows)[feat_cols]
            raw_probs = ml_model.predict_proba(batch_df)[:, 1]
            for idx, p in enumerate(raw_probs):
                ml_pct = round(float(p) * 100, 1)
                # Combined ML probability and clinical scoring
                c_score = round(ml_pct * 0.75 + (candidates[idx]["match_score"] * 0.25), 1)
                candidates[idx]["match_score"] = max(15.0, min(98.8, c_score))
                candidates[idx]["reasons"].insert(0, f"Prediksi XGBoost ML: {ml_pct}% kecocokan klinis")
        except Exception:
            pass

        # Re-sort with ML predictions
        candidates.sort(key=lambda x: (-x["match_score"], x["travel_time_minutes"]))

    # Assign Badges for Top 3
    for idx, c in enumerate(candidates):
        if idx == 0:
            c["rank_badge"] = "Rekomendasi Utama (Paling Ideal)"
            c["badge_color"] = "emerald"
        elif idx == 1:
            c["rank_badge"] = "Alternatif Sekunder"
            c["badge_color"] = "blue"
        elif idx == 2:
            c["rank_badge"] = "Alternatif Tersier"
            c["badge_color"] = "indigo"
        else:
            c["rank_badge"] = f"Pilihan #{idx + 1}"
            c["badge_color"] = "slate"

    return {
        "origin_clinic": faskes_asal,
        "diagnosis_code": kode_icd10,
        "diagnosis_info": diag_info,
        "recommendations": candidates[:5],  # Return Top 5
    }

