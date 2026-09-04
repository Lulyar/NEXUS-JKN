import random
import pandas as pd
from datetime import datetime, timedelta

def generate_nexus_jkn_dataset(num_rows=5000, output_file="dataset_rujukan_nexus.csv"):
    # Target counts based on ratio
    num_fraud = int(num_rows * 0.20)  # 20% = 1000 rows
    num_normal = num_rows - num_fraud  # 80% = 4000 rows

    # Reference Data
    faskes_asal_list = [
        "Klinik Pratama Sehat Sejahtera", # Fraud source
        "Puskesmas Melati",
        "Puskesmas Mawar",
        "Klinik Pratama Kasih Ibu",
        "Puskesmas Harapan Bangsa",
        "Klinik Pratama Medika Utama",
        "Puskesmas Sukamaju",
        "Klinik Pratama Sehat Bersama",
        "Puskesmas Cempaka",
        "Klinik Pratama Nusantara"
    ]

    faskes_tujuan_dict = {
        "RS Mitra Mulia": "Tipe B",     # Fraud target
        "RSUD Kota Sehat": "Tipe A",
        "RS Medika Care": "Tipe B",
        "RS Sentosa": "Tipe C",
        "RS Bhakti Husada": "Tipe C"
    }
    faskes_tujuan_names = list(faskes_tujuan_dict.keys())

    icd10_codes = ["J00", "E11", "I10", "K29", "A09"]

    # Generate pool of Patient IDs (e.g. 2,500 unique patients across 5,000 transactions)
    patient_pool = [f"PSN-{i:04d}" for i in range(1, 2501)]

    # Time range: August 1, 2026 to September 30, 2026
    start_date = datetime(2026, 8, 1, 7, 0, 0)
    end_date = datetime(2026, 9, 30, 21, 0, 0)
    time_span_seconds = int((end_date - start_date).total_seconds())

    def get_random_timestamp():
        random_seconds = random.randint(0, time_span_seconds)
        return start_date + timedelta(seconds=random_seconds)

    records = []

    # 1. Generate Normal Data (80%)
    for _ in range(num_normal):
        # Pick random faskes asal (any of the 10, or mainly the normal ones)
        asal = random.choice(faskes_asal_list)
        tujuan = random.choice(faskes_tujuan_names)
        tipe_rs = faskes_tujuan_dict[tujuan]
        icd = random.choice(icd10_codes)
        jarak = round(random.uniform(1.0, 25.0), 1)
        pasien = random.choice(patient_pool)
        ts = get_random_timestamp()

        records.append({
            'faskes_asal': asal,
            'faskes_tujuan': tujuan,
            'kode_icd10': icd,
            'tingkat_faskes_tujuan': tipe_rs,
            'jarak_km': jarak,
            'id_pasien': pasien,
            'timestamp': ts
        })

    # 2. Generate Fraud Data (20%) - Pattern: Self-Referral / Unnecessary Referral
    # Klinik Pratama Sehat Sejahtera -> RS Mitra Mulia, Kode J00, Jarak > 12 km
    for _ in range(num_fraud):
        asal = "Klinik Pratama Sehat Sejahtera"
        tujuan = "RS Mitra Mulia"
        tipe_rs = faskes_tujuan_dict[tujuan]
        icd = "J00"  # Mild illness inappropriately referred to hospital
        jarak = round(random.uniform(12.1, 24.8), 1)  # > 12 km
        pasien = random.choice(patient_pool)
        ts = get_random_timestamp()

        records.append({
            'faskes_asal': asal,
            'faskes_tujuan': tujuan,
            'kode_icd10': icd,
            'tingkat_faskes_tujuan': tipe_rs,
            'jarak_km': jarak,
            'id_pasien': pasien,
            'timestamp': ts
        })

    # Sort records by timestamp to simulate real transaction sequence
    records.sort(key=lambda x: x['timestamp'])

    # Assign sequential unique Referral IDs (RJK-2026-XXXX)
    for idx, rec in enumerate(records, start=1):
        rec['id_rujukan'] = f"RJK-2026-{idx:04d}"
        rec['timestamp'] = rec['timestamp'].strftime("%Y-%m-%d %H:%M:%S")

    # Reorder columns as specified
    columns = [
        'id_rujukan',
        'id_pasien',
        'faskes_asal',
        'faskes_tujuan',
        'kode_icd10',
        'tingkat_faskes_tujuan',
        'jarak_km',
        'timestamp'
    ]

    df = pd.DataFrame(records)[columns]
    df.to_csv(output_file, index=False)
    print(f"Dataset successfully created: '{output_file}' with {len(df)} rows.")

if __name__ == "__main__":
    generate_nexus_jkn_dataset()
