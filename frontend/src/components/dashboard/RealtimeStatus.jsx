import { Radio } from "lucide-react";

export default function RealtimeStatus({
  isRealtime = true,
  lastUpdated = null,
}) {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-full border px-3 py-1.5",
        isRealtime
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50",
      ].join(" ")}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={[
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            isRealtime ? "bg-emerald-400" : "bg-amber-400",
          ].join(" ")}
        />

        <span
          className={[
            "relative inline-flex h-2 w-2 rounded-full",
            isRealtime ? "bg-emerald-500" : "bg-amber-500",
          ].join(" ")}
        />
      </span>

      <Radio
        className={[
          "h-3.5 w-3.5",
          isRealtime ? "text-emerald-600" : "text-amber-600",
        ].join(" ")}
      />

      <div>
        <p
          className={[
            "text-xs font-semibold",
            isRealtime ? "text-emerald-700" : "text-amber-700",
          ].join(" ")}
        >
          {isRealtime ? "REALTIME" : "FILTER AKTIF"}
        </p>

        {lastUpdated && (
          <p className="hidden text-[10px] text-slate-400 sm:block">
            Update {lastUpdated}
          </p>
        )}
      </div>
    </div>
  );
}
