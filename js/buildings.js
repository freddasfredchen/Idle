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

// ── BAU-MENÜ ──────────────────────────────────────────────────

function selectBuild(slot) {
  if (!GS) return;

  const rows = Object.entries(BLDG).map(([type, m]) => {
    const cost = m.buildCost;
    const canAfford = Object.entries(cost).every(([res, amt]) => (GS.resources[res]?.v ?? 0) >= amt);
    const costStr = Object.entries(cost)
      .map(([res, amt]) => `${GS.resources[res]?.sym ?? res} ${fmt(amt)}`)
      .join('  ');
    const prodInfo = type === 'solar'
      ? `⚡ +${m.prod.base} kW`
      : `${GS.resources[m.resource]?.sym ?? ''} +${m.prod.base}/s${m.drain ? `  ⚡ ${m.drain.base} kW` : ''}`;

    return `<div class="build-option${canAfford ? '' : ' build-locked'}">
      <div class="build-option-left">
        <span style="color:${m.col};font-size:16px;line-height:1">${m.sym}</span>
        <div>
          <div class="build-option-name">${m.name}</div>
          <div class="build-option-prod">${prodInfo}</div>
        </div>
      </div>
      <div class="build-option-right">
        <div class="build-option-cost">${costStr}</div>
        <button class="build-btn" ${canAfford ? `onclick="buildBuilding(${slot},'${type}')"` : 'disabled'}>${canAfford ? 'Bauen' : '—'}</button>
      </div>
    </div>`;
  }).join('');

  document.getElementById('build-modal-body').innerHTML = rows;
  document.getElementById('build-modal').style.display = 'flex';
}

function buildBuilding(slot, type) {
  if (!GS) return;
  const m = BLDG[type];
  if (!m) return;

  for (const [res, amt] of Object.entries(m.buildCost)) {
    if ((GS.resources[res]?.v ?? 0) < amt) {
      addLog('warn', `Bau von ${m.name} fehlgeschlagen — zu wenig Ressourcen.`);
      closeBuildModal();
      return;
    }
  }

  for (const [res, amt] of Object.entries(m.buildCost)) {
    GS.resources[res].v -= amt;
  }

  const newId = Math.max(0, ...GS.planet.buildings.map(b => b.id)) + 1;
  GS.planet.buildings.push({ id: newId, type, name: m.name, level: 1, slot });

  recalcRates();
  addLog('ok', `${m.name} auf Bauplatz ${slot + 1} errichtet.`);
  closeBuildModal();
  renderAll();
}

function closeBuildModal() {
  document.getElementById('build-modal').style.display = 'none';
}
