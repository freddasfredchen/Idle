const SAVE_KEY = 'gds_v2';
const TICK_MS = 1000;
const MAX_OFFLINE_DECAY_S = 21600;
const LOYALTY_FLOOR = 15;
const FACTION_POW_BASE_RATE = 0.001;
const RAID_DURATION_TICKS = 60;
const RAID_COST = { credits: 30, influence: 10 };

// modifiers: { buildingType: productionMultiplier }
const PLANET_TYPES = [
  { type: "Mineralreiche Welt",  sym: "⬡", col: "#94a3b8", modifiers: { mine: 1.5, farm: 0.7 },                    desc: "+50% Minen · −30% Farmen" },
  { type: "Agrarwelt",           sym: "◇", col: "#86efac", modifiers: { farm: 1.6, mine: 0.8 },                    desc: "+60% Farmen · −20% Minen" },
  { type: "Handelsknoten",       sym: "₡", col: "#c8aa4f", modifiers: { ministry: 1.4, shipyard: 1.3 },            desc: "+40% Ministerium · +30% Raumwerft" },
  { type: "Forschungskolonie",   sym: "⬢", col: "#7dd3fc", modifiers: { lab: 1.6, mine: 0.8 },                    desc: "+60% Labor · −20% Minen" },
  { type: "Militärstützpunkt",   sym: "▲", col: "#f87171", modifiers: { barracks: 1.7, shipyard: 1.2 },            desc: "+70% Kaserne · +20% Raumwerft" },
  { type: "Energiereiche Welt",  sym: "◉", col: "#fbbf24", modifiers: { solar: 1.8, farm: 0.75 },                  desc: "+80% Solar · −25% Farmen" },
  { type: "Politisches Zentrum", sym: "◈", col: "#e879f9", modifiers: { ministry: 1.5, shipyard: 1.3, lab: 0.8 }, desc: "+50% Ministerium · +30% Raumwerft · −20% Labor" },
  { type: "Toxische Welt",       sym: "◎", col: "#fb923c", modifiers: { mine: 1.9, farm: 0.4 },                   desc: "+90% Minen · −60% Farmen" },
  { type: "Eiswelt",             sym: "◇", col: "#bfdbfe", modifiers: { solar: 0.5, mine: 1.4, lab: 1.3 },        desc: "−50% Solar · +40% Minen · +30% Labor" },
  { type: "Gasgigant-Mond",      sym: "◉", col: "#a78bfa", modifiers: { solar: 1.4, shipyard: 1.3, farm: 0.85 },  desc: "+40% Solar · +30% Raumwerft · −15% Farmen" },
  { type: "Strategischer Orbit", sym: "◈", col: "#60a5fa", modifiers: { barracks: 1.3, shipyard: 1.5 },            desc: "+30% Kaserne · +50% Raumwerft" },
  { type: "Feuchte Welt",        sym: "◇", col: "#34d399", modifiers: { farm: 1.8, mine: 0.7, solar: 0.9 },       desc: "+80% Farmen · −30% Minen · −10% Solar" },
];

const PLANET_PREFIXES = ["Proxima","Vega","Lyra","Arcturus","Sirius","Rigel","Aldebaran","Capella","Bellatrix","Deneb","Altair","Spica","Antares","Pollux","Fomalhaut","Hadar","Acrux","Mimosa","Agena","Ankaa","Saiph","Elnath","Canopus","Avior","Acamar","Algol","Mira","Izar","Nashira","Schedar"];
const PLANET_SUFFIXES = ["II","III","IV","V","VI","Alpha","Beta","Gamma","Delta","Prime","Minor","Major","Ultima","Nova","Eris","Omega"];

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

const RESEARCH = {
  // ── Stufe 1 ──────────────────────────────────────────────────
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
    desc: "Staatspropaganda stabilisiert Corp und Orden (+0.02/s), destabilisiert das Arbeiterkollektiv (−0.05/s Zufriedenheit).",
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

// factionSatRate: { factionId: sat/s }   – while active
// factionPowRate: { factionId: pow/s }   – while active (negative = suppress power)
// rateEffects:  see state.js recalcRates
const DECREES = {
  // ── Produktion ────────────────────────────────────────────────
  leisure_opt: {
    name: "Optimierte Freizeitgestaltung", sym: "⚙",
    desc: "+15% Produktion aller Gebäude. Arbeiter verlieren stetig Zufriedenheit und werden radikaler.",
    cost: { influence: 30 },
    rateEffects: { prod_all_mult: 1.15 },
    factionSatRate: { workers: -0.05 },
    factionPowRate: { workers: 0.003 },
  },
  war_tax: {
    name: "Kriegssteuer", sym: "₡",
    desc: "+40% Kredite aus Ministerien. Die Unternehmerfront verliert Zufriedenheit und Geduld.",
    cost: { influence: 25 },
    rateEffects: { building_mult: { ministry: 1.4 } },
    factionSatRate: { corp: -0.04 },
    factionPowRate: { corp: 0.002 },
  },
  surveillance: {
    name: "Überwachungsprogramm", sym: "◉",
    desc: "Loyalitätsverfall gestoppt. Wissenschaftler verlieren Zufriedenheit, ihr politischer Einfluss schwindet.",
    cost: { influence: 45 },
    rateEffects: { loyalty_no_decay: true },
    factionSatRate: { science: -0.04 },
    factionPowRate: { science: -0.003 },
  },
  labor_duty: {
    name: "Arbeitspflicht", sym: "▲",
    desc: "+30% Mine- und Farmproduktion. Das Arbeiterkollektiv verliert schnell Zufriedenheit und wird gefährlich.",
    cost: { influence: 25 },
    rateEffects: { building_mult: { mine: 1.3, farm: 1.3 } },
    factionSatRate: { workers: -0.08 },
    factionPowRate: { workers: 0.005 },
  },
  research_fund: {
    name: "Staatsforschungsprogramm", sym: "⬢",
    desc: "+50% Forschungsproduktion. Kostet 0.3 Credits/s. Wissenschaftler begeistert und politisch aktiver.",
    cost: { influence: 35 },
    rateEffects: { building_mult: { lab: 1.5 }, resource_flat: { credits: -0.3 } },
    factionSatRate: { science: 0.05 },
    factionPowRate: { science: 0.001 },
  },
  media_control: {
    name: "Staatliche Medienkontrolle", sym: "◆",
    desc: "Corp und Orden gewinnen Zufriedenheit und Einfluss. Wissenschaftler verlieren beides.",
    cost: { influence: 40 },
    rateEffects: {},
    factionSatRate: { corp: 0.04, order: 0.04, science: -0.05 },
    factionPowRate: { corp: 0.001, order: 0.001, science: -0.002 },
  },
  rationing: {
    name: "Rationierungsprogramm", sym: "◇",
    desc: "+25% Nahrungsproduktion. Staatliche Bürokratie kostet 0.25 Credits/s.",
    cost: { influence: 20 },
    rateEffects: { building_mult: { farm: 1.25 }, resource_flat: { credits: -0.25 } },
    factionSatRate: {},
    factionPowRate: {},
  },
  // ── Zufriedenheitserlass ───────────────────────────────────────
  volksfeste: {
    name: "Volksfeste und Spiele", sym: "★",
    desc: "Alle Fraktionen gewinnen Zufriedenheit (+0.02/s). Kostet laufend Nahrung und Credits. Macht sinkt leicht.",
    cost: { influence: 40 },
    rateEffects: { resource_flat: { food: -0.5, credits: -0.3 } },
    factionSatRate: { corp: 0.02, science: 0.02, workers: 0.02, order: 0.02 },
    factionPowRate: { corp: -0.001, science: -0.001, workers: -0.001, order: -0.001 },
  },
  workers_rights: {
    name: "Arbeiterschutzgesetz", sym: "⚒",
    desc: "Arbeiter +0.07/s Zufriedenheit, Macht sinkt. Unternehmerfront verliert Zufriedenheit. Mine/Farm −15%.",
    cost: { influence: 30 },
    rateEffects: { building_mult: { mine: 0.85, farm: 0.85 } },
    factionSatRate: { workers: 0.07, corp: -0.03 },
    factionPowRate: { workers: -0.003, corp: 0.002 },
  },
  corp_privileges: {
    name: "Unternehmensprivilegien", sym: "₡",
    desc: "Corp +0.06/s Zufriedenheit, Macht sinkt. Arbeiter verlieren Zufriedenheit. +0.2 Credits/s.",
    cost: { influence: 30 },
    rateEffects: { resource_flat: { credits: 0.2 } },
    factionSatRate: { corp: 0.06, workers: -0.03 },
    factionPowRate: { corp: -0.003, workers: 0.003 },
  },
  order_doctrine: {
    name: "Ordensdoktrin", sym: "◈",
    desc: "Orden +0.07/s Zufriedenheit, Macht sinkt. Wissenschaftler verlieren Zufriedenheit. +0.02/s Loyalität.",
    cost: { influence: 30 },
    rateEffects: { resource_flat: { loyalty: 0.02 } },
    factionSatRate: { order: 0.07, science: -0.03 },
    factionPowRate: { order: -0.003, science: 0.002 },
  },
};

const SHIPS = {
  colony: {
    name: "Kolonisierungsschiff", sym: "◉",
    desc: "Ermöglicht die Besiedlung neuer Planeten. Erfordert ein Kriegsschiff zur Sicherung.",
    cost: { minerals: 200, credits: 400 },
    rateBonus: {},
  },
  trade: {
    name: "Handelsschiff", sym: "₡",
    desc: "Unterhält Handelsrouten zwischen Systemen. Jedes Schiff generiert passiv Credits.",
    cost: { minerals: 100, credits: 200 },
    rateBonus: { credits: 0.2 },
  },
  warship: {
    name: "Kriegsschiff", sym: "▲",
    desc: "Für Pirateriefahrten und Planetenbefriedung. Benötigt für Kolonisierungssicherung.",
    cost: { minerals: 150, credits: 300, influence: 20 },
    rateBonus: {},
  },
};

// res: immediate resource reward; specialist: permanent rate bonus (resource chosen randomly)
const RAID_REWARDS = [
  { label: "Mineralienladung erbeutet",           res: { minerals: 60 } },
  { label: "Kreditreserven geplündert",            res: { credits: 100 } },
  { label: "Nahrungsvorräte gesichert",            res: { food: 50 } },
  { label: "Forschungsunterlagen gestohlen",       res: { research: 30 } },
  { label: "Geheimdienstdaten gewonnen",           res: { influence: 25 } },
  { label: "Frachter gekapert — gemischte Ladung", res: { minerals: 30, credits: 50 } },
  { label: "Spezialist rekrutiert",                specialist: { bonus: 0.1 } },
];
