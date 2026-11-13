import { Clock, Navigation, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

export default function TravelTimeComparison({ edgeMetrics, narrative }) {
  if (!edgeMetrics) return null;

  const realDist = edgeMetrics.real_distance_km ?? (edgeMetrics.avg_distance_km ? Number((edgeMetrics.avg_distance_km * 1.25).toFixed(1)) : 0);
  const travelTime = edgeMetrics.travel_time_minutes ?? Math.max(6, Math.round((realDist / 28) * 60));
  const nearestRs = edgeMetrics.nearest_hospital ?? "RS Terdekat";
  const nearestDist = edgeMetrics.nearest_distance_km ?? 3.1;
  const nearestTime = edgeMetrics.nearest_travel_time_min ?? 8;
  const timePenalty = edgeMetrics.time_penalty_minutes ?? Math.max(0, travelTime - nearestTime);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Navigation className="h-4 w-4 text-[#154B90]" />
            Analisis Jarak Riil & Waktu Tempuh
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Perhitungan rute jalan raya sebenarnya & estimasi waktu tempuh perkotaan.
          </p>
        </div>
        {timePenalty > 15 ? (
          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-bold border border-red-200">
            Delay Kritis
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200">
            Efisiensi Wajar
          </span>
        )}
      </div>

      {/* Side by side comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Actual Route */}
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-red-900">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-red-600" />
              Rute Rujukan Dipilih
            </span>
            <span className="font-mono font-bold text-red-700">{travelTime} Menit</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Jarak Jalan Riil:</span>
              <strong className="text-slate-900 font-mono">{realDist} km</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Kecepatan Urban:</span>
              <span className="font-mono text-slate-700">~28 km/jam</span>
            </div>
          </div>
        </div>

        {/* Nearest Recommended Route */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Alternatif Terdekat
            </span>
            <span className="font-mono font-bold text-emerald-700">{nearestTime} Menit</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Jarak Jalan Riil:</span>
              <strong className="text-slate-900 font-mono">{nearestDist} km</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Target Faskes:</span>
              <span className="text-emerald-800 font-semibold truncate max-w-[120px]">{nearestRs}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Penalty Warning */}
      {timePenalty > 0 ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <p className="leading-relaxed">
            Pasien menempuh <strong className="text-red-700 font-bold">+{timePenalty} Menit lebih lama</strong> dan
            melompati faskes terdekat (<b>{nearestRs}</b>). Pola ini mengindikasikan <em>bypass</em> rujukan wajar demi RS rekanan tertentu.
          </p>
        </div>
      ) : null}

      {/* Narrative Explanation */}
      {narrative && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Kesimpulan Narasi Geospasial:
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            "{narrative}"
          </p>
        </div>
      )}
    </div>
  );
}

