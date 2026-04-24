function hasLab() {
  return GS.planet.buildings.some(b => b.type === 'lab');
}

function canUnlockResearch(id) {
  const r = RESEARCH[id];
  if (!r) return false;
  const done = GS.research || [];
  return r.requires.every(req => done.includes(req));
}

function canAffordResearch(id) {
  const r = RESEARCH[id];
  if (!r) return false;
  return Object.entries(r.cost).every(([res, amt]) => (GS.resources[res]?.v ?? 0) >= amt);
}

function doResearch(id) {
  if (!GS) return;
  const r = RESEARCH[id];
  if (!r) return;
  if ((GS.research || []).includes(id)) return;
  if (!canUnlockResearch(id)) return;

  if (!canAffordResearch(id)) {
    const missing = Object.entries(r.cost)
      .filter(([res, amt]) => (GS.resources[res]?.v ?? 0) < amt)
      .map(([res]) => GS.resources[res]?.label ?? res)
      .join(', ');
    addLog('warn', `Forschung "${r.name}" fehlgeschlagen — zu wenig: ${missing}.`);
    renderLog();
    return;
  }

  for (const [res, amt] of Object.entries(r.cost)) {
    GS.resources[res].v -= amt;
  }
  if (!GS.research) GS.research = [];
  GS.research.push(id);
  recalcRates();
  addLog('ok', `Forschung abgeschlossen: "${r.name}".`);
  renderAll();
}

function renderResearch() {
  const el = document.getElementById('tab-content');
  if (!hasLab()) {
    el.innerHTML = `
      <div class="panel-title">Forschungsbaum</div>
      <p class="empty-hint">Kein Forschungslabor errichtet.<br><br>Errichte ein Forschungslabor auf Kepler Prime um Technologien zu erforschen.</p>`;
    return;
  }

  const done = GS.research || [];
  let html = '<div class="panel-title">Forschungsbaum</div>';

  for (const tier of [1, 2, 3]) {
    const items = Object.entries(RESEARCH).filter(([, r]) => r.tier === tier);
    html += `<div class="research-tier-label">— Stufe ${tier} —</div>`;
    for (const [id, r] of items) {
      const isDone = done.includes(id);
      const isUnlocked = canUnlockResearch(id);
      const isAffordable = canAffordResearch(id);
      const costStr = Object.entries(r.cost)
        .map(([res, amt]) => `${GS.resources[res]?.sym ?? res} ${amt}`)
        .join('  ');
      const reqStr = r.requires.map(req => RESEARCH[req]?.name ?? req).join(', ');

      html += `<div class="research-item${isDone ? ' done' : !isUnlocked ? ' locked' : ''}">
        <div class="research-head">
          <span style="font-size:14px;line-height:1">${r.sym}</span>
          <span class="research-name">${r.name}</span>
        </div>
        <div class="research-desc">${r.desc}</div>
        ${reqStr && !isDone ? `<div class="research-req">Benötigt: ${reqStr}</div>` : ''}
        <div class="research-meta">
          <span class="research-cost">${isDone ? '' : costStr}</span>
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
