import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

doc = docx.Document()

# Page Margins
for section in doc.sections:
    section.top_margin = Inches(0.9)
    section.bottom_margin = Inches(0.9)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)

# Colors
PRIMARY = RGBColor(11, 26, 48)      # Deep Navy
SECONDARY = RGBColor(2, 132, 199)   # Ocean Blue
BODY = RGBColor(30, 41, 59)         # Slate 800
MUTED = RGBColor(100, 116, 139)     # Slate 500
ACCENT = RGBColor(15, 118, 110)     # Teal

# Helpers
def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=160, bottom=160, left=200, right=200):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

# Title Header
p_title = doc.add_paragraph()
r_title = p_title.add_run("NASKAH BICARA LENGKAP PITCHING AEGIS-JKN")
r_title.font.name = "Calibri"
r_title.font.size = Pt(20)
r_title.font.bold = True
r_title.font.color.rgb = PRIMARY
p_title.paragraph_format.space_after = Pt(2)

p_sub = doc.add_paragraph()
r_sub = p_sub.add_run("Healthkathon BPJS Kesehatan 2026 | Estimasi Durasi: 5 - 7 Menit")
r_sub.font.name = "Calibri"
r_sub.font.size = Pt(11)
r_sub.font.bold = True
r_sub.font.color.rgb = SECONDARY
p_sub.paragraph_format.space_after = Pt(4)

p_meta = doc.add_paragraph()
r_meta = p_meta.add_run("Panduan resmi kata-per-kata, penekanan intonasi, dan petunjuk demonstrasi sistem.")
r_meta.font.name = "Calibri"
r_meta.font.size = Pt(10)
r_meta.font.italic = True
r_meta.font.color.rgb = MUTED
p_meta.paragraph_format.space_after = Pt(20)

slides = [
    {
        "title": "SLIDE 1: PEMBUKAAN & PERKENALAN SISTEM",
        "durasi": "Estimasi Waktu: 45 - 60 Detik",
        "action": "Berdiri tegap, tatap dewan juri dengan kontak mata merata, intonasi lugas dan percaya diri.",
        "spoken": [
            "\"Selamat pagi/siang Dewan Juri yang terhormat, panitia Healthkathon, dan rekan-rekan inovator BPJS Kesehatan.",
            "Setiap tahunnya, jutaan transaksi rujukan mengalir di dalam ekosistem Program Jaminan Kesehatan Nasional. Namun, di balik volume pelayanan yang luar biasa ini, terdapat dua tantangan besar yang mengancam efisiensi dana amanah dan mutu layanan peserta: pertama, adalah inefisiensi rujukan berjenjang akibat rujukan kasus ringan yang menumpuk di rumah sakit tingkat atas; dan kedua, adalah indikasi sindikasi faskes terorganisir di mana pasien diarahkan secara tidak wajar ke fasilitas kesehatan tertentu demi kepentingan klaim.",
            "Untuk menjawab tantangan tersebut, kami dari Tim AEGIS-JKN mempersembahkan: AEGIS-JKN — Anomaly and Ethical Graph Insight System, sebuah sistem pengawas dan pemandu rujukan cerdas berbasis Graph Machine Learning dan Prescriptive AI.",
            "AEGIS-JKN hadir sebagai perisai cerdas untuk menjaga integritas rujukan, menegakkan regulasi faskes berjenjang, dan memastikan peserta JKN mendapatkan penanganan di fasilitas terbaik yang paling efisien.\""
        ]
    },
    {
        "title": "SLIDE 2: PERUBAHAN & PENYEMPURNAAN SETELAH COACHING",
        "durasi": "Estimasi Waktu: 60 - 75 Detik",
        "action": "Tunjukkan komitmen eksekusi tim, sebutkan bahwa seluruh kode dapat diaudit secara terbuka di GitHub.",
        "spoken": [
            "\"Dewan Juri yang kami hormati, pada sesi coaching sebelumnya, kami menerima berbagai masukan berharga dari para coach dan juri. Kami tidak hanya mencatat masukan tersebut, melainkan mengeksekusinya secara tuntas ke dalam sistem produksi kami. Seluruh implementasi kode dan dataset pembaruan ini dapat diverifikasi langsung secara transparan pada repositori GitHub kami di github.com/Lulyar/NEXUS-JKN.",
            "Ada empat penyempurnaan utama yang telah kami selesaikan 100 persen:",
            "Pertama, kami menghapus total asumsi garis lurus pada peta rujukan. Kini, seluruh visualisasi rute menggunakan penarikan geometri jalan raya nyata berbasis koordinat OSRM, sehingga setiap garis rujukan merefleksikan kontur jalan sebenarnya yang dilalui pasien.",
            "Kedua, kami mengintegrasikan estimasi jarak tempuh kilometer jalan raya dan durasi perjalanan presisi dalam satuan menit. Ini memungkinkan sistem mendeteksi rujukan yang membuang waktu tempuh pasien secara tidak masuk akal.",
            "Ketiga, kami menerapkan standardisasi penjenjangan rumah sakit secara ketat ke dalam empat kelas resmi BPJS, yaitu Tipe A, Tipe B, Tipe C, dan Tipe D.",
            "Dan keempat, sebagai lompatan terbesar, kami melahirkan modul baru: AI Smart Hospital Recommender Engine. Modul ini menjadi sistem pendukung keputusan preskriptif yang membantu dokter di fasilitas kesehatan tingkat pertama memilih tiga rumah sakit rujukan paling ideal sesuai indikasi medis pasien.\""
        ]
    },
    {
        "title": "SLIDE 3: ARSITEKTUR SOLUSI & ALUR RUJUKAN CERDAS",
        "durasi": "Estimasi Waktu: 30 - 45 Detik",
        "action": "Sampaikan dengan ringkas sebagai 'jembatan' transisi yang mengundang rasa penasaran juri sebelum live demo.",
        "spoken": [
            "\"Lalu, bagaimana AEGIS-JKN bekerja mentransformasi ekosistem rujukan?",
            "Sistem kami menggabungkan dua mesin kecerdasan buatan: Mesin pertama adalah Graph Machine Learning dengan XGBoost Classifier yang bertindak sebagai detektor anomali jejaring untuk mengendus rute sindikasi dan loncat jenjang secara otomatis.",
            "Mesin kedua adalah Hospital Recommender Engine yang bertindak sebagai pemandu preskriptif bagi dokter, menimbang tingkat keparahan diagnosa ICD-10, kelas rumah sakit, waktu tempuh terdekat, dan rekam jejak anti-fraud.",
            "Agar Dewan Juri dapat melihat bukti nyata bagaimana data rujukan diolah dan dianalisis secara real-time, kami tidak hanya menampilkan diagram alur di slide ini, melainkan akan membuktikannya langsung melalui sesi live demo aplikasi berikut ini.\""
        ]
    },
    {
        "title": "SLIDE 4: LIVE DEMO APLIKASI AEGIS-JKN",
        "durasi": "Estimasi Waktu: 90 - 120 Detik",
        "action": "Pindah ke layar browser http://localhost:5173. Tunjukkan Peta Monitoring terlebih dahulu, lalu klik menu Rekomendasi RS (AI).",
        "spoken": [
            "\"Mari kita masuk ke dalam antarmuka operasional AEGIS-JKN.",
            "Di halaman pertama, kita melihat Peta Monitoring Jejaring Rujukan Interaktif. Di sini tergambar 30 faskes yang terdiri dari 20 Puskesmas dan Klinik serta 10 Rumah Sakit rujukan lintas Tipe A, B, C, dan D.",
            "Perhatikan garis-garis rujukan di peta ini. Garis-garis ini tidak lagi berbentuk garis lurus kaku, melainkan mengikuti liku jalan raya yang sebenarnya, lengkap dengan partikel animasi aliran rujukan dan badge waktu tempuh menit yang melayang di atas jalan.",
            "Ketika kita klik salah satu rute yang ditandai merah, panel audit di sisi kanan langsung mengaktifkan Explainable AI. Sistem membeberkan alasan mengapa rute tersebut terindikasi anomali: misalnya karena terjadi pemusatan rujukan hingga 80 persen ke satu rumah sakit swasta, mem-bypass rumah sakit terdekat, dan memaksakan kasus ringan masuk ke rumah sakit kelas atas.",
            "Sekarang, kita buka menu kedua: Rekomendasi Rumah Sakit Berbasis AI.",
            "Ini adalah fitur preskriptif unggulan yang kami bangun pasca-coaching. Bayangkan seorang dokter di Puskesmas Teratai menerima pasien dengan diagnosa ISPA atau batuk pilek ringan dengan kode ICD-10 J00. Ketika dokter memilih diagnosa ini, model Machine Learning langsung memproses rekomendasi teratas: RS Sentosa dan RS Bhakti Husada kelas C dan D mendapatkan skor kecocokan tertinggi di atas 95 persen dengan waktu tempuh 15 menit. Sebaliknya, RSUD Tipe A otomatis diturunkan skornya ke peringkat bawah karena tidak efisien untuk kasus non-spesialistik.",
            "Namun, jika diagnosa diganti menjadi Infark Miokard Akut atau serangan jantung darurat dengan kode I21, AI seketika membalik rekomendasi: RSUD Berkah Mandiri kelas Tipe A langsung melonjak menjadi rekomendasi utama karena memiliki fasilitas ICU dan spesialis jantung lengkap. Inilah wujud rujukan tepat guna yang melindungi keselamatan pasien sekaligus menjaga efisiensi biaya BPJS.\""
        ]
    },
    {
        "title": "SLIDE 5: DAMPAK TERUKUR BAGI EKOSISTEM BPJS KESEHATAN",
        "durasi": "Estimasi Waktu: 60 - 75 Detik",
        "action": "Tekankan nilai kuantitatif, efisiensi dana jaminan sosial, dan kepatuhan regulasi.",
        "spoken": [
            "\"Dewan Juri yang kami hormati, inovasi teknologi tidak akan berarti tanpa dampak konkret yang terukur. Implementasi AEGIS-JKN membawa tiga nilai transformasi utama bagi BPJS Kesehatan:",
            "Pertama, dari aspek Keuangan dan Efisiensi Dana JKN: Berdasarkan simulasi pada jejaring percontohan kami, deteksi dini terhadap sindikasi rujukan dan rute anomali mampu mengeliminasi kebocoran klaim hingga miliaran rupiah pada tingkat regional, dan berpotensi menyelamatkan ratusan miliar rupiah jika diskalakan secara nasional.",
            "Kedua, dari aspek Kepatuhan Regulasi Berjenjang: Rekomendasi preskriptif kami menekan penumpukan rujukan kasus ringan di rumah sakit Tipe A dan B hingga 40 persen. Pasien diarahkan sesuai kompetensi faskes Tipe C dan D, menciptakan distribusi beban kerja fasilitas kesehatan yang proporsional.",
            "Dan ketiga, dari aspek Mutu Layanan dan Keselamatan Pasien: Pasien dengan kondisi darurat tertolong lebih cepat karena sistem merekomendasikan faskes dengan fasilitas definitif dan rute perjalanan terpendek, mencegah keterlambatan penanganan pada fase golden hour.\""
        ]
    },
    {
        "title": "SLIDE 6: MODEL BISNIS, SKALABILITAS & RENCANA ADOPSI",
        "durasi": "Estimasi Waktu: 45 - 60 Detik",
        "action": "Tutup dengan komitmen keberlanjutan dan kesiapan go-live di sistem IT BPJS Kesehatan.",
        "spoken": [
            "\"Bagaimana sistem ini dapat diterapkan secara nyata?",
            "AEGIS-JKN dirancang dengan prinsip interoperabilitas tinggi untuk langsung melengkapi ekosistem digital BPJS Kesehatan yang sudah ada:",
            "Di tingkat faskes primer, engine rekomendasi kami dapat diintegrasikan secara mulus sebagai fitur plugin Smart Assist di dalam aplikasi P-Care, membantu dokter secara real-time saat menerbitkan surat rujukan.",
            "Di tingkat kantor cabang dan kantor pusat, modul audit anomali kami siap menjadi backend intelijen verifikasi di dalam sistem V-Claim, memberikan skor risiko otomatis sebelum berkas klaim disetujui untuk pembayaran.",
            "Seluruh model Machine Learning kami berjalan secara lokal, teruji ringan, tanpa biaya langganan API pihak ketiga yang membebani anggaran, dan siap diimplementasikan untuk ribuan faskes di seluruh Indonesia.",
            "Dengan AEGIS-JKN, kita wujudkan rujukan berjenjang yang transparan, adil, efisien, dan berintegritas tinggi demi keberlanjutan Program JKN untuk seluruh rakyat Indonesia.",
            "Sekian presentasi dari kami. Terima kasih atas perhatian Dewan Juri, dan kami siap berdiskusi pada sesi tanya jawab.\""
        ]
    }
]

for item in slides:
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, "F1F5F9")
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    run_h = p.add_run(item["title"])
    run_h.font.name = "Calibri"
    run_h.font.bold = True
    run_h.font.size = Pt(12)
    run_h.font.color.rgb = PRIMARY
    
    p_meta2 = doc.add_paragraph()
    p_meta2.paragraph_format.space_before = Pt(4)
    p_meta2.paragraph_format.space_after = Pt(2)
    r_durasi = p_meta2.add_run(item["durasi"])
    r_durasi.font.name = "Calibri"
    r_durasi.font.bold = True
    r_durasi.font.size = Pt(10)
    r_durasi.font.color.rgb = SECONDARY
    
    p_act = doc.add_paragraph()
    p_act.paragraph_format.space_before = Pt(2)
    p_act.paragraph_format.space_after = Pt(8)
    r_act_lbl = p_act.add_run("Petunjuk Presenter: ")
    r_act_lbl.font.name = "Calibri"
    r_act_lbl.font.bold = True
    r_act_lbl.font.size = Pt(10)
    r_act_lbl.font.color.rgb = ACCENT
    r_act_txt = p_act.add_run(item["action"])
    r_act_txt.font.name = "Calibri"
    r_act_txt.font.italic = True
    r_act_txt.font.size = Pt(10)
    r_act_txt.font.color.rgb = MUTED
    
    # Naskah
    for para in item["spoken"]:
        p_sp = doc.add_paragraph()
        p_sp.paragraph_format.space_before = Pt(3)
        p_sp.paragraph_format.space_after = Pt(5)
        p_sp.paragraph_format.line_spacing = 1.15
        r_sp = p_sp.add_run(para)
        r_sp.font.name = "Calibri"
        r_sp.font.size = Pt(11)
        r_sp.font.color.rgb = BODY
    
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

out_file = "d:\\healthkathon\\NASKAH_BICARA_PITCHING_LENGKAP.docx"
doc.save(out_file)
print("Updated successfully:", out_file)
