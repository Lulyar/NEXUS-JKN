# 🧠 LOGIKA PENENTUAN ANOMALI — NEXUS-JKN

---

## 💡 VERSI SIMPLE & GAMPANG DIPAHAMI (BISA UNTUK PRESENTASI)

Bayangkan sistem **NEXUS-JKN** ini seperti **Detektif Otomatis**. 

AI tidak asal menebak, tapi mencari **4 Tanda Kecurigaan** dari setiap alur rujukan dari Klinik ke Rumah Sakit. Jika total nilai kecurigaannya **di atas 55%**, sistem langsung menyalakan **GARIS MERAH BERKEDIP & HEXAGON MERAH**! 🚨

---

### 🔍 4 Tanda Kecurigaan Yang Dilihat AI:

#### 1. 🎯 "Pilih Kasih / Main Belakang" (Bobot 30%)
* **Maksudnya**: Dari semua pasien yang dirujuk oleh Klinik A, berapa persen yang dikirim ke Rumah Sakit B?
* **Contoh Kecurigaan**: Masa dari 1.000 pasien, 77% (770 orang) dikirim ke RS B semua? Padahal ada RS lain disekitarnya. Ini tanda kuat Klinik & RS tersebut punya "perjanjian rahasia/kolusi".

#### 2. 🤒 "Penyakit Ringan Kok Dirujuk ke RS?" (Bobot 30%)
* **Maksudnya**: Penyakit apa yang dirujuk?
* **Contoh Kecurigaan**: Masa cuma batuk pilek biasa (ISPA / `J00`) atau diare biasa harus dirujuk ke Rumah Sakit? Harusnya penyakit ringan cukup selesai ditangani di Klinik. Kalau 95% rujukannya penyakit ringan, berarti rujukannya cuma akal-akalan/fiktif.

#### 3. 🚗 "Jarak Terlalu Jauh Tidak Wajar" (Bobot 20%)
* **Maksudnya**: Berapa kilometer jaraknya?
* **Contoh Kecurigaan**: Kenapa pasien dipaksa dirujuk ke RS yang jaraknya 18 km, padahal di dekat klinik ada RS lain yang jaraknya cuma 2 km? 

#### 4. 📈 "Jumlah Pasien Meledak / Lonjakan Volume" (Bobot 20%)
* **Maksudnya**: Seberapa banyak jumlah rujukannya?
* **Contoh Kecurigaan**: Jumlah rujukan Klinik A ke RS B jauh melebihi rata-rata klinik normal lainnya (ribuan transaksi).

---

### 🏆 CONTOH KONKRET DI KASUS PROJECT KITA:

Pada dataset kita, AI menemukan hubungan antara **Klinik Pratama Sehat Sejahtera** $\to$ **RS Mitra Mulia**:
* 🎯 77.4% rujukannya cuma dikirim ke RS Mitra Mulia (Pilih kasih tinggi).
* 🤒 95.4% rujukannya cuma penyakit batuk pilek biasa (`J00`).
* 🚗 Jaraknya jauh (18.1 km).
* 📈 Jumlahnya meledak (1.068 transaksi).

👉 **Hasil Hitungan AI**: Tingkat Kecurigaan = **86.2%** ($\ge 55\%$)  
👉 **Tindakan Sistem**: Otomatis berubah jadi **Hexagon Merah Berkedip** & Garis Merah di layar!

---

<br>

---

## 📐 VERSI DETAIL TEKNIS & MATEMATIS (UNTUK JURI / FILE DOKUMENTASI)

Setiap alur rujukan dari **FKTP ($u$)** ke **FKRTL ($v$)** diberikan nilai **Fraud Score** menggunakan formula pembobotan:

$$\text{Fraud Score} = \left( 0.30 \times S_{\text{konsentrasi}} \right) + \left( 0.30 \times S_{\text{diagnosa}} \right) + \left( 0.20 \times S_{\text{jarak}} \right) + \left( 0.20 \times S_{\text{volume}} \right)$$

### Rincian Formula:
1. **$S_{\text{konsentrasi}}$**: $\frac{\text{Rujukan } (u \to v)}{\text{Total Rujukan Keluar dari Klinik } u}$ (Max: 1.0)
2. **$S_{\text{diagnosa}}$**: $\frac{\text{Jumlah Transaksi Diagnosa Ringan } (J00, A09)}{\text{Total Transaksi } (u \to v)}$ (Max: 1.0)
3. **$S_{\text{jarak}}$**: $\min\left( \frac{\max(0, \bar{d}_{u \to v} - d_{\text{median}})}{d_{\text{maksimal}}}, 1.0 \right)$
4. **$S_{\text{volume}}$**: Normalized $Z$-Score volume rujukan.

### Kategori Risiko:
* $\ge 0.75$ ➔ 🔴 **CRITICAL (Sangat Tinggi)**
* $0.60 - 0.74$ ➔ 🟧 **HIGH (Tinggi)**
* $0.55 - 0.59$ ➔ 🟨 **MEDIUM (Sedang)**
* $< 0.55$ ➔ 🟢 **NORMAL**
