import { useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, ClipboardCheck, X } from "lucide-react";

import useDashboardData from "../hooks/useDashboardData";
import { getRiskScore } from "../utils/risk";
import AuditPanel from "../components/audit/AuditPanel";
import { formatNumber } from "../utils/formatNumber";

function getSource(anomaly) {
  const value =
    anomaly?.source ?? anomaly?.source_id ?? anomaly?.sourceId ?? anomaly?.from;

  if (value && typeof value === "object") {
    return String(value.name ?? value.label ?? value.id ?? "");
  }

  return value == null ? "" : String(value);
}

function getTarget(anomaly) {
  const value =
    anomaly?.target ?? anomaly?.target_id ?? anomaly?.targetId ?? anomaly?.to;

  if (value && typeof value === "object") {
    return String(value.name ?? value.label ?? value.id ?? "");
  }

  return value == null ? "" : String(value);
}

function getRiskStyle(score) {
  if (score >= 70) {
    return "border-red-200 bg-red-50 text-red-600";
  }

  if (score >= 50) {
    return "border-orange-200 bg-orange-50 text-orange-600";
  }

  if (score >= 30) {
    return "border-amber-200 bg-amber-50 text-amber-600";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-600";
}

function getReferralCount(anomaly) {
  return Number(
    anomaly?.count ??
      anomaly?.referral_count ??
      anomaly?.total ??
      anomaly?.transaction_count ??
      0,
  );
}

export default function PriorityPage() {
  const { anomalies = [], loading, error } = useDashboardData();

  const [selectedAudit, setSelectedAudit] = useState(null);

  const sortedAnomalies = useMemo(() => {
    return [...anomalies].sort((a, b) => getRiskScore(b) - getRiskScore(a));
  }, [anomalies]);

  const handleSelectAudit = (anomaly) => {
    const source = getSource(anomaly);
    const target = getTarget(anomaly);

    if (!source || !target) {
      return;
    }

    setSelectedAudit({
      source,
      target,
      anomaly,
    });
  };

  return (
    <div className="space-y-5">
      {/* PAGE HEADER - SAMA DENGAN REKOMENDASI */}
      <section className="flex flex-col items-center px-4 pb-2 pt-3 text-center">
        <div className="mb-3 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
            PRIORITAS AUDIT
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Pola Rujukan yang Perlu Ditinjau
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Daftar pola rujukan yang diprioritaskan berdasarkan nilai risiko
          analitik.
        </p>
      </section>

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>{String(error.message ?? error)}</p>
        </div>
      )}

      {/* LOADING */}
      {loading && sortedAnomalies.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-500" />

          <p className="mt-3 text-sm text-slate-500">
            Memuat daftar prioritas audit...
          </p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && sortedAnomalies.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
          <ClipboardCheck size={34} className="mx-auto text-slate-300" />

          <h3 className="mt-3 font-semibold text-slate-700">
            Belum ada prioritas audit
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Belum ditemukan pola rujukan untuk ditampilkan.
          </p>
        </div>
      )}

      {/* AUDIT LIST */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sortedAnomalies.map((anomaly, index) => {
          const source = getSource(anomaly);
          const target = getTarget(anomaly);
          const score = getRiskScore(anomaly);
          const count = getReferralCount(anomaly);

          const isSelected =
            selectedAudit?.source === source &&
            selectedAudit?.target === target;

          return (
            <button
              key={`${source}-${target}-${index}`}
              type="button"
              onClick={() => handleSelectAudit(anomaly)}
              disabled={!source || !target}
              aria-pressed={isSelected}
              className={`
                flex min-w-0 flex-col justify-between
                rounded-xl border bg-white p-4 text-left
                transition duration-200
                hover:border-cyan-300 hover:shadow-sm
                focus:outline-none focus:ring-2
                focus:ring-cyan-500/30
                disabled:cursor-not-allowed disabled:opacity-60
                sm:p-5
                ${
                  isSelected
                    ? "border-cyan-400 ring-2 ring-cyan-100"
                    : "border-[#D9E3F0]"
                }
              `}
            >
              {/* RANK AND SCORE */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">
                  #{index + 1}
                </span>

                <span
                  className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${getRiskStyle(
                    score,
                  )}`}
                >
                  {score.toFixed(2)}/100
                </span>
              </div>

              {/* REFERRAL ROUTE */}
              <div className="mt-4 min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium leading-relaxed text-[#17324D] sm:text-base">
                  <span className="break-words">
                    {source || "Sumber tidak tersedia"}
                  </span>

                  <ChevronRight size={17} className="shrink-0 text-cyan-500" />

                  <span className="break-words">
                    {target || "Tujuan tidak tersedia"}
                  </span>
                </div>

                {/* REFERRAL COUNT */}
                <p className="mt-2 text-sm text-[#64748B]">
                  {formatNumber(count)} transaksi rujukan
                </p>
              </div>

              {/* STATUS AND DETAIL */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2 text-xs text-amber-500 sm:text-sm">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>Perlu pemeriksaan</span>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-cyan-600">
                  {isSelected ? "Detail dipilih" : "Lihat detail"}

                  <ChevronRight size={14} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* AUDIT DETAIL */}
      {selectedAudit && (
        <section
          className="scroll-mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          aria-label="Detail audit"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">
                Detail Audit
              </p>

              <h3 className="mt-1 text-base font-bold text-[#17324D]">
                Pemeriksaan Pola Rujukan
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setSelectedAudit(null)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Tutup detail audit"
              title="Tutup detail"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 sm:p-5">
            <AuditPanel
              key={`${selectedAudit.source}-${selectedAudit.target}`}
              source={selectedAudit.source}
              target={selectedAudit.target}
              onClose={() => setSelectedAudit(null)}
            />
          </div>
        </section>
      )}
    </div>
  );
}
