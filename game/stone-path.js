import * as THREE from 'three';
import {lookAhead} from './difficulty.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// One uninterrupted surface; scrolling UVs replace recycled geometry sections.
// Keep this public name for existing experience hosts.
export class StonePath {
  constructor(scene) {
    this.scene = scene; this.disposed = false;
    this.length = 150;
    this.ready = new GLTFLoader().loadAsync(new URL('./assets/road.glb', import.meta.url).href).then(({scene: model}) => {
      this.model = model;
      if (this.disposed) { this.release(); return; }
      // The selected asset is a flat XY plane, two units wide and long.
      model.rotation.x = -Math.PI / 2;
      model.scale.set(4, this.length / 2, 1);
      model.position.set(0, -0.015, 22 - this.length / 2);
      model.traverse(object => {
        if (!object.isMesh) return;
        const material = object.material;
        material.roughness = 1; material.metalness = 0;
        this.texture = material.map;
        // Mirroring joins identical edge pixels, avoiding visible texture seams.
        this.texture.wrapS = this.texture.wrapT = THREE.MirroredRepeatWrapping;
        this.texture.repeat.set(1, this.length / 8);
        this.texture.anisotropy = 4;
        this.texture.needsUpdate = true;
      });
      scene.add(model);
    });
  }
  update(dt, speed) {
    const length = Math.max(150, lookAhead(speed) + 60);
    if (this.model && this.texture && length > this.length) {
      this.length = length; this.model.scale.y = length / 2;
      this.model.position.z = 22 - length / 2; this.texture.repeat.y = length / 8;
    }
    // This asset has V increasing toward +Z; subtract offset to move asphalt toward the camera.
    if (this.texture) this.texture.offset.y = ((this.texture.offset.y - dt * speed / 8) % 2 + 2) % 2;
  }
  reset() { if (this.texture) this.texture.offset.y = 0; }
  release() {
    const resources = new Set();
    this.model?.traverse(object => {
      if (object.geometry) resources.add(object.geometry);
      for (const material of [object.material].flat()) {
        if (!material) continue;
        resources.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
      }
    });
    resources.forEach(resource => resource.dispose());
  }
  dispose() { this.disposed = true; this.model?.removeFromParent(); this.release(); }
}
