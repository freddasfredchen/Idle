const SAVE_KEY = 'gds_v1';
const TICK_MS = 1000;
const MAX_OFFLINE_DECAY_S = 21600; // 6h cap
const LOYALTY_FLOOR = 15;

let currentTab = 'factions';

// Grundproduktion ohne Gebäude
const BASE_RATES = {
  research: 0.3,
  influence: 0.15,
};

// solar.prod = Energieproduktion (kW), alle anderen: drain = Energieverbrauch (kW)
const BLDG = {
  solar:    { name: "Solaranlage",         sym: "◉", col: "#fbbf24", resource: null,        prod:  { base: 5.0,  perLevel: 3.0  },                                 upgradeCostBase: { minerals: 30,  credits: 50   } },
  mine:     { name: "Asteroidenmine",      sym: "⬡", col: "#94a3b8", resource: "minerals",  prod:  { base: 1.2,  perLevel: 0.8  }, drain: { base: 2.0, perLevel: 0.5 }, upgradeCostBase: { minerals: 30,  credits: 60   } },
  farm:     { name: "Hydroponie-Komplex",  sym: "◇", col: "#86efac", resource: "food",      prod:  { base: 2.1,  perLevel: 1.2  }, drain: { base: 1.5, perLevel: 0.5 }, upgradeCostBase: { minerals: 20,  credits: 40   } },
  ministry: { name: "Ministerium",         sym: "◆", col: "#c084fc", resource: "credits",   prod:  { base: 0.8,  perLevel: 0.5  }, drain: { base: 1.0, perLevel: 0.3 }, upgradeCostBase: { credits: 120, influence: 25 } },
  lab:      { name: "Forschungslabor",     sym: "⬢", col: "#7dd3fc", resource: "research",  prod:  { base: 0.5,  perLevel: 0.3  }, drain: { base: 3.0, perLevel: 1.0 }, upgradeCostBase: { credits: 100, minerals: 30  } },
  barracks: { name: "Kaserne",             sym: "▲", col: "#f87171", resource: "loyalty",   prod:  { base: 0.05, perLevel: 0.03 }, drain: { base: 2.0, perLevel: 0.5 }, upgradeCostBase: { minerals: 50, credits:  80  } },
  shipyard: { name: "Raumwerft",           sym: "◈", col: "#e879f9", resource: "influence", prod:  { base: 0.1,  perLevel: 0.08 }, drain: { base: 4.0, perLevel: 1.0 }, upgradeCostBase: { minerals: 100, credits: 150 } },
};
