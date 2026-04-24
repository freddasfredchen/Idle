# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

```bash
# Local dev — open directly in browser:
open index.html

# Production (Raspberry Pi, port 2077):
docker compose up -d --build
```

No build step, no package manager, no transpilation. All JS is loaded via `<script>` tags in `index.html` in dependency order: `config → utils → state → save → planets → buildings → factions → research → ships → decrees → render → help → tick`.

## Architecture

**Galaktisches Dynastieverwaltungssystem** is a vanilla JS browser idle game. All state lives in a single global `GS` object, persisted to `localStorage` under key `gds_v2`. The game loop runs via `setInterval(tickState, 1000)` in `tick.js`.

### The GS Object

```
GS.meta            { lastSaved, gameTick }
GS.dynasty         { name, ruler: { name, traits, age }, generation }
GS.resources       { energy, minerals, food, credits, research, influence, loyalty }
  each resource:   { v (value), cap, rate, decay, label, sym, col }
  energy special:  { v (=production kW), consumption (=drain kW), rate: 0 }
GS.planets[]       { id, name, type, sym, col, slots, modifiers: {bldgType: mult}, buildings[] }
  each building:   { id, type, name, level, slot }
GS.activePlanetId  index into GS.planets
GS.availablePlanets[]  5 colonizable planet candidates
GS.factions[]      { id, name, sat (0–100), pow (0–100), inf (%), col, lastRebTick, lastCorrTick }
GS.research[]      array of completed research IDs (strings)
GS.decrees[]       array of active decree IDs (strings)
GS.fleet           { colony, trade, warship, raidActive, raidEndTick, specialists[] }
GS.log[]           { id, sev: 'ok'|'warn'|'info', msg } — max 25 entries
```

### recalcRates() — The Central Calculation

Called after **every state change** (build, upgrade, research, decree, colonize). Never modify `GS.resources[x].rate` directly; instead change what feeds into recalcRates. The function:

1. Resets all rates to `BASE_RATES` and caps to `BASE_CAPS`
2. Applies research multipliers (`buildProdMult`, `researchDrainMult`, `loyaltyDecayMult`)
3. Applies decree multipliers (`decreeProdAllMult`, `decreeBuildMult`, `decreeFlatRate`)
4. Sums solar output → `energyProd`; sums building drain → `energyDrain`
5. Computes `efficiency = min(1, energyProd / energyDrain)` — energy shortage linearly reduces all non-solar production
6. Applies per-building production: `rate += (base + (level-1)*perLevel) * efficiency * researchMult * decreeMult * planetMult`
7. Adds trade ship credits, specialist bonuses, corruption drain

**Energy is a hard bottleneck.** Adding buildings increases drain; insufficient solar → sub-100% efficiency across all production.

### Planet Modifiers

`planet.modifiers = { buildingType: multiplier }` (e.g. `{ mine: 1.5, farm: 0.7 }`). Applied in recalcRates as the final multiplier per building. recalcRates iterates **all planets**, not just the active one.

`activePlanet()` in `planets.js` returns `GS.planets[GS.activePlanetId]`. Always use this — never `GS.planet` (removed).

`hasLab()`, `hasShipyard()`, `hasMinistry()` check across **all planets**: `GS.planets.some(p => p.buildings.some(...))`.

### Tick Loop (tick.js)

Each second: update resource values → apply faction satRate effects → grow faction power → check rebellion (sat ≤ 0.5, 90-tick cooldown) and corruption (pow ≥ 99.5, 120-tick cooldown) → check raid completion → increment gameTick → render → autosave every 30 ticks.

Rebellion: −20% credits+influence, sat→20, pow+15. Corruption: −30% credits, −20% influence, pow→60.

### Tab System

`currentTab` (global in `config.js`) drives `renderTab()` in `render.js`. `switchTab(tab, btn)` updates it and calls `renderTab()`. Each tab delegates to its own render function (`renderResearch()`, `renderShips()`, etc.) which sets `document.getElementById('tab-content').innerHTML` directly.

### Save Migrations

`loadState()` in `state.js` handles backward compatibility. Pattern:
```js
if (!GS.someNewField) GS.someNewField = defaultValue;
```
When renaming a field (e.g. `GS.planet` → `GS.planets`), add a migration block before the recalcRates call.

## Adding Content

### New Building
Add to `BLDG` in `config.js`:
```js
mybuilding: {
  name, sym, col,
  resource: 'credits',        // which resource it produces (omit for solar)
  prod: { base, perLevel },
  drain: { base, perLevel },  // energy drain (omit if no drain)
  buildCost: { minerals, credits },
  upgradeCostBase: { minerals, credits },
}
```
Buildings render automatically in the build modal and upgrade grid. No other files needed.

### New Research
Add to `RESEARCH` in `config.js`. Effect types: `prod_mult` (building multiplier), `drain_mult` (energy drain multiplier), `cap_increase`, `cap_increase_all`, `loyalty_decay_mult`, `faction_sat_rate` (per-tick sat delta), `faction_inf_delta` (one-time). Requires array controls the tech tree. Tier 1/2/3 used for display grouping only.

### New Decree
Add to `DECREES` in `config.js`. `rateEffects` is applied in recalcRates; `factionSatRate`/`factionPowRate` apply per tick in `tickState`. Cost requires the Ministry building.

### New Planet Type
Add to `PLANET_TYPES` in `config.js`: `{ type, sym, col, modifiers: {bldgType: mult}, desc }`. The `desc` string is shown in the UI. Modifiers are multipliers (1.5 = +50%, 0.7 = −30%).

## Key Constants (config.js)

| Constant | Value |
|---|---|
| `SAVE_KEY` | `'gds_v2'` |
| `TICK_MS` | `1000` |
| `LOYALTY_FLOOR` | `15` |
| `MAX_OFFLINE_DECAY_S` | `21600` (6h) |
| `RAID_DURATION_TICKS` | `60` |
| `BASE_RATES` | `{ research: 0.3, influence: 0.15 }` |
