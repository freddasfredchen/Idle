let GS = null;

function createInitialState() {
  return {
    meta: { lastSaved: Date.now(), gameTick: 0 },
    dynasty: {
      name: "Haus von Steinberg",
      ruler: { name: "Albrecht I.", traits: ["Gierig", "Paranoid"], age: 48 },
      generation: 1,
    },
    resources: {
      energy:    { v: 0, cap: 999, rate: 0, decay: 0, consumption: 0, label: "Energie", sym: "⚡", col: "#fbbf24" },
      minerals:  { v: 80,   cap: 500,  rate: 0, decay: 0,       label: "Mineralien", sym: "⬡", col: "#94a3b8" },
      food:      { v: 200,  cap: 800,  rate: 0, decay: 0,       label: "Nahrung",    sym: "◇", col: "#86efac" },
      credits:   { v: 500,  cap: 9999, rate: 0, decay: 0,       label: "Credits",    sym: "₡", col: "#c8aa4f" },
      research:  { v: 20,   cap: 300,  rate: 0, decay: 0,       label: "Forschung",  sym: "⬢", col: "#7dd3fc" },
      influence: { v: 45,   cap: 200,  rate: 0, decay: -0.03,   label: "Einfluss",   sym: "◈", col: "#e879f9" },
      loyalty:   { v: 72,   cap: 100,  rate: 0, decay: -0.005,  label: "Loyalität",  sym: "♥", col: "#f87171" },
    },
    planet: {
      name: "Kepler Prime", type: "Startkolonie", slots: 12,
      buildings: [
        { id: 1, type: "solar",    name: "Solaranlage Mk.II",       level: 2, slot: 0 },
        { id: 2, type: "mine",     name: "Asteroidenmine",           level: 1, slot: 1 },
        { id: 3, type: "farm",     name: "Hydroponie-Komplex",       level: 1, slot: 2 },
        { id: 4, type: "ministry", name: "Min. f. Wahrh. u. Verw.", level: 1, slot: 3 },
      ],
    },
    factions: [
      { id: "corp",    name: "Patriot. Unternehmerfront",  sat: 62, pow: 35, inf: 28, col: "#fbbf24", lastRebTick: -999, lastCorrTick: -999 },
      { id: "science", name: "Aufgekl. Expansionisten",    sat: 48, pow: 20, inf: 24, col: "#60a5fa", lastRebTick: -999, lastCorrTick: -999 },
      { id: "workers", name: "Arbeiterkollektiv Ω-7",      sat: 31, pow: 45, inf: 22, col: "#f87171", lastRebTick: -999, lastCorrTick: -999 },
      { id: "order",   name: "Orden d. Kosm. Wahrheit",    sat: 71, pow: 25, inf: 26, col: "#a78bfa", lastRebTick: -999, lastCorrTick: -999 },
    ],
    research: [],
    decrees: [],
    fleet: { colony: 0, trade: 0, warship: 0, raidActive: false, raidEndTick: 0, specialists: [] },
    log: [
      { id: 1, sev: "ok",   msg: "Kepler Prime kolonisiert. Protokoll 7-B initiiert." },
      { id: 2, sev: "warn", msg: "Arbeiterkollektiv Ω-7: 'spontane Erholungsaktivitäten' in Sektor 3 gemeldet." },
      { id: 3, sev: "info", msg: "Min. f. Wahrheit u. Verwandtes aufgenommen. Produktivität: statistisch vernachlässigbar gestiegen." },
      { id: 4, sev: "warn", msg: "Loyalitätswerte sinken. Erlass 4-C ('Optimierte Freizeitgestaltung') empfohlen." },
    ],
  };
}

function applyOffline(state) {
  const now = Date.now();
  const elapsed = (now - state.meta.lastSaved) / 1000;
  if (elapsed < 2) return { ...state, meta: { ...state.meta, lastSaved: now } };

  const decayElapsed = Math.min(elapsed, MAX_OFFLINE_DECAY_S);
  const newRes = {};
  for (const [k, r] of Object.entries(state.resources)) {
    if (k === 'energy') { newRes[k] = { ...r }; continue; }
    let v = r.v + r.rate * elapsed + r.decay * decayElapsed;
    if (k === 'loyalty') v = Math.max(LOYALTY_FLOOR, v);
    v = Math.max(0, Math.min(r.cap, v));
    newRes[k] = { ...r, v };
  }

  const mins = Math.round(elapsed / 60);
  const newLog = [
    { id: now, sev: "info", msg: `Offline-Protokoll: ${mins > 60 ? Math.round(mins/60)+'h' : mins+'min'} Abwesenheit kompensiert. Das Reich ist, wider Erwarten, noch existent.` },
    ...state.log
  ].slice(0, 25);

  return { ...state, resources: newRes, log: newLog, meta: { ...state.meta, lastSaved: now } };
}

function recalcRates() {
  // Reset rates and caps to base values
  for (const [k, r] of Object.entries(GS.resources)) {
    if (k !== 'energy') r.rate = BASE_RATES[k] || 0;
    if (BASE_CAPS[k] !== undefined) r.cap = BASE_CAPS[k];
  }

  // ── Research effects ──────────────────────────────────────────
  const buildProdMult = {};
  let researchDrainMult = 1;
  let loyaltyDecayMult = 1;

  for (const id of (GS.research || [])) {
    const r = RESEARCH[id];
    if (!r) continue;
    const e = r.effect;
    if (e.type === 'prod_mult') {
      buildProdMult[e.building] = (buildProdMult[e.building] || 1) * e.multiplier;
    } else if (e.type === 'drain_mult') {
      researchDrainMult *= e.multiplier;
    } else if (e.type === 'cap_increase') {
      for (const res of e.resources) {
        if (GS.resources[res]) GS.resources[res].cap += e.amount;
      }
    } else if (e.type === 'cap_increase_all') {
      for (const k of Object.keys(GS.resources)) {
        if (k !== 'energy') GS.resources[k].cap += e.amount;
      }
    } else if (e.type === 'loyalty_decay_mult') {
      loyaltyDecayMult *= e.multiplier;
    }
    // faction_sat_rate and faction_inf_delta handled in tick / doResearch
  }

  // ── Decree rate effects ───────────────────────────────────────
  let decreeProdAllMult = 1;
  const decreeBuildMult = {};
  const decreeFlatRate = {};
  let decreeLoyaltyNoDecay = false;

  for (const id of (GS.decrees || [])) {
    const d = DECREES[id];
    if (!d?.rateEffects) continue;
    const e = d.rateEffects;
    if (e.prod_all_mult) decreeProdAllMult *= e.prod_all_mult;
    if (e.building_mult) {
      for (const [btype, mult] of Object.entries(e.building_mult)) {
        decreeBuildMult[btype] = (decreeBuildMult[btype] || 1) * mult;
      }
    }
    if (e.resource_flat) {
      for (const [res, delta] of Object.entries(e.resource_flat)) {
        decreeFlatRate[res] = (decreeFlatRate[res] || 0) + delta;
      }
    }
    if (e.loyalty_no_decay) decreeLoyaltyNoDecay = true;
  }

  // Loyalty decay: decree surveillance overrides research multiplier
  if (decreeLoyaltyNoDecay) {
    GS.resources.loyalty.decay = 0;
  } else {
    GS.resources.loyalty.decay = -0.005 * loyaltyDecayMult;
  }

  // ── Energy computation ────────────────────────────────────────
  let energyProd = 0;
  let energyDrain = 0;
  for (const b of GS.planet.buildings) {
    const meta = BLDG[b.type];
    if (!meta) continue;
    if (b.type === 'solar') {
      const mult = (buildProdMult['solar'] || 1) * (decreeBuildMult['solar'] || 1) * decreeProdAllMult;
      energyProd += (meta.prod.base + (b.level - 1) * meta.prod.perLevel) * mult;
    } else if (meta.drain) {
      energyDrain += (meta.drain.base + (b.level - 1) * meta.drain.perLevel) * researchDrainMult;
    }
  }
  GS.resources.energy.v = energyProd;
  GS.resources.energy.consumption = energyDrain;
  GS.resources.energy.rate = 0;

  const efficiency = energyDrain > 0 ? Math.min(1, energyProd / energyDrain) : 1;

  // ── Building production rates ─────────────────────────────────
  for (const b of GS.planet.buildings) {
    if (b.type === 'solar') continue;
    const meta = BLDG[b.type];
    if (!meta?.resource) continue;
    const res = GS.resources[meta.resource];
    if (!res) continue;
    const researchMult = buildProdMult[b.type] || 1;
    const decreeMult = (decreeBuildMult[b.type] || 1) * decreeProdAllMult;
    res.rate += (meta.prod.base + (b.level - 1) * meta.prod.perLevel) * efficiency * researchMult * decreeMult;
  }

  // Flat rate bonuses from active decrees
  for (const [res, delta] of Object.entries(decreeFlatRate)) {
    if (GS.resources[res]) GS.resources[res].rate += delta;
  }

  // Trade ship passive income + specialist bonuses
  if (GS.fleet) {
    GS.resources.credits.rate += (GS.fleet.trade || 0) * 0.2;
    for (const s of (GS.fleet.specialists || [])) {
      if (GS.resources[s.resource]) GS.resources[s.resource].rate += s.bonus;
    }
  }

  // Passive corruption drain when faction power > 80
  for (const f of (GS.factions || [])) {
    const pow = f.pow || 0;
    if (pow > 80) GS.resources.credits.rate -= (pow - 80) * 0.003;
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    GS = saved ? applyOffline(JSON.parse(saved)) : createInitialState();
  } catch {
    GS = createInitialState();
  }
  if (!GS.research) GS.research = [];
  if (!GS.decrees)  GS.decrees  = [];
  if (!GS.fleet)    GS.fleet    = { colony: 0, trade: 0, warship: 0, raidActive: false, raidEndTick: 0, specialists: [] };
  if (!GS.fleet.specialists) GS.fleet.specialists = [];
  for (const f of GS.factions) {
    if (f.pow           === undefined) f.pow           = 30;
    if (f.lastRebTick   === undefined) f.lastRebTick   = -999;
    if (f.lastCorrTick  === undefined) f.lastCorrTick  = -999;
  }
  recalcRates();
  renderAll();
}
