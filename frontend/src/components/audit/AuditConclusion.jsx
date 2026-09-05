export default function AuditConclusion({ score }) {
  const numericScore = Number(score) || 0;

  let title = "Tidak terdapat prioritas tinggi.";

  let description =
    "Pola ini belum menunjukkan kombinasi indikator yang cukup kuat untuk menjadi prioritas pemeriksaan.";

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
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
      <p className="text-sm font-semibold text-amber-300">{title}</p>

      <p className="mt-2 text-xs leading-5 text-amber-200/70">{description}</p>

      <div className="mt-4 border-t border-amber-500/10 pt-4">
        <p className="text-[11px] leading-5 text-slate-500">
          NEXUS-JKN digunakan sebagai sistem pendukung keputusan. Hasil analitik
          tidak secara otomatis menyatakan suatu fasilitas melakukan fraud dan
          tetap memerlukan verifikasi auditor.
        </p>
      </div>
    </div>
  );
}
