function hasMinistry() {
  return GS.planets.some(p => p.buildings.some(b => b.type === 'ministry'));
}

function issueDecree(id) {
  if (!GS) return;
  const d = DECREES[id];
  if (!d || (GS.decrees || []).includes(id) || !hasMinistry()) return;
  if (!canAfford(d.cost)) {
    addLog('warn', `Erlass "${d.name}" fehlgeschlagen — zu wenig: ${getMissingLabels(d.cost)}.`);
    renderLog(); return;
  }
  deductResources(d.cost);
  if (!GS.decrees) GS.decrees = [];
  GS.decrees.push(id);
  recalcRates();
  addLog('ok', `Erlass "${d.name}" in Kraft gesetzt.`);
  renderAll();
}

function repealDecree(id) {
  if (!GS) return;
  if (!(GS.decrees || []).includes(id)) return;
  GS.decrees = GS.decrees.filter(d => d !== id);
  recalcRates();
  addLog('info', `Erlass "${DECREES[id]?.name ?? id}" aufgehoben.`);
  renderAll();
}

function decreeEffectSummary(d) {
  const parts = [];
  const e = d.rateEffects || {};
  if (e.prod_all_mult)   parts.push(`+${Math.round((e.prod_all_mult - 1) * 100)}% Produktion`);
  if (e.loyalty_no_decay) parts.push('Loyalitätsverfall: 0');
  if (e.building_mult) {
    for (const [bt, m] of Object.entries(e.building_mult))
      parts.push(`+${Math.round((m - 1) * 100)}% ${BLDG[bt]?.name ?? bt}`);
  }
  if (e.resource_flat) {
    for (const [res, delta] of Object.entries(e.resource_flat))
      parts.push(`${delta > 0 ? '+' : ''}${delta.toFixed(2)}/s ${GS.resources[res]?.sym ?? res}`);
  }
  if (d.factionSatRate) {
    for (const [fId, rate] of Object.entries(d.factionSatRate)) {
      const f = GS.factions.find(f => f.id === fId);
      parts.push(`${f ? f.name.split(' ')[0] : fId} ${rate > 0 ? '+' : ''}${(rate * 60).toFixed(1)}/min`);
    }
  }
  return parts.join(' · ');
}

function renderDecrees() {
  const el = document.getElementById('tab-content');
  if (!hasMinistry()) {
    el.innerHTML = `<div class="panel-title">Erlasse</div>
      <p class="empty-hint">Kein Ministerium errichtet.<br><br>Errichte das Ministerium um Erlasse zu verabschieden.</p>`;
    return;
  }
  const active = GS.decrees || [];
  let html = `<div class="panel-title">Erlasse <span style="font-family:'Share Tech Mono',monospace;color:#2e4060;font-size:9px;">${active.length} aktiv</span></div>`;
  const activeEntries   = Object.entries(DECREES).filter(([id]) =>  active.includes(id));
  const inactiveEntries = Object.entries(DECREES).filter(([id]) => !active.includes(id));
  if (activeEntries.length)   html += `<div class="research-tier-label">— Aktiv —</div>`   + activeEntries.map(([id, d])   => renderDecreeRow(id, d, true)).join('');
  if (inactiveEntries.length) html += `<div class="research-tier-label">— Verfügbar —</div>` + inactiveEntries.map(([id, d]) => renderDecreeRow(id, d, false)).join('');
  el.innerHTML = html;
}

function renderDecreeRow(id, d, isActive) {
  const affordable = canAfford(d.cost);
  const costStr    = formatCost(d.cost);
  const summary    = decreeEffectSummary(d);
  return `<div class="research-item${isActive ? ' decree-active' : ''}">
    <div class="research-head">
      <span style="font-size:14px;line-height:1">${d.sym}</span>
      <span class="research-name">${d.name}</span>
    </div>
    <div class="research-desc">${d.desc}</div>
    ${summary ? `<div class="decree-effects">${summary}</div>` : ''}
    <div class="research-meta">
      ${isActive
        ? `<span class="decree-active-label">◈ Aktiv — ${costStr} verbraucht</span>`
        : `<span class="research-cost">${costStr}</span>`
      }
      ${isActive
        ? `<button class="decree-repeal-btn" onclick="repealDecree('${id}')">Aufheben</button>`
        : `<button class="research-btn" ${affordable ? `onclick="issueDecree('${id}')"` : 'disabled'}>${affordable ? 'Verabschieden' : '— fehlt'}</button>`
      }
    </div>
  </div>`;
}
