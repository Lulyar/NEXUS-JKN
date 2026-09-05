import { apiFetch } from "./api";

/**
 * Mengambil analisis audit untuk satu relasi rujukan.
 *
 * Dipanggil oleh AuditPanel.jsx dengan format:
 *
 * getAuditData({
 *   source,
 *   target,
 *   startDate,
 *   endDate
 * })
 */
export async function getAuditData({
  source,
  target,
  startDate = null,
  endDate = null,
} = {}) {
  if (!source || !target) {
    throw new Error("Sumber dan tujuan rujukan wajib diisi.");
  }

  const params = new URLSearchParams();

  if (startDate) {
    params.append("start_date", startDate);
  }

  if (endDate) {
    params.append("end_date", endDate);
  }

  const query = params.toString();

  const url =
    `/api/audit/${encodeURIComponent(source)}/${encodeURIComponent(target)}` +
    (query ? `?${query}` : "");

  return apiFetch(url);
}

/**
 * Alias untuk kompatibilitas jika ada komponen lain
 * yang menggunakan nama getAuditDetail.
 */
export async function getAuditDetail(
  source,
  target,
  startDate = null,
  endDate = null,
) {
  return getAuditData({
    source,
    target,
    startDate,
    endDate,
  });
}
