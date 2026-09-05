import { ArrowRight, CheckCircle, AlertTriangle, X } from "lucide-react";

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

  const anomaly = data?.anomaly;
  const isAnomaly = Boolean(anomaly);

  let rawScore = isAnomaly
    ? (anomaly?.risk_score ?? anomaly?.fraud_score ?? data?.risk_score ?? data?.fraud_score ?? 0)
    : 0;

  // Convert 0..1 scale (e.g. 0.7786) to 0..100 percentage scale (e.g. 77.9)
  const score = rawScore > 0 && rawScore <= 1 ? Math.round(rawScore * 1000) / 10 : rawScore;

  const rawDist = anomaly?.detail_scores?.distance ?? anomaly?.distance_anomaly ?? 0;
  const rawVol = anomaly?.detail_scores?.volume ?? anomaly?.volume_spike ?? 0;

  const metrics = isAnomaly
    ? {
        concentration: anomaly?.concentration ?? (anomaly?.detail_scores?.concentration ? anomaly.detail_scores.concentration * 100 : 0),
        mild_ratio: anomaly?.mild_ratio ?? (anomaly?.detail_scores?.mild_diagnosis ? anomaly.detail_scores.mild_diagnosis * 100 : 0),
        distance_anomaly: rawDist > 0 && rawDist <= 1 ? rawDist * 100 : rawDist,
        volume_spike: rawVol > 0 && rawVol <= 1 ? rawVol * 100 : rawVol,
      }
    : {
        concentration: data?.edge_metrics?.concentration_pct ?? 0,
        mild_ratio: data?.edge_metrics?.mild_diagnosis_pct ?? 0,
        distance_anomaly: 0,
        volume_spike: 0,
      };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#154B90]">
                Analisis Rujukan
              </p>

              <h2 className="mt-0.5 text-lg font-bold text-slate-900">
                Panel Audit XAI
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800">
            <span className="text-slate-900">{source}</span>

            <ArrowRight className="h-4 w-4 shrink-0 text-[#154B90]" />

            <span className="text-slate-900">{target}</span>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 bg-slate-50/50 p-6">
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                Menganalisis pola rujukan...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">
                Gagal mengambil analisis
              </p>

              <p className="mt-1 text-xs text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Route Status Info Banner */}
              {isAnomaly ? (
                score >= 70 ? (
                  <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-bold text-red-900">
                        Terindikasi Sebagai Prioritas Audit Sangat Tinggi
                      </p>
                      <p className="mt-0.5 text-xs text-red-800">
                        Jalur ini terdeteksi memiliki pola anomali rujukan berisiko tinggi ({score}/100) yang memerlukan pemeriksaan prioritas.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">
                        Terindikasi Sebagai Prioritas Audit
                      </p>
                      <p className="mt-0.5 text-xs text-amber-800">
                        Jalur ini terdeteksi memiliki pola anomali rujukan ({score}/100) yang perlu ditinjau.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      Jalur Rujukan Normal
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-800">
                      Tidak ditemukan pola anomali berisiko pada jalur rujukan ini (Nilai Risiko 0/100).
                    </p>
                  </div>
                </div>
              )}

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
