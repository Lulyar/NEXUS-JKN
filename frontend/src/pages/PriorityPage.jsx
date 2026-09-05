import { AlertTriangle, ChevronRight } from "lucide-react";

import FacilityCard from "../components/facilities/FacilityCard";

import useDashboardData from "../hooks/useDashboardData";

import { getRiskClass, getRiskScore } from "../utils/risk";

export default function PriorityPage() {
  const { anomalies, loading } = useDashboardData();

  if (loading) {
    return <Loading />;
  }

  const sorted = [...anomalies].sort(
    (a, b) => getRiskScore(b) - getRiskScore(a),
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
          Prioritas Audit
        </p>

        <h2 className="mt-1 text-xl font-bold text-white">
          Pola Rujukan yang Perlu Ditinjau
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Daftar diprioritaskan berdasarkan nilai risiko analitik.
        </p>
      </div>

      {sorted.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-3">
          {sorted.map((item, index) => {
            const score = getRiskScore(item);

            return (
              <div
                key={`${item.source}-${item.target}-${index}`}
                className="rounded-xl border border-slate-800 bg-slate-900 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">
                        #{index + 1}
                      </span>

                      <span
                        className={[
                          "rounded-md border px-2 py-1 text-[10px] font-bold",
                          getRiskClass(score),
                        ].join(" ")}
                      >
                        {score}/100
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-white">
                        {item.source}
                      </span>

                      <ChevronRight className="h-4 w-4 text-cyan-400" />

                      <span className="font-semibold text-white">
                        {item.target}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {item.count ?? 0} transaksi rujukan
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    Perlu pemeriksaan
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
      <p className="text-sm text-slate-500">Memuat prioritas audit...</p>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
      <p className="text-sm text-slate-500">
        Belum ada pola yang masuk prioritas review.
      </p>
    </div>
  );
}
