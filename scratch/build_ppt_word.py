import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docx_helper import set_cell_background, set_cell_margins, set_cell_borders

NAVY_HEX = "154B90"
DARK_HEX = "0F172A"
MUTED_HEX = "475569"
TEAL_HEX = "0D9488"
EMERALD_HEX = "059669"
AMBER_HEX = "D97706"
CRIMSON_HEX = "DC2626"
LIGHT_BLUE_HEX = "F0F6FC"
LIGHT_AMBER_HEX = "FEF3C7"
LIGHT_GREEN_HEX = "ECFDF5"
LIGHT_GRAY_HEX = "F8FAFC"
BORDER_GRAY_HEX = "CBD5E1"

COLOR_NAVY = RGBColor(21, 75, 144)
COLOR_DARK = RGBColor(15, 23, 42)
COLOR_MUTED = RGBColor(71, 85, 105)
COLOR_CRIMSON = RGBColor(220, 38, 38)
COLOR_EMERALD = RGBColor(5, 150, 105)
COLOR_AMBER = RGBColor(217, 119, 6)

def create_ppt_document(output_path):
    doc = docx.Document()
    
    # Margin
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
        
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(10.5)
    style_normal.font.color.rgb = COLOR_DARK
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(3)

    # ────────────────────────── HEADER BANNER ──────────────────────────
    t_banner = doc.add_table(rows=1, cols=1)
    t_banner.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_banner.columns[0].width = Inches(6.7)
    c_banner = t_banner.cell(0, 0)
    set_cell_background(c_banner, NAVY_HEX)
    set_cell_margins(c_banner, top=240, bottom=240, left=260, right=260)
    set_cell_borders(c_banner)
    
    p = c_banner.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    r_tag = p.add_run("PANDUAN KONTEN SLIDE PRESENTASI (POWERPOINT / CANVA)\n")
    r_tag.font.name = "Arial"
    r_tag.font.size = Pt(9.5)
    r_tag.font.bold = True
    r_tag.font.color.rgb = RGBColor(254, 215, 170)
    
    r_t = p.add_run("AEGIS-JKN: Anomaly & Ethical Graph Insight System\n")
    r_t.font.name = "Arial"
    r_t.font.size = Pt(16)
    r_t.font.bold = True
    r_t.font.color.rgb = RGBColor(255, 255, 255)
    
    r_sub = p.add_run("Perisai Cerdas Penjaga Integritas Rujukan Faskes — Format Ringkas, Bullet Points & Layout Visual")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(10.5)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(224, 231, 255)

    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.space_before = Pt(10)
    p_intro.paragraph_format.space_after = Pt(8)
    r_in = p_intro.add_run("Petunjuk Penggunaan Dokumen: ")
    r_in.bold = True
    r_in.font.color.rgb = COLOR_NAVY
    p_intro.add_run("Dokumen ini memuat materi teks siap pakai untuk slide PowerPoint/Canva. Teks disusun ringkas, berbasis poin-poin padat (bullet points), dilengkapi rekomendasi tata letak visual dan angka sorotan kunci agar slide presentasi Anda terlihat sangat profesional, elegan, dan memukau dewan juri Healthkathon.")

    # Helper function for adding slide content
    def add_slide_box(slide_num, title, layout_text, bullets, highlight_box=None, asset_needed=None):
        # Heading
        p_h = doc.add_paragraph()
        p_h.paragraph_format.space_before = Pt(14)
        p_h.paragraph_format.space_after = Pt(2)
        p_h.paragraph_format.keep_with_next = True
        
        r_num = p_h.add_run(f"SLIDE {slide_num}: ")
        r_num.font.name = "Arial"
        r_num.font.size = Pt(12)
        r_num.font.bold = True
        r_num.font.color.rgb = COLOR_CRIMSON
        
        r_title = p_h.add_run(title)
        r_title.font.name = "Arial"
        r_title.font.size = Pt(12)
        r_title.font.bold = True
        r_title.font.color.rgb = COLOR_NAVY

        # Main Table Box
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.columns[0].width = Inches(6.7)
        cell = table.cell(0, 0)
        set_cell_background(cell, LIGHT_GRAY_HEX)
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        set_cell_borders(cell, 
                         top={'val': 'single', 'sz': 4, 'color': BORDER_GRAY_HEX},
                         bottom={'val': 'single', 'sz': 4, 'color': BORDER_GRAY_HEX},
                         left={'val': 'single', 'sz': 24, 'color': NAVY_HEX},
                         right={'val': 'single', 'sz': 4, 'color': BORDER_GRAY_HEX})

        cp = cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(4)
        
        # Layout recommendation
        r_lay_t = cp.add_run("🎨 Rekomendasi Tata Letak (Layout Visual):\n")
        r_lay_t.font.name = "Arial"
        r_lay_t.font.size = Pt(9.5)
        r_lay_t.font.bold = True
        r_lay_t.font.color.rgb = COLOR_AMBER
        
        r_lay = cp.add_run(f"{layout_text}\n\n")
        r_lay.font.size = Pt(9.5)
        r_lay.font.italic = True
        r_lay.font.color.rgb = COLOR_MUTED

        # Content bullets
        r_con_t = cp.add_run("📋 Poin Teks Layar (Salin Langsung ke Slide):\n")
        r_con_t.font.name = "Arial"
        r_con_t.font.size = Pt(10)
        r_con_t.font.bold = True
        r_con_t.font.color.rgb = COLOR_NAVY

        for b in bullets:
            bp = cell.add_paragraph()
            bp.paragraph_format.space_before = Pt(1)
            bp.paragraph_format.space_after = Pt(2)
            bp.paragraph_format.line_spacing = 1.15
            bp.paragraph_format.left_indent = Inches(0.2)
            
            run_bullet = bp.add_run("• ")
            run_bullet.bold = True
            run_bullet.font.color.rgb = COLOR_NAVY
            
            if isinstance(b, tuple):
                bold_part, regular_part = b
                rb = bp.add_run(bold_part)
                rb.bold = True
                rb.font.size = Pt(9.5)
                rr = bp.add_run(regular_part)
                rr.font.size = Pt(9.5)
            else:
                rr = bp.add_run(b)
                rr.font.size = Pt(9.5)

        # Highlight box if any
        if highlight_box:
            hp = cell.add_paragraph()
            hp.paragraph_format.space_before = Pt(5)
            hp.paragraph_format.space_after = Pt(2)
            
            r_hl_t = hp.add_run("⭐ Sorotan Kunci (Key Highlight): ")
            r_hl_t.font.bold = True
            r_hl_t.font.size = Pt(9.5)
            r_hl_t.font.color.rgb = COLOR_EMERALD
            
            r_hl = hp.add_run(highlight_box)
            r_hl.font.size = Pt(9.5)
            r_hl.font.bold = True

        # Asset recommendation
        if asset_needed:
            ap = cell.add_paragraph()
            ap.paragraph_format.space_before = Pt(3)
            ap.paragraph_format.space_after = Pt(0)
            r_as_t = ap.add_run("🖼️ Aset / Visual Pendukung: ")
            r_as_t.font.bold = True
            r_as_t.font.size = Pt(9)
            r_as_t.font.color.rgb = COLOR_MUTED
            r_as = ap.add_run(asset_needed)
            r_as.font.size = Pt(9)
            r_as.font.italic = True

    # ────────────────────────── SLIDE 1 ──────────────────────────
    add_slide_box(
        slide_num=1,
        title="Perkenalan Tim (Meet Our Team)",
        layout_text="Gunakan background Navy gelap elegan (#0B192C atau #0F172A). Tempatkan Logo BPJS Kesehatan & Healthkathon di sudut atas. Pasang 3 kartu (cards) foto profil profesional berjejer horizontal dengan frame aksen biru terang.",
        bullets=[
            ("LULY", " — Team Lead & Healthcare Strategist (Domain Policy, Regulasi JKN, Business Model & Tata Kelola Rujukan)"),
            ("YAYAN", " — AI & Graph Analytics Engineer (Graph NetworkX, Machine Learning XGBoost, Explainable AI Engine)"),
            ("NISRINA", " — Product & Full-Stack Specialist (GIS Mapping Interface, Leaflet Radar, WebSocket Live Streaming & UX)"),
            ("Institusi / Asal Kampus: ", "Tuliskan Universitas / Institusi tim Anda"),
            ("Tagline Tim: ", "\"Guardians of JKN Integrity — Mengawal Dana Umat dengan Kecerdasan Buatan Terpercaya\"")
        ],
        highlight_box="Kombinasi lengkap 3 pilar inovasi: Domain Regulasi Kesehatan + AI/Graph Engine + Interface Interaktif Siap Uji.",
        asset_needed="Foto profil 3 anggota berjas/formal, Logo BPJS Kesehatan, Logo Healthkathon 2026."
    )

    # ────────────────────────── SLIDE 2 ──────────────────────────
    add_slide_box(
        slide_num=2,
        title="Judul Ide, Deskripsi, dan Tujuan (The Value Proposition)",
        layout_text="Tampilkan judul besar berwibawa di tengah atas. Di bawahnya, buat 3 kolom kartu modern untuk 3 Pilar Tujuan dengan ikon: 🛡️ Integritas Finansial, ⚙️ Efisiensi Layanan, 🔍 Transparansi Forensik.",
        bullets=[
            ("Judul Inovasi: ", "AEGIS-JKN (Anomaly & Ethical Graph Insight System)"),
            ("Slogan Utama: ", "\"Perisai Cerdas Penjaga Integritas Rujukan Faskes — Transformasi Pengawasan Pasif Menjadi Radar Intelijen Proaktif\""),
            ("Deskripsi Singkat: ", "Platform audit intelijen rujukan berbasis Graph Network Theory & Hybrid Explainable AI untuk membongkar sindikasi kolusi rujukan semu (phantom/self-referral) dan anomali rujukan non-spesialistik secara real-time."),
            ("Pilar Tujuan 1 (Integritas Finansial): ", "Mencegah kebocoran dana klaim kapitasi dan INA-CBG dari penggelembungan rujukan fiktif/tidak sesuai."),
            ("Pilar Tujuan 2 (Efisiensi Layanan): ", "Menegakkan kepatuhan rujukan berjenjang (kasus ringan tuntas di FKTP, RS fokus pada kasus spesialistik)."),
            ("Pilar Tujuan 3 (Audit Forensik Transparan): ", "Menyajikan narasi XAI otomatis & bukti transaksi 1-klik siap audit untuk verifikator BPJS.")
        ],
        highlight_box="Menjawab langsung Subkategori 10 (Self-Referral) & Subkategori 3 (Rujukan Tidak Sesuai) Healthkathon BPJS.",
        asset_needed="Mockup logo perisai digital AEGIS-JKN, 3 icon kartu tujuan (koin/finansial, rumah sakit/alur, kaca pembesar/audit)."
    )

    # ────────────────────────── SLIDE 3 ──────────────────────────
    add_slide_box(
        slide_num=3,
        title="Latar Belakang dan Dampak (Problem & Impact Statement)",
        layout_text="Gunakan tata letak perbandingan 'Split-Screen' (Kiri: Masalah Nyata di Lapangan; Kanan: Dampak Buruk jika Dibiarkan vs Dampak Positif Solusi AEGIS-JKN). Gunakan warna merah untuk peringatan dan hijau untuk solusi.",
        bullets=[
            ("Volume Rujukan Masif: ", "Puluhan juta transaksi rujukan per tahun di Indonesia membuat verifikasi manual acak (sampling) kewalahan."),
            ("Fenomena Sindikasi Tersembunyi: ", "Klinik primer 'mengunci' alur pasien hingga >75% ke satu RS swasta tertentu demi komisi/insentif non-medis."),
            ("Bypass Fasilitas Terdekat: ", "Pasien dipaksa menempuh 18–24 km melompati beberapa RS Tipe C terdekat demi dirujuk ke RS rekanan sindikat."),
            ("Rujukan Kasus Non-Spesialistik: ", "Penyakit ringan tuntas FKTP (ISPA J00, Diare A09) sengaja dirujuk ke RS demi mengklaim biaya spesialistik."),
            ("Dampak Negatif Tanpa Sistem: ", "Pemborosan triliunan rupiah dana jaminan kesehatan, antrean RS menumpuk, dan pasien dirugikan."),
            ("Dampak Positif AEGIS-JKN: ", "Efisiensi pengawasan hingga 90%, pencegahan kebocoran dana sebelum klaim dicairkan, dan kepatuhan faskes terjamin.")
        ],
        highlight_box="77.4% rujukan dari satu klinik terkunci ke satu RS rekanan, 95.4% di antaranya hanya batuk-pilek biasa (Data Terbukti di Prototype).",
        asset_needed="Grafik perbandingan kerugian vs penyelamatan dana klaim, ilustrasi alur rujukan melompati faskes terdekat."
    )

    # ────────────────────────── SLIDE 4 ──────────────────────────
    add_slide_box(
        slide_num=4,
        title="Alur Proses Aplikasi yang Dikembangkan (System Architecture)",
        layout_text="Tampilkan diagram pipeline horizontal 4 langkah (Step 1 -> Step 2 -> Step 3 -> Step 4) dengan panah alir modern dan badge teknologi: Pandas -> NetworkX -> XGBoost + XAI -> Leaflet/React.",
        bullets=[
            ("Tahap 1 — Ingesti Data Transaksi: ", "Menyerap log rujukan JKN (FKTP asal, RS tujuan, ICD-10, koordinat geolokasi, timestamp)."),
            ("Tahap 2 — Graph Network Topology: ", "Memodelkan alur rujukan menggunakan NetworkX DiGraph (Node = Faskes, Edge = Agregasi Aliran Pasien)."),
            ("Tahap 3 — Hybrid Anomaly Detection: ", "Kombinasi model XGBoost Classifier + Formula Explainable AI (XAI) transparan 4 faktor bobot:"),
            ("  • Konsentrasi Rujukan (30%): ", "Rasio dominasi alur ke RS tertentu (Over-concentration ratio)."),
            ("  • Diagnosis Kasus Ringan (30%): ", "Persentase kasus non-spesialistik (ICD-10 J00, A09) yang dirujuk ke RS."),
            ("  • Deviasi Jarak Geografis (20%): ", "Penyimpangan jarak rujukan dibandingkan median jarak faskes normal."),
            ("  • Lonjakan Volume Transaksi (20%): ", "Z-Score lonjakan frekuensi transaksi rujukan melampaui ambang batas."),
            ("Tahap 4 — Output Klasifikasi Risiko: ", "CRITICAL (≥0.75 | Investigasi Segera), HIGH (0.60–0.74), MEDIUM (0.55–0.59), NORMAL (<0.55).")
        ],
        highlight_box="Formula Fraud Score: (0.30 × Konsentrasi) + (0.30 × Diagnosa Ringan) + (0.20 × Jarak) + (0.20 × Volume).",
        asset_needed="Diagram alur arsitektur data ke UI (bisa ambil diagram mermaid arsitektur), formula matematika fraud score."
    )

    # ────────────────────────── SLIDE 5 ──────────────────────────
    add_slide_box(
        slide_num=5,
        title="Demo Aplikasi / Prototype yang Telah Dikembangkan (Live Interface)",
        layout_text="Gunakan layout visual showcase. Letakkan screenshot antarmuka Radar Peta GIS dan Panel Audit XAI di tengah, dikelilingi 4 callout boxes yang menjelaskan elemen interaktif yang didemokan.",
        bullets=[
            ("Peta GIS Interaktif (Leaflet): ", "Memetakan seluruh sebaran FKTP dan FKRTL secara spasial dengan visualisasi alur rujukan."),
            ("Visualisasi Alur Merah Berkedip: ", "Jalur kolusi abnormal otomatis menyala merah berdenyut, memudahkan auditor menemukan anomali dalam 1 detik."),
            ("Kartu Metrik & Status Realtime: ", "Menyajikan ringkasan total rujukan, FKTP, FKRTL, dan jumlah anomali yang terdeteksi."),
            ("Panel Audit XAI 1-Klik: ", "Klik pada rute bermasalah langsung membuka narasi forensik instan, radar metrik, dan komposisi penyakit ICD-10."),
            ("Tabel Bukti Forensik Klaim: ", "Menyajikan 50 sampel data transaksi aktual lengkap dengan ID Pasien, jarak, tanggal, dan diagnosa sebagai alat bukti.")
        ],
        highlight_box="Hasil Uji Nyata: Klinik Pratama Sehat Sejahtera → RS Mitra Mulia terdeteksi Fraud Score 86.2% (CRITICAL) dalam <1 detik.",
        asset_needed="Screenshot dashboard GIS Leaflet (buka http://localhost:5173), rekaman demo interaktif."
    )

    # ────────────────────────── SLIDE 6 ──────────────────────────
    add_slide_box(
        slide_num=6,
        title="Penjelasan 5 Fitur Utama Aplikasi",
        layout_text="Tampilkan 5 kartu fitur rapi (sesuai menu navigasi dan panel utama pada aplikasi yang bisa diklik langsung di layar).",
        bullets=[
            ("1. Menu Monitoring (Peta GIS Alur Rujukan): ", "Peta interaktif alur rujukan antar-faskes dengan deteksi visual garis merah berkedip untuk rute abnormal."),
            ("2. Panel Audit XAI 1-Klik (Sidebar Forensik): ", "Klik alur bermasalah untuk membongkar skor risiko, 4 faktor penyebab (konsentrasi, penyakit ringan, jarak, volume), dan sampel transaksi."),
            ("3. Menu Prioritas Audit (Antrean Kasus Kritis): ", "Tabel antrean audit terurut otomatis dari risiko tertinggi (Critical, High, Medium) agar verifikator bertindak cepat."),
            ("4. Menu Faskes (Direktori & Profil Faskes): ", "Katalog seluruh Puskesmas, Klinik, dan RS (Tipe A/B/C) lengkap dengan riwayat rujukan masuk dan keluar per faskes."),
            ("5. Menu Analitik (Statistik & Sebaran Kasus): ", "Visualisasi data analitik makro jaringan rujukan, grafik komposisi diagnosa ICD-10, dan metrik risiko.")
        ],
        highlight_box="Semua 5 fitur ini terhubung langsung di navigasi web: Monitoring → Prioritas Audit → Faskes → Analitik + Panel Audit XAI.",
        asset_needed="Screenshot dari 4 menu navbar dan sidebar audit panel."
    )

    # ────────────────────────── SLIDE 7 ──────────────────────────
    add_slide_box(
        slide_num=7,
        title="Keunggulan Kompetitif & Dampak bagi BPJS Kesehatan (Strategic Value)",
        layout_text="Tampilkan tabel matriks perbandingan head-to-head (Metode Konvensional vs AEGIS-JKN) diikuti 3 kartu metrik dampak penghematan finansial.",
        bullets=[
            ("Pendekatan Relasional Graf (Unik): ", "Mendeteksi sindikat tersembunyi yang tak kasat mata jika hanya menggunakan analisis data tabular baris-per-baris."),
            ("Transparan & Akuntabel (Explainable AI): ", "Bukan sekadar 'black-box' neural network; menghasilkan angka bobot dan narasi forensik siap sidang/audit formal."),
            ("Performa Kilat (<1 Detik): ", "In-memory caching memproses puluhan ribu data rujukan secara instan tanpa membebani server BPJS."),
            ("Kesiapan Integrasi Sistem BPJS: ", "Arsitektur REST API & WebSocket siap dipasangkan langsung sebagai modul intelijen pada P-Care dan V-Claim."),
            ("Efisiensi Waktu Audit: ", "Memangkas waktu identifikasi kecurangan dari berminggu-minggu menjadi hitungan detik."),
            ("Penyelamatan Dana JKN: ", "Menekan potensi kerugian negara ratusan miliar rupiah dari klaim rujukan fiktif dan penggelembungan biaya INA-CBG.")
        ],
        highlight_box="Solusi pertama yang mengombinasikan Graph Topology + GIS Geospasial + Explainable AI untuk pengawasan rujukan JKN.",
        asset_needed="Tabel komparasi metode lama vs AEGIS-JKN, badge 'Ready for API Integration P-Care & V-Claim'."
    )

    # ────────────────────────── SLIDE 8 ──────────────────────────
    add_slide_box(
        slide_num=8,
        title="Penutup & Call to Action (Conclusion & Q&A)",
        layout_text="Layout minimalis, bersih, dan berwibawa. Kutipan visi besar tim di tengah, diikuti ucapan terima kasih dan kontak person tim di bawah.",
        bullets=[
            ("Kesimpulan Utama: ", "AEGIS-JKN hadir bukan untuk menghukum, tetapi untuk menjaga ekosistem rujukan BPJS Kesehatan tetap adil, bermutu, dan berintegritas."),
            ("Pesan Kunci: ", "\"Menjaga Dana Amanah Umat, Melindungi Hak Pasien, Memperkuat Kedaulatan Jaminan Kesehatan Nasional.\""),
            ("Kesiapan Tim: ", "Prototipe sistem telah teruji 100% fungsional, tervalidasi data sintetis terstruktur, dan siap dilanjutkan ke tahap pilot project bersama BPJS Kesehatan."),
            ("Sesi Tanya Jawab (Q&A): ", "Kami menyambut baik tanggapan, masukan, dan diskusi mendalam bersama Dewan Juri yang terhormat."),
            ("Kontak Tim: ", "Luly (Team Lead) | Yayan (AI Engineer) | Nisrina (Full-Stack Engineer) — AEGIS-JKN Healthkathon Team")
        ],
        highlight_box="Terima kasih kepada Dewan Juri dan Panitia Healthkathon 2026 BPJS Kesehatan.",
        asset_needed="Logo AEGIS-JKN besar di tengah, teks 'Terima Kasih / Q&A Session', alamat kontak tim."
    )

    # Save with lock fallback
    try:
        doc.save(output_path)
        print(f"[OK] Slide PPT Document successfully generated at: {output_path}")
    except PermissionError:
        fallback_path = output_path.replace(".docx", "_UPDATE.docx")
        doc.save(fallback_path)
        print(f"[NOTE] File asli sedang dibuka di Microsoft Word. Versi terbaru disimpan di: {fallback_path}")

if __name__ == "__main__":
    out_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "SLIDE_PRESENTASI_AEGIS_JKN.docx")
    create_ppt_document(out_file)
