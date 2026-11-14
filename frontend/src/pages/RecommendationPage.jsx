import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Building2,
  Navigation,
  Clock3,
  ShieldCheck,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  BedDouble,
  MapPin,
  Info,
  LoaderCircle,
  Hospital,
  ClipboardList,
} from "lucide-react";

import SearchableSelect from "../components/Recommendation/SearchableSelect";

const diagnosisGroups = [
  {
    label: "Penyakit Ringan",
    options: [
      { value: "J00", label: "J00 — ISPA / Batuk Pilek Akut" },
      { value: "A09", label: "A09 — Diare & Gastroenteritis Akut" },
      { value: "K29", label: "K29 — Gastritis & Maag Akut" },
    ],
  },
  {
    label: "Penyakit Kronis / Spesialistik",
    options: [
      { value: "E11", label: "E11 — Diabetes Melitus Tipe 2" },
      { value: "I10", label: "I10 — Hipertensi Primer" },
    ],
  },
  {
    label: "Kasus Kompleks / Gawat Darurat",
    options: [
      { value: "I21", label: "I21 — Infark Miokard Akut" },
      { value: "N18", label: "N18 — Penyakit Ginjal Kronis" },
      { value: "I63", label: "I63 — Stroke Iskemik Akut" },
    ],
  },
];

// Format diagnosis untuk SearchableSelect
const diagnosisOptions = diagnosisGroups.flatMap((group) =>
  group.options.map((option) => ({
    value: option.value,
    label: option.label,
  })),
);

const hospitalTypes = [
  {
    type: "A",
    name: "Tersier",
    description: "Pelayanan subspesialistik lengkap",
  },
  {
    type: "B",
    name: "Sekunder Lanjutan",
    description: "Pelayanan spesialistik lanjutan",
  },
  {
    type: "C",
    name: "Sekunder Standar",
    description: "Pelayanan spesialis dasar",
  },
  {
    type: "D",
    name: "Sekunder Dasar",
    description: "Pelayanan medis dasar",
  },
];

const inputClass =
  "h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 pr-9 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export default function RecommendationPage() {
  const [clinics, setClinics] = useState([]);
  const [diagnoses, setDiagnoses] = useState({});

  const [selectedClinic, setSelectedClinic] = useState("");
  const [selectedIcd, setSelectedIcd] = useState("");

  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initLoading, setInitLoading] = useState(true);

  // Format fasilitas kesehatan untuk SearchableSelect
  const clinicOptions = useMemo(
    () =>
      clinics.map((clinic) => ({
        value: clinic,
        label: clinic,
      })),
    [clinics],
  );

  // Load clinic and diagnosis data without requesting recommendations
  useEffect(() => {
    let mounted = true;

    async function initData() {
      try {
        const [graphRes, diagRes] = await Promise.all([
          fetch("/api/graph"),
          fetch("/api/diagnoses"),
        ]);

        if (!graphRes.ok) {
          throw new Error("Gagal memuat fasilitas kesehatan.");
        }

        if (!diagRes.ok) {
          throw new Error("Gagal memuat data diagnosis.");
        }

        const [gData, dData] = await Promise.all([
          graphRes.json(),
          diagRes.json(),
        ]);

        if (!mounted) return;

        const fktpNodes = (gData.nodes || [])
          .filter((n) => n.data?.node_type === "FKTP")
          .map((n) => n.data?.id || n.data?.label)
          .filter(Boolean);

        setClinics(fktpNodes);
        setDiagnoses(dData);
      } catch (err) {
        if (mounted) {
          setError(
            err.message || "Gagal memuat data. Silakan muat ulang halaman.",
          );
        }
      } finally {
        if (mounted) setInitLoading(false);
      }
    }

    initData();

    return () => {
      mounted = false;
    };
  }, []);

  // Clear previous results when parameters change
  const handleClinicChange = (value) => {
    setSelectedClinic(value);
    setRecommendations(null);
    setError(null);
  };

  const handleDiagnosisChange = (value) => {
    setSelectedIcd(value);
    setRecommendations(null);
    setError(null);
  };

  // Request recommendation only after button click
  const handleGetRecommendation = async () => {
    if (!selectedClinic || !selectedIcd || loading) return;

    setLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      const res = await fetch(
        `/api/recommend?clinic=${encodeURIComponent(
          selectedClinic,
        )}&icd=${encodeURIComponent(selectedIcd)}`,
      );

      if (!res.ok) {
        throw new Error("Gagal mengambil rekomendasi rumah sakit.");
      }

      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan pada sistem rekomendasi.");
    } finally {
      setLoading(false);
    }
  };

  const diagInfo =
    recommendations?.diagnosis_info || diagnoses[selectedIcd] || {};

  const resultList = recommendations?.recommendations || [];

  const getSeverityStyle = (severity) => {
    if (severity === "Ringan") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (severity === "Sedang") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-rose-200 bg-rose-50 text-rose-700";
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      {/* PAGE HEADER */}
      <section className="flex flex-col items-center px-4 pb-2 pt-3 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
            REKOMENDASI RUJUKAN BERBASIS AI
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Rekomendasi Rumah Sakit
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Temukan rumah sakit rujukan yang sesuai berdasarkan diagnosis pasien,
          jenjang pelayanan, dan aksesibilitas lokasi.
        </p>
      </section>

      {/* HOSPITAL CLASSIFICATION */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Building2 size={17} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Jenjang Pelayanan Rumah Sakit
              </h2>
              <p className="text-xs text-slate-500">
                Referensi klasifikasi rumah sakit berdasarkan tingkat pelayanan.
              </p>
            </div>
          </div>

          <span className="hidden text-xs text-slate-400 sm:block">
            4 Klasifikasi
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4 sm:gap-3 sm:p-4">
          {hospitalTypes.map((hospital) => (
            <div
              key={hospital.type}
              className="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:bg-slate-50/70"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-medium tracking-wide text-slate-400">
                  RUMAH SAKIT
                </span>

                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                  {hospital.type}
                </span>
              </div>

              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Tipe {hospital.type}
              </h3>

              <p className="mt-0.5 text-xs font-medium text-blue-700">
                {hospital.name}
              </p>

              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                {hospital.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5">
          <Info size={13} className="mt-0.5 shrink-0 text-slate-400" />

          <p className="text-[11px] leading-relaxed text-slate-500">
            Klasifikasi ini menjadi referensi untuk memahami jenjang pelayanan
            dan kesesuaian rumah sakit dengan kebutuhan pasien.
          </p>
        </div>
      </section>

      {/* RECOMMENDATION PARAMETERS */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <ClipboardList size={17} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Parameter Rekomendasi
            </h2>
            <p className="text-xs text-slate-500">
              Pilih fasilitas asal dan diagnosis pasien.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-12 md:items-end">
          {/* ORIGIN FACILITY */}
          <div className="space-y-1.5 md:col-span-5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Building2 size={15} className="text-slate-500" />
              Fasilitas Kesehatan Asal
            </label>

            <SearchableSelect
              options={clinicOptions}
              value={selectedClinic}
              onChange={handleClinicChange}
              placeholder="Pilih fasilitas kesehatan"
              searchPlaceholder="Cari nama Puskesmas, Klinik..."
              disabled={initLoading || clinics.length === 0}
            />
          </div>

          {/* DIAGNOSIS */}
          <div className="space-y-1.5 md:col-span-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Stethoscope size={15} className="text-slate-500" />
              Diagnosis Pasien (ICD-10)
            </label>

            <SearchableSelect
              options={diagnosisOptions}
              value={selectedIcd}
              onChange={handleDiagnosisChange}
              placeholder="Pilih diagnosis pasien"
              searchPlaceholder="Cari kode ICD-10 atau nama penyakit..."
            />
          </div>

          {/* SEARCH BUTTON */}
          <div className="md:col-span-3">
            <button
              type="button"
              onClick={handleGetRecommendation}
              disabled={loading || !selectedClinic || !selectedIcd}
              className="
                group flex h-11 w-full items-center justify-center gap-2
                rounded-lg border border-blue-700
                !bg-blue-700 px-4
                text-sm font-semibold !text-white
                shadow-sm shadow-blue-700/10
                transition-all duration-200
                hover:!bg-blue-800 hover:border-blue-800
                hover:shadow-md hover:shadow-blue-700/20
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:!border-slate-200
                disabled:!bg-slate-100
                disabled:!text-slate-400
                disabled:shadow-none
                disabled:hover:!bg-slate-100
              "
            >
              {loading ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Sparkles
                    size={16}
                    className="transition-transform duration-200 group-hover:rotate-12"
                  />
                  Cari Rekomendasi
                </>
              )}
            </button>
          </div>
        </div>

        {/* FORM HINT */}
        {!selectedClinic || !selectedIcd ? (
          <div className="border-t border-slate-100 px-4 py-2.5 sm:px-5">
            <p className="flex items-center gap-2 text-[11px] text-slate-400">
              <Info size={13} />
              Lengkapi kedua parameter untuk memulai analisis.
            </p>
          </div>
        ) : null}
      </section>

      {/* DIAGNOSIS INFORMATION */}
      {diagInfo.name && (
        <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  ICD-10 · {selectedIcd}
                </span>

                <h3 className="text-sm font-semibold text-slate-900">
                  {diagInfo.name}
                </h3>

                {diagInfo.severity && (
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getSeverityStyle(
                      diagInfo.severity,
                    )}`}
                  >
                    {diagInfo.severity}
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed text-slate-500">
                Kategori:{" "}
                <span className="font-medium text-slate-700">
                  {diagInfo.category || "-"}
                </span>
                <span className="mx-2 text-slate-300">|</span>
                Fasilitas yang diperlukan:{" "}
                <span className="font-medium text-slate-700">
                  {diagInfo.required_facility || "-"}
                </span>
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 sm:min-w-[150px]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Jenjang Pelayanan
              </p>

              <p className="mt-1 text-sm font-bold text-blue-700">
                {(diagInfo.preferred_tiers || []).join(" / ") || "-"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-600" />

          <div>
            <p className="text-sm font-semibold text-rose-800">
              Rekomendasi tidak dapat diproses
            </p>

            <p className="mt-1 text-xs text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* RESULTS */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Hasil Rekomendasi
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Alternatif rumah sakit berdasarkan hasil analisis sistem.
            </p>
          </div>

          {recommendations && (
            <span className="text-xs text-slate-500">
              {resultList.length} rumah sakit ditemukan
            </span>
          )}
        </div>

        {/* INITIAL EMPTY STATE */}
        {!loading && !error && !recommendations && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Hospital size={24} />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-800">
              Belum ada hasil rekomendasi
            </p>

            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              Pilih fasilitas kesehatan asal dan diagnosis pasien, kemudian klik
              Cari Rekomendasi untuk memulai analisis.
            </p>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
            <LoaderCircle size={30} className="animate-spin text-blue-600" />

            <p className="mt-4 text-sm font-semibold text-slate-800">
              Sedang menganalisis rumah sakit
            </p>

            <p className="mt-1 px-4 text-center text-xs text-slate-500">
              Memproses kesesuaian diagnosis, jenjang, dan aksesibilitas.
            </p>
          </div>
        )}

        {/* NO RESULT */}
        {!loading && !error && recommendations && resultList.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white py-12 text-center">
            <Hospital size={28} className="mx-auto text-slate-400" />

            <p className="mt-3 text-sm font-semibold text-slate-800">
              Tidak ada rekomendasi tersedia
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Belum ditemukan rumah sakit yang sesuai dengan parameter.
            </p>
          </div>
        )}

        {/* RECOMMENDATION CARDS */}
        {!loading && !error && resultList.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resultList.slice(0, 3).map((rs, idx) => {
              const isFirst = idx === 0;

              const score = Math.min(
                100,
                Math.max(0, Number(rs.match_score) || 0),
              );

              return (
                <article
                  key={rs.hospital_name}
                  className={`flex flex-col rounded-xl border bg-white p-5 transition hover:border-slate-300 hover:shadow-md ${
                    isFirst
                      ? "border-blue-300 shadow-sm"
                      : "border-slate-200 shadow-sm"
                  }`}
                >
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Hospital size={18} />
                      </div>

                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          {isFirst
                            ? "Rekomendasi utama"
                            : `Alternatif ${idx + 1}`}
                        </p>

                        <p className="text-xs font-semibold text-slate-700">
                          {rs.rank_badge}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold tracking-tight text-slate-900">
                        {rs.match_score}%
                      </p>

                      <p className="text-[10px] text-slate-500">
                        Skor kecocokan
                      </p>
                    </div>
                  </div>

                  {/* SCORE BAR */}
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        isFirst ? "bg-blue-600" : "bg-slate-400"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>

                  {/* HOSPITAL INFORMATION */}
                  <div className="mt-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {rs.hospital_name}
                      </h3>

                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
                        {rs.tier}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">{rs.role}</p>
                  </div>

                  {/* TRAVEL METRICS */}
                  <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock3 size={14} />
                        Waktu tempuh
                      </div>

                      <p className="mt-1 text-base font-bold text-slate-900">
                        {rs.travel_time_minutes} menit
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={14} />
                        Jarak jalan
                      </div>

                      <p className="mt-1 text-base font-bold text-slate-900">
                        {rs.real_distance_km} km
                      </p>
                    </div>
                  </div>

                  {/* REASONS */}
                  <div className="mt-5 flex-1 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-blue-600" />

                      <h4 className="text-xs font-semibold text-slate-800">
                        Dasar Rekomendasi
                      </h4>
                    </div>

                    <ul className="mt-3 space-y-2">
                      {(rs.reasons || []).map((reason, rIdx) => {
                        const warning = reason.includes("⚠️");

                        return (
                          <li
                            key={rIdx}
                            className="flex items-start gap-2 text-xs leading-relaxed text-slate-600"
                          >
                            {warning ? (
                              <AlertTriangle
                                size={14}
                                className="mt-0.5 shrink-0 text-amber-500"
                              />
                            ) : (
                              <CheckCircle2
                                size={14}
                                className="mt-0.5 shrink-0 text-emerald-600"
                              />
                            )}

                            <span>{reason}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* FACILITY INFORMATION */}
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex items-start gap-2">
                      <BedDouble
                        size={15}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />

                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-slate-400">
                          Kapasitas dan layanan
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-slate-700">
                          {rs.bed_capacity || "-"}
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {(rs.key_facilities || []).join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* DISCLAIMER */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-slate-500" />

        <p className="text-xs leading-relaxed text-slate-600">
          Hasil rekomendasi merupakan informasi pendukung keputusan rujukan.
          Penentuan rumah sakit tetap perlu mempertimbangkan kondisi klinis
          pasien, kebutuhan pelayanan medis, dan ketersediaan layanan.
        </p>
      </div>
    </div>
  );
}
