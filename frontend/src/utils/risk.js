export function getRiskScore(item) {
  if (item === null || item === undefined) return 0;

  let val = 0;
  if (typeof item === "number") {
    val = item;
  } else if (typeof item === "string") {
    val = parseFloat(item);
  } else if (typeof item === "object") {
    val = Number(item.risk_score ?? item.fraud_score ?? item.score ?? 0);
  }

  if (isNaN(val)) return 0;

  if (val > 0 && val <= 1) {
    val = val * 100;
  }

  return val;
}

export function getRiskLabel(score) {
  const value = getRiskScore(score);

  if (value >= 70) {
    return "SANGAT TINGGI";
  }

  if (value >= 55) {
    return "TINGGI";
  }

  if (value >= 35) {
    return "SEDANG";
  }

  return "RENDAH";
}

export function getRiskClass(score) {
  const value = getRiskScore(score);

  if (value >= 70) {
    return "text-red-700 bg-red-50 border-red-200";
  }

  if (value >= 55) {
    return "text-orange-700 bg-orange-50 border-orange-200";
  }

  if (value >= 35) {
    return "text-amber-700 bg-amber-50 border-amber-200";
  }

  return "text-emerald-700 bg-emerald-50 border-emerald-200";
}
