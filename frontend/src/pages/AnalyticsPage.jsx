import {
  Activity,
  BarChart3,
  Building2,
  Network,
  Route,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import useDashboardData from "../hooks/useDashboardData";

import { formatNumber } from "../utils/formatNumber";

/*
|--------------------------------------------------------------------------
| NORMALIZE NODE
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

/*
|--------------------------------------------------------------------------
| NORMALIZE EDGE
|--------------------------------------------------------------------------
*/

function normalizeEdge(edge) {
  if (edge?.data) {
    return {
      ...edge.data,
    };
  }

  return edge || {};
}

/*
|--------------------------------------------------------------------------
| NODE HELPERS
|--------------------------------------------------------------------------
*/

function getNodeId(node) {
  return String(node?.id ?? node?.name ?? node?.label ?? "");
}

function getNodeName(node) {
  return node?.name ?? node?.label ?? node?.id ?? "Fasilitas";
}

/*
|--------------------------------------------------------------------------
| EDGE HELPERS
|--------------------------------------------------------------------------
*/

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
| RISK
|--------------------------------------------------------------------------
*/

function getRiskScore(anomaly) {
  const value = Number(
    anomaly?.risk_score ?? anomaly?.fraud_score ?? anomaly?.score ?? 0,
  );

  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value >= 0 && value <= 1) {
    return value * 100;
  }

  return value;
}

/*
|--------------------------------------------------------------------------
| DIAGNOSIS
|--------------------------------------------------------------------------
*/

function extractDiagnosis(edge) {
  const breakdown =
    edge?.icd_breakdown ??
    edge?.diagnosis_breakdown ??
    edge?.diagnoses ??
    edge?.icd ??
    null;

  if (!breakdown) {
    return [];
  }

  if (Array.isArray(breakdown)) {
    return breakdown
      .map((item) => {
        if (typeof item === "string") {
          return {
            name: item,
            count: 1,
          };
        }

        return {
          name: item?.icd ?? item?.code ?? item?.name ?? "Tidak diketahui",
          count: Number(item?.count ?? item?.total ?? item?.value ?? 0),
        };
      })
      .filter((item) => item.count > 0);
  }

  if (typeof breakdown === "object") {
    return Object.entries(breakdown)
      .map(([name, value]) => ({
        name,
        count: Number(
          typeof value === "object"
            ? (value?.count ?? value?.total ?? value?.value ?? 0)
            : value,
        ),
      }))
      .filter((item) => item.count > 0);
  }

  return [];
}

/*
|--------------------------------------------------------------------------
| RISK LABEL
|--------------------------------------------------------------------------
*/

function getRiskLabel(score) {
  if (score >= 70) {
    return "Sangat Tinggi";
  }

  if (score >= 50) {
    return "Tinggi";
  }

  if (score >= 30) {
    return "Sedang";
  }

  return "Rendah";
}

/*
|--------------------------------------------------------------------------
| RISK COLOR
|--------------------------------------------------------------------------
*/

function getRiskColor(score) {
  if (score >= 70) {
    return {
      text: "text-red-600",
      bar: "bg-red-500",
      bg: "bg-red-50",
      border: "border-red-100",
    };
  }

  if (score >= 50) {
    return {
      text: "text-orange-600",
      bar: "bg-orange-500",
      bg: "bg-orange-50",
      border: "border-orange-100",
    };
  }

  if (score >= 30) {
    return {
      text: "text-amber-600",
      bar: "bg-amber-500",
      bg: "bg-amber-50",
      border: "border-amber-100",
    };
  }

  return {
    text: "text-emerald-600",
    bar: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  };
}

/*
|--------------------------------------------------------------------------
| MAIN PAGE
|--------------------------------------------------------------------------
*/

export default function AnalyticsPage() {
  const { stats, graph, anomalies = [] } = useDashboardData();

  /*
   * ================================================================
   * DATA
   * ================================================================
   */

  const nodes = (graph?.nodes ?? graph?.elements?.nodes ?? []).map(
    normalizeNode,
  );

  const edges = (
    graph?.edges ??
    graph?.links ??
    graph?.elements?.edges ??
    []
  ).map(normalizeEdge);

  /*
   * ================================================================
   * TOTAL REFERRALS
   * ================================================================
   *
   * Gunakan stats jika tersedia.
   * Jika tidak, hitung dari edge.
   */

  const calculatedReferralTotal = edges.reduce(
    (total, edge) => total + getEdgeCount(edge),
    0,
  );

  const totalReferrals = Number(
    stats?.total_rujukan ?? calculatedReferralTotal ?? 0,
  );

  /*
   * ================================================================
   * FACILITY COUNTS
   * ================================================================
   */

  const facilityCount = nodes.length;

  const relationCount = edges.length;

  const priorityCount = anomalies.length;

  /*
   * ================================================================
   * RISK DISTRIBUTION
   * ================================================================
   */

  const riskDistribution = {
    veryHigh: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  anomalies.forEach((anomaly) => {
    const score = getRiskScore(anomaly);

    if (score >= 70) {
      riskDistribution.veryHigh += 1;
    } else if (score >= 50) {
      riskDistribution.high += 1;
    } else if (score >= 30) {
      riskDistribution.medium += 1;
    } else {
      riskDistribution.low += 1;
    }
  });

  /*
   * ================================================================
   * REFERRAL CONCENTRATION
   * ================================================================
   *
   * Kelompokkan jumlah rujukan berdasarkan FKRTL tujuan.
   */

  const nodeMap = new Map();

  nodes.forEach((node) => {
    const id = getNodeId(node);

    if (!id) {
      return;
    }

    nodeMap.set(String(id), node);

    if (node?.name) {
      nodeMap.set(String(node.name), node);
    }

    if (node?.label) {
      nodeMap.set(String(node.label), node);
    }
  });

  const destinationMap = new Map();

  edges.forEach((edge) => {
    const target = getEdgeTarget(edge);

    const targetNode = nodeMap.get(String(target));

    const targetType = String(targetNode?.type ?? "").toUpperCase();

    /*
     * Jika backend memberikan type,
     * fokuskan konsentrasi pada FKRTL.
     */

    if (targetNode && targetType && targetType !== "FKRTL") {
      return;
    }

    const targetName = targetNode
      ? getNodeName(targetNode)
      : String(target ?? "Tidak diketahui");

    const count = getEdgeCount(edge);

    destinationMap.set(
      targetName,
      (destinationMap.get(targetName) || 0) + count,
    );
  });

  const destinations = [...destinationMap.entries()]
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const topDestinations = destinations.slice(0, 5);

  const destinationTotal = destinations.reduce(
    (total, item) => total + item.count,
    0,
  );

  const maxDestination = Math.max(
    ...topDestinations.map((item) => item.count),
    1,
  );

  /*
   * ================================================================
   * DIAGNOSIS DISTRIBUTION
   * ================================================================
   */

  const diagnosisMap = new Map();

  edges.forEach((edge) => {
    const diagnoses = extractDiagnosis(edge);

    diagnoses.forEach((item) => {
      diagnosisMap.set(
        item.name,
        (diagnosisMap.get(item.name) || 0) + item.count,
      );
    });
  });

  const diagnoses = [...diagnosisMap.entries()]
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxDiagnosis = Math.max(...diagnoses.map((item) => item.count), 1);

  /*
   * ================================================================
   * DISTANCE ANALYSIS
   * ================================================================
   */

  const distanceValues = edges
    .map((edge) =>
      Number(
        edge?.avg_distance ?? edge?.average_distance ?? edge?.distance_avg ?? 0,
      ),
    )
    .filter((value) => Number.isFinite(value) && value > 0);

  const averageDistance =
    distanceValues.length > 0
      ? distanceValues.reduce((total, value) => total + value, 0) /
        distanceValues.length
      : 0;

  /*
   * ================================================================
   * AVERAGE REFERRALS / RELATION
   * ================================================================
   */

  const averageReferralPerRelation =
    relationCount > 0 ? totalReferrals / relationCount : 0;

  /*
   * ================================================================
   * HIGHEST RISK
   * ================================================================
   */

  const highestRisk =
    anomalies.length > 0 ? Math.max(...anomalies.map(getRiskScore)) : 0;

  /*
   * ================================================================
   * RISK FACTORS
   * ================================================================
   *
   * Bobot sesuai anomaly detector backend saat ini.
   */

  const riskFactors = [
    {
      label: "Konsentrasi rujukan",
      value: 30,
    },
    {
      label: "Rasio diagnosis ringan",
      value: 30,
    },
    {
      label: "Anomali jarak",
      value: 20,
    },
    {
      label: "Lonjakan volume",
      value: 20,
    },
  ];

  /*
   * ================================================================
   * RENDER
   * ================================================================
   */

  return (
    <div className="space-y-5">
      {/* ==========================================================
          HEADER
          ========================================================== */}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">
          Analitik
        </p>

        <h2 className="mt-1 text-xl font-bold text-[#17324D]">
          Analitik Jaringan Rujukan
        </h2>

        <p className="mt-1 text-sm text-[#64748B]">
          Ringkasan struktur, konsentrasi, dan pola risiko jaringan rujukan.
        </p>
      </div>

      {/* ==========================================================
          SUMMARY CARDS
          ========================================================== */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          icon={Route}
          label="Total Rujukan"
          value={formatNumber(totalReferrals)}
        />

        <AnalyticsCard
          icon={Building2}
          label="Fasilitas Kesehatan"
          value={formatNumber(facilityCount)}
        />

        <AnalyticsCard
          icon={Network}
          label="Relasi Rujukan"
          value={formatNumber(relationCount)}
        />

        <AnalyticsCard
          icon={ShieldAlert}
          label="Prioritas Audit"
          value={formatNumber(priorityCount)}
        />
      </div>

      {/* ==========================================================
          NETWORK OVERVIEW
          ========================================================== */}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ========================================================
            CONCENTRATION
            ======================================================== */}

        <AnalyticsPanel
          title="Konsentrasi Tujuan Rujukan"
          description="Distribusi rujukan berdasarkan fasilitas tujuan."
          icon={Network}
        >
          {topDestinations.length === 0 ? (
            <EmptyAnalytics text="Belum tersedia data tujuan rujukan." />
          ) : (
            <div className="space-y-5">
              {topDestinations.map((item, index) => {
                const width = Math.max((item.count / maxDestination) * 100, 3);

                const percentage =
                  destinationTotal > 0
                    ? ((item.count / destinationTotal) * 100).toFixed(1)
                    : "0.0";

                return (
                  <div key={`${item.name}-${index}`}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="min-w-0 truncate text-sm text-[#52677D]">
                        {item.name}
                      </span>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs font-semibold text-[#17324D]">
                          {formatNumber(item.count)}
                        </span>

                        <span className="w-12 text-right text-xs text-[#64748B]">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-[#EDF2F6]">
                      <div
                        className="h-full rounded-full bg-[#10B8D1]"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AnalyticsPanel>

        {/* ========================================================
            RISK DISTRIBUTION
            ======================================================== */}

        <AnalyticsPanel
          title="Distribusi Risk Score"
          description="Sebaran fasilitas atau relasi yang masuk hasil analitik."
          icon={BarChart3}
        >
          <div className="space-y-4">
            <RiskRow
              label="Sangat Tinggi"
              count={riskDistribution.veryHigh}
              total={anomalies.length}
              color="bg-red-500"
            />

            <RiskRow
              label="Tinggi"
              count={riskDistribution.high}
              total={anomalies.length}
              color="bg-orange-500"
            />

            <RiskRow
              label="Sedang"
              count={riskDistribution.medium}
              total={anomalies.length}
              color="bg-amber-500"
            />

            <RiskRow
              label="Rendah"
              count={riskDistribution.low}
              total={anomalies.length}
              color="bg-emerald-500"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#E5EBF1] bg-[#F7F9FB] p-4">
              <p className="text-xs text-[#64748B]">Risiko tertinggi</p>

              <p className="mt-1 font-mono text-xl font-bold text-red-600">
                {Math.round(highestRisk)}
                /100
              </p>
            </div>

            <div className="rounded-xl border border-[#E5EBF1] bg-[#F7F9FB] p-4">
              <p className="text-xs text-[#64748B]">Total terdeteksi</p>

              <p className="mt-1 font-mono text-xl font-bold text-[#17324D]">
                {formatNumber(anomalies.length)}
              </p>
            </div>
          </div>
        </AnalyticsPanel>
      </div>

      {/* ==========================================================
          SECOND ROW
          ========================================================== */}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ========================================================
            RISK FACTORS
            ======================================================== */}

        <AnalyticsPanel
          title="Faktor Pembentuk Risiko"
          description="Bobot indikator yang digunakan dalam perhitungan risiko."
          icon={ShieldAlert}
        >
          <div className="space-y-5">
            {riskFactors.map((factor) => (
              <div key={factor.label}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-[#52677D]">{factor.label}</span>

                  <span className="font-mono text-sm font-bold text-[#17324D]">
                    {factor.value}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#EDF2F6]">
                  <div
                    className="h-full rounded-full bg-[#2563B8]"
                    style={{
                      width: `${(factor.value * 100) / 30}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs leading-5 text-[#52677D]">
              Bobot indikator digunakan untuk menghasilkan nilai risiko sebagai
              bahan prioritas pemeriksaan, bukan sebagai kesimpulan pelanggaran.
            </p>
          </div>
        </AnalyticsPanel>

        {/* ========================================================
            DIAGNOSIS
            ======================================================== */}

        <AnalyticsPanel
          title="Pola Diagnosis Rujukan"
          description="Distribusi kode diagnosis yang tercatat pada relasi rujukan."
          icon={Activity}
        >
          {diagnoses.length === 0 ? (
            <EmptyAnalytics text="Data diagnosis belum tersedia pada graph." />
          ) : (
            <div className="space-y-5">
              {diagnoses.map((item, index) => {
                const width = Math.max((item.count / maxDiagnosis) * 100, 3);

                return (
                  <div key={`${item.name}-${index}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-[#52677D]">
                        {item.name}
                      </span>

                      <span className="text-xs font-bold text-[#17324D]">
                        {formatNumber(item.count)}
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-[#EDF2F6]">
                      <div
                        className="h-full rounded-full bg-[#10B8D1]"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AnalyticsPanel>
      </div>

      {/* ==========================================================
          NETWORK METRICS
          ========================================================== */}

      <AnalyticsPanel
        title="Karakteristik Jaringan"
        description="Indikator umum yang menggambarkan struktur jaringan rujukan."
        icon={TrendingUp}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricBox
            label="Rata-rata Rujukan / Relasi"
            value={formatNumber(Math.round(averageReferralPerRelation))}
          />

          <MetricBox
            label="Rata-rata Jarak"
            value={
              averageDistance > 0
                ? `${averageDistance.toFixed(1)} km`
                : "Belum tersedia"
            }
          />

          <MetricBox
            label="Tujuan Teratas"
            value={topDestinations[0]?.name ?? "Belum tersedia"}
          />
        </div>
      </AnalyticsPanel>

      {/* ==========================================================
          NOTE
          ========================================================== */}

      <div className="rounded-xl border border-[#D9E2EC] bg-white px-5 py-4">
        <p className="text-xs leading-5 text-[#64748B]">
          <span className="font-semibold text-[#17324D]">
            Catatan analitik:
          </span>{" "}
          indikator pada halaman ini digunakan untuk membantu memahami pola
          jaringan dan menentukan prioritas pemeriksaan. Nilai atau pola yang
          tinggi tidak secara otomatis menunjukkan adanya fraud atau
          pelanggaran.
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ANALYTICS CARD
|--------------------------------------------------------------------------
*/

function AnalyticsCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-[0_2px_7px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#EAF9FC] p-2.5">
          <Icon className="h-5 w-5 text-[#06AFCB]" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
            {label}
          </p>

          <p className="mt-1 font-mono text-xl font-bold text-[#17324D]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ANALYTICS PANEL
|--------------------------------------------------------------------------
*/

function AnalyticsPanel({ title, description, icon: Icon, children }) {
  return (
    <section className="rounded-xl border border-[#D9E2EC] bg-white p-5 shadow-[0_2px_7px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="rounded-lg bg-[#EAF9FC] p-2">
            <Icon className="h-4 w-4 text-[#06AFCB]" />
          </div>
        )}

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#17324D]">{title}</h3>

          <p className="mt-1 text-xs leading-5 text-[#64748B]">{description}</p>
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| RISK ROW
|--------------------------------------------------------------------------
*/

function RiskRow({ label, count, total, color }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-[#52677D]">{label}</span>

        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-[#17324D]">
            {count}
          </span>

          <span className="w-12 text-right text-xs text-[#64748B]">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#EDF2F6]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${Math.max(percentage, count > 0 ? 3 : 0)}%`,
          }}
        />
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| METRIC BOX
|--------------------------------------------------------------------------
*/

function MetricBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E5EBF1] bg-[#F7F9FB] p-4">
      <p className="text-xs text-[#64748B]">{label}</p>

      <p className="mt-2 truncate text-base font-bold text-[#17324D]">
        {value}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| EMPTY
|--------------------------------------------------------------------------
*/

function EmptyAnalytics({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FAFC] p-8 text-center">
      <p className="text-sm text-[#64748B]">{text}</p>
    </div>
  );
}
