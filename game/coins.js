import {prepareFade, updateFade, setOpacity, releaseFade} from './presentation.js';
import { RunnerAsset } from './runner-assets.js';
import { collectsCoin, coinTrail } from './coin-rules.js';

export class Coins {
  constructor(scene) {
    this.scene = scene; this.items = [];
    this.asset = new RunnerAsset('./assets/coin.glb', 0.8);
    this.ready = this.asset.ready;
  }
  spawnRow(x, z, options = {}) {
    let i = 0;
    for (const point of coinTrail(z, options)) {
      const coin = this.asset.create();
      coin.position.set(x, point.y, point.z);
      coin.userData.baseY = point.y;
      coin.userData.age = i++ * 0.3; prepareFade(coin);
      this.items.push(coin); this.scene.add(coin);
    }
  }
  update(dt, speed, player) {
    let collected = 0;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const coin = this.items[i], previousZ = coin.position.z;
      if (coin.userData.collected) {
        coin.userData.pickupAge += dt;
        const t = Math.min(1, coin.userData.pickupAge / 0.28);
        coin.position.y += dt * 1.8; coin.scale.setScalar(1 - t * 0.65);
        setOpacity(coin, 1 - t);
        if (t === 1) { releaseFade(coin); this.items.splice(i, 1); }
        continue;
      }
      coin.position.z += speed * dt; coin.userData.age += dt;
      coin.rotation.y += dt * 2.5;
      coin.position.y = coin.userData.baseY + Math.sin(coin.userData.age * 3) * 0.12;
      const hit = collectsCoin(player, coin.position, previousZ);
      updateFade(coin, dt, coin.position.z - player.z);
      if (hit) {
        collected++; coin.userData.collected = true; coin.userData.pickupAge = 0;
        coin.position.z = player.z; continue;
      }
      if (coin.position.z > player.z + 14) { releaseFade(coin); this.items.splice(i, 1); }
    }
    return collected;
  }
  reset() { this.items.forEach(releaseFade); this.items = []; }
  dispose() { this.reset(); this.asset.dispose(); }
}
