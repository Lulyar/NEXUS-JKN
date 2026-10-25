# 🛡️ AEGIS-JKN — Panduan Menjalankan Project

Dokumen ini berisi panduan langkah demi langkah untuk menjalankan aplikasi **AEGIS-JKN** (*Anomaly & Ethical Graph Insight System* — *"Perisai Cerdas Penjaga Integritas Rujukan Faskes"*) di laptop kamu.

---

## 📋 Prasyarat (*Prerequisites*)

1. **Python** (versi 3.9 ke atas, gunakan perintah `py` atau `python`).
2. **Node.js** (versi 18 ke atas, untuk frontend React & Vite).

---

## 🚀 Langkah Menjalankan Project (Buka 2 Terminal)

Aplikasi ini menggunakan arsitektur modern yang terdiri dari **Backend (FastAPI)** dan **Frontend (React + Vite)**.

### 🖥️ Terminal 1 — Menjalankan Backend (FastAPI)

1. Buka PowerShell / Command Prompt:
   ```powershell
   cd d:\healthkathon
   ```
2. *(Opsional jika pertama kali)* Install dependensi Python:
   ```powershell
   py -m pip install -r backend/requirements.txt
   ```
3. Jalankan server backend:
   ```powershell
   py backend/main.py
   ```
   *Server backend akan aktif di: `http://localhost:8000`*

---

### 🌐 Terminal 2 — Menjalankan Frontend (React + Vite)

1. Buka terminal/PowerShell baru:
   ```powershell
   cd d:\healthkathon\frontend
   ```
2. *(Opsional jika pertama kali)* Install modul node:
   ```powershell
   npm install
   ```
3. Jalankan server frontend:
   ```powershell
   npm run dev
   ```
   *Server frontend akan aktif di: `http://localhost:5173`*

---

### 🎯 3. Buka di Browser

Buka browser pilihanmu dan akses:
👉 **[http://localhost:5173](http://localhost:5173)**

*(Vite sudah otomatis mem-proxy request data `/api` dan WebSocket `/ws` ke backend port 8000).*

---

## 🛠️ Fitur Utama Yang Bisa Dicoba

1. **Peta Jaringan Rujukan (Leaflet GIS & Network Graph)**:
   - Visualisasi alur rujukan dari FKTP (Puskesmas/Klinik) ke FKRTL (Rumah Sakit).
   - Jalur dengan garis merah menandai indikasi rujukan semu / kolusi rujukan abnormal.
2. **Panel Audit XAI (Explainable AI)**:
   - Klik pada jalur bermasalah untuk memunculkan bukti numerik, faktor pemicu risiko, serta sampel data transaksi rujukan.
3. **Filter Periode Analisis**:
   - Filter tanggal rujukan historis untuk memantau lonjakan transaksi pada rentang waktu tertentu.
4. **Simulasi Transaksi Real-time**:
   - Streaming data rujukan via WebSocket interaktif dengan kendali Play, Pause, dan Speed Control.

---

## ❓ Pemecahan Masalah (*Troubleshooting*)

* **Port 8000 bentrok (`Address already in use`):**
  * Pastikan terminal Python sebelumnya sudah ditutup (Ctrl + C), atau hentikan proses Python dari Task Manager.
* **Perintah `py` tidak dikenali:**
  * Gunakan `python backend/main.py`. Pastikan Python sudah dicentang *"Add to PATH"* saat instalasi.

