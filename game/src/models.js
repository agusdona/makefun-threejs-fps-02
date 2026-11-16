import * as THREE from 'three';
import { PALETTE } from './palette.js';

const PARTS = {
  head: { size: [0.34, 0.34, 0.34], center: [0, 1.62, 0], zone: 'head', multiplier: 4 },
  torso: { size: [0.58, 0.72, 0.32], center: [0, 1.08, 0], zone: 'torso', multiplier: 1 },
  leftLeg: { size: [0.24, 0.56, 0.28], center: [-0.17, 0.43, 0], zone: 'legs', multiplier: 0.75 },
  rightLeg: { size: [0.24, 0.56, 0.28], center: [0.17, 0.43, 0], zone: 'legs', multiplier: 0.75 },
};

export function createActor(team = 'warden') {
  const group = new THREE.Group();
  const tint = team === 'vanguard' ? PALETTE.accent : PALETTE.rust;
  const armor = new THREE.MeshStandardMaterial({ color: tint, roughness: 0.82 });
  const helmet = new THREE.MeshStandardMaterial({ color: PALETTE.hairline, metalness: 0.25, roughness: 0.62 });
  const hitboxes = [];
  for (const [name, part] of Object.entries(PARTS)) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...part.size), name === 'head' ? helmet : armor);
    mesh.position.set(...part.center);
    mesh.castShadow = true;
    mesh.userData.hitbox = { zone: part.zone, multiplier: part.multiplier };
    mesh.userData.actor = group;
    group.add(mesh);
    hitboxes.push(mesh);
  }
  group.userData.hitboxes = hitboxes;
  group.userData.team = team;
  group.userData.health = 100;
  group.userData.armor = 0;
  return group;
}

export function hitZone(mesh) {
  return mesh?.userData?.hitbox || null;
}
