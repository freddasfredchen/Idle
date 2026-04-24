function autoSave() {
  if (!GS) return;
  try {
    GS.meta.lastSaved = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(GS));
  } catch {}
}

function manualSave() {
  if (!GS) return;
  GS.meta.lastSaved = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(GS));
    const btn = document.getElementById('save-btn');
    btn.textContent = '✓ GESPEICHERT';
    btn.classList.add('saved');
    setTimeout(() => { btn.textContent = 'SPEICHERN'; btn.classList.remove('saved'); }, 2000);
  } catch {}
}
