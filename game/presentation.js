export function smoothstep(value) {
  const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t);
}
export function objectOpacity(age, pastPlayer) {
  return smoothstep(age / 0.8) * (1 - smoothstep((pastPlayer - 6) / 8));
}
export function prepareFade(item) {
  item.userData.fadeAge = 0;
  item.userData.fadeMaterials = [];
  item.traverse(object => {
    if (!object.isMesh) return;
    const clone = original => {
      const material = original.clone();
      material.transparent = true;
      item.userData.fadeMaterials.push({material, opacity: original.opacity});
      material.opacity = 0; return material;
    };
    object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material);
  });
}
export function setOpacity(item, opacity) {
  item.userData.fadeMaterials.forEach(entry => { entry.material.opacity = entry.opacity * opacity; });
}
export function updateFade(item, dt, pastPlayer) {
  item.userData.fadeAge += dt;
  setOpacity(item, objectOpacity(item.userData.fadeAge, pastPlayer));
}
export function releaseFade(item) {
  item.userData.fadeMaterials?.forEach(entry => entry.material.dispose());
  item.removeFromParent();
}
