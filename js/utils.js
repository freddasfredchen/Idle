function fmt(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return Math.floor(n).toString();
}

function fmtRate(r) {
  const t = r.rate + r.decay;
  return (t >= 0 ? '+' : '') + t.toFixed(2) + '/s';
}

function satColor(v) {
  if (v >= 70) return '#4ade80';
  if (v >= 50) return '#fbbf24';
  if (v >= 30) return '#fb923c';
  return '#f87171';
}

function powColor(v) {
  if (v >= 85) return '#f87171';
  if (v >= 70) return '#fb923c';
  if (v >= 50) return '#fbbf24';
  return '#4ade80';
}

function toRoman(n) {
  const r = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
  return r[n-1] || n;
}

// ── Resource helpers — costs = { resourceKey: amount } ──────────

function canAfford(costs) {
  return Object.entries(costs).every(([res, amt]) => (GS.resources[res]?.v ?? 0) >= amt);
}

function deductResources(costs) {
  for (const [res, amt] of Object.entries(costs)) GS.resources[res].v -= amt;
}

function getMissingLabels(costs) {
  return Object.entries(costs)
    .filter(([res, amt]) => (GS.resources[res]?.v ?? 0) < amt)
    .map(([res]) => GS.resources[res]?.label ?? res)
    .join(', ');
}

function formatCost(costs) {
  return Object.entries(costs)
    .map(([res, amt]) => `${GS.resources[res]?.sym ?? res} ${fmt(amt)}`)
    .join('  ');
}
