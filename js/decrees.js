function hasMinistry() {
  return GS.planets.some(p => p.buildings.some(b => b.type === 'ministry'));
}

function issueDecree(id) {
  if (!GS) return;
  const d = DECREES[id];
  if (!d) return;
  if ((GS.decrees || []).includes(id)) return;
  if (!hasMinistry()) return;

  const canAfford = Object.entries(d.cost).every(([res, amt]) => (GS.resources[res]?.v ?? 0) >= amt);
  if (!canAfford) {
    const missing = Object.entries(d.cost)
      .filter(([res, amt]) => (GS.resources[res]?.v ?? 0) < amt)
      .map(([res]) => GS.resources[res]?.label ?? res)
      .join(', ');
    addLog('warn', `Erlass "${d.name}" fehlgeschlagen — zu wenig: ${missing}.`);
    renderLog();
    return;
  }

  for (const [res, amt] of Object.entries(d.cost)) {
    GS.resources[res].v -= amt;
  }
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
  if (e.prod_all_mult) parts.push(`+${Math.round((e.prod_all_mult - 1) * 100)}% Produktion`);
  if (e.loyalty_no_decay) parts.push('Loyalitätsverfall: 0');
  if (e.building_mult) {
    for (const [bt, m] of Object.entries(e.building_mult)) {
      parts.push(`+${Math.round((m - 1) * 100)}% ${BLDG[bt]?.name ?? bt}`);
    }
  }
  if (e.resource_flat) {
    for (const [res, delta] of Object.entries(e.resource_flat)) {
      const sym = GS.resources[res]?.sym ?? res;
      parts.push(`${delta > 0 ? '+' : ''}${delta.toFixed(2)}/s ${sym}`);
    }
  }
  if (d.factionSatRate) {
    for (const [fId, rate] of Object.entries(d.factionSatRate)) {
      const f = GS.factions.find(f => f.id === fId);
      const name = f ? f.name.split(' ')[0] : fId;
      parts.push(`${name} ${rate > 0 ? '+' : ''}${(rate * 60).toFixed(1)}/min`);
    }
  }
  return parts.join(' · ');
}

function renderDecrees() {
  const el = document.getElementById('tab-content');
  if (!hasMinistry()) {
    el.innerHTML = `
      <div class="panel-title">Erlasse</div>
      <p class="empty-hint">Kein Ministerium errichtet.<br><br>Errichte das Ministerium für Wahrheit und Verwaltung, um Erlasse zu verabschieden.</p>`;
    return;
  }

  const active = GS.decrees || [];
  let html = `<div class="panel-title">Erlasse <span style="font-family:'Share Tech Mono',monospace;color:#2e4060;font-size:9px;">${active.length} aktiv</span></div>`;

  const activeEntries   = Object.entries(DECREES).filter(([id]) =>  active.includes(id));
  const inactiveEntries = Object.entries(DECREES).filter(([id]) => !active.includes(id));

  if (activeEntries.length) {
    html += `<div class="research-tier-label">— Aktiv —</div>`;
    for (const [id, d] of activeEntries) {
      html += renderDecreeRow(id, d, true);
    }
  }

  if (inactiveEntries.length) {
    html += `<div class="research-tier-label">— Verfügbar —</div>`;
    for (const [id, d] of inactiveEntries) {
      html += renderDecreeRow(id, d, false);
    }
  }

  el.innerHTML = html;
}

function renderDecreeRow(id, d, isActive) {
  const canAfford = Object.entries(d.cost)
    .every(([res, amt]) => (GS.resources[res]?.v ?? 0) >= amt);
  const costStr = Object.entries(d.cost)
    .map(([res, amt]) => `${GS.resources[res]?.sym ?? res} ${amt}`)
    .join('  ');
  const summary = decreeEffectSummary(d);

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
        : `<button class="research-btn" ${canAfford ? `onclick="issueDecree('${id}')"` : 'disabled'}>${canAfford ? 'Verabschieden' : '— fehlt'}</button>`
      }
    </div>
  </div>`;
}
