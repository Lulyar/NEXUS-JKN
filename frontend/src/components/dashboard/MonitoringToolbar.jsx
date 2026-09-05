import { Filter, Search } from "lucide-react";

export default function MonitoringToolbar({
  query = "",
  onQueryChange,
  riskFilter = "all",
  onRiskFilterChange,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* SEARCH BAR (Full Width) */}
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Cari fasilitas..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#154B90] focus:bg-white focus:ring-2 focus:ring-[#154B90]/10"
          />
        </div>

        {/* RISK FILTER (Right Aligned) */}
        <div className="flex shrink-0 items-center gap-2">
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
    </div>
  );
}
