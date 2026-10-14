export function jumpHeight(progress, floor = 0.02) {
  const t = Math.max(0, Math.min(1, progress));
  return floor + 4 * 2.8 * t * (1 - t);
}
export function clearsLava(isJumping, height, floor) {
  return isJumping && height > floor + 0.3;
}
