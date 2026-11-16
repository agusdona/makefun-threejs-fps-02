import * as THREE from 'three';
import { buildWorld, START, START_YAW, START_PITCH } from './world.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { FIXED_STEP, MAX_STEPS_PER_FRAME, LOOK, ROUND } from './config.js';
import { WEAPONS, GRENADES } from './weapons.js';
import { createActor } from './models.js';
import { fireShot, makeTracer } from './combat.js';
import { audio, unlockAudio } from './audio.js';
import { createMatch, buy, finishRound, tickRound } from './rounds.js';
import { createHud } from './hud.js';
import { createBots } from './bots.js';

const $ = s => document.querySelector(s), canvas = $('#view'), overlay = $('#overlay');
const params = new URLSearchParams(location.search), shot = params.get('shot') || 'start';
let seed = Number(params.get('seed') || 1) >>> 0;
function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(LOOK.fov, 1, .1, 180);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.shadowMap.enabled = true;
const world = buildWorld(scene), player = new Player({ ...START, yaw: START_YAW, pitch: START_PITCH });
player.health = 100; player.armor = 0; player.weapon = 'P9'; player.grenades = { he: 1, flash: 0, smoke: 0 }; player.ammoByWeapon = { P9: { mag: WEAPONS.P9.mag, reserve: WEAPONS.P9.reserve } };
player.ammo = { mag: WEAPONS.P9.mag, reserve: WEAPONS.P9.reserve };
const input = new Input(canvas), hud = createHud(), match = createMatch();
input.attach(window);
const actors = [], tracers = [], bots = createBots(scene, world, random);
const localActor = createActor('vanguard'); localActor.position.set(START.x, 0, START.z); scene.add(localActor);
actors.push(localActor, ...bots.bots);
const clock = new THREE.Clock(), euler = new THREE.Euler(0, 0, 0, 'YXZ'), forward = new THREE.Vector3();
let accumulator = 0, active = shot !== 'start', paused = false, cooldown = 0, reload = 0;
let plant = 0, defuse = 0, roundResolved = false, grenade = null, hitTime = 0, blindTime = 0;
const smokes = [], blinds = [];
const buyItems = [['P9','P9 SERVICE',0],['VK9','VK-9',1500],['SG12','SG-12',1200],['AR47','AR-47',2700],['MR9','MR-9',1800],['LW50','LW-50',4750],['armor','Armor',650],['flash','Flash',200],['smoke','Smoke',300],['he','HE',300]];
hud.buildBuy(buyItems, id => { if (buy(match, 'vanguard', id, player)) { if (WEAPONS[id]) equip(id); hud.showBuy(false); } });
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
function start() { unlockAudio(); active = true; paused = false; hud.hideOverlay(); canvas.requestPointerLock(); }
canvas.addEventListener('click', () => { if (!input.locked) start(); });
input.onLockChange = locked => { if (!locked && active && shot === 'play') { paused = true; hud.showOverlay('PAUSED', 'LONGWAVE STATION'); } };
window.addEventListener('resize', resize); resize();
if (shot === 'start') hud.showOverlay('LONGWAVE', 'LONGWAVE STATION // HIGH DESERT');
else { overlay.style.display = 'none'; if (shot === 'end') hud.showOverlay('ROUND COMPLETE', 'VANGUARD 1 : 0 WARDENS'); }
function equip(id) { if (!WEAPONS[id]) return; player.weapon = id; player.ammoByWeapon ||= {}; player.ammo = player.ammoByWeapon[id] ||= { mag: WEAPONS[id].mag, reserve: WEAPONS[id].reserve }; }
function fire() {
  const spec = WEAPONS[player.weapon];
  if (cooldown > 0 || reload > 0 || !player.ammo.mag || match.phase !== 'play') return;
  cooldown = 1 / spec.fireRate; player.ammo.mag--;
  const moving = Math.hypot(player.vel.x, player.vel.z) > 1.2;
  const result = fireShot({ camera, actors: actors.filter(a => a.userData.team === 'warden'), damage: spec.damage, spread: spec.spread * (moving ? 2.5 : 1) * (input.adsDown ? .38 : 1), random });
  const to = result.point || camera.position.clone().add(forward.clone().multiplyScalar(55));
  tracers.push(makeTracer(scene, camera.position.clone(), to));
  player.kick(spec.recoil, (random() - .5) * spec.recoil * .45); audio.shot(spec.category);
  if (result.hit) { hitTime = .12; hud.hit(true); if (result.hit.userData.health <= 0) { hud.kill(`VANGUARD > ${result.hit.userData.name} // ${result.zone}`); match.money.vanguard += 300; resolveClear(); } }
}
function resolveClear() { if (!actors.some(a => a.userData.team === 'warden' && a.userData.health > 0) && !roundResolved) { roundResolved = true; finishRound(match, 'vanguard'); audio.stinger(true); } }
function throwGrenade(type = 'he', testOnly = false) {
  if ((!testOnly && !player.grenades[type]) || grenade || match.phase !== 'play') return;
  player.grenades[type]--; camera.getWorldDirection(forward);
  const spec = GRENADES[type];
  grenade = { type, pos: camera.position.clone(), vel: forward.clone().multiplyScalar(spec.speed).add(new THREE.Vector3(0, 5, 0)), fuse: spec.fuse };
}
function step(dt) {
  input.begin(); cooldown = Math.max(0, cooldown - dt); hitTime = Math.max(0, hitTime - dt); hud.setBlind(blindTime > 0 ? Math.min(.9, blindTime / .35) : 0);
  if (!hitTime) hud.hit(false);
  player.look(input.mdx, input.mdy, input.adsDown); player.decayKick(dt);
  const ids = ['P9','VK9','SG12','AR47','MR9','LW50'];
  for (let i = 1; i <= 6; i++) if (input.pressed(`w${i}`)) equip(ids[i - 1]);
  if (input.pressed('reload') && reload <= 0 && player.ammo.mag < WEAPONS[player.weapon].mag && player.ammo.reserve > 0) { reload = WEAPONS[player.weapon].reload; audio.reload(); }
  if (reload > 0 && (reload = Math.max(0, reload - dt)) === 0) { const n = Math.min(WEAPONS[player.weapon].mag - player.ammo.mag, player.ammo.reserve); player.ammo.mag += n; player.ammo.reserve -= n; }
  if (input.pressed('grenade')) throwGrenade(player.grenades.he ? 'he' : player.grenades.flash ? 'flash' : 'smoke');
  if (input.pressed('buy')) hud.showBuy(match.phase === 'freeze' && $('#buy').style.display === 'none');
  const controls = { fwd: input.fwd, side: input.side, walk: input.walk, crouch: input.crouch, jump: input.jump, ads: input.adsDown };
  player.step(controls, world.colliders, dt); localActor.position.set(player.pos.x, player.pos.y, player.pos.z); localActor.rotation.y = player.yaw;
  if (input.fireDown && blindTime <= 0) fire();
  if (match.phase === 'play') updateCombat(dt);
  tickRound(match, dt);
  if (match.phase === 'freeze' && match.round > 1 && roundResolved) resetRound();
  hud.update(match, player, { vanguard: 1, warden: actors.filter(a => a.userData.team === 'warden' && a.userData.health > 0).length });
  hud.updateBuy(match.money.vanguard, match.phase);
  if (match.phase !== 'freeze') hud.showBuy(false);
  input.end();
}
function updateCombat(dt) {
  if (!params.has('test')) bots.step(dt, player, match, damage => { player.health = Math.max(0, player.health - damage); if (!player.health && !roundResolved) { roundResolved = true; finishRound(match, 'warden'); } }, (killer, victim) => hud.kill(`${killer.userData.name} > ${victim.userData.name}`), { blind: blinds, smokes });
  for (let i = smokes.length - 1; i >= 0; i--) { smokes[i].life -= dt; if (smokes[i].life <= 0) { scene.remove(smokes[i].mesh); smokes.splice(i, 1); } }
  for (let i = blinds.length - 1; i >= 0; i--) { blinds[i].life -= dt; if (blinds[i].life <= 0) blinds.splice(i, 1); }
  if (blindTime > 0) blindTime = Math.max(0, blindTime - dt);
  if (grenade) {
    grenade.fuse -= dt; grenade.vel.y -= 9.8 * dt; grenade.pos.addScaledVector(grenade.vel, dt);
    if (grenade.pos.y < .2) { grenade.pos.y = .2; grenade.vel.y *= -.35; grenade.vel.x *= .72; grenade.vel.z *= .72; }
    if (grenade.fuse <= 0) {
      const g = grenade, spec = GRENADES[g.type]; grenade = null; audio.explosion();
      if (g.type === 'he') for (const a of bots.bots) if (a.userData.team === 'warden' && a.userData.health > 0 && a.position.distanceTo(g.pos) < spec.radius) a.userData.health -= spec.damage;
      if (g.type === 'flash') {
        for (const b of bots.bots) if (b.userData.health > 0 && b.position.distanceTo(g.pos) < spec.radius) blinds.push({ team: b.userData.team, position: g.pos.clone(), radius: spec.radius, life: spec.effect });
        if (new THREE.Vector3(player.pos.x, player.pos.y + 1, player.pos.z).distanceTo(g.pos) < spec.radius) blindTime = spec.effect;
      }
      if (g.type === 'smoke') {
        const material = new THREE.MeshBasicMaterial({ color: 0x8c9697, transparent: true, opacity: .3, depthWrite: false, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(spec.radius, 16, 12), material); mesh.position.copy(g.pos); scene.add(mesh);
        smokes.push({ position: g.pos.clone(), radius: spec.radius, life: spec.duration, mesh });
      }
      resolveClear();
    }
  }
  const site = Object.entries(world.sites).find(([, s]) => Math.hypot(player.pos.x - s.cx, player.pos.z - s.cz) < 3);
  if (input.down.use && site && !match.device) { plant += dt; if (plant >= ROUND.plant) { match.device = { site: site[0], fuse: ROUND.fuse }; match.money.vanguard += 300; hud.kill(`DEVICE PLANTED ${site[0]}`); audio.beep(); plant = 0; } } else plant = 0;
  if (match.device && input.down.use && !site) { defuse += dt; if (defuse >= ROUND.defuse) { roundResolved = true; finishRound(match, 'warden'); match.device = null; audio.stinger(false); } } else defuse = 0;
  if (player.health <= 0 && !roundResolved) { roundResolved = true; finishRound(match, 'warden'); }
}
function resetRound() {
  roundResolved = false; plant = 0; defuse = 0; player.health = 100; player.armor = 0;
  Object.assign(player.pos, { x: START.x, y: 0, z: START.z });
  const sp = { vanguard: [[-3,19],[0,19.5],[3,19],[-1.5,16.5],[1.5,16.5]], warden: [[-3,-16],[0,-16.5],[3,-16],[-1,-15.2],[1,-15.2]] };
  for (const a of bots.bots) { const i = Number(a.userData.name.split(' ').pop()); a.position.set(sp[a.userData.team][i][0], 0, sp[a.userData.team][i][1]); a.userData.health = 100; a.userData.dead = false; }
  player.grenades = { he: 0, flash: 0, smoke: 0 };
}
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), .1);
  if (active && !paused) { accumulator = Math.min(accumulator + dt, FIXED_STEP * MAX_STEPS_PER_FRAME); while (accumulator >= FIXED_STEP) { step(FIXED_STEP); accumulator -= FIXED_STEP; } }
  camera.position.set(player.pos.x, player.pos.y + player.eyeY(), player.pos.z);
  euler.set(player.pitch + player.kickPitch, player.yaw + player.kickYaw, 0); camera.quaternion.setFromEuler(euler); camera.getWorldDirection(forward);
  for (let i = tracers.length - 1; i >= 0; i--) { tracers[i].life -= dt; if (tracers[i].life <= 0) { tracers[i].dispose(); tracers.splice(i, 1); } }
  renderer.render(scene, camera);
}
if (shot === 'play') {
  match.phase = 'play'; match.phaseTime = 72; active = true;
  Object.assign(player.pos, { x: 0, y: 0, z: 10 }); player.yaw = 0; player.pitch = 0;
  const displaySpawns = [[-3, 5], [0, 6], [3, 5], [-1, 7]];
  let displayIndex = 0;
  for (const a of bots.bots) if (a.userData.team === 'warden') {
    const [x, z] = displaySpawns[displayIndex++]; a.position.set(x, 0, z); a.userData.cooldown = 99;
  }
  hud.update(match, player, { vanguard: 5, warden: 5 });
  tracers.push(makeTracer(scene, new THREE.Vector3(-2.8, 1.4, 5.1), new THREE.Vector3(0, 1.2, 6.1), 0xffa63d));
}
if (shot === 'site') Object.assign(player.pos, { x: -17, y: 7, z: -8 });
if (params.has('test')) window.__gameTest = {
  player, match, bots, world, get grenade() { return grenade; }, get reload() { return reload; }, get plant() { return plant; }, get use() { return input.down.use; },
  placeNearSite() { Object.assign(player.pos, { x: world.sites.A.cx, y: 0.7, z: world.sites.A.cz }); },
  placeAwayFromSite() { Object.assign(player.pos, { x: START.x, y: 0, z: START.z }); }, get defuse() { return defuse; },
  lockInput() { input.locked = true; },
  fireOnce() { fire(); },
  buyItem(id) { return buy(match, 'vanguard', id, player); }, setPhase(phase) { match.phase = phase; },
  throwGrenade(type) { throwGrenade(type, true); },
  detonate(type) { grenade = { type, pos: new THREE.Vector3(player.pos.x, player.pos.y + 1, player.pos.z), vel: new THREE.Vector3(), fuse: 0.01 }; },
  finishRound(winner) { finishRound(match, winner); },
  get blindTime() { return blindTime; }, get smokes() { return smokes; }, get blinds() { return blinds; },
  testDetonation(type) { const g = { type, pos: new THREE.Vector3(player.pos.x, player.pos.y + 1, player.pos.z) }, spec = GRENADES[type];
    if (type === 'flash') { for (const b of bots.bots) if (b.userData.health > 0 && b.position.distanceTo(g.pos) < spec.radius) blinds.push({ team: b.userData.team, position: g.pos.clone(), radius: spec.radius, life: spec.effect }); blindTime = spec.effect; }
    if (type === 'smoke') { const mesh = new THREE.Mesh(new THREE.SphereGeometry(spec.radius, 16, 12), new THREE.MeshBasicMaterial({ color: 0x8c9697, transparent: true, opacity: .3, depthWrite: false, side: THREE.DoubleSide })); mesh.position.copy(g.pos); scene.add(mesh); smokes.push({ position: g.pos.clone(), radius: spec.radius, life: spec.duration, mesh }); }
  },
  placeTarget() { const target = bots.bots.find(a => a.userData.team === 'warden'); target.position.set(player.pos.x, 0, player.pos.z - 8); return target; },
};
frame();
