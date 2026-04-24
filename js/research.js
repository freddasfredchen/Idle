function hasLab() {
  return GS.planets.some(p => p.buildings.some(b => b.type === 'lab'));
}

function canUnlockResearch(id) {
  const r = RESEARCH[id];
  if (!r) return false;
  return r.requires.every(req => (GS.research || []).includes(req));
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
      const isUnlocked   = canUnlockResearch(id);
      const isAffordable = canAfford(r.cost);
      const reqStr = r.requires.map(req => RESEARCH[req]?.name ?? req).join(', ');
      const fxStr  = factionEffectDesc(r.effect);
      html += `<div class="research-item${isDone ? ' done' : !isUnlocked ? ' locked' : ''}">
        <div class="research-head">
          <span style="font-size:14px;line-height:1">${r.sym}</span>
          <span class="research-name">${r.name}</span>
        </div>
        <div class="research-desc">${r.desc}</div>
        ${fxStr && !isDone ? `<div class="research-faction-fx">Fraktionen: ${fxStr}</div>` : ''}
        ${reqStr && !isDone ? `<div class="research-req">Benötigt: ${reqStr}</div>` : ''}
        <div class="research-meta">
          <span class="research-cost">${isDone ? '' : formatCost(r.cost)}</span>
          ${isDone
            ? '<span class="research-done-label">✓ Abgeschlossen</span>'
            : `<button class="research-btn" ${isUnlocked && isAffordable ? `onclick="doResearch('${id}')"` : 'disabled'}>${isUnlocked ? (isAffordable ? 'Forschen' : '— fehlt') : '— gesperrt'}</button>`
          }
        </div>
      </div>`;
    }
  }
  el.innerHTML = html;
}
