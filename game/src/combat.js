import * as THREE from 'three';
import { hitZone } from './models.js';

const ray = new THREE.Raycaster();
const direction = new THREE.Vector3();
const origin = new THREE.Vector3();
const targets = [];

export function fireShot({ camera, actors, damage, spread = 0, range = 120, random = Math.random }) {
  camera.getWorldDirection(direction);
  direction.x += (random() - 0.5) * spread;
  direction.y += (random() - 0.5) * spread;
  direction.z += (random() - 0.5) * spread;
  direction.normalize();
  origin.copy(camera.position);
  ray.set(origin, direction);
  ray.far = range;
  targets.length = 0;
  for (const actor of actors) {
    if (!actor || actor.userData.health <= 0) continue;
    actor.updateMatrixWorld(true);
    for (const mesh of actor.userData.hitboxes) targets.push(mesh);
  }
  const hit = ray.intersectObjects(targets, false)[0];
  if (!hit) return { hit: null, damage: 0, point: null };
  const zone = hitZone(hit.object);
  const actor = hit.object.userData.actor;
  let dealt = damage * (zone?.multiplier || 1);
  const absorbed = Math.min(actor.userData.armor || 0, dealt * 0.5);
  actor.userData.armor = Math.max(0, (actor.userData.armor || 0) - absorbed);
  dealt -= absorbed;
  actor.userData.health = Math.max(0, actor.userData.health - dealt);
  return { hit: actor, zone: zone?.zone || 'torso', damage: dealt, point: hit.point };
}

export function makeTracer(scene, from, to, color = 0xffa63d) {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  return { line, life: 0.075, dispose() { scene.remove(line); geometry.dispose(); material.dispose(); } };
}
