const SAVE_KEY = 'gds_v1';
const TICK_MS = 1000;
const MAX_OFFLINE_DECAY_S = 21600; // 6h cap
const LOYALTY_FLOOR = 15;

let currentTab = 'factions';

const BLDG = {
  solar:    { sym: "◉", col: "#fbbf24" },
  mine:     { sym: "⬡", col: "#94a3b8" },
  farm:     { sym: "◇", col: "#86efac" },
  ministry: { sym: "◆", col: "#c084fc" },
  lab:      { sym: "⬢", col: "#7dd3fc" },
  barracks: { sym: "▲", col: "#f87171" },
  shipyard: { sym: "◈", col: "#e879f9" },
};
