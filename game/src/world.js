import * as THREE from 'three';
import { WALL_H, walls, solids, sites } from './map.js';
import { PALETTE } from './palette.js';

export const BOUNDS = { minX: -20.5, maxX: 20.5, minZ: -13, maxZ: 9 };
export const START = { x: 0, y: 1.7, z: 7.5 };
export const START_YAW = -0.42;
export const START_PITCH = 0.04;

const DRESSING = [
  [2, 2.2, 2, -9.5, 0, -1, 'crate'], [2, 2.2, 2, -9.5, 0, 1.6, 'crate'],
  [3, 1.4, 1.2, -17.5, 0, 3, 'concrete'], [1.2, 2.6, 4, -7, 0, 4.5, 'container'],
  [2.4, 2.6, 2.4, 11, 0, 2.5, 'container'], [2, 1.2, 2, -16, 0, -3, 'crate'],
];
export const levelRecords = [...walls, ...solids].map(b => [b.w, b.h, b.d, b.x, b.y, b.z, b.mat]);
const MATERIAL_COLORS = {
  concrete: 'muted', roof: 'hairline', crate: 'rust', container: 'rust',
  sand: 'sand', asphalt: 'asphalt', metal: 'hairline', screen: 'cyan',
};

export function buildWorld(scene, records = levelRecords) {
  const colliders = records;
  const shootables = records.concat(DRESSING);
  scene.background = new THREE.Color(PALETTE.canvas);
  scene.fog = new THREE.Fog(PALETTE.canvas, 38, 92);
  scene.add(new THREE.HemisphereLight(PALETTE.ink, PALETTE.asphalt, 1.4));
  const sun = new THREE.DirectionalLight(PALETTE.accent, 2.1);
  sun.position.set(-18, 28, 12);
  scene.add(sun);
  const materials = Object.create(null);
  for (const [mat, color] of Object.entries(MATERIAL_COLORS)) {
    materials[mat] = new THREE.MeshStandardMaterial({ color: PALETTE[color], roughness: 0.88 });
  }
  const addBox = (w, h, d, x, y, z, mat) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), materials[mat] || materials.concrete);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(61, 44), materials.sand);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.04;
  floor.receiveShadow = true;
  scene.add(floor);
  for (const b of colliders) addBox(b[0], b[1], b[2], b[3], b[4], b[5], b[6]);
  for (const b of DRESSING) addBox(...b);

  const dishMat = new THREE.MeshStandardMaterial({ color: PALETTE.hairline, metalness: 0.72, roughness: 0.3, side: THREE.DoubleSide });
  const dish = new THREE.Mesh(new THREE.SphereGeometry(5.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), dishMat);
  dish.position.set(-17, 3.3, -17.5);
  dish.rotation.x = Math.PI;
  scene.add(dish);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 8, 8), materials.metal);
  mast.position.set(-17, 4.6, -17.5);
  scene.add(mast);

  const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 2.4, 16), materials.metal);
  tank.position.set(8.75, 7.4, 3.5);
  scene.add(tank);
  const sodium = [];
  for (const p of [[-26, 5, -8], [-2, 5, -11], [26, 5, -7], [4, 5, 15]]) {
    const light = new THREE.PointLight(PALETTE.accent, 22, 19, 2);
    light.position.set(p[0], p[1], p[2]);
    scene.add(light);
    sodium.push(light);
  }
  return { colliders, shootables, sites, materials, addBox, dressing: DRESSING, sodium };
}
