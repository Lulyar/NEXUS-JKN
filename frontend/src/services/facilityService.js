/*
|--------------------------------------------------------------------------
| FACILITY SERVICE
|--------------------------------------------------------------------------
|
| Detail faskes dihitung dari:
| - graph.nodes
| - graph.edges
| - anomalies
|
| Tidak membutuhkan endpoint tambahan.
|
|--------------------------------------------------------------------------
*/

function normalizeNode(node) {
  if (node?.data) {
    return {
      ...node.data,
      ...(node.position || {}),
    };
  }

  return node || {};
}

function normalizeEdge(edge) {
  if (edge?.data) {
    return {
      ...edge.data,
    };
  }

  return edge || {};
}

function getNodeId(node) {
  return String(node?.id ?? node?.name ?? node?.label ?? "");
}

function getNodeName(node) {
  return node?.name ?? node?.label ?? node?.id ?? "Fasilitas";
}

function getEdgeSource(edge) {
  return edge?.source ?? edge?.from ?? edge?.source_id ?? edge?.sourceId;
}

function getEdgeTarget(edge) {
  return edge?.target ?? edge?.to ?? edge?.target_id ?? edge?.targetId;
}

function getEdgeCount(edge) {
  return Number(
    edge?.count ?? edge?.referral_count ?? edge?.total ?? edge?.value ?? 0,
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE RISK SCORE
|--------------------------------------------------------------------------
|
| Backend bisa mengirim:
|
| 0.78  -> 78
| 78    -> 78
|
|--------------------------------------------------------------------------
*/

function normalizeRiskScore(value) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  if (score >= 0 && score <= 1) {
    return Math.round(score * 100);
  }

  return Math.round(score);
}

function getRiskScore(item) {
  return normalizeRiskScore(
    item?.risk_score ?? item?.fraud_score ?? item?.score ?? 0,
  );
}

function getAnomalySource(item) {
  return item?.source ?? item?.source_id ?? item?.sourceId ?? item?.from;
}

function getAnomalyTarget(item) {
  return item?.target ?? item?.target_id ?? item?.targetId ?? item?.to;
}

function matchesFacility(value, facility) {
  if (value === undefined || value === null || !facility) {
    return false;
  }

  const valueString = String(value);

  const possibleIds = [facility?.id, facility?.name, facility?.label]
    .filter((item) => item !== undefined && item !== null && item !== "")
    .map(String);

  return possibleIds.includes(valueString);
}

/*
|--------------------------------------------------------------------------
| GET FACILITY RISK
|--------------------------------------------------------------------------
*/

export function getFacilityRisk(facility, anomalies = []) {
  let highestRisk = 0;

  anomalies.forEach((item) => {
    const source = getAnomalySource(item);

    const target = getAnomalyTarget(item);

    if (
      matchesFacility(source, facility) ||
      matchesFacility(target, facility)
    ) {
      highestRisk = Math.max(highestRisk, getRiskScore(item));
    }
  });

  return highestRisk;
}

/*
|--------------------------------------------------------------------------
| BUILD FACILITY DETAIL
|--------------------------------------------------------------------------
*/

export function buildFacilityDetail(facility, graph, anomalies = []) {
  if (!facility) {
    throw new Error("Fasilitas tidak ditemukan.");
  }

  const rawNodes = graph?.nodes ?? graph?.elements?.nodes ?? [];

  const rawEdges = graph?.edges ?? graph?.links ?? graph?.elements?.edges ?? [];

  const nodes = rawNodes.map(normalizeNode);

  const edges = rawEdges.map(normalizeEdge);

  /*
   * ============================================================
   * CURRENT FACILITY
   * ============================================================
   */

  const currentFacility =
    nodes.find((node) => matchesFacility(getNodeId(node), facility)) ||
    nodes.find((node) => matchesFacility(node?.name, facility)) ||
    facility;

  const facilityId = getNodeId(currentFacility);

  const facilityName = getNodeName(currentFacility);

  const facilityType = String(
    currentFacility?.type ??
      currentFacility?.facility_type ??
      facility?.type ??
      "FKTP",
  ).toUpperCase();

  /*
   * ============================================================
   * RELATED EDGES
   * ============================================================
   */

  const relatedEdges = edges.filter((edge) => {
    const source = getEdgeSource(edge);

    const target = getEdgeTarget(edge);

    return (
      matchesFacility(source, currentFacility) ||
      matchesFacility(target, currentFacility)
    );
  });

  /*
   * ============================================================
   * FKTP
   * ============================================================
   */

  if (facilityType === "FKTP") {
    const outgoingEdges = relatedEdges.filter((edge) =>
      matchesFacility(getEdgeSource(edge), currentFacility),
    );

    const distribution = outgoingEdges
      .map((edge) => {
        const targetId = getEdgeTarget(edge);

        const target = nodes.find((node) =>
          matchesFacility(getNodeId(node), {
            id: targetId,
            name: targetId,
          }),
        );

        const targetName = target ? getNodeName(target) : String(targetId);

        return {
          name: targetName,
          count: getEdgeCount(edge),
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    const totalReferrals = distribution.reduce(
      (total, item) => total + item.count,
      0,
    );

    const destinationCount = distribution.length;

    const dominant = distribution[0] || null;

    const concentration =
      totalReferrals > 0 && dominant
        ? ((dominant.count / totalReferrals) * 100).toFixed(1)
        : "0.0";

    return {
      id: facilityId,

      name: facilityName,

      type: "FKTP",

      riskScore: getFacilityRisk(currentFacility, anomalies),

      totalReferrals,

      destinationCount,

      dominantDestination: dominant?.name || "Belum tersedia",

      concentration: Number(concentration),

      distribution,

      sourceDistribution: [],

      period: null,
    };
  }

  /*
   * ============================================================
   * FKRTL
   * ============================================================
   */

  const incomingEdges = relatedEdges.filter((edge) =>
    matchesFacility(getEdgeTarget(edge), currentFacility),
  );

  const distribution = incomingEdges
    .map((edge) => {
      const sourceId = getEdgeSource(edge);

      const source = nodes.find((node) =>
        matchesFacility(getNodeId(node), {
          id: sourceId,
          name: sourceId,
        }),
      );

      const sourceName = source ? getNodeName(source) : String(sourceId);

      return {
        name: sourceName,
        count: getEdgeCount(edge),
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalReferrals = distribution.reduce(
    (total, item) => total + item.count,
    0,
  );

  const sourceCount = distribution.length;

  const dominant = distribution[0] || null;

  const concentration =
    totalReferrals > 0 && dominant
      ? ((dominant.count / totalReferrals) * 100).toFixed(1)
      : "0.0";

  return {
    id: facilityId,

    name: facilityName,

    type: "FKRTL",

    riskScore: getFacilityRisk(currentFacility, anomalies),

    totalReferrals,

    destinationCount: sourceCount,

    dominantDestination: dominant?.name || "Belum tersedia",

    concentration: Number(concentration),

    distribution: [],

    sourceDistribution: distribution,

    period: null,
  };
}

/*
|--------------------------------------------------------------------------
| COMPATIBILITY FUNCTION
|--------------------------------------------------------------------------
*/

export async function getFacilityDetail(facility, options = {}) {
  const graph = options?.graph ?? {
    nodes: [],
    edges: [],
  };

  const anomalies = options?.anomalies ?? [];

  return buildFacilityDetail(facility, graph, anomalies);
}
