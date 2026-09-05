import { Network } from "lucide-react";

import { getFacilityRisk } from "../../services/facilityService";

function normalizeNode(node) {
  if (node?.data) {
    return {
      ...node.data,
      ...(node.position || {}),
    };
  }

  return node || {};
}

export default function FacilityCard({
  facility,
  anomalies = [],
  selected = false,
  onSelect,
}) {
  const normalized = normalizeNode(facility);

  const name =
    normalized?.name ?? normalized?.label ?? normalized?.id ?? "Fasilitas";

  const type = String(
    normalized?.type ?? normalized?.facility_type ?? "FKTP",
  ).toUpperCase();

  /*
   * Tetap hitung risk karena dipakai
   * untuk sorting / kebutuhan data,
   * tetapi tidak ditampilkan di card.
   */

  getFacilityRisk(normalized, anomalies);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(normalized)}
      className={[
        "group w-full rounded-2xl border bg-white p-5 text-left",
        "shadow-[0_2px_8px_rgba(15,23,42,0.08)]",
        "transition duration-150",
        "hover:-translate-y-[1px]",
        "hover:shadow-[0_4px_12px_rgba(15,23,42,0.10)]",
        selected
          ? "border-[#11C5E8] ring-1 ring-[#11C5E8]/20"
          : "border-[#D9E2EC]",
      ].join(" ")}
    >
      {/* ======================================================
          TYPE BADGE
          ====================================================== */}

      <div className="flex items-center justify-between">
        <span className="inline-flex rounded-full bg-[#F1F5F9] px-3 py-1 text-[11px] font-bold tracking-wide text-[#60758D]">
          {type}
        </span>
      </div>

      {/* ======================================================
          NAME
          ====================================================== */}

      <h3 className="mt-4 min-h-[24px] truncate text-[17px] font-bold text-[#102A43]">
        {name}
      </h3>

      {/* ======================================================
          LINK
          ====================================================== */}

      <div className="mt-4 flex items-center gap-2 text-[13px] text-[#60758D] transition group-hover:text-[#154B90]">
        <Network className="h-4 w-4 shrink-0 text-[#60758D] transition group-hover:text-[#154B90]" />

        <span>Lihat ringkasan rujukan</span>
      </div>
    </button>
  );
}
