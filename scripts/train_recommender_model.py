"""
AEGIS-JKN — Machine Learning Hospital Recommender Training Script.
Trains a Gradient Boosted Decision Tree (XGBoost) model to rank and recommend
the optimal destination hospital (Tipe A, B, C, D) based on clinical severity,
spatial accessibility, and anti-fraud compliance.
"""

import os
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score, classification_report

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "dataset_rujukan_nexus.csv")
MODEL_DIR = os.path.join(BASE_DIR, "backend", "models")
MODEL_OUT_PATH = os.path.join(MODEL_DIR, "aegis_jkn_recommender.joblib")

print("=" * 60)
print("  🚀 TRAINING MACHINE LEARNING HOSPITAL RECOMMENDER MODEL")
print("=" * 60)

# 1. Load Data
print("\n[1/5] Loading referral dataset...")
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df):,} referral transactions.")

# 2. Feature Engineering for Recommendation Candidates
print("\n[2/5] Engineering clinical & hierarchical features (Tipe A, B, C, D)...")

# Severity weights per diagnosis
SEVERITY_MAP = {
    "J00": 1,  # ISPA (Ringan)
    "A09": 1,  # Diare (Ringan)
    "K29": 1,  # Gastritis (Ringan)
    "E11": 2,  # Diabetes (Sedang / Kronis)
    "I10": 2,  # Hipertensi (Sedang / Kronis)
    "I21": 3,  # Infark Miokard Akut (Berat / Emergency)
    "N18": 3,  # Gagal Ginjal (Berat)
    "I63": 3,  # Stroke (Berat)
}

TIER_SCORE_MAP = {
    "Tipe A": 4,
    "Tipe B": 3,
    "Tipe C": 2,
    "Tipe D": 1,
}

# Add synthesized synthetic sample cases for training paired candidate suitability
# For each transaction, create candidate evaluation features
training_rows = []

# Known 15 anomaly route pairs to teach model fraud penalty
audited_anomaly_routes = set([
    ("Klinik Pratama Sehat Sejahtera", "RS Mitra Mulia"),
    ("Klinik Pratama Medika Utama", "RS Sentosa"),
    ("Puskesmas Sukamaju", "RS Medika Care"),
    ("Klinik Pratama Surya Medika", "RS Graha Sehat"),
    ("Puskesmas Anggrek", "RS Permata Bunda"),
    ("Puskesmas Harapan Bangsa", "RS Bhakti Husada"),
    ("Klinik Pratama Kasih Ibu", "RS Ananda Medika"),
    ("Puskesmas Melati", "RS Harapan Kita Bersama"),
    ("Klinik Pratama Nusantara", "RSUD Berkah Mandiri"),
    ("Puskesmas Kenanga", "RS Mitra Mulia"),
    ("Klinik Pratama Sehat Bersama", "RS Sentosa"),
    ("Puskesmas Mawar", "RS Medika Care"),
    ("Klinik Pratama Sejahtera Abadi", "RS Bhakti Husada"),
    ("Puskesmas Flamboyan", "RS Graha Sehat"),
    ("Puskesmas Cempaka", "RS Permata Bunda"),
])

# Sample 15,000 real referral cases to build pair evaluation dataset
sample_df = df.sample(n=min(15000, len(df)), random_state=42)

for _, row in sample_df.iterrows():
    f_asal = row["faskes_asal"]
    f_tujuan = row["faskes_tujuan"]
    icd = row["kode_icd10"]
    tier = row["tingkat_faskes_tujuan"]
    dist = float(row["jarak_km"])
    real_dist = round(dist * 1.25, 1)
    travel_time = max(5, int(round((real_dist / 28.0) * 60)))

    sev = SEVERITY_MAP.get(icd, 1)
    tier_val = TIER_SCORE_MAP.get(tier, 2)
    is_mild = 1 if sev == 1 else 0
    is_emergency = 1 if sev == 3 else 0
    is_collusion = 1 if (f_asal, f_tujuan) in audited_anomaly_routes else 0

    # Rule of BPJS Hierarchical Compliance:
    # Mild cases should NOT go to Tipe A/B
    # Severe cases MUST go to Tipe A/B
    # Chronic cases should go to Tipe C/B
    if is_mild:
        ideal_tier = tier in ["Tipe D", "Tipe C"]
    elif is_emergency:
        ideal_tier = tier in ["Tipe A", "Tipe B"]
    else:
        ideal_tier = tier in ["Tipe C", "Tipe B", "Tipe D"]

    # Ground truth suitability label:
    # 1 (Suitable destination) if compliant with tier, not collusion, reasonable travel time (<40 mins)
    is_suitable = 1 if (ideal_tier and not is_collusion and travel_time <= 45) else 0

    training_rows.append({
        "severity_score": sev,
        "is_mild_icd": is_mild,
        "is_emergency": is_emergency,
        "real_distance_km": real_dist,
        "travel_time_minutes": travel_time,
        "tipe_rs_score": tier_val,
        "is_collusion_risk": is_collusion,
        "is_suitable_label": is_suitable,
    })

train_df = pd.DataFrame(training_rows)
print(f"Constructed training feature matrix: {len(train_df):,} candidate pairs.")

# 3. Train Model
print("\n[3/5] Training XGBoost Recommender Classifier...")
feature_cols = [
    "severity_score",
    "is_mild_icd",
    "is_emergency",
    "real_distance_km",
    "travel_time_minutes",
    "tipe_rs_score",
    "is_collusion_risk",
]

X = train_df[feature_cols]
y = train_df["is_suitable_label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

xgb_rec = xgb.XGBClassifier(
    n_estimators=250,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.85,
    colsample_bytree=0.85,
    eval_metric="logloss",
    random_state=42,
)

xgb_rec.fit(X_train, y_train)
print("Training completed successfully!")

# 4. Evaluation
print("\n[4/5] Evaluating model performance...")
y_pred = xgb_rec.predict(X_test)
y_proba = xgb_rec.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_proba)

print(f"  ✓ Accuracy: {acc * 100:.2f}%")
print(f"  ✓ Area Under ROC (AUC): {auc:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["Kurang Sesuai", "Direkomendasikan"]))

# Feature Importance
importances = xgb_rec.feature_importances_
print("Feature Importances:")
for col, imp in sorted(zip(feature_cols, importances), key=lambda x: -x[1]):
    print(f"  - {col:22s}: {imp * 100:.1f}%")

# 5. Export Model Bundle
print("\n[5/5] Exporting model bundle...")
os.makedirs(MODEL_DIR, exist_ok=True)

bundle = {
    "model": xgb_rec,
    "feature_columns": feature_cols,
    "severity_map": SEVERITY_MAP,
    "tier_map": TIER_SCORE_MAP,
    "metrics": {
        "accuracy": float(acc),
        "auc_roc": float(auc),
    },
    "version": "1.0-healthkathon",
}

joblib.dump(bundle, MODEL_OUT_PATH)
file_size_kb = os.path.getsize(MODEL_OUT_PATH) / 1024
print(f"Saved model bundle to: {MODEL_OUT_PATH} ({file_size_kb:.1f} KB)")
print("\n✅ TRAINING BERHASIL & MODEL MACHINE LEARNING SIAP DIGUNAKAN!")

