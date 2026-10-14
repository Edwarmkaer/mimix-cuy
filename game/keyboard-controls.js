const directions = {ArrowLeft:-1, KeyA:-1, ArrowRight:1, KeyD:1};
const jumps = ['Space','ArrowUp','KeyW'];
export class KeyboardControls {
  constructor(player) { this.player = player; this.reset(); }
  reset() { this.held = new Map(); this.elapsed = 0; }
  press(code) {
    if (!(code in directions) && !jumps.includes(code)) return false;
    if (this.held.has(code)) return true;
    this.held.set(code, directions[code] ?? 0);
    if (code in directions) { this.move(directions[code]); this.elapsed = 0; }
    else this.player.jump();
    return true;
  }
  release(code) { this.held.delete(code); }
  move(direction) { this.player.setTargetLane(this.player.targetLane + direction, true); }
  update(dt) {
    const held = [...this.held.values()].filter(Boolean);
    if (!held.length) { this.elapsed = 0; return; }
    this.elapsed += dt;
    if (this.elapsed >= .18) { this.elapsed %= .18; this.move(held.at(-1)); }
  }
}
