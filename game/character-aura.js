// Rim emission uses the character's skinned normals, so it follows every pose.
export class CharacterAura {
  constructor(player) {
    this.reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.entries = []; this.disposed = false; this.flash = 0;
    this.uniforms = {uAuraTime:{value:0}, uAuraStrength:{value:0}, uCoinFlash:{value:0}};
    player.ready.then(() => {
      if (this.disposed) return;
      player.mesh.traverse(object => {
        if (!object.isMesh) return;
        const originals = object.material;
        const clone = source => {
          const material = source.clone();
          material.onBeforeCompile = shader => {
            Object.assign(shader.uniforms, this.uniforms);
            shader.fragmentShader = `uniform float uAuraTime; uniform float uAuraStrength; uniform float uCoinFlash;\n${shader.fragmentShader}`;
            shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
              float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.5);
              vec3 rainbow = 0.5 + 0.5 * cos(6.2831853 * (vec3(0.0, 0.33, 0.67) + vViewPosition.y * 0.18 + uAuraTime * 0.16));
              totalEmissiveRadiance += rainbow * uAuraStrength * (rim * 1.4 + 0.07);
              totalEmissiveRadiance += vec3(1.0, 0.65, 0.12) * uCoinFlash * (0.06 + rim * 0.3);
            `);
          };
          material.customProgramCacheKey = () => 'mimix-character-aura-v1';
          return material;
        };
        object.material = Array.isArray(originals) ? originals.map(clone) : clone(originals);
        this.entries.push({object, originals, materials:[object.material].flat()});
      });
    });
  }
  collectedCoin() { this.flash = 1; }
  update(dt, remaining) {
    if (!this.reducedMotion) this.uniforms.uAuraTime.value += dt;
    const strength = remaining > 0 ? Math.min(1, remaining / 1.5) : 0;
    this.uniforms.uAuraStrength.value += (strength - this.uniforms.uAuraStrength.value) * (1 - Math.exp(-9 * dt));
    this.flash = Math.max(0, this.flash - dt * 4);
    this.uniforms.uCoinFlash.value = this.flash;
  }
  reset() { this.flash = 0; this.uniforms.uAuraStrength.value = this.uniforms.uCoinFlash.value = 0; }
  dispose() {
    this.disposed = true;
    this.entries.forEach(({object, originals, materials}) => { object.material = originals; materials.forEach(material => material.dispose()); });
    this.entries = [];
  }
}
