import { apiFetch, buildQuery } from "./api";

export async function getDashboardData({
  startDate = null,
  endDate = null,
} = {}) {
  const query = buildQuery({
    startDate,
    endDate,
  });

  const [stats, graph, anomalyResponse] = await Promise.all([
    apiFetch(`/api/stats${query}`),
    apiFetch(`/api/graph${query}`),
    apiFetch(`/api/anomalies${query}`),
  ]);

  return {
    stats: normalizeStats(stats),
    graph: normalizeGraph(graph),
    anomalies: anomalyResponse?.anomalies || [],
  };
}

function normalizeStats(stats) {
  if (!stats) {
    return null;
  }

  return {
    ...stats,
    total_rujukan: stats.total_rujukan ?? stats.total_transaksi ?? 0,
  };
}

function normalizeGraph(graph) {
  const rawNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const rawEdges = Array.isArray(graph?.edges) ? graph.edges : [];

  const typeIndexes = { FKTP: 0, FKRTL: 0 };

  const nodes = rawNodes.map((rawNode) => {
    const node = rawNode?.data || rawNode || {};
    const type = String(node.type || node.node_type || "").toUpperCase();
    const nodeType = type === "FKRTL" ? "FKRTL" : "FKTP";
    const index = typeIndexes[nodeType]++;
    const fallbackCoordinates = getFallbackCoordinates(nodeType, index);

    return {
      ...node,
      id: node.id ?? node.name ?? node.label,
      name: node.name ?? node.label ?? node.id,
      type: node.type ?? node.node_type ?? nodeType,
      lat: node.lat ?? node.latitude ?? fallbackCoordinates[0],
      lng: node.lng ?? node.longitude ?? fallbackCoordinates[1],
    };
  });

  const edges = rawEdges.map((rawEdge) => {
    const edge = rawEdge?.data || rawEdge || {};

    return {
      ...edge,
      source: edge.source ?? edge.from,
      target: edge.target ?? edge.to,
      count: edge.count ?? edge.referral_count ?? 0,
    };
  });

  return { nodes, edges };
}

function getFallbackCoordinates(type, index) {
  const coordinates = {
    FKTP: [
      [-6.175, 106.78],
      [-6.21, 106.8],
      [-6.16, 106.83],
      [-6.23, 106.79],
      [-6.19, 106.86],
      [-6.14, 106.84],
      [-6.25, 106.82],
      [-6.12, 106.76],
      [-6.2, 106.75],
      [-6.28, 106.85],
    ],
    FKRTL: [
      [-6.2, 106.82],
      [-6.18, 106.87],
      [-6.23, 106.84],
      [-6.16, 106.79],
      [-6.27, 106.8],
    ],
  };

  return coordinates[type]?.[index] || coordinates.FKTP[0];
}
