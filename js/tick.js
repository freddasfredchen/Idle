function tickState() {
  if (!GS) return;
  const dt = TICK_MS / 1000;

  // Resources
  for (const [k, r] of Object.entries(GS.resources)) {
    if (k === 'energy') continue;
    let v = r.v + (r.rate + r.decay) * dt;
    if (k === 'loyalty') v = Math.max(LOYALTY_FLOOR, v);
    v = Math.max(0, Math.min(r.cap, v));
    GS.resources[k].v = v;
  }

  // Faction satisfaction rates from active decrees and research
  const factionRates = {};
  for (const id of (GS.decrees || [])) {
    const d = DECREES[id];
    if (!d?.factionSatRate) continue;
    for (const [fId, rate] of Object.entries(d.factionSatRate)) {
      factionRates[fId] = (factionRates[fId] || 0) + rate;
    }
  }
  for (const id of (GS.research || [])) {
    const r = RESEARCH[id];
    if (r?.effect?.type !== 'faction_sat_rate') continue;
    for (const [fId, rate] of Object.entries(r.effect.rates)) {
      factionRates[fId] = (factionRates[fId] || 0) + rate;
    }
  }
  for (const f of GS.factions) {
    const rate = factionRates[f.id] || 0;
    if (rate !== 0) f.sat = Math.max(0, Math.min(100, f.sat + rate * dt));
  }

  GS.meta.gameTick++;
  renderResources();
  renderTick();
  if (GS.meta.gameTick % 30 === 0) autoSave();
}

setInterval(tickState, TICK_MS);
