const SAVE_KEY = 'gds_v2';
const TICK_MS = 1000;
const MAX_OFFLINE_DECAY_S = 21600;
const LOYALTY_FLOOR = 15;

let currentTab = 'factions';

const BASE_RATES = {
  research: 0.3,
  influence: 0.15,
};

const BASE_CAPS = {
  minerals: 500, food: 800, credits: 9999, research: 300, influence: 200, loyalty: 100,
};

const BLDG = {
  solar:    { name: "Solaranlage",         sym: "◉", col: "#fbbf24", resource: null,        prod:  { base: 5.0,  perLevel: 3.0  },                                 buildCost: { minerals: 50,  credits: 100 }, upgradeCostBase: { minerals: 30,  credits: 50   } },
  mine:     { name: "Asteroidenmine",      sym: "⬡", col: "#94a3b8", resource: "minerals",  prod:  { base: 1.2,  perLevel: 0.8  }, drain: { base: 2.0, perLevel: 0.5 }, buildCost: { minerals: 40,  credits:  80 }, upgradeCostBase: { minerals: 30,  credits: 60   } },
  farm:     { name: "Hydroponie-Komplex",  sym: "◇", col: "#86efac", resource: "food",      prod:  { base: 2.1,  perLevel: 1.2  }, drain: { base: 1.5, perLevel: 0.5 }, buildCost: { minerals: 30,  credits:  60 }, upgradeCostBase: { minerals: 20,  credits: 40   } },
  ministry: { name: "Ministerium",         sym: "◆", col: "#c084fc", resource: "credits",   prod:  { base: 0.8,  perLevel: 0.5  }, drain: { base: 1.0, perLevel: 0.3 }, buildCost: { credits:  150, influence: 30 }, upgradeCostBase: { credits: 120, influence: 25 } },
  lab:      { name: "Forschungslabor",     sym: "⬢", col: "#7dd3fc", resource: "research",  prod:  { base: 0.5,  perLevel: 0.3  }, drain: { base: 3.0, perLevel: 1.0 }, buildCost: { credits:  200, research:  10 }, upgradeCostBase: { credits: 100, minerals: 30  } },
  barracks: { name: "Kaserne",             sym: "▲", col: "#f87171", resource: "loyalty",   prod:  { base: 0.05, perLevel: 0.03 }, drain: { base: 2.0, perLevel: 0.5 }, buildCost: { minerals: 60,  credits:  100}, upgradeCostBase: { minerals: 50, credits:  80  } },
  shipyard: { name: "Raumwerft",           sym: "◈", col: "#e879f9", resource: "influence", prod:  { base: 0.1,  perLevel: 0.08 }, drain: { base: 4.0, perLevel: 1.0 }, buildCost: { minerals: 100, credits:  200}, upgradeCostBase: { minerals: 100, credits: 150 } },
};

// effect types:
//   prod_mult           → { building, multiplier }       – applied in recalcRates per building
//   drain_mult          → { multiplier }                  – applied in recalcRates to energy drain
//   cap_increase        → { resources[], amount }         – applied in recalcRates
//   cap_increase_all    → { amount }                      – applied in recalcRates
//   loyalty_decay_mult  → { multiplier }                  – applied in recalcRates
//   faction_sat_rate    → { rates: {factionId: perSec} }  – applied each tick
//   faction_inf_delta   → { deltas: {factionId: delta} }  – applied once on research completion
const RESEARCH = {
  // ── Stufe 1 (keine Voraussetzungen) ──────────────────────────
  mining_tech: {
    name: "Verbesserte Bergbautechnik", sym: "⬡", tier: 1,
    desc: "Asteroidenminen produzieren 25% mehr Mineralien.",
    cost: { research: 20 }, requires: [],
    effect: { type: 'prod_mult', building: 'mine', multiplier: 1.25 },
  },
  hydro2: {
    name: "Hydroponie 2.0", sym: "◇", tier: 1,
    desc: "Hydroponie-Komplexe produzieren 25% mehr Nahrung.",
    cost: { research: 20 }, requires: [],
    effect: { type: 'prod_mult', building: 'farm', multiplier: 1.25 },
  },
  fiscal: {
    name: "Fiskalreform", sym: "◆", tier: 1,
    desc: "Ministerien erwirtschaften 25% mehr Credits.",
    cost: { research: 25 }, requires: [],
    effect: { type: 'prod_mult', building: 'ministry', multiplier: 1.25 },
  },
  solar_opt: {
    name: "Solaroptimierung", sym: "◉", tier: 1,
    desc: "Solaranlagen erzeugen 20% mehr Energie.",
    cost: { research: 15 }, requires: [],
    effect: { type: 'prod_mult', building: 'solar', multiplier: 1.2 },
  },
  // ── Stufe 2 ──────────────────────────────────────────────────
  superconductor: {
    name: "Supraleitung", sym: "⚡", tier: 2,
    desc: "Alle Gebäude verbrauchen 20% weniger Energie.",
    cost: { research: 50, credits: 80 }, requires: ['solar_opt'],
    effect: { type: 'drain_mult', multiplier: 0.8 },
  },
  quantum: {
    name: "Quantencomputing", sym: "⬢", tier: 2,
    desc: "Forschungslabore produzieren 30% mehr Forschungspunkte.",
    cost: { research: 40, credits: 60 }, requires: ['mining_tech'],
    effect: { type: 'prod_mult', building: 'lab', multiplier: 1.3 },
  },
  orbital_storage: {
    name: "Orbitallager", sym: "◈", tier: 2,
    desc: "+500 Lagerkapazität für Mineralien und Nahrung.",
    cost: { research: 45, minerals: 100 }, requires: ['hydro2'],
    effect: { type: 'cap_increase', resources: ['minerals', 'food'], amount: 500 },
  },
  propaganda: {
    name: "Propaganda-Netz", sym: "◎", tier: 2,
    desc: "Staatspropaganda stabilisiert Corp und Orden (+0.02/s), destabilisiert das Arbeiterkollektiv (-0.05/s).",
    cost: { research: 40, credits: 60 }, requires: ['fiscal'],
    effect: { type: 'faction_sat_rate', rates: { corp: 0.02, order: 0.02, workers: -0.05 } },
  },
  // ── Stufe 3 ──────────────────────────────────────────────────
  loyalty_matrix: {
    name: "Loyalitäts-Matrix", sym: "♥", tier: 3,
    desc: "Psychosoziale Konditionierung halbiert den natürlichen Loyalitätsverfall.",
    cost: { research: 80, credits: 200, influence: 30 }, requires: ['superconductor', 'fiscal'],
    effect: { type: 'loyalty_decay_mult', multiplier: 0.5 },
  },
  megastructure: {
    name: "Megastruktur-Programm", sym: "★", tier: 3,
    desc: "+1000 Lagerkapazität für alle Ressourcen.",
    cost: { research: 100, minerals: 200, credits: 300 }, requires: ['quantum', 'orbital_storage'],
    effect: { type: 'cap_increase_all', amount: 1000 },
  },
  divide_conquer: {
    name: "Teile und Herrsche", sym: "⚔", tier: 3,
    desc: "Permanente Schwächung der größten Oppositionsfraktionen: Corp −10 Einfluss, Arbeiter −8 Einfluss. Nicht umkehrbar.",
    cost: { research: 90, influence: 50, credits: 150 }, requires: ['propaganda', 'quantum'],
    effect: { type: 'faction_inf_delta', deltas: { corp: -10, workers: -8 } },
  },
};

// rateEffects:
//   prod_all_mult   → multiplier on all non-solar building production
//   building_mult   → { btype: multiplier }
//   resource_flat   → { res: delta/s } added directly to resource rate
//   loyalty_no_decay → boolean, overrides loyalty decay to 0
//
// factionSatRate: { factionId: perSecond } – applied each tick while decree is active
const DECREES = {
  leisure_opt: {
    name: "Optimierte Freizeitgestaltung", sym: "⚙",
    desc: "+15% Produktion aller Gebäude. Das Arbeiterkollektiv verliert stetig an Zufriedenheit.",
    cost: { influence: 30 },
    rateEffects: { prod_all_mult: 1.15 },
    factionSatRate: { workers: -0.05 },
  },
  war_tax: {
    name: "Kriegssteuer", sym: "₡",
    desc: "+40% Kredite aus Ministerien. Die Unternehmerfront verliert stetig an Zufriedenheit.",
    cost: { influence: 25 },
    rateEffects: { building_mult: { ministry: 1.4 } },
    factionSatRate: { corp: -0.04 },
  },
  surveillance: {
    name: "Überwachungsprogramm", sym: "◉",
    desc: "Loyalitätsverfall komplett gestoppt. Die Aufgeklärten Expansionisten verlieren an Zufriedenheit.",
    cost: { influence: 45 },
    rateEffects: { loyalty_no_decay: true },
    factionSatRate: { science: -0.04 },
  },
  labor_duty: {
    name: "Arbeitspflicht", sym: "▲",
    desc: "+30% Mine- und Farmproduktion. Das Arbeiterkollektiv verliert schnell an Zufriedenheit.",
    cost: { influence: 25 },
    rateEffects: { building_mult: { mine: 1.3, farm: 1.3 } },
    factionSatRate: { workers: -0.08 },
  },
  research_fund: {
    name: "Staatsforschungsprogramm", sym: "⬢",
    desc: "+50% Forschungsproduktion aller Labore. Kostet 0.3 Credits/s. Wissenschaftler begeistert.",
    cost: { influence: 35 },
    rateEffects: { building_mult: { lab: 1.5 }, resource_flat: { credits: -0.3 } },
    factionSatRate: { science: 0.05 },
  },
  media_control: {
    name: "Staatliche Medienkontrolle", sym: "◆",
    desc: "Gleichgeschaltete Medien: Corp und Orden gewinnen Zufriedenheit, Wissenschaftler verlieren.",
    cost: { influence: 40 },
    rateEffects: {},
    factionSatRate: { corp: 0.04, order: 0.04, science: -0.05 },
  },
  rationing: {
    name: "Rationierungsprogramm", sym: "◇",
    desc: "+25% Nahrungsproduktion. Staatliche Bürokratie kostet 0.25 Credits/s.",
    cost: { influence: 20 },
    rateEffects: { building_mult: { farm: 1.25 }, resource_flat: { credits: -0.25 } },
    factionSatRate: {},
  },
};
