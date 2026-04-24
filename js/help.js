function showHelp() {
  const res = (key) => GS.resources[key];
  const sym = (key) => res(key)?.sym ?? key;

  const rows = Object.entries(BLDG).map(([type, m]) => {
    const isSolar = type === 'solar';

    const prodLine = isSolar
      ? `⚡ +${m.prod.base} kW (Lv1), +${m.prod.perLevel} kW/Stufe`
      : `${sym(m.resource)} ${res(m.resource)?.label ?? m.resource}: +${m.prod.base}/s, +${m.prod.perLevel}/Stufe`;

    const drainLine = !isSolar && m.drain
      ? `<div class="help-detail help-drain">⚡ Verbrauch: ${m.drain.base} kW (Lv1), +${m.drain.perLevel}/Stufe</div>`
      : '';

    const costStr = Object.entries(m.upgradeCostBase)
      .map(([r, amt]) => `${sym(r)}${amt}×Lv`)
      .join('  ');

    return `<div class="help-bldg">
      <div class="help-bldg-head">
        <span style="color:${m.col}">${m.sym}</span>
        <span class="help-bldg-name">${m.name}</span>
      </div>
      <div class="help-detail">${prodLine}</div>
      ${drainLine}
      <div class="help-detail help-cost">↑ Ausbau: ${costStr}</div>
    </div>`;
  }).join('');

  document.getElementById('help-modal').style.display = 'flex';
  document.getElementById('help-modal-body').innerHTML = rows;
}

function closeHelp() {
  document.getElementById('help-modal').style.display = 'none';
}
