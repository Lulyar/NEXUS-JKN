import random
import pandas as pd
from datetime import datetime, timedelta

def generate_nexus_jkn_dataset(num_rows=40000, output_file="data/dataset_rujukan_nexus.csv"):
    # Reference Data: 20 FKTP (Puskesmas & Klinik Pratama)
    faskes_asal_list = [
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
        "Puskesmas Anggrek",
        "Klinik Pratama Surya Medika",
        "Puskesmas Kenanga",
        "Klinik Pratama Sejahtera Abadi",
        "Puskesmas Flamboyan",
        "Klinik Pratama Mitra Sehat",
        "Puskesmas Teratai",
        "Klinik Pratama Graha Medika",
        "Puskesmas Dahlia",
        "Klinik Pratama Sehat Mandiri"
    ]

    # Reference Data: 10 FKRTL (Rumah Sakit)
    faskes_tujuan_dict = {
        "RS Mitra Mulia": "Tipe B",
        "RSUD Kota Sehat": "Tipe A",
        "RS Medika Care": "Tipe B",
        "RS Sentosa": "Tipe C",
        "RS Bhakti Husada": "Tipe D",
        "RS Graha Sehat": "Tipe B",
        "RS Permata Bunda": "Tipe C",
        "RSUD Berkah Mandiri": "Tipe A",
        "RS Ananda Medika": "Tipe D",
        "RS Harapan Kita Bersama": "Tipe B"
    }
    faskes_tujuan_names = list(faskes_tujuan_dict.keys())

    # 15 Specific Anomaly Configurations:
    # (source, target, count_anom, mild_ratio, dist_min, dist_max, normal_quota)
    # Tier 1 - CRITICAL (5)
    # Tier 2 - HIGH (6)
    # Tier 3 - MEDIUM (4)
    anom_specs = [
        # --- CRITICAL (5) ---
        ("Klinik Pratama Sehat Sejahtera", "RS Mitra Mulia", 1100, 0.96, 19.0, 24.5, 180),
        ("Klinik Pratama Medika Utama", "RS Sentosa", 1050, 0.94, 18.0, 23.5, 200),
        ("Puskesmas Sukamaju", "RS Medika Care", 1000, 0.93, 20.0, 25.0, 220),
        ("Klinik Pratama Surya Medika", "RS Graha Sehat", 980, 0.95, 19.0, 24.0, 220),
        ("Puskesmas Anggrek", "RS Permata Bunda", 950, 0.92, 18.5, 23.5, 230),

        # --- HIGH (6) ---
        ("Puskesmas Harapan Bangsa", "RS Bhakti Husada", 750, 0.85, 16.5, 21.0, 350),
        ("Klinik Pratama Kasih Ibu", "RS Ananda Medika", 720, 0.82, 16.5, 22.0, 380),
        ("Puskesmas Melati", "RS Harapan Kita Bersama", 700, 0.80, 16.0, 21.0, 400),
        ("Klinik Pratama Nusantara", "RSUD Berkah Mandiri", 680, 0.78, 17.0, 22.5, 420),
        ("Puskesmas Kenanga", "RS Mitra Mulia", 650, 0.80, 15.5, 21.0, 430),
        ("Klinik Pratama Sehat Bersama", "RS Sentosa", 630, 0.77, 15.0, 20.5, 440),

        # --- MEDIUM (4) ---
        ("Puskesmas Mawar", "RS Medika Care", 570, 0.72, 14.0, 18.5, 360),
        ("Klinik Pratama Sejahtera Abadi", "RS Bhakti Husada", 550, 0.71, 14.0, 18.0, 380),
        ("Puskesmas Cempaka", "RS Permata Bunda", 530, 0.70, 13.5, 18.0, 400),
        ("Puskesmas Flamboyan", "RS Graha Sehat", 540, 0.72, 14.0, 18.0, 360),
    ]

    patient_pool = [f"PSN-{i:05d}" for i in range(1, 15001)]
    start_date = datetime(2026, 8, 1, 7, 0, 0)
    end_date = datetime(2026, 9, 30, 21, 0, 0)
    time_span_seconds = int((end_date - start_date).total_seconds())

    def get_random_timestamp():
        return start_date + timedelta(seconds=random.randint(0, time_span_seconds))

    records = []
    anom_sources = set()

    # 1. Generate 15 Anomaly Clusters + controlled background noise for anomaly sources
    for asal, tujuan, count, mild_ratio, d_min, d_max, normal_quota in anom_specs:
        anom_sources.add(asal)
        tipe_rs = faskes_tujuan_dict[tujuan]
        for _ in range(count):
            icd = random.choice(["J00", "A09"]) if random.random() < mild_ratio else random.choice(["E11", "I10", "K29"])
            jarak = round(random.uniform(d_min, d_max), 1)
            records.append({
                'faskes_asal': asal,
                'faskes_tujuan': tujuan,
                'kode_icd10': icd,
                'tingkat_faskes_tujuan': tipe_rs,
                'jarak_km': jarak,
                'id_pasien': random.choice(patient_pool),
                'timestamp': get_random_timestamp()
            })

        # Normal background quota for this clinic distributed across other hospitals
        other_rs = [rs for rs in faskes_tujuan_names if rs != tujuan]
        for _ in range(normal_quota):
            target_rs = random.choice(other_rs)
            tipe_rs_other = faskes_tujuan_dict[target_rs]
            icd = random.choice(["J00", "A09"]) if random.random() < 0.12 else random.choice(["E11", "I10", "K29"])
            jarak = round(random.uniform(1.0, 10.5), 1)
            records.append({
                'faskes_asal': asal,
                'faskes_tujuan': target_rs,
                'kode_icd10': icd,
                'tingkat_faskes_tujuan': tipe_rs_other,
                'jarak_km': jarak,
                'id_pasien': random.choice(patient_pool),
                'timestamp': get_random_timestamp()
            })

    # 2. Generate Normal Data from pure normal clinics to reach exact num_rows (40,000)
    normal_clinics = [c for c in faskes_asal_list if c not in anom_sources]
    remaining = num_rows - len(records)

    for _ in range(remaining):
        asal = random.choice(normal_clinics)
        tujuan = random.choice(faskes_tujuan_names)
        tipe_rs = faskes_tujuan_dict[tujuan]
        icd = random.choice(["J00", "A09"]) if random.random() < 0.12 else random.choice(["E11", "I10", "K29"])
        jarak = round(random.uniform(1.0, 10.5), 1)
        records.append({
            'faskes_asal': asal,
            'faskes_tujuan': tujuan,
            'kode_icd10': icd,
            'tingkat_faskes_tujuan': tipe_rs,
            'jarak_km': jarak,
            'id_pasien': random.choice(patient_pool),
            'timestamp': get_random_timestamp()
        })

    # Sort records by timestamp to simulate real transaction sequence
    records.sort(key=lambda x: x['timestamp'])

    # Assign sequential unique Referral IDs (RJK-2026-XXXXX)
    for idx, rec in enumerate(records, start=1):
        rec['id_rujukan'] = f"RJK-2026-{idx:05d}"
        rec['timestamp'] = rec['timestamp'].strftime("%Y-%m-%d %H:%M:%S")

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

