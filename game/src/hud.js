const byId = (id) => document.getElementById(id);

export function createHud() {
  const el = {
    score: byId('score'), timer: byId('timer'), alive: byId('alive'), status: byId('status'),
    device: byId('device'), health: byId('health'), armor: byId('armor'), money: byId('money'),
    count: byId('count'), weapon: byId('weapon'), overlay: byId('overlay'), panel: byId('panel'),
    buy: byId('buy'), buygrid: byId('buygrid'), killfeed: byId('killfeed'), hitmarker: byId('hitmarker'), blind: byId('blind'),
  };
  return {
    update(match, player, counts = { vanguard: 5, warden: 5 }) {
      if (el.score) el.score.textContent = `VANGUARD ${match.score.vanguard} : ${match.score.warden} WARDENS`;
      if (el.timer) {
        const time = Math.max(0, Math.ceil(match.phaseTime));
        el.timer.textContent = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
      }
      if (el.alive) el.alive.textContent = `${counts.vanguard} vs ${counts.warden}`;
      if (el.status) el.status.textContent = `ROUND ${match.round} / ${match.phase.toUpperCase()}`;
      if (el.device) el.device.textContent = match.device ? `DEVICE: ${match.device.site} // ${Math.ceil(match.device.fuse)}s` : 'DEVICE: SAFE';
      if (el.health) el.health.textContent = String(Math.ceil(player?.health ?? 100));
      if (el.armor) el.armor.textContent = String(Math.ceil(player?.armor ?? 0));
      if (el.money) el.money.textContent = `$${match.money.vanguard}`;
      if (el.weapon && player?.weapon) el.weapon.textContent = player.weapon;
      if (el.count && player?.ammo) el.count.textContent = `${player.ammo.mag} / ${player.ammo.reserve}`;
    },
    showOverlay(title, detail) {
      if (el.panel) el.panel.innerHTML = `<h1>${title}</h1><p>${detail}</p><p>CLICK TO DEPLOY</p>`;
      if (el.overlay) el.overlay.style.display = 'grid';
    },
    hideOverlay() { if (el.overlay) el.overlay.style.display = 'none'; },
    showBuy(show) { if (el.buy) el.buy.style.display = show ? 'block' : 'none'; },
    setBlind(value) { if (el.blind) el.blind.style.opacity = String(Math.max(0, Math.min(0.92, value))); },
    buildBuy(items, onBuy) {
      if (!el.buygrid) return;
      el.buygrid.replaceChildren(...items.map(([id, label, price]) => {
        const button = document.createElement('button');
        button.className = 'buyitem'; button.dataset.item = id;
        button.innerHTML = `<span>${label}</span><span>$${price}</span>`;
        button.addEventListener('click', () => onBuy(id)); return button;
      }));
    },
    updateBuy(money, phase) {
      if (!el.buygrid) return;
      for (const button of el.buygrid.children) button.disabled = phase !== 'freeze' || money < Number(button.lastElementChild.textContent.slice(1));
    },
    kill(message) { if (el.killfeed) el.killfeed.textContent = message; },
    hit(show) { if (el.hitmarker) el.hitmarker.style.display = show ? 'block' : 'none'; },
  };
}
