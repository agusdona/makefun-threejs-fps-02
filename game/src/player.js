// LONGWAVE local player: acceleration/friction movement, gravity, crouch, AABB collision
// against world colliders (slide X then Z), recoil view state. No three.js import.
// State lives in one object: player.pos {x,y,z} is feet, player.yaw/pitch look, vel is m/s.
import { MOVE, LOOK, RECOIL } from './config.js';

export const HITBOX = {
  radius: 0.35,
  height: 1.8,
  crouch: 1.25,
  eye: 1.62,
  eyeCrouch: 1.05,
};

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const ease = (rate, dt) => 1 - Math.exp(-rate * dt);

// Reusable scratch objects: the step never allocates.
const wish = { x: 0, z: 0 };
const dir = { x: 0, z: 0 };

export class Player {
  constructor(start) {
    this.pos = { x: start.x, y: 0, z: start.z }; // feet
    this.vel = { x: 0, y: 0, z: 0 };
    this.yaw = start.yaw || 0;
    this.pitch = start.pitch || 0;
    this.crouchT = 0; // 0 standing .. 1 crouched, eased
    this.height = HITBOX.height;
    this.onGround = true;
    this.sprinting = false;
    this.ads = false;
    this.kickPitch = 0;
    this.kickYaw = 0;
  }

  eyeY() {
    return HITBOX.eye + (HITBOX.eyeCrouch - HITBOX.eye) * this.crouchT;
  }

  // inp: {fwd, side, walk, crouch, jump, ads, speedMul}. colliders: [[w,h,d,x,y,z,mat],...]
  step(inp, colliders, dt) {
    const crouchTarget = inp.crouch ? 1 : 0;
    this.crouchT += clamp(crouchTarget - this.crouchT, -dt * 8, dt * 8);
    this.height = HITBOX.height + (HITBOX.crouch - HITBOX.height) * this.crouchT;

    let speed = MOVE.run;
    if (this.crouchT > 0.5) speed = MOVE.crouch;
    else if (inp.walk) speed = MOVE.walk;
    if (inp.ads) speed = Math.min(speed, MOVE.ads);
    speed *= inp.speedMul || 1;

    const sy = Math.sin(this.yaw);
    const cy = Math.cos(this.yaw);
    wish.x = -sy * inp.fwd + cy * inp.side;
    wish.z = -cy * inp.fwd - sy * inp.side;
    const wl = Math.hypot(wish.x, wish.z);
    if (wl > 1) { wish.x /= wl; wish.z /= wl; }
    this.sprinting = !inp.walk && !inp.ads && inp.fwd > 0 && this.crouchT < 0.5;

    // Horizontal: exponential approach to the wish velocity (acceleration or friction).
    const rate = this.onGround ? (wl > 0 ? MOVE.accel : MOVE.friction) : MOVE.airAccel;
    const k = ease(rate, dt);
    this.vel.x += (wish.x * speed - this.vel.x) * k;
    this.vel.z += (wish.z * speed - this.vel.z) * k;

    // Gravity, jump, vertical resolve against box tops / the floor at y = 0.
    const p = this.pos;
    if (inp.jump && this.onGround) {
      this.vel.y = MOVE.jumpSpeed;
      this.onGround = false;
    }
    this.vel.y -= MOVE.gravity * dt;
    const prevY = p.y;
    p.y += this.vel.y * dt;
    const r = HITBOX.radius;
    let floorY = 0;
    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      const top = b[4] + b[1];
      if (prevY >= top - 0.001 && p.y <= top + 0.001 && overlapXZ(p, b, r)) floorY = Math.max(floorY, top);
    }
    if (p.y <= floorY) {
      p.y = floorY;
      this.vel.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Horizontal: move X, push out, then move Z, push out (slide along walls).
    p.x += this.vel.x * dt;
    resolveAxis(this, colliders, r, 0);
    p.z += this.vel.z * dt;
    resolveAxis(this, colliders, r, 2);
  }
}

// Circle (radius r) at p vs box footprint in the XZ plane.
function overlapXZ(p, b, r) {
  const hx = b[0] / 2;
  const hz = b[2] / 2;
  const qx = Math.abs(p.x - b[3]) - hx;
  const qz = Math.abs(p.z - b[5]) - hz;
  if (qx > 0 || qz > 0) return qx * qx + qz * qz < r * r;
  return true;
}

function resolveAxis(self, colliders, r, axis) {
  const p = self.pos;
  for (let iter = 0; iter < 3; iter++) {
    let moved = false;
    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      const top = b[4] + b[1];
      if (top <= p.y + 0.05 || b[4] >= p.y + self.height - 0.05) continue;
      if (!overlapXZ(p, b, r)) continue;
      const cx = b[3];
      const cz = b[5];
      if (axis === 0) {
        if (p.x > cx) p.x = cx + b[0] / 2 + r;
        else p.x = cx - b[0] / 2 - r;
        self.vel.x = 0;
      } else {
        if (p.z > cz) p.z = cz + b[2] / 2 + r;
        else p.z = cz - b[2] / 2 - r;
        self.vel.z = 0;
      }
      moved = true;
    }
    if (!moved) break;
  }
}

// Mouse look applied from input deltas; pitch clamped to LOOK.pitchLimit.
Player.prototype.look = function look(dx, dy, ads) {
  const s = LOOK.sensitivity * (ads ? LOOK.adsScale : 1);
  this.yaw -= dx * s;
  this.pitch = clamp(this.pitch - dy * s, -LOOK.pitchLimit, LOOK.pitchLimit);
  if (this.yaw > Math.PI) this.yaw -= 2 * Math.PI;
  if (this.yaw < -Math.PI) this.yaw += 2 * Math.PI;
};

// Recoil: each kick adds to kickPitch/kickYaw (rendered on top of the aim). decayKick pulls the view
// back by RECOIL.recenter and bleeds the kick at RECOIL.recover, so a spray walks up but settles.
Player.prototype.kick = function kick(pitch, yaw) {
  this.kickPitch += pitch;
  this.kickYaw += yaw;
};

// Recoil: kickPitch is the rendered offset, always pushing the view up. Each step the aim itself is
// re-centred upward by RECOIL.recenter, so letting go of fire walks the crosshair back down.
Player.prototype.decayKick = function decayKick(dt) {
  const back = ease(RECOIL.recover, dt);
  this.kickPitch *= 1 - back;
  this.pitch -= this.kickPitch * ease(RECOIL.recenter, dt);
  this.pitch = clamp(this.pitch, -LOOK.pitchLimit, LOOK.pitchLimit);
};
