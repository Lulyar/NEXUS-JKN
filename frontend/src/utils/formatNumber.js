export function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
}
