import { Activity, Database, ShieldAlert } from "lucide-react";

import RealtimeStatus from "../dashboard/RealtimeStatus";

export default function Header({ isRealtime = true, lastUpdated = null }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10">
            <ShieldAlert className="h-5 w-5 text-blue-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-bold tracking-wide text-white sm:text-lg">
                NEXUS-JKN
              </h1>

              <span className="hidden rounded-md border border-slate-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:inline-block">
                Network Intelligence
              </span>
            </div>

            <p className="hidden text-xs text-slate-500 sm:block">
              Referral Network Intelligence & Early Warning System
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 md:flex">
            <Database className="h-4 w-4 text-slate-500" />

            <span className="text-xs text-slate-400">Sumber Data</span>

            <span className="text-xs font-semibold text-slate-200">
              Referral
            </span>
          </div>

          <RealtimeStatus isRealtime={isRealtime} lastUpdated={lastUpdated} />
        </div>
      </div>
    </header>
  );
}
