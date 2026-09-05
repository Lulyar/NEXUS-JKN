export default function AuditConclusion({ score }) {
  const numericScore = Number(score) || 0;

  let title = "Tidak terdapat prioritas tinggi (Jalur Normal).";

  let description =
    "Pola rujukan pada jalur ini berjalan secara alami dan tidak menunjukkan kombinasi indikator yang mencurigakan.";

  if (numericScore >= 70) {
    title = "Pola perlu mendapat prioritas pemeriksaan.";

    description =
      "Beberapa indikator menunjukkan pola yang tidak biasa. Hasil ini merupakan sinyal analitik dan bukan bukti terjadinya fraud.";
  } else if (numericScore >= 55) {
    title = "Pola perlu ditinjau lebih lanjut.";

    description =
      "Terdapat beberapa indikator yang perlu dibandingkan dengan konteks operasional dan data pendukung.";
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
      <p className="text-sm font-bold text-amber-900">{title}</p>

      <p className="mt-2 text-xs leading-5 text-amber-800">{description}</p>

      <div className="mt-4 border-t border-amber-200/80 pt-4">
        <p className="text-[11px] leading-5 text-slate-500">
          NEXUS-JKN digunakan sebagai sistem pendukung keputusan. Hasil analitik
          tidak secara otomatis menyatakan suatu fasilitas melakukan fraud dan
          tetap memerlukan verifikasi auditor.
        </p>
      </div>
    </div>
  );
}
