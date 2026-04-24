function hasShipyard() {
  return GS.planet.buildings.some(b => b.type === 'shipyard');
}

function buildShip(type) {
  if (!GS || !hasShipyard()) return;
  const s = SHIPS[type];
  if (!s) return;
  const canAfford = Object.entries(s.cost).every(([res, amt]) => (GS.resources[res]?.v ?? 0) >= amt);
  if (!canAfford) {
    const missing = Object.entries(s.cost)
      .filter(([res, amt]) => (GS.resources[res]?.v ?? 0) < amt)
      .map(([res]) => GS.resources[res]?.label ?? res).join(', ');
    addLog('warn', `Bau von ${s.name} fehlgeschlagen — zu wenig: ${missing}.`);
    renderLog();
    return;
  }
  for (const [res, amt] of Object.entries(s.cost)) GS.resources[res].v -= amt;
  GS.fleet[type]++;
  recalcRates();
  addLog('ok', `${s.name} gebaut. Flotte: ${GS.fleet[type]}× ${s.name}.`);
  renderAll();
}

function startRaid() {
  if (!GS || !hasShipyard()) return;
  if ((GS.fleet.warship || 0) < 1) {
    addLog('warn', 'Pirateriefahrt fehlgeschlagen — kein Kriegsschiff verfügbar.'); renderLog(); return;
  }
  if (GS.fleet.raidActive) {
    addLog('warn', 'Eine Pirateriefahrt läuft bereits.'); renderLog(); return;
  }
  if (!Object.entries(RAID_COST).every(([res, amt]) => (GS.resources[res]?.v ?? 0) >= amt)) {
    addLog('warn', 'Pirateriefahrt fehlgeschlagen — zu wenig Ressourcen.'); renderLog(); return;
  }
  for (const [res, amt] of Object.entries(RAID_COST)) GS.resources[res].v -= amt;
  GS.fleet.raidActive  = true;
  GS.fleet.raidEndTick = GS.meta.gameTick + RAID_DURATION_TICKS;
  addLog('info', `Pirateriefahrt gestartet. Rückkehr in ${RAID_DURATION_TICKS}s.`);
  renderAll();
}

function completeRaid() {
  GS.fleet.raidActive = false;
  const reward = RAID_REWARDS[Math.floor(Math.random() * RAID_REWARDS.length)];

  if (reward.specialist) {
    const pool = ['minerals', 'food', 'credits', 'research', 'influence'];
    const res  = pool[Math.floor(Math.random() * pool.length)];
    GS.fleet.specialists.push({ resource: res, bonus: reward.specialist.bonus });
    recalcRates();
    addLog('ok', `Pirateriefahrt: ${reward.label} — ${GS.resources[res]?.label ?? res} +${reward.specialist.bonus}/s dauerhaft.`);
  } else {
    let parts = [];
    for (const [res, amt] of Object.entries(reward.res)) {
      if (GS.resources[res]) {
        GS.resources[res].v = Math.min(GS.resources[res].cap, GS.resources[res].v + amt);
        parts.push(`${GS.resources[res].sym}+${amt}`);
      }
    }
    addLog('ok', `Pirateriefahrt: ${reward.label} — ${parts.join(' ')}.`);
  }
  renderAll();
}

function renderShips() {
  const el = document.getElementById('tab-content');
  if (!hasShipyard()) {
    el.innerHTML = `
      <div class="panel-title">Flotte</div>
      <p class="empty-hint">Keine Raumwerft errichtet.<br><br>Errichte eine Raumwerft auf Kepler Prime um Schiffe zu bauen.</p>`;
    return;
  }

  const fleet = GS.fleet;
  const totalShips = (fleet.colony || 0) + (fleet.trade || 0) + (fleet.warship || 0);
  const raidRemaining = fleet.raidActive ? Math.max(0, fleet.raidEndTick - GS.meta.gameTick) : 0;
  const raidCostStr = Object.entries(RAID_COST)
    .map(([res, amt]) => `${GS.resources[res]?.sym ?? res}${amt}`).join(' ');
  const canAffordRaid = Object.entries(RAID_COST)
    .every(([res, amt]) => (GS.resources[res]?.v ?? 0) >= amt);
  const canRaid = (fleet.warship || 0) >= 1 && !fleet.raidActive && canAffordRaid;

  let html = `<div class="panel-title">Flotte <span style="font-family:'Share Tech Mono',monospace;color:#2e4060;font-size:9px;">${totalShips} Schiffe</span></div>`;

  // Ship construction
  html += `<div class="research-tier-label">— Schiffswerft —</div>`;
  for (const [type, s] of Object.entries(SHIPS)) {
    const count = fleet[type] || 0;
    const canAfford = Object.entries(s.cost).every(([res, amt]) => (GS.resources[res]?.v ?? 0) >= amt);
    const costStr = Object.entries(s.cost).map(([res, amt]) => `${GS.resources[res]?.sym ?? res}${amt}`).join(' ');
    const bonusStr = Object.entries(s.rateBonus).map(([res, b]) => `+${b}/s ${GS.resources[res]?.sym ?? res}`).join(' ');
    html += `<div class="ship-item">
      <div class="ship-head">
        <span style="font-size:16px;line-height:1;flex-shrink:0">${s.sym}</span>
        <div>
          <div class="ship-name">${s.name}</div>
          <div class="ship-desc">${s.desc}</div>
          ${bonusStr ? `<div class="ship-bonus">${bonusStr} pro Schiff</div>` : ''}
        </div>
      </div>
      <div class="ship-meta">
        <span class="ship-count">Flotte: <strong>${count}</strong></span>
        <div style="display:flex;align-items:center;gap:5px;">
          <span class="ship-cost">${costStr}</span>
          <button class="research-btn" ${canAfford ? `onclick="buildShip('${type}')"` : 'disabled'}>${canAfford ? 'Bauen' : '— fehlt'}</button>
        </div>
      </div>
    </div>`;
  }

  // Piracy raids
  html += `<div class="research-tier-label">— Pirateriefahrten —</div>`;
  if (fleet.raidActive) {
    const pct = Math.round((1 - raidRemaining / RAID_DURATION_TICKS) * 100);
    html += `<div class="ship-raid-active">
      <div class="ship-raid-label">▶ Fahrt läuft — ${raidRemaining}s verbleibend</div>
      <div class="ship-raid-bar-bg"><div class="ship-raid-bar-fill" style="width:${pct}%"></div></div>
    </div>`;
  } else {
    html += `<div class="ship-item">
      <div class="ship-desc" style="margin-bottom:6px;">Schicke ein Kriegsschiff auf Beutezug. Zufällige Ressourcen oder Spezialisten werden erbeutet.</div>
      <div class="ship-meta">
        <span class="ship-cost">Dauer: ${RAID_DURATION_TICKS}s · ${raidCostStr}</span>
        <button class="research-btn" ${canRaid ? `onclick="startRaid()"` : 'disabled'}>${(fleet.warship || 0) < 1 ? '— kein Kriegsschiff' : canRaid ? 'Starten' : '— fehlt'}</button>
      </div>
    </div>`;
  }

  // Specialists
  if ((fleet.specialists || []).length > 0) {
    html += `<div class="research-tier-label">— Spezialisten (${fleet.specialists.length}) —</div>`;
    for (const s of fleet.specialists) {
      const res = GS.resources[s.resource];
      html += `<div class="ship-specialist">${res?.sym ?? s.resource} ${res?.label ?? s.resource}: +${s.bonus}/s dauerhaft</div>`;
    }
  }

  // Colonization status
  html += `<div class="research-tier-label">— Kolonisierung —</div>
    <div class="ship-item">
      <div class="ship-desc">Neuer Planet erfordert 1× Kolonisierungsschiff + 1× Kriegsschiff zur Sicherung.</div>
      <div class="ship-meta" style="margin-top:6px;">
        <span class="ship-count">Kolonieschiff: <strong>${fleet.colony || 0}</strong> · Kriegsschiff: <strong>${fleet.warship || 0}</strong></span>
        <button class="research-btn" ${(fleet.colony || 0) >= 1 && (fleet.warship || 0) >= 1 ? `onclick="startColonization()"` : 'disabled'}>${(fleet.colony || 0) >= 1 && (fleet.warship || 0) >= 1 ? 'Kolonisieren' : '— fehlt'}</button>
      </div>
    </div>`;

  el.innerHTML = html;
}

function startColonization() {
  addLog('info', 'Kolonisierungsmission vorbereitet — Zielsystem wird analysiert. [Folgt in nächster Version]');
  renderLog();
}
