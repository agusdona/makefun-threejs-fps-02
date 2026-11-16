// Keyboard + mouse look + pointer lock. No three.js import.
export const BINDS = {
  KeyW: 'fwd', KeyS: 'back', KeyA: 'left', KeyD: 'right',
  ShiftLeft: 'walk', ControlLeft: 'crouch', KeyC: 'crouch',
  Space: 'jump', KeyR: 'reload', KeyB: 'buy', KeyE: 'use',
  KeyQ: 'grenade', KeyG: 'grenade', Tab: 'score',
  Digit1: 'w1', Digit2: 'w2', Digit3: 'w3', Digit4: 'w4', Digit5: 'w5', Digit6: 'w6',
};

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = Object.create(null);
    this.pressedKeys = Object.create(null);
    this.dx = 0;
    this.dy = 0;
    this.fire = false;
    this.ads = false;
    this.locked = false;
    this.enabled = true;
    this.onLockChange = null;
  }

  attach(target) {
    const el = target || window;
    this._kd = (e) => this.keyDown(e);
    this._ku = (e) => this.keyUp(e);
    this._mm = (e) => this.mouseMove(e);
    this._md = (e) => this.mouseDown(e);
    this._mu = (e) => this.mouseUp(e);
    this._lc = () => this.lockChanged();
    el.addEventListener('keydown', this._kd);
    el.addEventListener('keyup', this._ku);
    el.addEventListener('mousemove', this._mm);
    el.addEventListener('mousedown', this._md);
    el.addEventListener('mouseup', this._mu);
    document.addEventListener('pointerlockchange', this._lc);
  }

  detach() {
    const el = window;
    el.removeEventListener('keydown', this._kd);

    el.removeEventListener('keyup', this._ku);
    el.removeEventListener('mousemove', this._mm);
    el.removeEventListener('mousedown', this._md);
    el.removeEventListener('mouseup', this._mu);
    document.removeEventListener('pointerlockchange', this._lc);
  }

  action(code) {
    return BINDS[code] || null;
  }

  keyDown(e) {
    const a = this.action(e.code);
    if (!a || !this.down[a]) this.pressedKeys[a || e.code] = true;
    if (a) {
      this.down[a] = true;
      if (a !== 'score') e.preventDefault();
    }
  }

  keyUp(e) {
    const a = this.action(e.code);
    if (a) this.down[a] = false;
  }

  mouseMove(e) {
    if (!this.locked) return;
    this.dx += e.movementX || 0;
    this.dy += e.movementY || 0;
  }

  mouseDown(e) {
    if (!this.locked) return;
    if (e.button === 0) this.fire = true;
    if (e.button === 2) this.ads = true;
  }

  mouseUp(e) {
    if (e.button === 0) this.fire = false;
    if (e.button === 2) this.ads = false;
  }

  lockChanged() {
    this.locked = document.pointerLockElement === this.canvas;
    this.dx = 0;
    this.dy = 0;
    if (!this.locked) {
      this.fire = false;
      this.ads = false;
      this.down = Object.create(null);
    }
    if (this.onLockChange) this.onLockChange(this.locked);
  }

  // Called at the start of each fixed step: reads movement axes, then clears edge events.
  begin() {
    let fwd = 0;
    let side = 0;
    if (this.enabled) {
      if (this.down.fwd) fwd += 1;
      if (this.down.back) fwd -= 1;
      if (this.down.right) side += 1;
      if (this.down.left) side -= 1;
    }
    this.fwd = fwd;
    this.side = side;
    this.walk = !!this.down.walk;
    this.crouch = !!this.down.crouch;
    this.jump = !!this.down.jump;
    this.fireDown = this.fire;
    this.adsDown = this.ads;
    let slot = 0;
    for (let i = 1; i <= 6; i++) if (this.down['w' + i]) slot = i;
    this.slot = slot;
    this.mdx = this.dx;
    this.mdy = this.dy;
    this.dx = 0;
    this.dy = 0;
  }

  // True once per physical key press.
  pressed(action) {
    if (!this.pressedKeys[action]) return false;
    this.pressedKeys[action] = false;
    return true;
  }

  end() {
    this.pressedKeys = Object.create(null);
  }
}
