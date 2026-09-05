import { getRiskClass, getRiskLabel } from "../../utils/risk";

export default function RiskScore({ score }) {
  const numericScore = Number(score) || 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Nilai Risiko
          </p>

          <div className="mt-2 flex items-end gap-2">
            <span className="text-5xl font-bold text-white">
              {numericScore}
            </span>

            <span className="mb-1 text-sm text-slate-500">/ 100</span>
          </div>
        </div>

        <div
          className={[
            "rounded-lg border px-3 py-2 text-xs font-bold",
            getRiskClass(numericScore),
          ].join(" ")}
        >
          {getRiskLabel(numericScore)}
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-current transition-all"
          style={{
            width: `${Math.min(numericScore, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
