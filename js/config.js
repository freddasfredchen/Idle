const SAVE_KEY = 'gds_v2';
const TICK_MS = 1000;
const MAX_OFFLINE_DECAY_S = 21600;
const LOYALTY_FLOOR = 15;
const FACTION_POW_BASE_RATE = 0.001;
const RAID_DURATION_TICKS = 60;
const RAID_COST = { credits: 30, influence: 10 };
const REBELLION_COOLDOWN  = 90;
const CORRUPTION_COOLDOWN = 120;
const APPEASE_COST    = { influence: 20, credits: 50 };
const INTIMIDATE_COST = { influence: 30, loyalty: 20 };

// modifiers: { buildingType: productionMultiplier }
const PLANET_TYPES = [
  { type: "Mineralreiche Welt",  sym: "⬡", col: "#94a3b8", modifiers: { mine: 1.5, farm: 0.7 },                          desc: "+50% Minen · −30% Farmen" },
  { type: "Agrarwelt",           sym: "◇", col: "#86efac", modifiers: { farm: 1.7, lab: 1.1 },                            desc: "+70% Farmen · +10% Labor" },
  { type: "Handelsknoten",       sym: "₡", col: "#c8aa4f", modifiers: { ministry: 1.5, shipyard: 1.4, mine: 0.7 },        desc: "+50% Min. · +40% Werft · −30% Minen" },
  { type: "Forschungskolonie",   sym: "⬢", col: "#7dd3fc", modifiers: { lab: 1.8, shipyard: 0.7 },                        desc: "+80% Labor · −30% Raumwerft" },
  { type: "Militärstützpunkt",   sym: "▲", col: "#f87171", modifiers: { barracks: 1.9, shipyard: 1.3, farm: 0.6 },        desc: "+90% Kaserne · +30% Werft · −40% Farmen" },
  { type: "Energiereiche Welt",  sym: "◉", col: "#fbbf24", modifiers: { solar: 2.0, mine: 0.8, farm: 0.7 },               desc: "+100% Solar · −20% Minen · −30% Farmen" },
  { type: "Politisches Zentrum", sym: "◈", col: "#e879f9", modifiers: { ministry: 1.7, barracks: 1.2, lab: 0.7 },         desc: "+70% Min. · +20% Kaserne · −30% Labor" },
  { type: "Toxische Welt",       sym: "◎", col: "#fb923c", modifiers: { mine: 2.1, farm: 0.3, lab: 0.6 },                 desc: "+110% Minen · −70% Farmen · −40% Labor" },
  { type: "Eiswelt",             sym: "❋", col: "#bfdbfe", modifiers: { lab: 1.5, mine: 1.2, solar: 0.4 },                desc: "+50% Labor · +20% Minen · −60% Solar" },
  { type: "Gasgigant-Mond",      sym: "◉", col: "#a78bfa", modifiers: { solar: 1.5, shipyard: 1.4, farm: 0.7 },           desc: "+50% Solar · +40% Werft · −30% Farmen" },
  { type: "Strategischer Orbit", sym: "△", col: "#60a5fa", modifiers: { barracks: 1.4, shipyard: 1.7, mine: 0.8 },        desc: "+40% Kaserne · +70% Werft · −20% Minen" },
  { type: "Feuchte Welt",        sym: "◈", col: "#34d399", modifiers: { farm: 2.0, lab: 1.2, solar: 0.7, mine: 0.6 },     desc: "+100% Farmen · +20% Labor · −30% Solar" },
  { type: "Wüstenwelt",          sym: "◎", col: "#f59e0b", modifiers: { solar: 1.7, mine: 1.3, farm: 0.2 },               desc: "+70% Solar · +30% Minen · −80% Farmen" },
  { type: "Ozeanwelt",           sym: "◇", col: "#38bdf8", modifiers: { farm: 1.9, lab: 1.3, mine: 0.3, solar: 0.8 },     desc: "+90% Farmen · +30% Labor · −70% Minen" },
  { type: "Kristallhöhle",       sym: "⬡", col: "#c4b5fd", modifiers: { lab: 2.2, mine: 0.9, solar: 0.6 },                desc: "+120% Labor · −10% Minen · −40% Solar" },
  { type: "Vulkanwelt",          sym: "◉", col: "#dc2626", modifiers: { mine: 1.8, solar: 1.4, farm: 0.2, lab: 0.5 },     desc: "+80% Minen · +40% Solar · −80% Farmen" },
  { type: "Tundrawelt",          sym: "❋", col: "#93c5fd", modifiers: { mine: 1.4, lab: 1.3, farm: 0.5, solar: 0.6 },     desc: "+40% Minen · +30% Labor · −50% Farmen" },
  { type: "Urwald-Welt",         sym: "◇", col: "#4ade80", modifiers: { farm: 1.5, lab: 1.6, mine: 0.6, shipyard: 0.8 },  desc: "+50% Farmen · +60% Labor · −40% Minen" },
  { type: "Asteroiden-Gürtel",   sym: "⬡", col: "#78716c", modifiers: { mine: 2.5, shipyard: 1.3, farm: 0.1, solar: 0.5 }, desc: "+150% Minen · +30% Werft · −90% Farmen" },
  { type: "Verbannte Welt",      sym: "△", col: "#dc4b4b", modifiers: { ministry: 2.0, barracks: 1.5, lab: 0.5, farm: 0.6 }, desc: "+100% Min. · +50% Kaserne · −50% Labor" },
  { type: "Schmugglerhafen",     sym: "₡", col: "#d97706", modifiers: { shipyard: 1.8, ministry: 1.4, barracks: 0.5 },     desc: "+80% Werft · +40% Min. · −50% Kaserne" },
  { type: "Biolumineszente Welt",sym: "◈", col: "#a3e635", modifiers: { farm: 1.3, lab: 1.4, solar: 1.2, mine: 0.85 },    desc: "+30% Farmen · +40% Labor · +20% Solar" },
  { type: "Gasriese-Orbit",      sym: "◉", col: "#7c3aed", modifiers: { shipyard: 2.0, solar: 1.2, farm: 0.5, barracks: 0.7 }, desc: "+100% Werft · +20% Solar · −50% Farmen" },
  { type: "Magnetar-Zone",       sym: "⬢", col: "#f0abfc", modifiers: { lab: 1.6, solar: 0.3, shipyard: 0.7, mine: 1.3 }, desc: "+60% Labor · +30% Minen · −70% Solar" },
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
  solar:     { name: "Solaranlage",                              sym: "◉", col: "#fbbf24", resource: null,        prod: { base: 5.0,  perLevel: 3.0  },                                  buildCost: { minerals: 50,  credits: 100 }, upgradeCostBase: { minerals: 30,  credits: 50   } },
  mine:      { name: "Asteroidenmine",                           sym: "⬡", col: "#94a3b8", resource: "minerals",  prod: { base: 1.2,  perLevel: 0.8  }, drain: { base: 2.0, perLevel: 0.5 }, buildCost: { minerals: 40,  credits:  80 }, upgradeCostBase: { minerals: 30,  credits: 60   } },
  farm:      { name: "Hydroponie-Komplex",                       sym: "◇", col: "#86efac", resource: "food",      prod: { base: 2.1,  perLevel: 1.2  }, drain: { base: 1.5, perLevel: 0.5 }, buildCost: { minerals: 30,  credits:  60 }, upgradeCostBase: { minerals: 20,  credits: 40   } },
  ministry:  { name: "Ministerium",                              sym: "◆", col: "#c084fc", resource: "credits",   prod: { base: 0.8,  perLevel: 0.5  }, drain: { base: 1.0, perLevel: 0.3 }, buildCost: { credits:  150, influence: 30 }, upgradeCostBase: { credits: 120, influence: 25 } },
  lab:       { name: "Forschungslabor",                          sym: "⬢", col: "#7dd3fc", resource: "research",  prod: { base: 0.5,  perLevel: 0.3  }, drain: { base: 3.0, perLevel: 1.0 }, buildCost: { credits:  200, research:  10 }, upgradeCostBase: { credits: 100, minerals: 30  } },
  barracks:  { name: "Kaserne",                                  sym: "▲", col: "#f87171", resource: "loyalty",   prod: { base: 0.05, perLevel: 0.03 }, drain: { base: 2.0, perLevel: 0.5 }, buildCost: { minerals: 60,  credits:  100}, upgradeCostBase: { minerals: 50, credits:  80  } },
  shipyard:  { name: "Raumwerft",                                sym: "◈", col: "#e879f9", resource: "influence", prod: { base: 0.1,  perLevel: 0.08 }, drain: { base: 4.0, perLevel: 1.0 }, buildCost: { minerals: 100, credits:  200}, upgradeCostBase: { minerals: 100, credits: 150 } },
  // ── OGame-Inspiriert ─────────────────────────────────────────────────────────────────────────────────
  fusion:    { name: "Kernfusionskomplex 'Prometheus'",          sym: "⊕", col: "#38bdf8", resource: null,        prod: { base: 20.0, perLevel: 12.0 },                                  buildCost: { minerals: 400, credits: 800 },             upgradeCostBase: { minerals: 250, credits: 500 },
               desc: "Wandelt Wasserstoff in Energie um. Kostet ein Vermögen, hält Versprechen zu 94%. Die restlichen 6% sind 'Forschungsmaterial'." },
  crystal:   { name: "Epistemologische Extraktionskammer",       sym: "◇", col: "#a78bfa", resource: "research",  prod: { base: 0.9,  perLevel: 0.5  }, drain: { base: 4.0, perLevel: 1.2 }, buildCost: { minerals: 80,  research:  20 }, upgradeCostBase: { minerals: 60,  research: 15  },
               desc: "Gewinnt Wissenskristalle aus Planetenformationen. Das Bergbaukollektiv besteht darauf, dass Kristalle 'sprechen'. HR ist informiert." },
  deuterium: { name: "Amt für Flüssige Überzeugungen",          sym: "◎", col: "#67e8f9", resource: "influence", prod: { base: 0.25, perLevel: 0.15 }, drain: { base: 2.5, perLevel: 0.7 }, buildCost: { credits:  150, minerals:  80 }, upgradeCostBase: { credits: 100, minerals: 60  },
               desc: "Destilliert Deuterium zu politisch verwertbarem Einfluss. Einfluss schmeckt angeblich nach Salzlakritz." },
  nanite:    { name: "Subatomare Abbaugesellschaft mbH",         sym: "⬡", col: "#6ee7b7", resource: "minerals",  prod: { base: 2.5,  perLevel: 1.5  }, drain: { base: 5.0, perLevel: 1.5 }, buildCost: { minerals: 500, credits: 1000, research: 50 }, upgradeCostBase: { minerals: 300, credits: 600  },
               desc: "Nano-Roboter schürfen autonom. Das Arbeiterkollektiv Ω-7 nennt es 'Beschäftigungsoptimierung'. Wir auch." },
  robotics:  { name: "Automatisiertes Verwaltungsministerium",   sym: "▣", col: "#fb923c", resource: "credits",   prod: { base: 1.2,  perLevel: 0.7  }, drain: { base: 3.0, perLevel: 0.8 }, buildCost: { minerals: 150, credits: 250,  research: 15  }, upgradeCostBase: { minerals: 100, credits: 200  },
               desc: "Roboter ersetzen Bürokraten. Effizienz stieg um 340%. Beschwerden sanken auf null — aus verschiedenen Gründen." },
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
  energy_tech: {
    name: "Kernreaktor-Zertifizierungsprogramm", sym: "⊕", tier: 1,
    desc: "Fusionsreaktoren +30% Energie. 14 Formulare und ein Sicherheitsaudit waren erforderlich.",
    cost: { research: 25, credits: 50 }, requires: [], requiresBuilding: 'fusion',
    effect: { type: 'prod_mult', building: 'fusion', multiplier: 1.3 },
  },
  weapons_tech: {
    name: "Kasernierungsoptimierung", sym: "▲", tier: 1,
    desc: "Kasernen steigern Loyalitätsproduktion um 40%. Die Methodik bleibt klassifiziert.",
    cost: { research: 20, minerals: 40 }, requires: [], requiresBuilding: 'barracks',
    effect: { type: 'prod_mult', building: 'barracks', multiplier: 1.4 },
  },
  crystal_opt: {
    name: "Kristallographische Verfeinerung", sym: "◇", tier: 1,
    desc: "Extraktionskammern fördern 25% mehr Wissenskristalle. Die Kristalle sprechen jetzt lauter.",
    cost: { research: 20, minerals: 30 }, requires: [], requiresBuilding: 'crystal',
    effect: { type: 'prod_mult', building: 'crystal', multiplier: 1.25 },
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
  ion_tech: {
    name: "Ionenfeldoptimierung", sym: "⚡", tier: 2,
    desc: "Ionenfelder reduzieren Energieverbrauch aller Gebäude um weitere 15%. Nebenwirkungen: leichtes Kribbeln.",
    cost: { research: 50, credits: 80 }, requires: ['superconductor'], requiresBuilding: 'crystal',
    effect: { type: 'drain_mult', multiplier: 0.85 },
  },
  plasma_tech: {
    name: "Plasmatische Substanzextraktion", sym: "◎", tier: 2,
    desc: "Minen und Nanitenfabriken fördern 40% mehr. Plasma brennt Ineffizienz weg — und gelegentlich auch die Infrastruktur.",
    cost: { research: 70, minerals: 100, credits: 100 }, requires: ['ion_tech', 'mining_tech'], requiresBuilding: 'crystal',
    effect: { type: 'prod_mult_multi', buildings: ['mine', 'nanite'], multiplier: 1.4 },
  },
  espionage_tech: {
    name: "Abt. f. Freundliche Informationsbeschaffung", sym: "◈", tier: 2,
    desc: "+0.25/s Einfluss dauerhaft. Spionage ist nur ein freundlicheres Wort für 'aufmerksames Zuhören'.",
    cost: { research: 45, influence: 20 }, requires: ['fiscal'], requiresBuilding: 'shipyard',
    effect: { type: 'resource_flat_rate', resource: 'influence', delta: 0.25 },
  },
  propaganda: {
    name: "Propaganda-Netz", sym: "◎", tier: 2,
    desc: "Staatspropaganda stabilisiert Corp und Orden (+0.02/s), destabilisiert das Arbeiterkollektiv (−0.05/s Zufriedenheit).",
    cost: { research: 40, credits: 60 }, requires: ['fiscal'],
    effect: { type: 'faction_sat_rate', rates: { corp: 0.02, order: 0.02, workers: -0.05 } },
  },
  hyperspace_drive: {
    name: "Hyperraumfaltungsforschung", sym: "◉", tier: 2,
    desc: "Raumwerft und Deuteriumdestillerie +35% effizienter. Der Raum wurde gefaltet. Die Gewerkschaft protestiert.",
    cost: { research: 60, credits: 100, influence: 15 }, requires: ['espionage_tech', 'quantum'], requiresBuilding: 'shipyard',
    effect: { type: 'prod_mult_multi', buildings: ['shipyard', 'deuterium'], multiplier: 1.35 },
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
  graviton_tech: {
    name: "Gravitonverdichtungskommission", sym: "✦", tier: 3,
    desc: "Alle Produktionsgebäude +20%. Die Physik hat ihre Einwände nach einem Gespräch zurückgezogen.",
    cost: { research: 150, credits: 400, influence: 50 }, requires: ['plasma_tech', 'hyperspace_drive', 'loyalty_matrix'], requiresBuilding: 'fusion',
    effect: { type: 'prod_mult_multi', buildings: ['mine','farm','ministry','lab','barracks','shipyard','fusion','crystal','deuterium','nanite','robotics'], multiplier: 1.2 },
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
