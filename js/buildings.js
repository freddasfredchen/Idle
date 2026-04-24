function getUpgradeCost(type, level) {
  const base = BLDG[type]?.upgradeCostBase;
  if (!base) return {};
  const result = {};
  for (const [res, amount] of Object.entries(base)) result[res] = Math.round(amount * level);
  return result;
}

function canAffordUpgrade(type, level) {
  return canAfford(getUpgradeCost(type, level));
}

function upgradeBuilding(slot) {
  if (!GS) return;
  const b = activePlanet().buildings.find(b => b.slot === slot);
  if (!b) return;
  const costs = getUpgradeCost(b.type, b.level);
  if (!canAfford(costs)) {
    addLog('warn', `Ausbau von ${b.name} fehlgeschlagen — zu wenig: ${getMissingLabels(costs)}.`);
    renderLog(); return;
  }
  deductResources(costs);
  b.level++;
  recalcRates();
  addLog('ok', `${b.name} auf Stufe ${b.level} ausgebaut.`);
  renderAll();
}

function addLog(sev, msg) {
  GS.log.unshift({ id: Date.now(), sev, msg });
  GS.log = GS.log.slice(0, 25);
}

function selectBuild(slot) {
  if (!GS) return;
  const rows = Object.entries(BLDG).map(([type, m]) => {
    const affordable = canAfford(m.buildCost);
    const prodInfo = !m.resource
      ? `⚡ +${m.prod.base} kW`
      : `${GS.resources[m.resource]?.sym ?? ''} +${m.prod.base}/s${m.drain ? `  ⚡ ${m.drain.base} kW` : ''}`;
    return `<div class="build-option${affordable ? '' : ' build-locked'}">
      <div class="build-option-left">
        <span style="color:${m.col};font-size:16px;line-height:1">${m.sym}</span>
        <div>
          <div class="build-option-name">${m.name}</div>
          <div class="build-option-prod">${prodInfo}</div>
          ${m.desc ? `<div style="color:#2e4060;font-size:8px;margin-top:2px;font-style:italic">${m.desc}</div>` : ''}
        </div>
      </div>
      <div class="build-option-right">
        <div class="build-option-cost">${formatCost(m.buildCost)}</div>
        <button class="build-btn" ${affordable ? `onclick="buildBuilding(${slot},'${type}')"` : 'disabled'}>${affordable ? 'Bauen' : '—'}</button>
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
  if (!canAfford(m.buildCost)) {
    addLog('warn', `Bau von ${m.name} fehlgeschlagen — zu wenig: ${getMissingLabels(m.buildCost)}.`);
    closeBuildModal(); return;
  }
  deductResources(m.buildCost);
  const p = activePlanet();
  const newId = Math.max(0, ...p.buildings.map(b => b.id)) + 1;
  p.buildings.push({ id: newId, type, name: m.name, level: 1, slot });
  recalcRates();
  addLog('ok', `${m.name} auf Bauplatz ${slot + 1} errichtet.`);
  closeBuildModal();
  renderAll();
}

function closeBuildModal() {
  document.getElementById('build-modal').style.display = 'none';
}
