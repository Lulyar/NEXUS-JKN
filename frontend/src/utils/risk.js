export function getRiskScore(item) {
  return Number(item?.risk_score ?? item?.fraud_score ?? item?.score ?? 0);
}

export function getRiskLabel(score) {
  const value = Number(score) || 0;

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
  const value = Number(score) || 0;

  if (value >= 70) {
    return "text-red-400 bg-red-500/10 border-red-500/20";
  }

  if (value >= 55) {
    return "text-orange-400 bg-orange-500/10 border-orange-500/20";
  }

  if (value >= 35) {
    return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  }

  return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
}
