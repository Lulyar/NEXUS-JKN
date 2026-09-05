import { AlertTriangle, Building2, ClipboardCheck, Route } from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import MonitoringToolbar from "../components/dashboard/MonitoringToolbar";
import DateFilter from "../components/dashboard/DateFilter";
import ReferralMap from "../components/map/ReferralMap";
import AuditPanel from "../components/audit/AuditPanel";
import FacilityDetail from "../components/facilities/FacilityDetail";

import useDashboardData from "../hooks/useDashboardData";
import useDateFilter from "../hooks/useDateFilter";

import { formatNumber } from "../utils/formatNumber";

export default function MonitoringPage({ onFacilityFromMap }) {
  const {
    stats,
    graph,
    anomalies,
    loading,
    error,
    query,
    setQuery,
    riskFilter,
    setRiskFilter,
    selectedFacility,
    setSelectedFacility,
    selectedAudit,
    setSelectedAudit,
    loadData,
  } = useDashboardData();

  const dateFilter = useDateFilter({
    onApply: ({ startDate, endDate }) =>
      loadData({
        startDate,
        endDate,
      }),

    onReset: () =>
      loadData({
        startDate: null,
        endDate: null,
      }),
  });

  const visibleAnomalies = anomalies.filter((item) => {
    if (riskFilter === "all") {
      return true;
    }

    const score = Number(item.risk_score ?? item.fraud_score ?? 0);

    if (riskFilter === "high") {
      return score >= 70;
    }

    if (riskFilter === "medium") {
      return score >= 40 && score < 70;
    }

    if (riskFilter === "low") {
      return score < 40;
    }

    return true;
  });

  /*
   * Ketika marker map diklik:
   *
   * - tetap set selectedFacility untuk menjaga
   *   behavior lama
   * - kirim facility ke App untuk navigasi
   */
  const handleFacilitySelect = (facility) => {
    setSelectedFacility(facility);

    onFacilityFromMap?.(facility);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* ==========================================================
          TOOLBAR
          ========================================================== */}

      <MonitoringToolbar
        query={query}
        onQueryChange={setQuery}
        riskFilter={riskFilter}
        onRiskChange={setRiskFilter}
        onReset={() => {
          dateFilter.reset();
          setQuery("");
          setRiskFilter("all");
        }}
        onOpenDateFilter={dateFilter.open}
        hasDateFilter={dateFilter.isFiltered}
        loading={loading}
      />

      {/* ==========================================================
          ERROR
          ========================================================== */}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />

            <div>
              <p className="text-sm font-semibold text-red-300">
                Gagal memuat data
              </p>

              <p className="mt-1 text-xs text-red-300/70">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          STATISTICS
          ========================================================== */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Rujukan"
          value={formatNumber(stats?.total_rujukan)}
          icon={Route}
          description="Jumlah transaksi rujukan"
          accent="cyan"
        />

        <StatCard
          label="Prioritas Audit"
          value={formatNumber(stats?.total_anomali ?? anomalies.length)}
          icon={ClipboardCheck}
          description="Pola yang perlu ditinjau"
          accent="red"
        />

        <StatCard
          label="Persentase Risiko"
          value={`${stats?.fraud_rate ?? 0}%`}
          icon={AlertTriangle}
          description="Proporsi transaksi dalam pola berisiko"
          accent="amber"
        />

        <StatCard
          label="Fasilitas Terindikasi"
          value={formatNumber(stats?.faskes_terindikasi)}
          icon={Building2}
          description="Faskes yang masuk prioritas"
          accent="red"
        />
      </section>

      {/* ==========================================================
          MAP
          ========================================================== */}

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        {/*
         * PENTING:
         *
         * Mobile:
         *   h-[420px]
         *
         * Tablet:
         *   h-[520px]
         *
         * Desktop:
         *   mengambil ruang yang tersedia.
         *
         * min-h-0 + shrink-0 memastikan map tidak
         * menghilang karena parent flex.
         */}

        <div className="h-[420px] min-h-[420px] w-full shrink-0 sm:h-[520px] sm:min-h-[520px] lg:h-auto lg:min-h-0 lg:flex-1">
          <ReferralMap
            graph={graph}
            anomalies={visibleAnomalies}
            query={query}
            onEdgeSelect={setSelectedAudit}
            onFacilitySelect={handleFacilitySelect}
          />
        </div>

        <div className="space-y-3 border-t border-slate-800 px-4 py-3 sm:px-5" />
      </section>

      {/* ==========================================================
          FACILITY DETAIL
          ========================================================== */}

      {selectedFacility && (
        <FacilityDetail
          facility={selectedFacility}
          onClose={() => setSelectedFacility(null)}
          startDate={dateFilter.appliedStartDate}
          endDate={dateFilter.appliedEndDate}
        />
      )}

      {/* ==========================================================
          AUDIT PANEL
          ========================================================== */}

      {selectedAudit && (
        <AuditPanel
          source={selectedAudit.source}
          target={selectedAudit.target}
          startDate={dateFilter.appliedStartDate}
          endDate={dateFilter.appliedEndDate}
          onClose={() => setSelectedAudit(null)}
        />
      )}

      {/* ==========================================================
          DATE FILTER
          ========================================================== */}

      <DateFilter
        open={dateFilter.isOpen}
        startDate={dateFilter.startDate}
        endDate={dateFilter.endDate}
        onStartDateChange={dateFilter.setStartDate}
        onEndDateChange={dateFilter.setEndDate}
        onApply={dateFilter.apply}
        onReset={dateFilter.reset}
        onClose={dateFilter.close}
      />
    </div>
  );
}
