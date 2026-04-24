function appeaseFaction(factionId) {
  if (!GS) return;
  const f = GS.factions.find(f => f.id === factionId);
  if (!f) return;
  if (GS.resources.influence.v < 20 || GS.resources.credits.v < 50) {
    addLog('warn', `Beschwichtigung fehlgeschlagen — zu wenig ◈ oder ₡.`);
    renderLog();
    return;
  }
  GS.resources.influence.v -= 20;
  GS.resources.credits.v   -= 50;
  f.sat = Math.min(100, f.sat + 20);
  f.pow = Math.max(0,   f.pow - 10);
  addLog('ok', `${f.name} beschwichtigt: Zufriedenheit +20, Macht −10.`);
  renderAll();
}

function intimidateFaction(factionId) {
  if (!GS) return;
  const f = GS.factions.find(f => f.id === factionId);
  if (!f) return;
  if (GS.resources.influence.v < 30 || GS.resources.loyalty.v < 20) {
    addLog('warn', `Einschüchterung fehlgeschlagen — zu wenig ◈ oder ♥.`);
    renderLog();
    return;
  }
  GS.resources.influence.v -= 30;
  GS.resources.loyalty.v   -= 20;
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
  f.sat = 20;
  f.pow = Math.min(100, f.pow + 15);
  addLog('warn', `AUFSTAND! ${f.name} außer Kontrolle. Verluste: ₡${credLoss}, ◈${infLoss}. Machtgewinn der Fraktion.`);
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
