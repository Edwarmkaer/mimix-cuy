// Original tutorial's handlePoseUpdate rules, isolated from the DOM for reuse.
export class PoseControls {
  constructor(player) { this.player = player; this.reset(); }
  reset() { this.baseline = null; this.cooldown = 0; }
  update(x, y) {
    const mirrored = 1 - x;
    this.player.setTargetLane(mirrored < 0.35 ? 0 : mirrored > 0.65 ? 2 : 1);
    // Preserve the original per-detection cooldown and adaptive shoulder baseline.
    if (this.cooldown > 0) this.cooldown -= 1 / 60;
    if (this.baseline === null && y > 0 && y < 1) this.baseline = y;
    if (this.baseline !== null && this.cooldown <= 0) {
      if (this.baseline - y > 0.06) {
        this.player.jump();
        this.cooldown = 0.7;
        this.baseline = y + 0.06 * 0.5;
      } else if (y > this.baseline + 0.06 * 0.5 && !this.player.isJumping) {
        this.baseline = this.baseline * 0.99 + y * 0.01;
      }
    }
  }
}
