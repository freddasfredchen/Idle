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

const BLDG = {
  solar:    { sym: "◉", col: "#fbbf24", resource: "energy",    prod: { base: 2.0,  perLevel: 1.5  }, upgradeCostBase: { energy: 30,   minerals: 15  } },
  mine:     { sym: "⬡", col: "#94a3b8", resource: "minerals",  prod: { base: 1.2,  perLevel: 0.8  }, upgradeCostBase: { energy: 20,   credits:  60  } },
  farm:     { sym: "◇", col: "#86efac", resource: "food",      prod: { base: 2.1,  perLevel: 1.2  }, upgradeCostBase: { energy: 15,   credits:  40  } },
  ministry: { sym: "◆", col: "#c084fc", resource: "credits",   prod: { base: 0.8,  perLevel: 0.5  }, upgradeCostBase: { credits: 120, influence: 25 } },
  lab:      { sym: "⬢", col: "#7dd3fc", resource: "research",  prod: { base: 0.5,  perLevel: 0.3  }, upgradeCostBase: { credits: 100, energy:   50  } },
  barracks: { sym: "▲", col: "#f87171", resource: "loyalty",   prod: { base: 0.05, perLevel: 0.03 }, upgradeCostBase: { minerals: 50, credits:  80  } },
  shipyard: { sym: "◈", col: "#e879f9", resource: "influence", prod: { base: 0.1,  perLevel: 0.08 }, upgradeCostBase: { minerals: 100, credits: 150 } },
};
