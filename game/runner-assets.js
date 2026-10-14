import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class RunnerAsset {
  constructor(file, size, grounded = false) {
    this.disposed = false;
    this.ready = new GLTFLoader().loadAsync(new URL(file, import.meta.url).href).then(({scene}) => {
      this.model = new THREE.Group();
      const bounds = new THREE.Box3().setFromObject(scene);
      const dimensions = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = size / Math.max(dimensions.x, dimensions.y, dimensions.z);
      scene.scale.multiplyScalar(scale);
      scene.position.sub(center.multiplyScalar(scale));
      if (grounded) scene.position.y += dimensions.y * scale / 2;
      this.model.add(scene);
      this.height = dimensions.y * scale;
      this.width = dimensions.x * scale;
      this.depth = dimensions.z * scale;
      if (this.disposed) this.dispose();
    });
  }
  create() { return this.model.clone(true); }
  dispose() {
    this.disposed = true;
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
