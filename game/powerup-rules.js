export const POWERUP_DURATION = 12;

export class PowerupState {
  remaining = 0;
  get active() { return this.remaining > 0; }
  activate() { this.remaining = POWERUP_DURATION; }
  reset() { this.remaining = 0; }
  advance(dt) {
    const boostedSeconds = Math.min(dt, this.remaining);
    this.remaining = Math.max(0, this.remaining - dt);
    return dt + boostedSeconds; // Exact x2 score time, including the expiry frame.
  }
}

export function collectsBottle(playerX, playerZ, bottleX, previousZ, currentZ) {
  return Math.abs(playerX - bottleX) < 0.9 &&
    playerZ >= Math.min(previousZ, currentZ) - 0.8 &&
    playerZ <= Math.max(previousZ, currentZ) + 0.8;
}
