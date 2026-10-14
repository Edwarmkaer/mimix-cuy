import {prepareFade, updateFade, setOpacity, releaseFade} from './presentation.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { collectsBottle } from './powerup-rules.js';

export class Powerups {
  constructor(scene, player) {
    this.scene = scene;
    this.items = [];
    this.disposed = false;
    this.ready = new GLTFLoader().loadAsync(new URL('./assets/inca-kola.glb', import.meta.url).href).then(({scene: model}) => {
      this.model = model;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = 1.65 / size.y;
      model.scale.multiplyScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      if (this.disposed) this.dispose();
    });
  }
  spawn(x, z) {
    const item = new THREE.Group();
    item.add(this.model.clone(true));
    prepareFade(item);
    item.position.set(x, 1.4, z);
    item.userData.age = 0;
    this.scene.add(item); this.items.push(item);
  }
  update(dt, speed, player, state) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i], previousZ = item.position.z;
      if (item.userData.collected) {
        item.userData.pickupAge += dt;
        const t = Math.min(1, item.userData.pickupAge / 0.4);
        item.position.y += dt; item.scale.setScalar(1 - t * 0.5); setOpacity(item, 1 - t);
        if (t === 1) { releaseFade(item); this.items.splice(i, 1); }
        continue;
      }
      item.userData.age += dt;
      item.position.z += speed * dt;
      item.position.y = 1.4 + Math.sin(item.userData.age * 3) * 0.18;
      item.rotation.y += dt * 1.3;
      const collected = collectsBottle(player.position.x, player.position.z, item.position.x, previousZ, item.position.z);
      updateFade(item, dt, item.position.z - player.position.z);
      if (collected) { state.activate(); item.userData.collected = true; item.userData.pickupAge = 0; continue; }
      if (item.position.z > player.position.z + 14) {
        releaseFade(item); this.items.splice(i, 1);
      }
    }
  }
  reset() {
    this.items.forEach(releaseFade);
    this.items = [];
  }
  dispose() {
    this.disposed = true; this.reset();
    const resources = new Set();
    this.model?.traverse(object => {
      if (object.geometry) resources.add(object.geometry);
      for (const material of [object.material].flat()) {
        if (!material) continue;
        resources.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
      }
    });
    resources.forEach(resource => resource.dispose()); this.model = null;
  }
}
