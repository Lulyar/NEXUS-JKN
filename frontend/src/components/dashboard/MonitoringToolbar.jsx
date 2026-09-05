import { Activity, Filter, RotateCcw, Search } from "lucide-react";

export default function MonitoringToolbar({
  query = "",
  onQueryChange,
  riskFilter = "all",
  onRiskFilterChange,
  onReset,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {/* LEFT */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          {/* SEARCH */}
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={query}
              onChange={(e) => onQueryChange?.(e.target.value)}
              placeholder="Cari fasilitas..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#154B90] focus:bg-white focus:ring-2 focus:ring-[#154B90]/10"
            />
          </div>

          {/* RISK FILTER */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />

            <select
              value={riskFilter}
              onChange={(e) => onRiskFilterChange?.(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-[#154B90] focus:ring-2 focus:ring-[#154B90]/10"
            >
              <option value="all">Semua Risiko</option>
              <option value="high">Risiko Tinggi</option>
              <option value="medium">Risiko Sedang</option>
              <option value="low">Risiko Rendah</option>
            </select>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg bg-[#154B90]/5 px-3 py-2 text-xs text-[#154B90] sm:flex">
            <Activity className="h-4 w-4" />

            <span>Network monitoring aktif</span>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
