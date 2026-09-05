import { ArrowRight, X } from "lucide-react";

import { useEffect, useState } from "react";

import RiskScore from "./RiskScore";
import XaiFactors from "./XaiFactors";
import AuditConclusion from "./AuditConclusion";

import { getAuditData } from "../../services/auditService";

export default function AuditPanel({
  source,
  target,
  startDate = null,
  endDate = null,
  onClose,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await getAuditData({
          source,
          target,
          startDate,
          endDate,
        });

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Gagal mengambil analisis audit.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (source && target) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [source, target, startDate, endDate]);

  if (!source || !target) {
    return null;
  }

  const score = data?.risk_score ?? data?.fraud_score ?? data?.score ?? 0;

  const metrics = data?.metrics ?? data?.xai ?? data?.factors ?? {};

  return (
    <div className="fixed inset-0 z-[900] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl border border-slate-700 bg-slate-900 shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                Analisis Rujukan
              </p>

              <h2 className="mt-1 text-base font-bold text-white">
                Panel Audit XAI
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3 sm:flex-row sm:items-center">
            <span className="text-xs font-medium text-slate-300">{source}</span>

            <ArrowRight className="h-4 w-4 shrink-0 text-cyan-400" />

            <span className="text-xs font-medium text-slate-300">{target}</span>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {loading && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center">
              <p className="text-sm text-slate-400">
                Menganalisis pola rujukan...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm font-semibold text-red-300">
                Gagal mengambil analisis
              </p>

              <p className="mt-1 text-xs text-red-300/70">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <RiskScore score={score} />

              <XaiFactors metrics={metrics} />

              <AuditConclusion score={score} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
