function activePlanet() {
  return GS.planets[GS.activePlanetId || 0];
}

function generatePlanet(seed, excludeTypes = []) {
  const rng = (() => { let s = Math.abs(seed % 2147483647) || 1; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  const pool = PLANET_TYPES.filter(t => !excludeTypes.includes(t.type));
  const t    = (pool.length > 0 ? pool : PLANET_TYPES)[Math.floor(rng() * (pool.length > 0 ? pool : PLANET_TYPES).length)];
  const name = PLANET_PREFIXES[Math.floor(rng() * PLANET_PREFIXES.length)]
             + ' ' + PLANET_SUFFIXES[Math.floor(rng() * PLANET_SUFFIXES.length)];
  const slots = 6 + Math.floor(rng() * 7); // 6–12
  const n = (GS.planets || []).length;
  const colonizeCost = {
    minerals: 150 + n * 80,
    credits:  250 + n * 120,
  };
  return { id: seed, name, type: t.type, sym: t.sym, col: t.col, slots, desc: t.desc, modifiers: t.modifiers, colonizeCost };
}

function generateAvailablePlanets(count = 5) {
  const planets = [];
  const usedTypes = [];
  let seed = (Math.random() * 2147483647) | 0;
  while (planets.length < count) {
    const p = generatePlanet(seed, usedTypes);
    usedTypes.push(p.type);
    planets.push(p);
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
  }
  return planets;
}

function switchActivePlanet(idx) {
  GS.activePlanetId = idx;
  renderAll();
}

function colonizePlanet(planetId) {
  if (!GS) return;
  const avail = GS.availablePlanets.find(p => p.id === planetId);
  if (!avail) return;

  if ((GS.fleet.colony || 0) < 1 || (GS.fleet.warship || 0) < 1) {
    addLog('warn', 'Kolonisierung fehlgeschlagen — benötigt 1× Kolonisierungsschiff + 1× Kriegsschiff.');
    renderLog(); return;
  }

  const canAfford = Object.entries(avail.colonizeCost)
    .every(([res, amt]) => (GS.resources[res]?.v ?? 0) >= amt);
  if (!canAfford) {
    const miss = Object.entries(avail.colonizeCost)
      .filter(([res, amt]) => (GS.resources[res]?.v ?? 0) < amt)
      .map(([res]) => GS.resources[res]?.label ?? res).join(', ');
    addLog('warn', `Kolonisierung fehlgeschlagen — zu wenig: ${miss}.`);
    renderLog(); return;
  }

  GS.fleet.colony--;
  GS.fleet.warship--;
  for (const [res, amt] of Object.entries(avail.colonizeCost)) GS.resources[res].v -= amt;

  const newPlanet = { ...avail, buildings: [] };
  GS.planets.push(newPlanet);

  // Replace the slot with a freshly generated planet of a different type
  const idx = GS.availablePlanets.findIndex(p => p.id === planetId);
  const takenTypes = GS.availablePlanets.filter((_, i) => i !== idx).map(p => p.type);
  GS.availablePlanets[idx] = generatePlanet(Date.now() + idx * 97331, takenTypes);

  recalcRates();
  addLog('ok', `${newPlanet.name} (${newPlanet.type}) kolonisiert! ${newPlanet.slots} Bauplätze erschlossen.`);
  renderAll();
}

function refreshAvailablePlanets(showBackBtn = false) {
  GS.availablePlanets = generateAvailablePlanets(5);
  renderPlanets(showBackBtn);
}

function renderPlanets(showBackBtn = false) {
  const el = document.getElementById('tab-content');
  let html = `<div class="panel-title" style="display:flex;justify-content:space-between;align-items:center;">
    <span>Planeten <span style="font-family:'Share Tech Mono',monospace;color:#2e4060;font-size:9px;">${GS.planets.length} kolonisiert</span></span>
    <div style="display:flex;gap:5px;">
      ${showBackBtn ? `<button class="planet-view-btn" onclick="showFleetView()">← Zurück</button>` : ''}
      <button class="planet-view-btn" onclick="refreshAvailablePlanets(${showBackBtn})" title="Neue Ziele generieren">⟳ Refresh</button>
    </div>
  </div>`;

  // Colonized planets
  html += `<div class="research-tier-label">— Kolonisiert —</div>`;
  GS.planets.forEach((p, idx) => {
    const isActive = idx === GS.activePlanetId;
    html += `<div class="planet-entry${isActive ? ' planet-active' : ''}">
      <div class="planet-entry-head">
        <span style="color:${p.col};font-size:16px;line-height:1">${p.sym}</span>
        <div style="flex:1;min-width:0">
          <div class="planet-entry-name">${p.name}</div>
          <div class="planet-entry-type">${p.type} · ${p.buildings.length}/${p.slots} Gebäude</div>
          ${Object.keys(p.modifiers || {}).length ? `<div class="planet-entry-mods">${describeModifiers(p.modifiers)}</div>` : ''}
        </div>
        <button class="planet-view-btn${isActive ? ' active' : ''}" onclick="switchActivePlanet(${idx})">${isActive ? '▶ Aktiv' : 'Ansehen'}</button>
      </div>
    </div>`;
  });

  // Available planets
  html += `<div class="research-tier-label">— Entdeckt — 5 Ziele</div>`;
  for (const p of GS.availablePlanets) {
    const costStr = Object.entries(p.colonizeCost)
      .map(([res, amt]) => `${GS.resources[res]?.sym ?? res}${amt}`).join(' ');
    const hasColony  = (GS.fleet?.colony  || 0) >= 1;
    const hasWarship = (GS.fleet?.warship || 0) >= 1;
    const canAfford  = Object.entries(p.colonizeCost)
      .every(([res, amt]) => (GS.resources[res]?.v ?? 0) >= amt);
    const canColonize = hasColony && hasWarship && canAfford;
    const reason = !hasColony ? '— kein Kolonieschiff' : !hasWarship ? '— kein Kriegsschiff' : !canAfford ? '— zu wenig Res.' : '';

    html += `<div class="planet-entry">
      <div class="planet-entry-head">
        <span style="color:${p.col};font-size:16px;line-height:1">${p.sym}</span>
        <div style="flex:1;min-width:0">
          <div class="planet-entry-name">${p.name}</div>
          <div class="planet-entry-type">${p.type} · ${p.slots} Bauplätze</div>
          <div class="planet-entry-mods">${p.desc}</div>
        </div>
      </div>
      <div class="planet-colonize-row">
        <span class="ship-cost">Schiffe: ◉1 ▲1 · ${costStr}</span>
        <button class="research-btn" ${canColonize ? `onclick="colonizePlanet(${p.id})"` : 'disabled'}>
          ${canColonize ? 'Kolonisieren' : reason}
        </button>
      </div>
    </div>`;
  }

  el.innerHTML = html;
}

function describeModifiers(mods) {
  return Object.entries(mods).map(([bt, m]) => {
    const sym = BLDG[bt]?.sym ?? bt;
    const pct = Math.round((m - 1) * 100);
    const col = m > 1 ? '#4ade80' : '#f87171';
    return `<span style="color:${col}">${sym} ${pct > 0 ? '+' : ''}${pct}%</span>`;
  }).join(' · ');
}
