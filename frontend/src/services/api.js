const API_BASE = "";

export { API_BASE };

/**
 * Membuat query parameter untuk API.
 *
 * Contoh:
 * buildQuery({
 *   startDate: "2026-09-01",
 *   endDate: "2026-09-05"
 * })
 *
 * menghasilkan:
 * ?start_date=2026-09-01&end_date=2026-09-05
 */
export function buildQuery({ startDate = null, endDate = null } = {}) {
  const params = new URLSearchParams();

  if (startDate) {
    params.append("start_date", startDate);
  }

  if (endDate) {
    params.append("end_date", endDate);
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

/**
 * Request umum ke backend
 */
export async function apiFetch(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request gagal: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        message = errorData.detail;
      } else if (errorData?.message) {
        message = errorData.message;
      }
    } catch {
      // Response bukan JSON
    }

    throw new Error(message);
  }

  return response.json();
}

/**
 * GET
 */
export async function apiGet(url) {
  return apiFetch(url, {
    method: "GET",
  });
}

/**
 * POST
 */
export async function apiPost(url, body) {
  return apiFetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * PUT
 */
export async function apiPut(url, body) {
  return apiFetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * DELETE
 */
export async function apiDelete(url) {
  return apiFetch(url, {
    method: "DELETE",
  });
}
