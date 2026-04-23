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

function toRoman(n) {
  const r = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
  return r[n-1] || n;
}
