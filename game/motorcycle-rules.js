// Two adjacent lanes; jumping never bypasses this obstacle.
export const MOTORCYCLE_WIDTH = 4.6;
export const MOTORCYCLE_DEPTH = 8.4;
export function hitsMotorcycle(x, z, obstacleX, previousZ, currentZ) {
  return Math.abs(x - obstacleX) < MOTORCYCLE_WIDTH / 2 + 0.3
    && z >= Math.min(previousZ, currentZ) - MOTORCYCLE_DEPTH / 2 - 0.3
    && z <= Math.max(previousZ, currentZ) + MOTORCYCLE_DEPTH / 2 + 0.3;
}

export function motorcyclePresentation(age, distancePastPlayer) {
  const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  return {
    opacity: smooth(age / 0.9) * (1 - smooth((distancePastPlayer - 6) / 12)),
    speedFactor: 0.65 + 0.7 * smooth(age / 0.9),
  };
}
