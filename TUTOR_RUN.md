# 🛰️ NEXUS-JKN — Panduan Cara Menjalankan Project di Laptop

Dokumen ini berisi panduan langkah demi langkah untuk menjalankan aplikasi **NEXUS-JKN** (Network Explorer & Unusual Syndicate-detector) di laptop kamu.

---

## 📋 Prasyarat (*Prerequisites*)

Pastikan laptop kamu sudah terinstall **Python** (versi 3.9 ke atas).
> 💡 *Untuk pengguna Windows, perintah Python bisa menggunakan `py` atau `python`.*

---

## 🚀 Langkah-Langkah Menjalankan Project

### 1. Buka Terminal / Command Prompt
Buka **Command Prompt (CMD)** atau **PowerShell**, lalu masuk ke folder project `healthkathon`:
```powershell
cd d:\healthkathon
```
*(Sesuaikan `d:\healthkathon` dengan lokasi folder project di laptop kamu)*

---

### 2. Install Dependensi / Library Python
Jalankan perintah berikut di terminal untuk menginstall semua library yang dibutuhkan (FastAPI, Uvicorn, Pandas, NetworkX):

**Untuk Windows:**
```powershell
py -m pip install -r backend/requirements.txt
```

**Atau (jika menggunakan `python` biasa):**
```bash
python -m pip install -r backend/requirements.txt
```

---

### 3. Jalankan Server Backend
Setelah install selesai, jalankan server aplikasi dengan perintah:

**Untuk Windows:**
```powershell
py backend/main.py
```

**Atau:**
```bash
python backend/main.py
```

Jika berhasil, akan muncul pesan di terminal seperti ini:
```text
[NEXUS-JKN] Server Starting...
[NEXUS-JKN] Frontend path: ...\frontend
[NEXUS-JKN] Open browser at: http://localhost:8000

INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

### 4. Buka di Browser
Buka browser (Chrome, Edge, Firefox, atau Safari) dan akses link berikut:

👉 **[http://localhost:8000](http://localhost:8000)**

---

## 🎯 Fitur Utama Yang Bisa Dicoba

1. **Peta Jaringan Rujukan (Cytoscape Graph)**:
   - **Node Lingkaran Biru**: Klinik / Puskesmas (FKTP).
   - **Node Hexagon Cyan**: Rumah Sakit (FKRTL).
   - **Garis Merah Berkedip & Node Hexagon Merah**: Indikasi kolusi / rujukan semu bermasalah.
2. **Panel Audit XAI (Explainable AI)**:
   - Klik pada **Garis Merah Berkedip** (antara Klinik Pratama Sehat Sejahtera → RS Mitra Mulia) untuk membuka **Panel Audit XAI** di sisi kanan.
   - Panel akan membedah bukti numerik: skor fraud, persentase konsentrasi rujukan, rasio diagnosa ringan (ISPA J00), rata-rata jarak, serta sampel log transaksi.
3. **Tombol Tindakan Audit**:
   - Coba klik tombol **"Tandai untuk Audit"** atau **"Cetak Bukti PDF"** di panel kanan untuk melihat respons notifikasi melayang (*Toast Notification*).

---

## 🧪 Menguji Auto-Update Data Baru (Input CSV)

Aplikasi ini memiliki fitur **Auto-Detect File Modification**:
1. Buka file CSV dataset di `data/dataset_rujukan_nexus.csv`.
2. Coba ubah atau tambah data rujukan baru.
3. Simpan file CSV, lalu tekan **Refresh (F5)** di browser `http://localhost:8000`.
4. Sistem backend akan otomatis menghitung ulang grafik dan mendeteksi anomali baru tanpa perlu restart server!

---

## ❓ Pertanyaan & Pemecahan Masalah (*Troubleshooting*)

* **Error: `[Errno 10048] error while attempting to bind on address`**
  * **Penyebab:** Port `8000` sudah dipakai oleh aplikasi lain atau server NEXUS-JKN sebelumnya masih berjalan.
  * **Solusi:** Tutup terminal yang sedang berjalan sebelumnya, atau buka Task Manager dan akhiri proses Python, lalu jalankan `py backend/main.py` kembali.

* **Perintah `py` atau `python` tidak dikenali?**
  * **Solusi:** Pastikan Python sudah terinstall dan centang centang opsi **"Add Python to PATH"** saat install Python.

---

 Selamat mencoba **NEXUS-JKN**! Jika ada pertanyaan, hubungi tim pengembang. 🚀
