import { ECONOMY, MATCH, ROUND } from './config.js';
import { GRENADES, WEAPONS } from './weapons.js';

export function createMatch() {
  return {
    round: 1, phase: 'freeze', phaseTime: ROUND.freeze,
    score: { vanguard: 0, warden: 0 },
    money: { vanguard: ECONOMY.start, warden: ECONOMY.start },
    lossStreak: { vanguard: 0, warden: 0 },
    players: [], device: null, winner: null,
  };
}

export function buy(match, team, item, player = null) {
  const weapon = WEAPONS[item];
  const grenade = GRENADES[item];
  const price = item === 'armor' ? 650 : weapon?.price ?? grenade?.price;
  if (match.phase !== 'freeze' || price == null || match.money[team] < price) return false;
  match.money[team] -= price;
  if (player) {
    if (weapon) {
      player.weapon = item;
      player.ammoByWeapon ||= {};
      player.ammo = player.ammoByWeapon[item] ||= { mag: weapon.mag, reserve: weapon.reserve };
    } else if (item === 'armor') player.armor = 100;
    else {
      player.grenades ||= { he: 0, flash: 0, smoke: 0 };
      if (typeof player.grenades === 'number') player.grenades = { he: player.grenades, flash: 0, smoke: 0 };
      player.grenades[item] = (player.grenades[item] || 0) + 1;
    }
  }
  return true;
}

export function finishRound(match, winner) {
  const loser = winner === 'vanguard' ? 'warden' : 'vanguard';
  match.score[winner]++;
  match.lossStreak[winner] = 0;
  match.lossStreak[loser]++;
  const bonus = ECONOMY.loss + Math.min(match.lossStreak[loser] - 1, ECONOMY.lossStreakMax) * ECONOMY.lossStreak;
  match.money[winner] = Math.min(ECONOMY.max, match.money[winner] + ECONOMY.win);
  match.money[loser] = Math.min(ECONOMY.max, match.money[loser] + bonus);
  match.winner = match.score[winner] >= MATCH.scoreToWin || match.round >= MATCH.maxRounds ? winner : null;
  match.phase = 'end';
  match.phaseTime = 4;
}

export function tickRound(match, dt) {
  if (match.phase === 'end') {
    match.phaseTime -= dt;
    if (match.phaseTime <= 0 && !match.winner) {
      match.round++;
      if (match.round === MATCH.swapAt + 1) {
        [match.score.vanguard, match.score.warden] = [match.score.warden, match.score.vanguard];
      }
      match.phase = 'freeze';
      match.phaseTime = ROUND.freeze;
      match.device = null;
    }
    return;
  }
  if (match.phase === 'freeze') {
    match.phaseTime -= dt;
    if (match.phaseTime <= 0) { match.phase = 'play'; match.phaseTime = ROUND.time; }
    return;
  }
  if (match.phase === 'play') {
    match.phaseTime -= dt;
    if (match.device) {
      match.device.fuse -= dt;
      if (match.device.fuse <= 0) finishRound(match, 'vanguard');
    } else if (match.phaseTime <= 0) finishRound(match, 'warden');
  }
}
