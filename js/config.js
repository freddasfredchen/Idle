const SAVE_KEY = 'gds_v2';
const TICK_MS = 1000;
const MAX_OFFLINE_DECAY_S = 21600; // 6h cap
const LOYALTY_FLOOR = 15;

let currentTab = 'factions';

const BASE_RATES = {
  research: 0.3,
  influence: 0.15,
};

// Base caps reset in recalcRates so research bonuses layer on top cleanly
const BASE_CAPS = {
  minerals: 500, food: 800, credits: 9999, research: 300, influence: 200, loyalty: 100,
};

// solar.prod = Energieproduktion (kW), alle anderen: drain = Energieverbrauch (kW)
const BLDG = {
  solar:    { name: "Solaranlage",         sym: "◉", col: "#fbbf24", resource: null,        prod:  { base: 5.0,  perLevel: 3.0  },                                 buildCost: { minerals: 50,  credits: 100 }, upgradeCostBase: { minerals: 30,  credits: 50   } },
  mine:     { name: "Asteroidenmine",      sym: "⬡", col: "#94a3b8", resource: "minerals",  prod:  { base: 1.2,  perLevel: 0.8  }, drain: { base: 2.0, perLevel: 0.5 }, buildCost: { minerals: 40,  credits:  80 }, upgradeCostBase: { minerals: 30,  credits: 60   } },
  farm:     { name: "Hydroponie-Komplex",  sym: "◇", col: "#86efac", resource: "food",      prod:  { base: 2.1,  perLevel: 1.2  }, drain: { base: 1.5, perLevel: 0.5 }, buildCost: { minerals: 30,  credits:  60 }, upgradeCostBase: { minerals: 20,  credits: 40   } },
  ministry: { name: "Ministerium",         sym: "◆", col: "#c084fc", resource: "credits",   prod:  { base: 0.8,  perLevel: 0.5  }, drain: { base: 1.0, perLevel: 0.3 }, buildCost: { credits:  150, influence: 30 }, upgradeCostBase: { credits: 120, influence: 25 } },
  lab:      { name: "Forschungslabor",     sym: "⬢", col: "#7dd3fc", resource: "research",  prod:  { base: 0.5,  perLevel: 0.3  }, drain: { base: 3.0, perLevel: 1.0 }, buildCost: { credits:  200, research:  10 }, upgradeCostBase: { credits: 100, minerals: 30  } },
  barracks: { name: "Kaserne",             sym: "▲", col: "#f87171", resource: "loyalty",   prod:  { base: 0.05, perLevel: 0.03 }, drain: { base: 2.0, perLevel: 0.5 }, buildCost: { minerals: 60,  credits:  100}, upgradeCostBase: { minerals: 50, credits:  80  } },
  shipyard: { name: "Raumwerft",           sym: "◈", col: "#e879f9", resource: "influence", prod:  { base: 0.1,  perLevel: 0.08 }, drain: { base: 4.0, perLevel: 1.0 }, buildCost: { minerals: 100, credits:  200}, upgradeCostBase: { minerals: 100, credits: 150 } },
};

const RESEARCH = {
  // Stufe 1 — keine Voraussetzungen
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
  // Stufe 2 — je eine Stufe-1-Forschung nötig
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
  // Stufe 3 — zwei Stufe-2-Forschungen nötig
  loyalty_matrix: {
    name: "Loyalitäts-Matrix", sym: "♥", tier: 3,
    desc: "Psychosoziale Konditionierung halbiert den Loyalitätsverfall.",
    cost: { research: 80, credits: 200, influence: 30 }, requires: ['superconductor', 'fiscal'],
    effect: { type: 'loyalty_decay_mult', multiplier: 0.5 },
  },
  megastructure: {
    name: "Megastruktur-Programm", sym: "★", tier: 3,
    desc: "+1000 Lagerkapazität für alle Ressourcen.",
    cost: { research: 100, minerals: 200, credits: 300 }, requires: ['quantum', 'orbital_storage'],
    effect: { type: 'cap_increase_all', amount: 1000 },
  },
};
