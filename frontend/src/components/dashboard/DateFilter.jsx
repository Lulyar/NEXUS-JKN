import { CalendarDays, X } from "lucide-react";

export default function DateFilter({
  open,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <CalendarDays className="h-5 w-5 text-cyan-400" />
            </div>

            <div>
              <h3 className="font-semibold text-white">
                Filter Periode Analisis
              </h3>

              <p className="text-xs text-slate-500">
                Cari pola rujukan pada periode tertentu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Dari tanggal
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sampai tanggal
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs leading-5 text-amber-300">
              Mode filter digunakan untuk meninjau data historis. Untuk kembali
              ke data realtime, gunakan tombol
              <strong> Reset</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-800 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
          >
            Kembali Realtime
          </button>

          <button
            type="button"
            onClick={onApply}
            className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
}
