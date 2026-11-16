// LONGWAVE — the tuning table. Every number the simulation cares about lives here, in metres and
// seconds (angles in radians). config.js imports nothing, so anything may import it.

export const FIXED_STEP = 1 / 60;
export const MAX_STEPS_PER_FRAME = 5;

// One round: a freeze/buy phase, the play clock, then the device's fuse once it is planted.
export const ROUND = {
  time: 100, // play clock, seconds
  freeze: 15, // buy phase before the first step
  fuse: 40, // seconds from plant to detonation
  plant: 3.5, // hold E inside a site to plant
  defuse: 5, // hold E on a planted device to defuse
  defuseKit: 2.5, // with a defuse kit
};

// Match format: first to 8 of MR15, sides swap after 12 rounds.
export const MATCH = {
  scoreToWin: 8,
  maxRounds: 15,
  swapAt: 12,
};

// Money.
export const ECONOMY = {
  start: 800,
  max: 16000,
  kill: 300,
  win: 3250,
  loss: 1900,
  lossStreak: 500,
  lossStreakMax: 2,
  plant: 300,
  defuse: 300,
};

// Team payout at round end, stacked on the per-round bonus above.
export const TEAM = {
  winElimination: 3250,
  winDevice: 3500,
  winDefuse: 3500,
  winTime: 3250,
  loss: 1900,
  lossStreak: 500,
  lossStreakMax: 2,
  plant: 800,
  defuse: 800,
};

// Movement: top speeds by stance. Accel and friction are exponential rates per second.
export const MOVE = {
  run: 6.0,
  walk: 3.1,
  crouch: 2.6,
  ads: 3.0,
  accel: 30,
  airAccel: 3,
  friction: 10,
  jumpSpeed: 5.2,
  gravity: 17,
  snapStep: 0.1,
};

// Where the player's crosshair and view sit inside the simulated eye.
export const LOOK = {
  sensitivity: 0.0022,
  adsScale: 0.62,
  pitchLimit: 1.5,
  fov: 74,
  adsFov: 54,
};

// Recoil: pitch kick is up on the screen, yaw is side to side. Each kick decays at recovery; the
// view itself is re-centred by a weaker rate so the crosshair never fully returns (recoil pattern).
export const RECOIL = {
  recover: 9.5,
  recenter: 12,
  kickPitch: 0.0065,
  kickYaw: 0.0022,
};
