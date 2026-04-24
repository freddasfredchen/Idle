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

  // Faction satisfaction + power changes
  const factionSatRates = {};
  const factionPowRates = {};

  for (const id of (GS.decrees || [])) {
    const d = DECREES[id];
    for (const [fId, rate] of Object.entries(d?.factionSatRate || {})) {
      factionSatRates[fId] = (factionSatRates[fId] || 0) + rate;
    }
    for (const [fId, rate] of Object.entries(d?.factionPowRate || {})) {
      factionPowRates[fId] = (factionPowRates[fId] || 0) + rate;
    }
  }
  for (const id of (GS.research || [])) {
    const r = RESEARCH[id];
    if (r?.effect?.type === 'faction_sat_rate') {
      for (const [fId, rate] of Object.entries(r.effect.rates)) {
        factionSatRates[fId] = (factionSatRates[fId] || 0) + rate;
      }
    }
  }

  for (const f of GS.factions) {
    // Satisfaction drift
    const satRate = factionSatRates[f.id] || 0;
    if (satRate !== 0) f.sat = Math.max(0, Math.min(100, f.sat + satRate * dt));

    // Power growth: base + satisfaction bonus + decree modifiers
    let powRate = FACTION_POW_BASE_RATE;
    if (f.sat > 85) powRate += 0.002;
    else if (f.sat > 70) powRate += 0.001;
    powRate += (factionPowRates[f.id] || 0);
    f.pow = Math.max(0, Math.min(100, f.pow + powRate * dt));

    // Rebellion: sat at floor, cooldown 90 ticks
    if (f.sat <= 0.5 && GS.meta.gameTick - f.lastRebTick > 90) {
      triggerRebellion(f);
    }
    // Corruption crisis: pow maxed, cooldown 120 ticks
    if (f.pow >= 99.5 && GS.meta.gameTick - f.lastCorrTick > 120) {
      triggerCorruption(f);
    }
  }

  // Raid completion
  if (GS.fleet?.raidActive && GS.meta.gameTick >= GS.fleet.raidEndTick) {
    completeRaid();
  }

  GS.meta.gameTick++;
  renderResources();
  renderTick();
  if (currentTab === 'ships' && GS.fleet?.raidActive) renderTab();
  if (GS.meta.gameTick % 30 === 0) autoSave();
}

setInterval(tickState, TICK_MS);
