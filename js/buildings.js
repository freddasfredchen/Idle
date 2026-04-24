function getUpgradeCost(type, level) {
  const base = BLDG[type]?.upgradeCostBase;
  if (!base) return {};
  const result = {};
  for (const [res, amount] of Object.entries(base)) {
    result[res] = Math.round(amount * level);
  }
  return result;
}

function canAffordUpgrade(type, level) {
  const costs = getUpgradeCost(type, level);
  return Object.entries(costs).every(([res, amount]) => (GS.resources[res]?.v ?? 0) >= amount);
}

function upgradeBuilding(slot) {
  if (!GS) return;
  const b = GS.planet.buildings.find(b => b.slot === slot);
  if (!b) return;

  const costs = getUpgradeCost(b.type, b.level);

  if (!canAffordUpgrade(b.type, b.level)) {
    const missing = Object.entries(costs)
      .filter(([res, amt]) => (GS.resources[res]?.v ?? 0) < amt)
      .map(([res]) => GS.resources[res].label)
      .join(', ');
    addLog('warn', `Ausbau von ${b.name} fehlgeschlagen — zu wenig: ${missing}.`);
    renderLog();
    return;
  }

  for (const [res, amount] of Object.entries(costs)) {
    GS.resources[res].v -= amount;
  }

  b.level++;
  recalcRates();
  addLog('ok', `${b.name} auf Stufe ${b.level} ausgebaut. Produktion gesteigert.`);
  renderAll();
}

function addLog(sev, msg) {
  GS.log.unshift({ id: Date.now(), sev, msg });
  GS.log = GS.log.slice(0, 25);
}
