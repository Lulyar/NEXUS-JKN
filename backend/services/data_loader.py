import pandas as pd
import os

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'data', 'dataset_rujukan_nexus.csv')

_df_cache = None
_df_mtime = None

def load_dataset(force_reload=False):
    """Load CSV dataset with simple file-change caching."""
    global _df_cache, _df_mtime

    csv_path = os.path.normpath(DATA_PATH)

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at: {csv_path}")

    current_mtime = os.path.getmtime(csv_path)

    if not force_reload and _df_cache is not None and _df_mtime == current_mtime:
        return _df_cache

    df = pd.read_csv(csv_path)
    df['timestamp'] = pd.to_datetime(df['timestamp'])

    _df_cache = df
    _df_mtime = current_mtime

    return df


def get_summary_stats(df):
    """Calculate summary statistics from the dataset."""
    return {
        "total_transaksi": int(len(df)),
        "total_fktp": int(df['faskes_asal'].nunique()),
        "total_fkrtl": int(df['faskes_tujuan'].nunique()),
        "total_pasien": int(df['id_pasien'].nunique()),
        "rentang_waktu": {
            "dari": df['timestamp'].min().strftime("%Y-%m-%d"),
            "sampai": df['timestamp'].max().strftime("%Y-%m-%d")
        },
        "diagnosa_terbanyak": df['kode_icd10'].value_counts().idxmax(),
    }
