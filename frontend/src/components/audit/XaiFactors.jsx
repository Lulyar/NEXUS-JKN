function Factor({ label, value, description }) {
  const numeric = Number(value) || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-300">{label}</p>

          {description && (
            <p className="text-[11px] text-slate-600">{description}</p>
          )}
        </div>

        <span className="text-xs font-bold text-white">
          {numeric.toFixed(1)}%
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{
            width: `${Math.min(numeric, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function XaiFactors({ metrics = {} }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-white">Faktor Penjelas</h3>

        <p className="mt-1 text-xs text-slate-500">
          Faktor yang berkontribusi terhadap nilai risiko.
        </p>
      </div>

      <div className="space-y-5">
        <Factor
          label="Konsentrasi Rujukan"
          value={metrics.concentration ?? metrics.concentration_ratio ?? 0}
        />

        <Factor
          label="Diagnosis Ringan"
          value={metrics.mild_ratio ?? metrics.diagnosis_light_ratio ?? 0}
        />

        <Factor
          label="Anomali Jarak"
          value={metrics.distance_anomaly ?? metrics.distance_score ?? 0}
        />

        <Factor
          label="Lonjakan Volume"
          value={metrics.volume_spike ?? metrics.volume_score ?? 0}
        />
      </div>
    </div>
  );
}
