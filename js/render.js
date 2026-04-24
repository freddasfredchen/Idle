function renderAll() {
  if (!GS) return;
  renderHeader();
  renderResources();
  renderPlanet();
  renderLog();
  renderTab();
  renderTick();
}

function renderHeader() {
  document.getElementById('dynasty-name').textContent = GS.dynasty.name;
  document.getElementById('ruler-line').textContent =
    `${GS.dynasty.ruler.name} • Generation ${toRoman(GS.dynasty.generation)} • ${GS.dynasty.ruler.traits.join(', ')}`;
}

function renderTick() {
  document.getElementById('tick-display').textContent =
    `PROTOKOLL ${GS.meta.gameTick.toString().padStart(8,'0')} • VERSION 0.2.0`;
}

function renderResources() {
  const bar = document.getElementById('resource-bar');
  bar.innerHTML = Object.entries(GS.resources).map(([k, r]) => {
    if (k === 'energy') {
      const drain = r.consumption || 0;
      const isDeficit = drain > r.v;
      const surplus = r.v - drain;
      const valCol = isDeficit ? '#f87171' : surplus < 2 ? '#fbbf24' : r.col;
      const statusText = drain === 0 ? 'kein Verbrauch'
        : isDeficit ? `⚠ ${drain.toFixed(1)} ben.`
        : `${drain.toFixed(1)} genutzt`;
      const statusCol = isDeficit ? '#8a3535' : '#4a7a50';
      return `<div class="res-item">
        <div class="res-label">${r.label}</div>
        <div class="res-value" style="color:${valCol}">${r.sym} ${r.v.toFixed(1)}</div>
        <div class="res-rate" style="color:${statusCol}">${statusText}</div>
      </div>`;
    }
    const netRate = r.rate + r.decay;
    const rateCol = netRate > 0 ? '#4a7a50' : netRate < 0 ? '#8a3535' : '#2e3e55';
    const isFull = r.v >= r.cap * 0.98;
    const valCol = isFull ? '#fb923c' : r.col;
    return `<div class="res-item">
      <div class="res-label">${r.label}</div>
      <div class="res-value" style="color:${valCol}">${r.sym} ${fmt(r.v)}</div>
      <div class="res-rate" style="color:${rateCol}">${fmtRate(r)}</div>
    </div>`;
  }).join('');
}

function renderPlanet() {
  const p = GS.planet;
  document.getElementById('planet-title').innerHTML =
    `<span style="font-family:'Cinzel',serif">${p.name}</span> — ${p.type} <span>${p.buildings.length}/${p.slots} Bauplätze</span><button class="help-btn" onclick="showHelp()">?</button>`;

  const slotMap = {};
  p.buildings.forEach(b => slotMap[b.slot] = b);
  const grid = document.getElementById('building-grid');
  grid.innerHTML = Array.from({length: p.slots}, (_, i) => {
    const b = slotMap[i];
    if (b) {
      const m = BLDG[b.type] || {sym:'?', col:'#fff'};
      const costs = getUpgradeCost(b.type, b.level);
      const affordable = canAffordUpgrade(b.type, b.level);
      const costStr = Object.entries(costs)
        .map(([res, amt]) => `${GS.resources[res]?.sym ?? res}${fmt(amt)}`)
        .join(' ');
      const energyLine = b.type === 'solar'
        ? `<div class="bslot-energy prod">⚡ +${(m.prod.base + (b.level-1)*m.prod.perLevel).toFixed(1)}</div>`
        : m.drain ? `<div class="bslot-energy drain">⚡ ${(m.drain.base + (b.level-1)*m.drain.perLevel).toFixed(1)}</div>` : '';
      return `<div class="bslot occupied${affordable ? ' can-afford' : ''}" onclick="upgradeBuilding(${i})" title="Ausbau: ${costStr}">
        <div class="bslot-level">Lv${b.level}</div>
        <div class="bslot-sym" style="color:${m.col}">${m.sym}</div>
        <div class="bslot-name">${b.name}</div>
        ${energyLine}
        <div class="bslot-cost">↑ ${costStr}</div>
      </div>`;
    }
    return `<div class="bslot" onclick="selectBuild(${i})" title="Leerer Bauplatz — klicken zum Bauen">
      <div class="bslot-empty">+</div>
    </div>`;
  }).join('');
}

function renderLog() {
  const el = document.getElementById('log-entries');
  el.innerHTML = GS.log.map(e =>
    `<div class="log-entry ${e.sev}">${e.sev==='warn'?'⚠ ':e.sev==='ok'?'✓ ':'› '}${e.msg}</div>`
  ).join('');
}

function renderTab() {
  const el = document.getElementById('tab-content');
  if (currentTab === 'factions') {
    const stability = Math.round(GS.factions.reduce((a,f) => a + f.sat * f.inf/100, 0));
    const stabCol = satColor(stability);
    const canAppease    = GS.resources.influence.v >= 20 && GS.resources.credits.v >= 50;
    const canIntimidate = GS.resources.influence.v >= 30 && GS.resources.loyalty.v >= 20;
    el.innerHTML = `
      <div class="panel-title">Fraktionsstatus</div>
      ${GS.factions.map(f => {
        const pow = f.pow || 0;
        const satC = satColor(f.sat);
        const powC = powColor(pow);
        const satCrit  = f.sat < 20;
        const powCrit  = pow  > 80;
        return `<div class="faction-row">
          <div class="faction-header">
            <span class="faction-name">${f.name}</span>
            <span>${satCrit ? '<span class="faction-warn rebellion">⚠ AUFSTAND</span>' : ''}${powCrit ? '<span class="faction-warn corruption"> ⚠ KORRUPTION</span>' : ''}</span>
          </div>
          <div class="faction-bar-row">
            <span class="faction-bar-lbl">Zuf.</span>
            <div class="faction-bar-bg"><div class="faction-bar-fill" style="width:${f.sat}%;background:${satC}"></div></div>
            <span style="color:${satC};font-size:8px;font-weight:bold;min-width:26px;text-align:right">${Math.round(f.sat)}%</span>
          </div>
          <div class="faction-bar-row">
            <span class="faction-bar-lbl">Macht</span>
            <div class="faction-bar-bg"><div class="faction-bar-fill" style="width:${pow}%;background:${powC}"></div></div>
            <span style="color:${powC};font-size:8px;font-weight:bold;min-width:26px;text-align:right">${Math.round(pow)}%</span>
          </div>
          <div class="faction-footer">
            <span class="faction-inf">Einfluss: ${f.inf}%</span>
            <div class="faction-actions">
              <button class="faction-action-btn" ${canAppease ? `onclick="appeaseFaction('${f.id}')"` : 'disabled'} title="Beschwichtigen (◈20 ₡50): Zuf.+20, Macht+10">Besch.</button>
              <button class="faction-action-btn intimidate" ${canIntimidate ? `onclick="intimidateFaction('${f.id}')"` : 'disabled'} title="Einschüchtern (◈30 ♥20): Macht−20, Zuf.−10">Einsch.</button>
            </div>
          </div>
        </div>`;
      }).join('')}
      <div class="stability-block">
        <div class="stability-label">GESAMTSTABILITÄT</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:9px;color:${stabCol}">${stability}%</span>
        </div>
        <div class="stability-bar-bg">
          <div class="stability-bar-fill" style="width:${stability}%;background:${stabCol}"></div>
        </div>
      </div>`;
  } else if (currentTab === 'research') {
    renderResearch();
  } else if (currentTab === 'decrees') {
    renderDecrees();
  } else if (currentTab === 'planets') {
    el.innerHTML = `
      <div class="panel-title">Planeten</div>
      <div class="planet-card">
        <div class="planet-card-name">${GS.planet.name}</div>
        <div class="planet-card-sub">${GS.planet.type} • ${GS.planet.slots} Bauplätze</div>
      </div>
      <p class="empty-hint" style="margin-top:8px;">Weitere Planeten durch Kolonisierung erschließbar.<br><br>Benötigt: Raumwerft + Kolonisierungsschiff + 100 Einfluss.</p>`;
  }
}

function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTab();
}
