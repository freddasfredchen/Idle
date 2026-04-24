function hasLab() {
  return GS.planets.some(p => p.buildings.some(b => b.type === 'lab'));
}

function canUnlockResearch(id) {
  const r = RESEARCH[id];
  if (!r) return false;
  if (!r.requires.every(req => (GS.research || []).includes(req))) return false;
  if (r.requiresBuilding) {
    const needed = Array.isArray(r.requiresBuilding) ? r.requiresBuilding : [r.requiresBuilding];
    if (!needed.every(bt => GS.planets.some(p => p.buildings.some(b => b.type === bt)))) return false;
  }
  return true;
}

function missingBuildingReq(id) {
  const r = RESEARCH[id];
  if (!r?.requiresBuilding) return null;
  const needed = Array.isArray(r.requiresBuilding) ? r.requiresBuilding : [r.requiresBuilding];
  const missing = needed.filter(bt => !GS.planets.some(p => p.buildings.some(b => b.type === bt)));
  return missing.length > 0 ? missing.map(bt => BLDG[bt]?.name ?? bt).join(', ') : null;
}

function doResearch(id) {
  if (!GS) return;
  const r = RESEARCH[id];
  if (!r || (GS.research || []).includes(id) || !canUnlockResearch(id)) return;
  if (!canAfford(r.cost)) {
    addLog('warn', `Forschung "${r.name}" fehlgeschlagen — zu wenig: ${getMissingLabels(r.cost)}.`);
    renderLog(); return;
  }
  deductResources(r.cost);
  if (r.effect.type === 'faction_inf_delta') {
    for (const [fId, delta] of Object.entries(r.effect.deltas)) {
      const f = GS.factions.find(f => f.id === fId);
      if (f) f.inf = Math.max(0, f.inf + delta);
    }
  }
  if (!GS.research) GS.research = [];
  GS.research.push(id);
  recalcRates();
  addLog('ok', `Forschung abgeschlossen: "${r.name}".`);
  renderAll();
}

function factionEffectDesc(effect) {
  if (effect.type === 'faction_sat_rate') {
    return Object.entries(effect.rates).map(([fId, rate]) => {
      const f = GS.factions.find(f => f.id === fId);
      return `${f ? f.name.split(' ')[0] : fId} ${rate > 0 ? '+' : ''}${(rate * 60).toFixed(1)}/min`;
    }).join(', ');
  }
  if (effect.type === 'faction_inf_delta') {
    return Object.entries(effect.deltas).map(([fId, d]) => {
      const f = GS.factions.find(f => f.id === fId);
      return `${f ? f.name.split(' ')[0] : fId} Einfluss ${d > 0 ? '+' : ''}${d}`;
    }).join(', ');
  }
  return null;
}

function renderResearch() {
  const el = document.getElementById('tab-content');
  if (!hasLab()) {
    el.innerHTML = `<div class="panel-title">Forschungsbaum</div>
      <p class="empty-hint">Kein Forschungslabor errichtet.<br><br>Errichte ein Forschungslabor um Technologien zu erforschen.</p>`;
    return;
  }

  const done = GS.research || [];
  let html = '<div class="panel-title">Forschungsbaum</div>';

  for (const tier of [1, 2, 3]) {
    const items = Object.entries(RESEARCH).filter(([, r]) => r.tier === tier);
    html += `<div class="research-tier-label">— Stufe ${tier} —</div>`;
    for (const [id, r] of items) {
      const isDone       = done.includes(id);
      const missingBldg  = !isDone ? missingBuildingReq(id) : null;
      const isUnlocked   = !isDone && canUnlockResearch(id);
      const isAffordable = isUnlocked && canAfford(r.cost);
      const reqStr  = r.requires.map(req => RESEARCH[req]?.name ?? req).join(', ');
      const fxStr   = factionEffectDesc(r.effect);
      const lockBtn = missingBldg ? '— kein Gebäude' : '— gesperrt';
      html += `<div class="research-item${isDone ? ' done' : !isUnlocked ? ' locked' : ''}">
        <div class="research-head">
          <span style="font-size:14px;line-height:1">${r.sym}</span>
          <span class="research-name">${r.name}</span>
        </div>
        <div class="research-desc">${r.desc}</div>
        ${fxStr && !isDone ? `<div class="research-faction-fx">Fraktionen: ${fxStr}</div>` : ''}
        ${missingBldg && !isDone ? `<div class="research-req" style="color:#8a3535">Gebäude benötigt: ${missingBldg}</div>` : ''}
        ${reqStr && !isDone ? `<div class="research-req">Benötigt: ${reqStr}</div>` : ''}
        <div class="research-meta">
          <span class="research-cost">${isDone ? '' : formatCost(r.cost)}</span>
          ${isDone
            ? '<span class="research-done-label">✓ Abgeschlossen</span>'
            : `<button class="research-btn" ${isUnlocked && isAffordable ? `onclick="doResearch('${id}')"` : 'disabled'}>${isUnlocked ? (isAffordable ? 'Forschen' : '— fehlt') : lockBtn}</button>`
          }
        </div>
      </div>`;
    }
  }
  el.innerHTML = html;
}
