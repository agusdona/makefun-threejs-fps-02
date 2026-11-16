import * as THREE from 'three';
import { waypoints, spawns, sites } from './map.js';
import { createActor } from './models.js';
import { fireShot } from './combat.js';
import { WEAPONS } from './weapons.js';

const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
const WARDEN_SPAWNS = [[-3, -16], [0, -16.5], [3, -16], [-1, -15.2], [1, -15.2]];
export function createBots(scene, world, random) {
  const bots = [];
  const adjacency = new Map(waypoints.nodes.map(n => [n.id, []]));
  for (const [a, b] of waypoints.edges) {
    if (adjacency.has(a) && adjacency.has(b)) { adjacency.get(a).push(b); adjacency.get(b).push(a); }
  }
  function routeTo(start, goal) {
    const queue = [start], previous = new Map([[start, null]]);
    for (let i = 0; i < queue.length && !previous.has(goal); i++) for (const next of adjacency.get(queue[i]) || []) if (!previous.has(next)) { previous.set(next, queue[i]); queue.push(next); }
    if (!previous.has(goal)) return [];
    const path = []; for (let at = goal; at !== null; at = previous.get(at)) path.push(at);
    return path.reverse().map(id => waypoints.nodes.find(n => n.id === id));
  }
  function nearest(x, z) { return waypoints.nodes.reduce((best, n) => dist2(n, { x, z }) < dist2(best, { x, z }) ? n : best, waypoints.nodes[0]); }
  for (const team of ['vanguard', 'warden']) for (let i = 1; i < 5; i++) {
    const spawn = team === 'warden' ? WARDEN_SPAWNS[i] : spawns[team][i];
    const actor = createActor(team);
    actor.position.set(spawn[0], 0, spawn[1]);
    actor.userData.name = `${team === 'vanguard' ? 'Vanguard' : 'Warden'} ${i}`;
    actor.userData.team = team;
    actor.userData.health = 100;
    actor.userData.armor = i % 2 ? 25 : 0;
    actor.userData.cooldown = random() * 1.5;
    actor.userData.speed = 1.8 + random() * 0.55;
    actor.userData.route = routeTo(nearest(spawn[0], spawn[1]).id, waypoints.nodes.find(n => n.site === (i % 2 ? 'A' : 'B')).id);
    actor.userData.routeIndex = 0;
    scene.add(actor);
    bots.push(actor);
  }
  function step(dt, player, match, onDamage, onKill, effects = {}) {
    for (const bot of bots) {
      const u = bot.userData;
      if (u.health <= 0) continue;
      const enemy = u.team === 'warden' ? player : bots.find(x => x.userData.team !== u.team && x.userData.health > 0 && dist2(x.position, bot.position) < 100);
      if (!enemy || enemy.health <= 0) continue;
      const enemyTarget = enemy === player ? player.pos : enemy.position;
      const seen = enemy !== player || !effects.smokes?.some(s => segmentDistance2(bot.position, player.pos, s.position) < s.radius * s.radius);
      let target = enemyTarget;
      if (!seen || dist2(enemyTarget, bot.position) > 100) {
        const route = u.route;
        if (route?.length) {
          if (dist2(bot.position, route[u.routeIndex]) < 2.25) u.routeIndex = (u.routeIndex + 1) % route.length;
          target = route[u.routeIndex];
        }
      }
      const dx = target.x - bot.position.x, dz = target.z - bot.position.z;
      const d = Math.hypot(dx, dz) || 1;
      if (effects.blind?.some(b => b.team === u.team && b.position.distanceTo(bot.position) < b.radius)) { u.cooldown = Math.max(u.cooldown, 0.2); continue; }
      if (effects.smokes?.some(s => segmentDistance2(bot.position, enemyTarget, s.position) < s.radius * s.radius)) continue;
      if (d > 10) { bot.position.x += dx / d * u.speed * dt; bot.position.z += dz / d * u.speed * dt; }
      bot.rotation.y = Math.atan2(-dx, -dz);
      u.cooldown -= dt;
      if (seen && d < 22 && u.cooldown <= 0) {
        u.cooldown = 0.65 + random() * Math.max(0.25, 1.4 - match.round * 0.06);
        if (enemy === player) onDamage(5 + Math.min(match.round, 8), bot);
        else {
          const result = fireShot({ camera: botCamera(bot, enemy), actors: [enemy], damage: 12, spread: 0.08, random });
          if (result.hit && result.hit.userData.health <= 0) onKill(bot, result.hit);
        }
      }
    }
  }
  return { bots, step };
}
function segmentDistance2(a, b, p) {
  const dx = b.x - a.x, dz = b.z - a.z, len = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / len));
  return (a.x + dx * t - p.x) ** 2 + (a.z + dz * t - p.z) ** 2;
}
const temp = new THREE.Object3D();
function botCamera(bot, enemy) {
  temp.position.set(bot.position.x, bot.position.y + 1.5, bot.position.z);
  temp.lookAt(enemy.position.x, enemy.position.y + 1.0, enemy.position.z);
  temp.updateMatrixWorld();
  return temp;
}
