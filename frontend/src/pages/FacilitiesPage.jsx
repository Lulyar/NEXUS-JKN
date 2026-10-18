import { useEffect, useMemo } from "react";

import { Building2, X } from "lucide-react";

import FacilityCard from "../components/facilities/FacilityCard";
import FacilityDetail from "../components/facilities/FacilityDetail";

import useDashboardData from "../hooks/useDashboardData";
import { getFacilityRisk } from "../services/facilityService";

function normalizeNode(node) {
  if (node?.data) {
    return {
      ...node.data,
      ...(node.position || {}),
    };
  }

  return node || {};
}

function getNodeId(node) {
  return String(node?.id ?? node?.name ?? node?.label ?? "");
}

function getNodeName(node) {
  return node?.name ?? node?.label ?? node?.id ?? "Fasilitas";
}

function isSameFacility(first, second) {
  if (!first || !second) {
    return false;
  }

  const firstValues = [first?.id, first?.name, first?.label]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(String);

  const secondValues = [second?.id, second?.name, second?.label]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(String);

  return firstValues.some((value) => secondValues.includes(value));
}

export default function FacilitiesPage({
  facilityFromMap,
  onClearFacilityFromMap,
}) {
  const {
    graph,
    anomalies,
    loading,
    error,
    selectedFacility,
    setSelectedFacility,
  } = useDashboardData();

  // ==========================================================
  // FACILITIES
  // ==========================================================

  const facilities = useMemo(() => {
    return (graph?.nodes ?? graph?.elements?.nodes ?? [])
      .map(normalizeNode)
      .filter((node) => getNodeId(node) || getNodeName(node));
  }, [graph]);

  // ==========================================================
  // SORT BY RISK
  // ==========================================================

  const sortedFacilities = useMemo(() => {
    return [...facilities].sort(
      (a, b) => getFacilityRisk(b, anomalies) - getFacilityRisk(a, anomalies),
    );
  }, [facilities, anomalies]);

  // ==========================================================
  // SELECT FACILITY FROM MAP
  // ==========================================================

  useEffect(() => {
    if (!facilityFromMap || facilities.length === 0) {
      return;
    }

    const matchedFacility = facilities.find((facility) =>
      isSameFacility(facility, facilityFromMap),
    );

    if (matchedFacility) {
      setSelectedFacility(matchedFacility);
    }
  }, [facilityFromMap, facilities, setSelectedFacility]);

  // ==========================================================
  // CLEAR MAP SELECTION
  // ==========================================================

  useEffect(() => {
    if (
      selectedFacility &&
      facilityFromMap &&
      isSameFacility(selectedFacility, facilityFromMap)
    ) {
      onClearFacilityFromMap?.();
    }
  }, [selectedFacility, facilityFromMap, onClearFacilityFromMap]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-5">
      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-600">
            Gagal memuat data faskes
          </p>

          <p className="mt-1 text-xs text-red-500">
            {typeof error === "string"
              ? error
              : error.message || "Terjadi kesalahan saat memuat data."}
          </p>
        </div>
      )}

      {/* LOADING */}

      {loading && facilities.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-500" />

          <p className="mt-3 text-sm text-slate-500">
            Memuat data fasilitas...
          </p>
        </div>
      )}

      {/* EMPTY */}

      {!loading && sortedFacilities.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300" />

          <p className="mt-3 text-sm text-slate-500">
            Belum ada data fasilitas.
          </p>
        </div>
      )}

      {/* MAIN FACILITY LAYOUT */}

      {sortedFacilities.length > 0 && (
        <div
          className="
            grid grid-cols-1 gap-6
            xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.95fr)]
            xl:items-start
          "
        >
          {/* LEFT — FACILITY LIST */}

          <section className="min-w-0">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sortedFacilities.map((facility, index) => (
                <FacilityCard
                  key={
                    getNodeId(facility) || `${getNodeName(facility)}-${index}`
                  }
                  facility={facility}
                  anomalies={anomalies}
                  selected={isSameFacility(selectedFacility, facility)}
                  onSelect={setSelectedFacility}
                />
              ))}
            </div>
          </section>

          {/* RIGHT — FACILITY DETAIL DESKTOP */}

          <aside className="hidden min-w-0 xl:block">
            {selectedFacility ? (
              <FacilityDetail
                facility={selectedFacility}
                graph={graph}
                anomalies={anomalies}
              />
            ) : (
              <div className="sticky top-5 rounded-2xl border border-[#D9E2EC] bg-white p-8 text-center shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
                <Building2 className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-3 text-sm font-semibold text-[#52677D]">
                  Pilih faskes
                </p>

                <p className="mt-1 text-xs text-[#60758D]">
                  Klik salah satu faskes untuk melihat detail rujukan.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* MOBILE — FACILITY DETAIL MODAL */}

      {selectedFacility && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-3 py-4 xl:hidden">
          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Tutup detail faskes"
            onClick={() => setSelectedFacility(null)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
          />

          {/* MODAL */}

          <section
            role="dialog"
            aria-modal="true"
            aria-label="Detail fasilitas kesehatan"
            className="relative z-10 flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-2xl"
          >
            {/* MODAL HEADER */}

            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50">
                  <Building2 className="h-5 w-5 text-cyan-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">
                    Detail Faskes
                  </p>

                  <h2 className="mt-1 truncate text-base font-bold text-[#17324D]">
                    {getNodeName(selectedFacility)}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFacility(null)}
                aria-label="Tutup detail"
                title="Tutup detail"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
              <FacilityDetail
                facility={selectedFacility}
                graph={graph}
                anomalies={anomalies}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
