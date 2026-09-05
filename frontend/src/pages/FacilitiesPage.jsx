import { useEffect, useMemo } from "react";

import { Building2 } from "lucide-react";

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

  /*
   * ==========================================================
   * FACILITIES
   * ==========================================================
   */

  const facilities = useMemo(() => {
    return (graph?.nodes ?? graph?.elements?.nodes ?? [])
      .map(normalizeNode)
      .filter((node) => getNodeId(node) || getNodeName(node));
  }, [graph]);

  /*
   * ==========================================================
   * SORT BY RISK
   * ==========================================================
   */

  const sortedFacilities = useMemo(() => {
    return [...facilities].sort(
      (a, b) => getFacilityRisk(b, anomalies) - getFacilityRisk(a, anomalies),
    );
  }, [facilities, anomalies]);

  /*
   * ==========================================================
   * SELECT FACILITY FROM MAP
   * ==========================================================
   *
   * Ketika user klik marker FKTP/FKRTL pada map,
   * App mengirim facilityFromMap ke halaman ini.
   *
   * Kita cari node asli dari graph supaya FacilityDetail
   * mendapatkan object fasilitas yang lengkap.
   */

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

  /*
   * ==========================================================
   * CLEAR MAP SELECTION
   * ==========================================================
   */

  useEffect(() => {
    if (
      selectedFacility &&
      facilityFromMap &&
      isSameFacility(selectedFacility, facilityFromMap)
    ) {
      onClearFacilityFromMap?.();
    }
  }, [selectedFacility, facilityFromMap, onClearFacilityFromMap]);

  return (
    <div className="space-y-5">
      {/* ========================================================
          ERROR
          ======================================================== */}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-semibold text-red-300">
            Gagal memuat data faskes
          </p>

          <p className="mt-1 text-xs text-red-300/70">{error}</p>
        </div>
      )}

      {/* ========================================================
          LOADING
          ======================================================== */}

      {loading && facilities.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
          <p className="text-sm text-slate-500">Memuat data fasilitas...</p>
        </div>
      )}

      {/* ========================================================
          EMPTY
          ======================================================== */}

      {!loading && sortedFacilities.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-700" />

          <p className="mt-3 text-sm text-slate-500">
            Belum ada data fasilitas.
          </p>
        </div>
      )}

      {/* ========================================================
          MAIN FACILITY LAYOUT
          ======================================================== */}

      {sortedFacilities.length > 0 && (
        <div
          className="
            grid
            grid-cols-1
            gap-6
            xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.95fr)]
            xl:items-start
          "
        >
          {/* ====================================================
              LEFT — FACILITY LIST
              ==================================================== */}

          <section className="min-w-0">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sortedFacilities.map((facility, index) => (
                <FacilityCard
                  key={
                    getNodeId(facility) || `${getNodeName(facility)}-${index}`
                  }
                  facility={facility}
                  anomalies={anomalies}
                  onSelect={setSelectedFacility}
                />
              ))}
            </div>
          </section>

          {/* ====================================================
              RIGHT — FACILITY DETAIL
              ==================================================== */}

          <aside className="min-w-0">
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
    </div>
  );
}
