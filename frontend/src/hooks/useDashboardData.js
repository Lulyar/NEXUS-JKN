import { useCallback, useEffect, useRef, useState } from "react";

import { getDashboardData } from "../services/dashboardService";

const REALTIME_INTERVAL = 5000;

export default function useDashboardData() {
  const [stats, setStats] = useState(null);

  const [graph, setGraph] = useState({
    nodes: [],
    edges: [],
  });

  const [anomalies, setAnomalies] = useState([]);

  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const [selectedFacility, setSelectedFacility] = useState(null);

  const [selectedAudit, setSelectedAudit] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState(null);

  const [endDate, setEndDate] = useState(null);

  const [lastUpdated, setLastUpdated] = useState(null);

  const requestId = useRef(0);

  const isRealtime = !startDate && !endDate;

  const loadData = useCallback(
    async ({
      startDate: nextStartDate = startDate,
      endDate: nextEndDate = endDate,
      silent = false,
    } = {}) => {
      const currentRequest = ++requestId.current;

      if (!silent) {
        setLoading(true);
      }

      setError(null);

      try {
        const data = await getDashboardData({
          startDate: nextStartDate,
          endDate: nextEndDate,
        });

        if (currentRequest !== requestId.current) {
          return;
        }

        setStats(data.stats);

        setGraph(
          data.graph || {
            nodes: [],
            edges: [],
          },
        );

        setAnomalies(data.anomalies || []);

        setStartDate(nextStartDate || null);

        setEndDate(nextEndDate || null);

        setLastUpdated(new Date());
      } catch (err) {
        console.error("NEXUS-JKN LOAD ERROR:", err);

        if (currentRequest === requestId.current) {
          setError(err.message || "Gagal mengambil data dashboard.");
        }
      } finally {
        if (!silent && currentRequest === requestId.current) {
          setLoading(false);
        }
      }
    },
    [startDate, endDate],
  );

  /*
   * Initial load.
   */
  useEffect(() => {
    loadData({
      startDate: null,
      endDate: null,
    });
  }, []);

  /*
   * Realtime polling.
   *
   * Hanya aktif jika tidak ada filter tanggal.
   */
  useEffect(() => {
    if (!isRealtime) {
      return undefined;
    }

    const interval = setInterval(() => {
      loadData({
        startDate: null,
        endDate: null,
        silent: true,
      });
    }, REALTIME_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [isRealtime, loadData]);

  /*
   * Reset selected item ketika periode berubah.
   */
  useEffect(() => {
    setSelectedFacility(null);
    setSelectedAudit(null);
  }, [startDate, endDate]);

  return {
    stats,
    graph,
    anomalies,

    query,
    setQuery,

    riskFilter,
    setRiskFilter,

    selectedFacility,
    setSelectedFacility,

    selectedAudit,
    setSelectedAudit,

    loading,
    error,

    startDate,
    endDate,

    isRealtime,
    lastUpdated,

    loadData,
  };
}
