function appeaseFaction(factionId) {
  if (!GS) return;
  const f = GS.factions.find(f => f.id === factionId);
  if (!f) return;
  if (!canAfford(APPEASE_COST)) {
    addLog('warn', `Beschwichtigung fehlgeschlagen — zu wenig: ${getMissingLabels(APPEASE_COST)}.`);
    renderLog(); return;
  }
  deductResources(APPEASE_COST);
  f.sat = Math.min(100, f.sat + 20);
  f.pow = Math.min(100, f.pow + 10);
  addLog('ok', `${f.name} beschwichtigt: Zufriedenheit +20, Macht +10.`);
  renderAll();
}

function intimidateFaction(factionId) {
  if (!GS) return;
  const f = GS.factions.find(f => f.id === factionId);
  if (!f) return;
  if (!canAfford(INTIMIDATE_COST)) {
    addLog('warn', `Einschüchterung fehlgeschlagen — zu wenig: ${getMissingLabels(INTIMIDATE_COST)}.`);
    renderLog(); return;
  }
  deductResources(INTIMIDATE_COST);
  f.pow = Math.max(0,   f.pow - 20);
  f.sat = Math.max(0,   f.sat - 10);
  addLog('info', `${f.name} eingeschüchtert: Macht −20, Zufriedenheit −10.`);
  renderAll();
}

function triggerRebellion(f) {
  f.lastRebTick = GS.meta.gameTick;
  const credLoss = Math.max(20, Math.round(GS.resources.credits.v   * 0.20));
  const infLoss  = Math.max(10, Math.round(GS.resources.influence.v * 0.20));
  GS.resources.credits.v   = Math.max(0, GS.resources.credits.v   - credLoss);
  GS.resources.influence.v = Math.max(0, GS.resources.influence.v - infLoss);
  f.sat = 20; f.pow = Math.min(100, f.pow + 15);
  addLog('warn', `AUFSTAND! ${f.name} außer Kontrolle. Verluste: ₡${credLoss}, ◈${infLoss}.`);
}

function triggerCorruption(f) {
  f.lastCorrTick = GS.meta.gameTick;
  const credLoss = Math.max(30, Math.round(GS.resources.credits.v   * 0.30));
  const infLoss  = Math.max(20, Math.round(GS.resources.influence.v * 0.20));
  GS.resources.credits.v   = Math.max(0, GS.resources.credits.v   - credLoss);
  GS.resources.influence.v = Math.max(0, GS.resources.influence.v - infLoss);
  f.pow = 60;
  addLog('warn', `KORRUPTIONSKRISE! ${f.name} überschreitet alle Grenzen. Verluste: ₡${credLoss}, ◈${infLoss}.`);
}
