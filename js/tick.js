function tickState() {
  if (!GS) return;
  const dt = TICK_MS / 1000;
  for (const [k, r] of Object.entries(GS.resources)) {
    let v = r.v + (r.rate + r.decay) * dt;
    if (k === 'loyalty') v = Math.max(LOYALTY_FLOOR, v);
    v = Math.max(0, Math.min(r.cap, v));
    GS.resources[k].v = v;
  }
  GS.meta.gameTick++;
  renderResources();
  renderTick();
  if (GS.meta.gameTick % 30 === 0) autoSave();
}

setInterval(tickState, TICK_MS);
