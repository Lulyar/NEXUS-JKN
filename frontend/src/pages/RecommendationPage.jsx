import { useState, useEffect } from "react";
import {
  Sparkles,
  Building2,
  Navigation,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  ChevronRight,
  CheckCircle2,
  Filter,
} from "lucide-react";

export default function RecommendationPage() {
  const [clinics, setClinics] = useState([]);
  const [diagnoses, setDiagnoses] = useState({});
  const [selectedClinic, setSelectedClinic] = useState("");
  const [selectedIcd, setSelectedIcd] = useState("J00");
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load list of clinics from graph and diagnoses catalog on mount
  useEffect(() => {
    async function initData() {
      try {
        const [graphRes, diagRes] = await Promise.all([
          fetch("/api/graph"),
          fetch("/api/diagnoses"),
        ]);
        if (graphRes.ok) {
          const gData = await graphRes.json();
          const fktpNodes = (gData.nodes || [])
            .filter((n) => n.data?.node_type === "FKTP")
            .map((n) => n.data?.id || n.data?.label);
          setClinics(fktpNodes);
          if (fktpNodes.length > 0) {
            setSelectedClinic(fktpNodes[0]);
          }
        }
        if (diagRes.ok) {
          const dData = await diagRes.json();
          setDiagnoses(dData);
        }
      } catch (err) {
        console.error("Gagal inisialisasi data rekomendasi:", err);
      }
    }
    initData();
  }, []);

  // Fetch recommendation
  const handleGetRecommendation = async () => {
    if (!selectedClinic || !selectedIcd) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/recommend?clinic=${encodeURIComponent(selectedClinic)}&icd=${encodeURIComponent(selectedIcd)}`
      );
      if (!res.ok) throw new Error("Gagal mengambil rekomendasi RS.");
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan sistem rekomendasi.");
    } finally {
      setLoading(false);
    }
  };

  // Run initial recommendation when selectedClinic is ready
  useEffect(() => {
    if (selectedClinic && selectedIcd) {
      handleGetRecommendation();
    }
  }, [selectedClinic]);

  const diagInfo = recommendations?.diagnosis_info || diagnoses[selectedIcd] || {};

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-900 via-[#0B1A30] to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Sistem Pendukung Keputusan Rujukan Cerdas (Prescriptive AI)
            </div>
            <h1 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              Rekomendasi Rumah Sakit Rujukan Terbaik
            </h1>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              Membantu FKTP menentukan RS rujukan paling ideal sesuai jenjang BPJS (Tipe A, B, C, D),
              aksesibilitas waktu tempuh jalan raya, dan rekam jejak anti-fraud.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2">
              🛡️ Kepatuhan Permenkes
            </span>
            <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2">
              ⏱️ Road Travel Time
            </span>
          </div>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
          {/* Clinic Origin */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-[#154B90]" />
              Fasilitas Kesehatan Asal (FKTP / Puskesmas / Klinik)
            </label>
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-[#154B90] focus:bg-white focus:ring-2 focus:ring-[#154B90]/10"
            >
              {clinics.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Diagnosis ICD-10 */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Stethoscope className="h-4 w-4 text-emerald-600" />
              Diagnosa Penyakit Pasien (ICD-10)
            </label>
            <select
              value={selectedIcd}
              onChange={(e) => setSelectedIcd(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-[#154B90] focus:bg-white focus:ring-2 focus:ring-[#154B90]/10"
            >
              <optgroup label="Penyakit Ringan (Tuntas FKTP / Rujukan Tipe D-C)">
                <option value="J00">J00 — ISPA / Batuk Pilek Akut (Ringan)</option>
                <option value="A09">A09 — Diare & Gastroenteritis Akut (Ringan)</option>
                <option value="K29">K29 — Gastritis & Maag Akut (Ringan)</option>
              </optgroup>
              <optgroup label="Penyakit Kronis / Spesialistik (Tipe C-B)">
                <option value="E11">E11 — Diabetes Melitus Tipe 2 (Kronis)</option>
                <option value="I10">I10 — Hipertensi Primer (Kronis)</option>
              </optgroup>
              <optgroup label="Kasus Kompleks / Gawat Darurat (Tipe B-A)">
                <option value="I21">I21 — Infark Miokard Akut / Serangan Jantung</option>
                <option value="N18">N18 — Penyakit Ginjal Kronis (Cuci Darah)</option>
                <option value="I63">I63 — Stroke Iskemik Akut (Bedah Saraf)</option>
              </optgroup>
            </select>
          </div>

          {/* Submit Action */}
          <div className="md:col-span-3">
            <button
              onClick={handleGetRecommendation}
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#154B90] px-4 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  Hitung Rekomendasi
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Context Alert */}
      {diagInfo.name && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-200/80 px-2 py-0.5 rounded">
                  ICD: {selectedIcd}
                </span>
                <span className="text-sm font-bold text-slate-900">{diagInfo.name}</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    diagInfo.severity === "Ringan"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : diagInfo.severity === "Sedang"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  Tingkat: {diagInfo.severity}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Kategori: <strong className="text-slate-800">{diagInfo.category}</strong> • Fasilitas Wajib:{" "}
                <span className="italic text-slate-700">{diagInfo.required_facility}</span>
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Jenjang Target Disarankan
              </p>
              <p className="text-xs font-bold text-[#154B90]">
                {(diagInfo.preferred_tiers || []).join(" / ") || "Tipe C"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Daftar Rumah Sakit Rekomendasi Teratas (Hasil Analisis AI)
          </h2>
          <span className="text-xs text-slate-500">
            Diurutkan berdasarkan skor kecocokan tertinggi
          </span>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
            {error}
          </div>
        )}

        {recommendations?.recommendations && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommendations.recommendations.slice(0, 3).map((rs, idx) => {
              const isFirst = idx === 0;
              return (
                <div
                  key={rs.hospital_name}
                  className={`relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                    isFirst
                      ? "border-emerald-400 ring-2 ring-emerald-500/20"
                      : "border-slate-200"
                  }`}
                >
                  {/* Top Badge */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold shadow-sm ${
                          isFirst
                            ? "bg-emerald-600 text-white"
                            : idx === 1
                            ? "bg-blue-600 text-white"
                            : "bg-indigo-600 text-white"
                        }`}
                      >
                        {rs.rank_badge}
                      </span>
                      <div className="text-right">
                        <span className="text-lg font-black text-slate-900">
                          {rs.match_score}%
                        </span>
                        <p className="text-[10px] font-medium text-slate-400">Match Score</p>
                      </div>
                    </div>

                    {/* Hospital Name & Tier */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{rs.hospital_name}</h3>
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-black ${
                            rs.tier === "Tipe A"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : rs.tier === "Tipe B"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : rs.tier === "Tipe C"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {rs.tier}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{rs.role}</p>
                    </div>

                    {/* Key Metrics: Travel Time & Real Road Distance */}
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#154B90]" />
                          Waktu Tempuh:
                        </span>
                        <strong className="text-sm font-extrabold text-slate-900">
                          {rs.travel_time_minutes} Menit
                        </strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Navigation className="h-3 w-3 text-emerald-600" />
                          Jarak Jalan Riil:
                        </span>
                        <strong className="text-sm font-extrabold text-slate-900">
                          {rs.real_distance_km} km
                        </strong>
                      </div>
                    </div>

                    {/* Reasons / XAI Justification */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Pertimbangan AI:
                      </p>
                      <ul className="space-y-1.5 text-xs">
                        {rs.reasons.map((r, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-1.5 text-slate-700">
                            {r.includes("⚠️") ? (
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                            )}
                            <span className="leading-snug">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Facility Features */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{rs.bed_capacity}</span>
                    <span className="font-semibold text-slate-700">
                      {(rs.key_facilities || []).join(", ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hospital Tier Reference Table (Tipe A, B, C, D) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>🏛️</span>
          Referensi Regulasi Rujukan Berjenjang BPJS Kesehatan (Tipe A, B, C, dan D)
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Pedoman penegakan alur rujukan horizontal & vertikal sesuai tingkat kompetensi faskes.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-2.5">Tipe Rumah Sakit</th>
                <th className="px-4 py-2.5">Klasifikasi Pelayanan</th>
                <th className="px-4 py-2.5">Kriteria Kasus Pasien</th>
                <th className="px-4 py-2.5">Contoh di Sistem NEXUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-2.5 font-bold text-purple-700">Tipe A</td>
                <td className="px-4 py-2.5">Rujukan Tersier Tertinggi (Pelayanan Subspesialistik Lengkap)</td>
                <td className="px-4 py-2.5">Kasus kompleks, gagal organ ganda, bedah saraf/jantung lanjutan</td>
                <td className="px-4 py-2.5 font-medium">RSUD Kota Sehat, RSUD Berkah Mandiri</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-bold text-blue-700">Tipe B</td>
                <td className="px-4 py-2.5">Rujukan Sekunder Lanjut (Minimal 11 Spesialis & 4 Subspesialis)</td>
                <td className="px-4 py-2.5">Kasus spesialistik lanjutan tidak tertangani di Tipe C/D</td>
                <td className="px-4 py-2.5 font-medium">RS Medika Care, RS Graha Sehat, RS Mitra Mulia</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-bold text-emerald-700">Tipe C</td>
                <td className="px-4 py-2.5">Rujukan Sekunder Standar (Minimal 4 Spesialis Dasar)</td>
                <td className="px-4 py-2.5">Kasus rawat inap spesialistik standar (penyakit dalam, bedah, anak)</td>
                <td className="px-4 py-2.5 font-medium">RS Sentosa, RS Permata Bunda</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-bold text-amber-700">Tipe D</td>
                <td className="px-4 py-2.5">Rujukan Sekunder Dasar / RS Pratama (Minimal 2 Spesialis Dasar)</td>
                <td className="px-4 py-2.5">Penyakit umum, observasi medis dasar, rawat inap pratama</td>
                <td className="px-4 py-2.5 font-medium">RS Bhakti Husada, RS Ananda Medika</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

