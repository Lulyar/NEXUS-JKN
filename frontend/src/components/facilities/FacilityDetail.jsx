import { Building2 } from "lucide-react";

import { buildFacilityDetail } from "../../services/facilityService";

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value || 0));
}

function getRiskClass(score) {
  if (score >= 70) {
    return "text-red-600";
  }

  if (score >= 50) {
    return "text-orange-600";
  }

  if (score >= 30) {
    return "text-amber-600";
  }

  return "text-emerald-600";
}

function DetailStat({ label, value, valueClass = "text-[#102A43]" }) {
  return (
    <div className="rounded-xl border border-[#E5EBF1] bg-[#F7F9FB] px-4 py-4">
      <p className="text-[12px] font-medium text-[#60758D]">{label}</p>

      <p
        className={[
          "mt-2 font-mono text-[21px] font-bold leading-none",
          valueClass,
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

export default function FacilityDetail({ facility, graph, anomalies = [] }) {
  if (!facility) {
    return null;
  }

  let detail;

  try {
    detail = buildFacilityDetail(facility, graph, anomalies);
  } catch (error) {
    console.error("Facility detail error:", error);

    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6">
        <p className="text-sm font-semibold text-red-600">
          Gagal menghitung detail faskes.
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {error?.message ?? "Terjadi kesalahan saat menghitung data."}
        </p>
      </div>
    );
  }

  const distribution =
    detail.type === "FKTP" ? detail.distribution : detail.sourceDistribution;

  const maxCount = Math.max(
    ...distribution.map((item) => Number(item.count || 0)),
    1,
  );

  return (
    <div className="sticky top-5 overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="px-6 pt-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ECFBFC] text-[#0891B2]">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0087B5]">
              Detail Faskes
            </p>

            <h2 className="mt-1 truncate text-[19px] font-bold text-[#102A43]">
              {detail.name}
            </h2>

            <p className="mt-1 text-[14px] text-[#60758D]">{detail.type}</p>
          </div>
        </div>
      </div>

      {/* ======================================================
          DIVIDER
          ====================================================== */}

      <div className="mx-6 mt-6 border-t border-[#E7EDF3]" />

      {/* ======================================================
          CONTENT
          ====================================================== */}

      <div className="space-y-6 p-6">
        {/* ====================================================
            STATISTICS
            ==================================================== */}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DetailStat
            label="Total Rujukan"
            value={formatNumber(detail.totalReferrals)}
          />

          <DetailStat
            label="Tujuan Rujukan"
            value={formatNumber(detail.destinationCount)}
          />

          <DetailStat
            label="Risk Score"
            value={`${detail.riskScore}/100`}
            valueClass={getRiskClass(detail.riskScore)}
          />
        </section>

        {/* ====================================================
            DOMINAN + KONSENTRASI
            ==================================================== */}

        <section className="rounded-xl bg-[#F7F9FB] px-5 py-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[14px] text-[#60758D]">Tujuan dominan</p>

              <p className="mt-2 text-[14px] font-bold text-[#102A43]">
                {detail.dominantDestination}
              </p>
            </div>

            <div>
              <p className="text-[14px] text-[#60758D]">Konsentrasi rujukan</p>

              <p className="mt-2 text-[14px] font-bold text-[#102A43]">
                {detail.concentration}%
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================
            DIVIDER
            ==================================================== */}

        <div className="border-t border-[#E7EDF3]" />

        {/* ====================================================
            DISTRIBUTION
            ==================================================== */}

        <section>
          <h3 className="text-[14px] font-bold text-[#17324D]">
            {detail.type === "FKTP"
              ? "Distribusi tujuan rujukan"
              : "Distribusi sumber rujukan"}
          </h3>

          {distribution.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-[#D9E2EC] p-6 text-center">
              <p className="text-sm text-[#64748B]">
                Belum tersedia distribusi rujukan.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {distribution.map((item, index) => {
                const count = Number(item.count || 0);

                const width = Math.max((count / maxCount) * 100, 3);

                return (
                  <div key={`${item.name}-${index}`}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="min-w-0 truncate text-[14px] text-[#52677D]">
                        {item.name}
                      </span>

                      <span className="shrink-0 font-mono text-[13px] font-bold text-[#17324D]">
                        {formatNumber(count)}
                      </span>
                    </div>

                    <div className="h-[10px] overflow-hidden rounded-full bg-[#EDF2F6]">
                      <div
                        className="h-full rounded-full bg-[#10B8D1] transition-all"
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
        </section>
      </div>
    </div>
  );
}
