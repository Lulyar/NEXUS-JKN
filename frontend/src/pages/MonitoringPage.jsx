import { useMemo } from "react";

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

function getNodeId(node) {
  if (node && typeof node === "object") {
    return String(node.id ?? node.name ?? node.label ?? "");
  }

  return String(node ?? "");
}

function getNodeName(node) {
  if (node && typeof node === "object") {
    return String(node.name ?? node.label ?? node.id ?? "");
  }

  return String(node ?? "");
}

function getEdgeSource(edge) {
  return edge?.source ?? edge?.from ?? edge?.source_id ?? edge?.sourceId;
}

function getEdgeTarget(edge) {
  return edge?.target ?? edge?.to ?? edge?.target_id ?? edge?.targetId;
}

function getRouteKey(source, target) {
  return `${getNodeId(source)}|||${getNodeId(target)}`;
}

function matchesSearch(edge, query, nodes) {
  if (!query.trim()) {
    return true;
  }

  const keyword = query.toLowerCase();

  const source = getEdgeSource(edge);
  const target = getEdgeTarget(edge);

  const sourceNode = nodes.find(
    (node) => getNodeId(node) === getNodeId(source),
  );

  const targetNode = nodes.find(
    (node) => getNodeId(node) === getNodeId(target),
  );

  const searchableText = [
    getNodeId(source),
    getNodeName(source),
    getNodeName(sourceNode),
    getNodeId(target),
    getNodeName(target),
    getNodeName(targetNode),
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(keyword);
}

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

  const nodes = useMemo(
    () => graph?.nodes ?? graph?.elements?.nodes ?? [],
    [graph],
  );

  const edges = useMemo(
    () => graph?.edges ?? graph?.links ?? graph?.elements?.edges ?? [],
    [graph],
  );

  // ==========================================================
  // NORMALIZE ANOMALY ROUTES
  // ==========================================================

  const anomalyRouteKeys = useMemo(() => {
    const routes = new Set();

    anomalies.forEach((item) => {
      const source = getEdgeSource(item);
      const target = getEdgeTarget(item);

      if (source == null || target == null) {
        return;
      }

      routes.add(getRouteKey(source, target));
    });

    return routes;
  }, [anomalies]);

  // ==========================================================
  // FILTER MAP RELATIONS
  // ==========================================================

  const visibleGraph = useMemo(() => {
    const filteredEdges = edges.filter((edge) => {
      const source = getEdgeSource(edge);
      const target = getEdgeTarget(edge);

      const isPriority = anomalyRouteKeys.has(getRouteKey(source, target));

      if (riskFilter === "anomaly" && !isPriority) {
        return false;
      }

      if (riskFilter === "normal" && isPriority) {
        return false;
      }

      return matchesSearch(edge, query, nodes);
    });

    const visibleNodeIds = new Set();

    filteredEdges.forEach((edge) => {
      visibleNodeIds.add(getNodeId(getEdgeSource(edge)));
      visibleNodeIds.add(getNodeId(getEdgeTarget(edge)));
    });

    const filteredNodes = nodes.filter((node) => {
      if (!query.trim() && riskFilter === "all") {
        return true;
      }

      return visibleNodeIds.has(getNodeId(node));
    });

    return {
      ...graph,
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }, [graph, nodes, edges, anomalyRouteKeys, riskFilter, query]);

  // Only show anomalies associated with visible routes.
  const visibleAnomalies = useMemo(() => {
    return anomalies.filter((item) => {
      const source = getEdgeSource(item);
      const target = getEdgeTarget(item);

      if (source == null || target == null) {
        return false;
      }

      const routeKey = getRouteKey(source, target);

      if (riskFilter === "normal") {
        return false;
      }

      if (riskFilter === "anomaly" && !anomalyRouteKeys.has(routeKey)) {
        return false;
      }

      return visibleGraph.edges.some(
        (edge) =>
          getRouteKey(getEdgeSource(edge), getEdgeTarget(edge)) === routeKey,
      );
    });
  }, [anomalies, riskFilter, anomalyRouteKeys, visibleGraph.edges]);

  // ==========================================================
  // SELECT FACILITY FROM MAP
  // ==========================================================

  const handleFacilitySelect = (facility) => {
    setSelectedFacility(facility);
    onFacilityFromMap?.(facility);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    // FIX 1: min-h-0 hanya di desktop. Di mobile, konten mengalir
    // natural (tinggi mengikuti isi) dan halaman bisa di-scroll.
    <div className="flex flex-1 flex-col gap-3 lg:min-h-0">
      {/* TOOLBAR */}

      <MonitoringToolbar
        query={query}
        onQueryChange={setQuery}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
      />

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />

            <div>
              <p className="text-sm font-semibold text-red-700">
                Gagal memuat data
              </p>

              <p className="mt-1 text-xs text-red-600">
                {typeof error === "string"
                  ? error
                  : error?.message || "Data tidak dapat dimuat."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STATISTICS */}

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

      {/* MAP */}

      {/*
        FIX 2: `shrink-0` di mobile agar section tidak diciutkan flexbox
        menjadi tinggi 0 (overflow-hidden membuat min-height auto = 0).
        Di desktop (lg) kembali `shrink` + flex-1 agar mengisi sisa layar.
      */}
      <section className="shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white lg:flex lg:min-h-0 lg:flex-1 lg:shrink lg:flex-col">
        {/*
          FIX 3: tinggi eksplisit di mobile, `relative` sebagai anchor
          untuk root peta (jika ReferralMap memakai absolute/h-full).
        */}
        <div className="relative h-[420px] min-h-[420px] w-full shrink-0 sm:h-[520px] sm:min-h-[520px] lg:h-auto lg:min-h-0 lg:flex-1">
          <ReferralMap
            graph={visibleGraph}
            anomalies={visibleAnomalies}
            query={query}
            onEdgeSelect={setSelectedAudit}
            onFacilitySelect={handleFacilitySelect}
          />
        </div>

        <div className="border-t border-slate-200 px-4 py-3 sm:px-5">
          <p className="text-xs text-slate-500">
            {riskFilter === "anomaly"
              ? "Menampilkan relasi prioritas review."
              : riskFilter === "normal"
                ? "Menampilkan relasi normal yang tidak teridentifikasi sebagai anomali."
                : "Menampilkan seluruh relasi rujukan."}
          </p>
        </div>
      </section>

      {/* FACILITY DETAIL */}

      {selectedFacility && (
        <FacilityDetail
          facility={selectedFacility}
          graph={graph}
          anomalies={anomalies}
        />
      )}

      {/* AUDIT PANEL */}

      {selectedAudit && (
        <AuditPanel
          source={selectedAudit.source}
          target={selectedAudit.target}
          startDate={dateFilter.appliedStartDate}
          endDate={dateFilter.appliedEndDate}
          onClose={() => setSelectedAudit(null)}
        />
      )}

      {/* DATE FILTER */}

      <DateFilter
        open={dateFilter.isOpen}
        startDate={dateFilter.startDate}
        endDate={dateFilter.endDate}
        onStartDateChange={dateFilter.setStartDate}
        onEndDateChange={dateFilter.setEndDate}
        onApply={dateFilter.applyFilter}
        onReset={dateFilter.resetFilter}
        onClose={dateFilter.close}
      />
    </div>
  );
}
