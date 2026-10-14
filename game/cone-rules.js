export function hitsCone(player, baseY, cone, previousZ, dimensions) {
  return Math.abs(player.x - cone.x) < dimensions.width / 2 + 0.3 &&
    player.z >= Math.min(previousZ, cone.z) - dimensions.depth / 2 - 0.3 &&
    player.z <= Math.max(previousZ, cone.z) + dimensions.depth / 2 + 0.3 &&
    player.y - baseY < dimensions.height;
}
