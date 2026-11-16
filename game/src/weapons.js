// LONGWAVE weapon and grenade tuning data. Damage is body damage before hit-zone multipliers.
export const WEAPONS = {
  P9: { name: 'P9 SERVICE', category: 'pistol', damage: 26, fireRate: 4.2, mag: 12, reserve: 36, reload: 1.55, spread: 0.018, recoil: 0.012, price: 0, move: 5.4, penetration: 0.25 },
  VK9: { name: 'VK-9', category: 'smg', damage: 22, fireRate: 11, mag: 30, reserve: 90, reload: 2.0, spread: 0.032, recoil: 0.009, price: 1500, move: 5.5, penetration: 0.18 },
  SG12: { name: 'SG-12', category: 'shotgun', damage: 12, pellets: 8, fireRate: 1.15, mag: 6, reserve: 24, reload: 2.7, spread: 0.09, recoil: 0.045, price: 1200, move: 4.6, penetration: 0.08 },
  AR47: { name: 'AR-47', category: 'rifle', damage: 34, fireRate: 9.2, mag: 30, reserve: 90, reload: 2.35, spread: 0.022, recoil: 0.016, price: 2700, move: 4.8, penetration: 0.55 },
  MR9: { name: 'MR-9', category: 'carbine', damage: 30, fireRate: 7.8, mag: 24, reserve: 72, reload: 2.1, spread: 0.016, recoil: 0.013, price: 1800, move: 5.0, penetration: 0.42 },
  LW50: { name: 'LW-50', category: 'sniper', damage: 88, fireRate: 0.9, mag: 5, reserve: 20, reload: 2.8, spread: 0.003, recoil: 0.055, price: 4750, move: 3.8, penetration: 0.8 },
};

export const GRENADES = {
  flash: { name: 'Flash Charge', price: 200, fuse: 1.5, radius: 18, effect: 4.5, speed: 13 },
  smoke: { name: 'Smoke Canister', price: 300, fuse: 1.2, radius: 7, duration: 12, speed: 12 },
  he: { name: 'HE Charge', price: 300, fuse: 1.8, radius: 6, damage: 85, speed: 11 },
};
