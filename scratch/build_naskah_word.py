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

# Color Definitions
NAVY_HEX = "154B90"
DARK_HEX = "0F172A"
MUTED_HEX = "475569"
TEAL_HEX = "0D9488"
EMERALD_HEX = "059669"
AMBER_HEX = "D97706"
CRIMSON_HEX = "DC2626"
PURPLE_HEX = "7C3AED"
BLUE_SPEAKER_HEX = "1D4ED8"

LIGHT_BLUE_HEX = "EFF6FF"
LIGHT_GREEN_HEX = "ECFDF5"
LIGHT_PURPLE_HEX = "F5F3FF"
LIGHT_AMBER_HEX = "FFFBEB"
LIGHT_GRAY_HEX = "F8FAFC"
BORDER_GRAY_HEX = "E2E8F0"

COLOR_NAVY = RGBColor(21, 75, 144)
COLOR_DARK = RGBColor(15, 23, 42)
COLOR_MUTED = RGBColor(71, 85, 105)
COLOR_CRIMSON = RGBColor(220, 38, 38)
COLOR_EMERALD = RGBColor(5, 150, 105)
COLOR_PURPLE = RGBColor(124, 58, 237)
COLOR_BLUE = RGBColor(29, 78, 216)
COLOR_AMBER = RGBColor(217, 119, 6)

def create_naskah_document(output_path):
    doc = docx.Document()
    
    # Page setup
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
        
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = COLOR_DARK
    style_normal.paragraph_format.line_spacing = 1.2
    style_normal.paragraph_format.space_after = Pt(4)

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
    r_tag = p.add_run("NASKAH BICARA & PANDUAN PRESENTASI LENGKAP (SPEECH SCRIPT)\n")
    r_tag.font.name = "Arial"
    r_tag.font.size = Pt(9.5)
    r_tag.font.bold = True
    r_tag.font.color.rgb = RGBColor(254, 215, 170)
    
    r_t = p.add_run("AEGIS-JKN: Perisai Cerdas Penjaga Integritas Rujukan Faskes\n")
    r_t.font.name = "Arial"
    r_t.font.size = Pt(16)
    r_t.font.bold = True
    r_t.font.color.rgb = RGBColor(255, 255, 255)
    
    r_sub = p.add_run("Naskah Orasi Panggung Siap Baca — Pembagian Peran 3 Orang: Luly, Yayan, dan Nisrina")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(10.5)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(224, 231, 255)

    # ────────────────────────── PANDUAN & PEMBAGIAN PERAN ──────────────────────────
    p_info = doc.add_paragraph()
    p_info.paragraph_format.space_before = Pt(12)
    p_info.paragraph_format.space_after = Pt(6)
    r_inf_t = p_info.add_run("📊 DISTRIBUSI PERAN & STRUKTUR TIM (TOTAL ESTIMASI: 8 - 10 MENIT)\n")
    r_inf_t.font.name = "Arial"
    r_inf_t.bold = True
    r_inf_t.font.size = Pt(11)
    r_inf_t.font.color.rgb = COLOR_NAVY
    
    p_info.add_run("Naskah ini dirancang secara dinamis agar presentasi tidak monoton. Ketiga pembicara saling mengisi dengan transisi yang mengalir alami dan saling melempar fokus panggung secara profesional:\n")

    # Table of roles
    t_roles = doc.add_table(rows=4, cols=3)
    t_roles.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_roles.columns[0].width = Inches(1.3)
    t_roles.columns[1].width = Inches(2.2)
    t_roles.columns[2].width = Inches(3.2)
    
    headers = ["Presenter", "Peran & Tanggung Jawab", "Fokus Bagian Presentasi"]
    for i, h in enumerate(headers):
        c = t_roles.cell(0, i)
        set_cell_background(c, "1E293B")
        set_cell_margins(c, top=100, bottom=100, left=120, right=120)
        set_cell_borders(c, bottom={'val': 'single', 'sz': 12, 'color': 'CBD5E1'})
        cp = c.paragraphs[0]
        r = cp.add_run(h)
        r.font.name = "Arial"
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    role_data = [
        ("🔵 LULY", "Team Lead & Healthcare Strategist", "Membuka presentasi, Salam Juri, Slide 1 (Tim), Slide 2 (Ide & Tujuan), Slide 3 (Masalah & Dampak), serta Slide 8 (Penutup & Closing Statement)."),
        ("🟢 YAYAN", "AI & Graph Analytics Engineer", "Slide 4 (Alur Proses Aplikasi, Arsitektur Graph NetworkX, Model XGBoost, dan Logika 4 Faktor Explainable AI / XAI)."),
        ("🟣 NISRINA", "Product & Interface Specialist", "Slide 5 (Live Demo Prototype di Peta GIS & Live Stream), Slide 6 (Penjelasan Fitur Utama), dan Slide 7 (Keunggulan Kompetitif & Dampak Finansial BPJS).")
    ]
    
    for row_idx, (speaker, role, desc) in enumerate(role_data, start=1):
        bg = LIGHT_BLUE_HEX if "LULY" in speaker else LIGHT_GREEN_HEX if "YAYAN" in speaker else LIGHT_PURPLE_HEX
        for col_idx, val in enumerate([speaker, role, desc]):
            c = t_roles.cell(row_idx, col_idx)
            set_cell_background(c, bg)
            set_cell_margins(c, top=100, bottom=100, left=120, right=120)
            set_cell_borders(c, bottom={'val': 'single', 'sz': 4, 'color': BORDER_GRAY_HEX})
            cp = c.paragraphs[0]
            r = cp.add_run(val)
            r.font.size = Pt(9.5)
            if col_idx == 0:
                r.bold = True
                r.font.name = "Arial"

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Helper function to add dialog section
    def add_dialog_block(speaker_name, speaker_role, slide_title, duration, action_cue, speech_text, border_hex, bg_hex, speaker_color):
        p_head = doc.add_paragraph()
        p_head.paragraph_format.space_before = Pt(14)
        p_head.paragraph_format.space_after = Pt(2)
        p_head.paragraph_format.keep_with_next = True
        
        r_spk = p_head.add_run(f"[{speaker_name.upper()}] ")
        r_spk.font.name = "Arial"
        r_spk.font.size = Pt(11.5)
        r_spk.font.bold = True
        r_spk.font.color.rgb = speaker_color
        
        r_sub = p_head.add_run(f"— {speaker_role} | {slide_title} (Est: {duration})")
        r_sub.font.name = "Calibri"
        r_sub.font.size = Pt(10)
        r_sub.font.italic = True
        r_sub.font.color.rgb = COLOR_MUTED

        # Dialog Box
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.columns[0].width = Inches(6.7)
        cell = table.cell(0, 0)
        set_cell_background(cell, bg_hex)
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        set_cell_borders(cell, 
                         top={'val': 'single', 'sz': 4, 'color': BORDER_GRAY_HEX},
                         bottom={'val': 'single', 'sz': 4, 'color': BORDER_GRAY_HEX},
                         left={'val': 'single', 'sz': 24, 'color': border_hex},
                         right={'val': 'single', 'sz': 4, 'color': BORDER_GRAY_HEX})

        cp = cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(4)
        
        # Action cue
        r_cue_t = cp.add_run("🎬 Petunjuk Panggung / Action Cue:\n")
        r_cue_t.font.name = "Arial"
        r_cue_t.font.size = Pt(9.5)
        r_cue_t.font.bold = True
        r_cue_t.font.color.rgb = COLOR_AMBER
        
        r_cue = cp.add_run(f"{action_cue}\n\n")
        r_cue.font.size = Pt(9.5)
        r_cue.font.italic = True
        r_cue.font.color.rgb = COLOR_MUTED

        # Speech Text header
        r_sp_t = cp.add_run("🗣️ Naskah Bicara (Ucapkan dengan lugas dan percaya diri):\n")
        r_sp_t.font.name = "Arial"
        r_sp_t.font.size = Pt(10)
        r_sp_t.font.bold = True
        r_sp_t.font.color.rgb = COLOR_DARK

        # Actual paragraphs of speech
        paragraphs = speech_text.strip().split("\n\n")
        for para in paragraphs:
            sp_p = cell.add_paragraph()
            sp_p.paragraph_format.space_before = Pt(2)
            sp_p.paragraph_format.space_after = Pt(3)
            sp_p.paragraph_format.line_spacing = 1.2
            
            # Highlight quotes or transition phrases
            run_p = sp_p.add_run(para.strip())
            run_p.font.name = "Calibri"
            run_p.font.size = Pt(10.5)
            run_p.font.color.rgb = COLOR_DARK

    # ────────────────────────── PART 1: LULY (SLIDE 1 & SLIDE 2) ──────────────────────────
    add_dialog_block(
        speaker_name="Luly",
        speaker_role="Team Lead & Healthcare Strategist",
        slide_title="Slide 1: Pembuka & Perkenalan Tim",
        duration="1.5 Menit",
        action_cue="Berdiri di tengah panggung dengan posisi tegak, tersenyum hangat, tatap mata dewan juri dengan tatapan penuh keyakinan. Tangan terbuka menyambut audiens. Slide 1 menampilkan foto profil Luly, Yayan, dan Nisrina.",
        speech_text="""\"Assalamu’alaikum Warahmatullahi Wabarakatuh, Selamat pagi/siang, Salam sejahtera bagi kita semua, Shalom, Om Swastiastu, Namo Buddhaya, Salam Kebajikan.

Yang kami hormati Dewan Juri Healthkathon 2026 BPJS Kesehatan, para mentor, dan seluruh hadirin yang berbahagia.

Program Jaminan Kesehatan Nasional (JKN) adalah salah satu capaian perlindungan sosial terbesar di dunia. Lebih dari 270 juta rakyat Indonesia menggantungkan harapan kesehatannya pada sistem ini. Namun, di balik keberhasilan jutaan pasien terlayani setiap hari, ada sebuah celah sunyi namun mematikan yang perlahan menggerogoti dana amanah umat: yaitu praktik sindikat rujukan semu, kolusi antar-faskes, dan rujukan kasus non-spesialistik.

Hari ini, perkenalkan kami dari Tim Pengembang, beranggotakan tiga orang yang berdedikasi mengawal integritas ekosistem kesehatan Indonesia:
Saya sendiri, Luly, sebagai Team Lead dan Healthcare Strategist;
Di sebelah saya, Yayan, sebagai AI & Graph Analytics Engineer kami;
Dan di samping Yayan, ada Nisrina, sebagai Product & Interface Specialist kami.

Bersama-sama, kami mempersembahkan sebuah terobosan revolusioner: AEGIS-JKN — Anomaly & Ethical Graph Insight System!\"""",
        border_hex=BLUE_SPEAKER_HEX,
        bg_hex=LIGHT_BLUE_HEX,
        speaker_color=COLOR_BLUE
    )

    add_dialog_block(
        speaker_name="Luly",
        speaker_role="Team Lead & Healthcare Strategist",
        slide_title="Slide 2: Judul Ide, Deskripsi, dan Tujuan",
        duration="1.0 Menit",
        action_cue="Tampilkan Slide 2. Tangan mengarah ke layar menampilkan logo perisai AEGIS-JKN dan 3 pilar tujuan. Suara berwibawa, menekankan slogan.",
        speech_text="""\"Dewan Juri yang kami muliakan, judul inovasi kami adalah AEGIS-JKN, dengan slogan: 'Perisai Cerdas Penjaga Integritas Rujukan Faskes — Mengubah Pengawasan Rujukan Pasif Menjadi Radar Intelijen Proaktif'.

AEGIS-JKN lahir untuk menjawab langsung Subkategori 10 mengenai Self-Referral dan Subkategori 3 mengenai Rujukan Tidak Sesuai. Jika selama ini pengawasan rujukan dilakukan secara pasif dan terisolasi per lembar klaim, AEGIS-JKN hadir sebagai radar intelijen berbasis Graph Network Theory dan Hybrid Explainable AI yang mampu memetakan seluruh jaringan alur rujukan faskes se-Indonesia secara spasial dan real-time.

Kami memegang teguh tiga pilar tujuan utama:
Pertama, Financial Integrity — menghentikan kebocoran dana klaim kapitasi dan INA-CBG akibat rekayasa rujukan fiktif.
Kedua, Healthcare Efficiency — mengembalikan marwah sistem rujukan berjenjang; pasien dengan penyakit ringan harus tuntas di FKTP, sementara Rumah Sakit rujukan fokus pada pasien dengan kondisi darurat dan spesialistik.
Dan Ketiga, Transparent Auditability — membekali verifikator BPJS Kesehatan dengan alat bukti forensik digital dan narasi Explainable AI yang siap dipertanggungjawabkan secara hukum dalam satu kali klik!\"""",
        border_hex=BLUE_SPEAKER_HEX,
        bg_hex=LIGHT_BLUE_HEX,
        speaker_color=COLOR_BLUE
    )

    # ────────────────────────── PART 2: LULY (SLIDE 3) ──────────────────────────
    add_dialog_block(
        speaker_name="Luly",
        speaker_role="Team Lead & Healthcare Strategist",
        slide_title="Slide 3: Latar Belakang dan Dampak",
        duration="1.5 Menit",
        action_cue="Tampilkan Slide 3. Intonasi berubah menjadi lebih serius dan empatik saat memaparkan masalah nyata di lapangan. Gestur tangan mengepal perlahan saat menyebut angka kebocoran dana. Di akhir slide, tersenyum dan mengoper ke Yayan.",
        speech_text="""\"Mengapa inovasi ini sangat mendesak? Mari kita lihat realitas di lapangan pada Slide 3.

Setiap tahunnya, terdapat puluhan hingga ratusan juta transaksi rujukan berjenjang. Dengan volume sebesar itu, mustahil bagi verifikator BPJS mengaudit satu per satu alur secara manual melalui tabel Excel atau sampling acak konvensional. Akibatnya, sindikat kolusi tersembunyi leluasa beroperasi:

Fakta di lapangan menunjukkan fenomena mencengangkan: sebuah klinik primer (FKTP) sengaja 'mengunci' alur rujukannya hingga lebih dari 75% hanya ke satu Rumah Sakit swasta tertentu. Kenapa? Karena adanya perjanjian di bawah meja atau insentif non-medis. Pasien yang hanya menderita batuk pilek biasa (ISPA) atau diare ringan sengaja dirujuk ke RS rekanan dengan menempuh jarak 18 hingga 24 kilometer, melompati beberapa Rumah Sakit terdekat yang sebenarnya jauh lebih kompeten!

Dampaknya sangat fatal:
Pasien terbebani waktu dan biaya perjalanan;
Rumah Sakit kebanjiran pasien kasus ringan yang menyebabkan antrean membludak;
Dan yang paling miris, ratusan miliar dana amanah BPJS menguap untuk klaim-klaim yang tidak perlu.

Inilah masalah fundamental yang kami selesaikan. Dan untuk menjelaskan bagaimana kecerdasan buatan dan analisis graf bekerja di balik layar AEGIS-JKN, rekan saya Yayan akan membedah dapur pacunya. Kepada Yayan, saya persilakan.\" [Luly mengarahkan tangan ke Yayan dengan senyuman percaya diri]""",
        border_hex=BLUE_SPEAKER_HEX,
        bg_hex=LIGHT_BLUE_HEX,
        speaker_color=COLOR_BLUE
    )

    # ────────────────────────── PART 3: YAYAN (SLIDE 4) ──────────────────────────
    add_dialog_block(
        speaker_name="Yayan",
        speaker_role="AI & Graph Analytics Engineer",
        slide_title="Slide 4: Alur Proses Aplikasi & Logika Anomali",
        duration="2.0 Menit",
        action_cue="Yayan melangkah maju setengah langkah, mengangguk sopan ke arah Luly dan Dewan Juri. Tatapan tajam, intonasi lugas, cerdas, dan percaya diri. Tampilkan Slide 4 yang memuat diagram arsitektur sistem dan formula matematika XAI.",
        speech_text="""\"Terima kasih Luly. Dewan Juri yang kami hormati,

Sebagai tim teknis, tantangan terbesar kami adalah: bagaimana mendeteksi sindikat kolusi yang sengaja disamarkan di antara puluhan ribu transaksi normal? Jawabannya bukan dengan tabel tabular biasa, melainkan dengan Graph Network Theory!

Mari kita perhatikan alur proses pada Slide 4:
Pertama, Sistem menyerap log transaksi rujukan: mencakup identitas FKTP asal, Rumah Sakit tujuan, kode diagnosis ICD-10, koordinat geolokasi, dan timestamp.
Kedua, Graph Modeling: Menggunakan NetworkX, kami membangun graf berarah (Directed Graph). Faskes diposisikan sebagai Node, dan alur rujukan agregat diposisikan sebagai Edge berbobot. Dari sini, topologi jaringan langsung terlihat.
Ketiga, Hybrid Anomaly Detection Engine: Kami tidak menggunakan AI yang 'black-box'. Kami menggabungkan model Machine Learning XGBoost Classifier dengan 4 Pilar Formula Explainable AI (XAI) yang sangat transparan dan akuntabel.

AI kami bertindak layaknya detektif otomatis yang mencari 4 tanda kecurigaan dengan bobot pembobotan terukur:
1. Konsentrasi Rujukan (Bobot 30%): Seberapa besar persentase pasien klinik diarahkan hanya ke satu RS tujuan? Jika melebihi 70%, ini adalah alarm kuat monopoli rujukan.
2. Rasio Diagnosis Ringan (Bobot 30%): Seberapa banyak kasus non-spesialistik seperti ISPA (J00) atau Diare (A09) yang dirujuk ke RS? Rujukan penyakit ringan adalah indikasi kuat rujukan fiktif atau akal-akalan.
3. Anomali Jarak Geografis (Bobot 20%): Apakah pasien dipaksa menempuh jarak puluhan kilometer melompati faskes rujukan terdekat?
4. Dan Lonjakan Volume Transaksi (Bobot 20%): Dihitung berbasis Z-score deviasi volume rujukan dibanding faskes normal lainnya.

Keempat nilai ini digabungkan menjadi Fraud Score tunggal berskala 0 hingga 1. Jika skor mencapai 0.75 ke atas, sistem menetapkan status CRITICAL; 0.60 hingga 0.74 berstatus HIGH; dan 0.55 hingga 0.59 berstatus MEDIUM.

Dengan arsitektur ini, seluruh proses komputasi terhadap 40.000 transaksi dapat diselesaikan dalam waktu kurang dari 1 detik berkat sistem in-memory graph caching kami.

Namun, algoritma canggih tidak akan ada artinya tanpa antarmuka yang ramah bagi pengguna. Bagaimana wujud nyata sistem ini bekerja di lapangan? Rekan saya Nisrina akan mendemokan langsung prototype interaktif AEGIS-JKN. Kepada Nisrina, saya persilakan.\" [Yayan mengarahkan tangan ke Nisrina]""",
        border_hex=EMERALD_HEX,
        bg_hex=LIGHT_GREEN_HEX,
        speaker_color=COLOR_EMERALD
    )

    # ────────────────────────── PART 4: NISRINA (SLIDE 5 & SLIDE 6) ──────────────────────────
    add_dialog_block(
        speaker_name="Nisrina",
        speaker_role="Product & Interface Specialist",
        slide_title="Slide 5: Demo Aplikasi / Prototype yang Telah Dikembangkan",
        duration="2.0 Menit",
        action_cue="Nisrina tersenyum cerah, memegang clicker/laptop demo. Slide 5 menyala, menampilkan antarmuka Radar Peta GIS AEGIS-JKN di browser. Gerakan kursor mengklik rute merah dan membuka panel audit secara nyata.",
        speech_text="""\"Terima kasih Yayan. Dewan Juri yang terhormat, mari kita buktikan inovasi ini secara nyata. Di layar hadapan Anda, adalah prototype fungsional AEGIS-JKN yang sedang berjalan langsung (live)!

[Action: Tunjuk ke Peta GIS Leaflet di layar]
Saat verifikator BPJS membuka halaman utama Monitoring Radar, sistem langsung memetakan topologi jaringan faskes berbasis koordinat spasial nyata. Titik-titik biru adalah Puskesmas dan Klinik (FKTP), dan titik-titik hijau adalah Rumah Sakit Rujukan (FKRTL). Garis-garis yang menghubungkan keduanya adalah aliran pasien rujukan riil.

Perhatikan di layar: verifikator tidak perlu lagi memelototi ribuan baris spreadsheet!
Jalur rujukan yang normal akan berwarna abu-abu tipis. Namun, begitu AI mendeteksi adanya sindikasi abnormal, sistem secara instan menyalakan GARIS MERAH BERKEDIP dan HEXAGON MERAH BERDENYUT di atas peta!

[Action: Nisrina mengklik garis rute merah Klinik Sehat Sejahtera -> RS Mitra Mulia]
Mari kita klik salah satu rute merah yang paling mencurigakan ini: alur dari 'Klinik Pratama Sehat Sejahtera' menuju 'RS Mitra Mulia'.

Begitu diklik, di sebelah kanan langsung meluncur Panel Audit XAI (Explainable AI):
Lihat, AI kami tidak hanya menuduh, tapi menyajikan bukti forensik lengkap:
• Nilai Risiko: 86.2% — Kategori CRITICAL!
• Bukti 1: Sebanyak 77.4% pasien dari klinik ini dimonopoli dan hanya dikirim ke RS Mitra Mulia.
• Bukti 2: 95.4% kasus yang dirujuk ternyata hanya penyakit batuk pilek biasa (kode ICD-10: J00)!
• Bukti 3: Pasien dipaksa menempuh jarak rata-rata 18.1 kilometer!
• Dan di bawahnya, sistem menyajikan 50 sampel data transaksi aktual lengkap dengan ID Pasien, tanggal rujukan, dan kode diagnosa.

Verifikator cukup mengklik tombol 'Cetak Bukti Audit', dan laporan investigasi forensik siap dijadikan dasar hukum pemanggilan faskes dalam hitungan detik!\"""",
        border_hex=PURPLE_HEX,
        bg_hex=LIGHT_PURPLE_HEX,
        speaker_color=COLOR_PURPLE
    )

    add_dialog_block(
        speaker_name="Nisrina",
        speaker_role="Product & Interface Specialist",
        slide_title="Slide 6: Penjelasan 5 Fitur Utama Aplikasi",
        duration="1.5 Menit",
        action_cue="Beralih ke Slide 6. Menampilkan 5 fitur utama yang sesuai dengan menu navigasi dan antarmuka aplikasi dengan gestur tangan yang dinamis.",
        speech_text="""\"Tidak berhenti di sana, Dewan Juri yang kami hormati,

Untuk mendukung operasional pengawasan harian di BPJS Kesehatan, AEGIS-JKN dirancang dengan 5 Fitur Utama yang konkret dan siap digunakan:

Pertama, Menu Monitoring (Peta GIS Alur Rujukan): Memetakan seluruh jaringan alur rujukan faskes di atas peta interaktif. Jika ada alur kolusi abnormal, jalurnya otomatis menyala dengan garis merah berkedip.
Kedua, Panel Audit XAI 1-Klik: Cukup klik pada garis alur merah di peta, sistem langsung membuka sidebar bukti forensik yang membedah nilai risiko, narasi penjelasan, 4 faktor pemicu, dan sampel transaksi pasien.
Ketiga, Menu Prioritas Audit: Halaman antrean investigasi yang secara otomatis mengurutkan alur rujukan paling bermasalah dari risiko tertinggi (Critical, High, Medium) sehingga verifikator BPJS langsung tahu faskes mana yang wajib ditindaklanjuti terlebih dahulu tanpa membuang waktu.
Keempat, Menu Direktori Faskes: Halaman katalog seluruh Puskesmas, Klinik, dan Rumah Sakit (Tipe A, B, C) untuk melihat profil dan rekam jejak riwayat rujukan masuk maupun keluar per fasilitas kesehatan.
Dan Kelima, Menu Analitik: Dashboard statistik makro yang menyajikan visualisasi sebaran diagnosis penyakit ICD-10, metrik jejaring graf faskes rujukan, dan ringkasan risiko secara komprehensif.\" """,
        border_hex=PURPLE_HEX,
        bg_hex=LIGHT_PURPLE_HEX,
        speaker_color=COLOR_PURPLE
    )

    # ────────────────────────── PART 5: NISRINA (SLIDE 7) ──────────────────────────
    add_dialog_block(
        speaker_name="Nisrina",
        speaker_role="Product & Interface Specialist",
        slide_title="Slide 7: Keunggulan Kompetitif & Dampak bagi BPJS",
        duration="1.0 Menit",
        action_cue="Tampilkan Slide 7. Nada bicara meyakinkan, menonjolkan positioning unik inovasi di hadapan dewan juri dibanding pendekatan kompetitor.",
        speech_text="""\"Apa yang membuat AEGIS-JKN jauh lebih unggul dibanding sistem pengawasan konvensional yang ada saat ini?

Pertama, Metode Baru: Jika inovasi lain hanya fokus pada data tabular tunggal klaim rumah sakit, AEGIS-JKN adalah yang pertama memanfaatkan Analisis Topologi Graf untuk melihat relasi sindikasi antar-faskes yang sengaja disamarkan.
Kedua, Transparansi XAI: Sistem kami bukan 'black box'. Setiap peringatan didasari formula 4 pilar yang dapat diuji dan dipahami dengan mudah oleh tim auditor maupun pihak berwenang.
Ketiga, Kesiapan Integrasi: Arsitektur REST API dan WebSocket kami dirancang sangat modular dan siap diintegrasikan langsung sebagai modul intelijen pada sistem P-Care di tingkat FKTP maupun sistem V-Claim di tingkat Rumah Sakit BPJS Kesehatan.

Dengan AEGIS-JKN, BPJS Kesehatan mampu menghemat ratusan miliar rupiah potensi pemborosan klaim rujukan non-spesialistik dan menegakkan tata kelola yang berintegritas.

Dan sebagai penutup dari presentasi kami, saya kembalikan mikrofon kepada rekan kami, Luly.\" [Nisrina mengangguk sopan dan mengoper kembali ke Luly]""",
        border_hex=PURPLE_HEX,
        bg_hex=LIGHT_PURPLE_HEX,
        speaker_color=COLOR_PURPLE
    )

    # ────────────────────────── PART 6: LULY (SLIDE 8 - CLOSING) ──────────────────────────
    add_dialog_block(
        speaker_name="Luly",
        speaker_role="Team Lead & Healthcare Strategist",
        slide_title="Slide 8: Kesimpulan & Penutup (Closing Statement)",
        duration="1.0 Menit",
        action_cue="Luly kembali mengambil posisi tengah panggung. Suara hangat, menggetarkan, penuh ketulusan dan optimisme. Ketiga anggota tim berdiri tegak berdampingan, bersiap memberikan hormat dan salam penutup.",
        speech_text="""\"Terima kasih Nisrina dan Yayan.

Dewan Juri yang kami muliakan dan seluruh hadirin,

Pada akhirnya, kecerdasan buatan hanyalah sebuah alat. Namun ketika kecerdasan buatan dipadukan dengan integritas moral dan pemahaman mendalam atas regulasi kesehatan, lahirlah sebuah perisai pelindung yang tangguh.

AEGIS-JKN hadir bukan semata-mata untuk mencari kesalahan faskes, melainkan untuk menjaga ekosistem rujukan BPJS Kesehatan tetap adil, transparan, dan berkelanjutan. Uang yang berhasil kita selamatkan dari sindikat rujukan semu adalah hak bagi pasien kanker yang membutuhkan kemoterapi, hak bagi ibu hamil yang memerlukan persalinan darurat, dan hak bagi jutaan anak Indonesia untuk mendapatkan masa depan yang sehat.

Mari bersama-sama kita wujudkan:
'Integritas Rujukan Terjaga, Pasien Sejahtera, BPJS Kesehatan Berkelanjutan!'

Prototipe sistem kami telah teruji 100% fungsional, dan kami siap berkolaborasi mewujudkan pilot project bersama BPJS Kesehatan.

Sekian presentasi dari kami. Kami siap menyambut pertanyaan dan diskusi mendalam dari Dewan Juri yang terhormat.

Wabillahi taufiq wal hidayah,
Wassalamu’alaikum Warahmatullahi Wabarakatuh.
Terima kasih banyak!\" [Ketiga anggota tim membungkuk hormat bersamaan dan tersenyum menyambut sesi Q&A]""",
        border_hex=BLUE_SPEAKER_HEX,
        bg_hex=LIGHT_BLUE_HEX,
        speaker_color=COLOR_BLUE
    )

    # ────────────────────────── LAMPIRAN: PANDUAN Q&A TANYA JAWAB ──────────────────────────
    p_qa = doc.add_paragraph()
    p_qa.paragraph_format.space_before = Pt(16)
    p_qa.paragraph_format.space_after = Pt(4)
    r_qa_t = p_qa.add_run("🎯 LAMPIRAN KHUSUS: PANDUAN JAWABAN TANYA JAWAB (Q&A) DEWAN JURI\n")
    r_qa_t.font.name = "Arial"
    r_qa_t.bold = True
    r_qa_t.font.size = Pt(11)
    r_qa_t.font.color.rgb = COLOR_NAVY
    
    p_qa.add_run("Berikut adalah contekan jawaban taktis jika dewan juri menanyakan pertanyaan mendalam saat sesi Q&A:")

    qa_list = [
        ("Tanya 1: Bagaimana jika rujukan kasus ringan memang atas indikasi medis darurat di FKTP?",
         "Dijawab oleh Luly/Yayan: 'Pertanyaan yang sangat bagus, Dewan Juri. Sistem kami tidak menilai transaksi tunggal secara membabi buta, melainkan menilai rasio agregat (konsentrasi & volume). Jika hanya 1-2 pasien karena kondisi darurat/alat rusak, rute tidak akan menyentuh threshold anomali (55%). Garis merah hanya menyala jika mayoritas rujukan (>70-90%) secara sistematis dan terus-menerus dikirim ke satu RS rekanan saja.'"),
        ("Tanya 2: Mengapa memilih XGBoost dan Graph Network dibanding Deep Learning GNN?",
         "Dijawab oleh Yayan: 'Dewan Juri yang kami hormati, dalam ranah hukum dan audit keuangan negara, aspek akuntabilitas dan Explainable AI adalah yang utama. Model Deep Learning GNN cenderung bersifat black-box dan sulit dipertanggungjawabkan di pengadilan/sidang audit. Kombinasi NetworkX + XGBoost + bobot transparan 4 faktor memberikan waktu komputasi instan (<1 detik) serta narasi forensik numerik yang 100% dapat diaudit oleh manusia (Human-in-the-loop).'"),
        ("Tanya 3: Seberapa siap sistem ini dihubungkan dengan database BPJS riil?",
         "Dijawab oleh Nisrina: 'Sangat siap. Backend kami dibangun di atas FastAPI modular dengan schema endpoint REST API dan WebSocket yang sudah siap menerima payload JSON dari server P-Care maupun V-Claim BPJS. Kami juga telah mendesain mekanisme batch-preprocessing dan in-memory caching sehingga mampu menahan beban jutaan transaksi tanpa latensi tinggi.'")
    ]

    for q, a in qa_list:
        t_qa = doc.add_table(rows=1, cols=1)
        t_qa.alignment = WD_TABLE_ALIGNMENT.CENTER
        t_qa.columns[0].width = Inches(6.7)
        c_qa = t_qa.cell(0, 0)
        set_cell_background(c_qa, LIGHT_GRAY_HEX)
        set_cell_margins(c_qa, top=100, bottom=100, left=140, right=140)
        set_cell_borders(c_qa, left={'val': 'single', 'sz': 16, 'color': NAVY_HEX})
        
        qp = c_qa.paragraphs[0]
        qp.paragraph_format.space_before = Pt(1)
        qp.paragraph_format.space_after = Pt(2)
        r_q = qp.add_run(f"❓ {q}\n")
        r_q.font.name = "Arial"
        r_q.font.size = Pt(9.5)
        r_q.bold = True
        r_q.font.color.rgb = COLOR_NAVY
        
        r_a = qp.add_run(f"💡 {a}")
        r_a.font.name = "Calibri"
        r_a.font.size = Pt(9.5)
        r_a.font.italic = True
        
        doc.add_paragraph().paragraph_format.space_after = Pt(3)

    # Save with lock fallback
    try:
        doc.save(output_path)
        print(f"[OK] Naskah Bicara Document successfully generated at: {output_path}")
    except PermissionError:
        fallback_path = output_path.replace(".docx", "_UPDATE.docx")
        doc.save(fallback_path)
        print(f"[NOTE] File asli sedang dibuka di Microsoft Word. Versi terbaru disimpan di: {fallback_path}")

if __name__ == "__main__":
    out_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "NASKAH_BICARA_PRESENTASI_AEGIS_JKN.docx")
    create_naskah_document(out_file)
