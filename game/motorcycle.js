import { motorcyclePresentation } from './motorcycle-rules.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Motorcycle {
  constructor() {
    this.disposed = false;
    this.ready = new GLTFLoader().loadAsync(new URL('./assets/mototaxi.glb', import.meta.url).href).then(({scene}) => {
      this.model = scene;
      if (this.disposed) this.dispose();
    });
  }
  create() {
    const mesh = this.model.clone(true);
    mesh.userData.kind = 'motorcycle';
    mesh.userData.age = 0;
    mesh.userData.fadeMaterials = [];
    mesh.traverse(object => {
      if (!object.isMesh) return;
      const clone = original => {
        const material = original.clone();
        material.transparent = true; material.opacity = 0;
        mesh.userData.fadeMaterials.push(material); return material;
      };
      object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material);
    });
    return mesh;
  }
  update(mesh, dt, playerZ) {
    mesh.userData.age += dt;
    const state = motorcyclePresentation(mesh.userData.age, mesh.position.z - playerZ);
    for (const material of mesh.userData.fadeMaterials) material.opacity = state.opacity;
    // Suspension and body roll suggest an engine in motion without changing lanes.
    mesh.position.y = 0.035 + Math.sin(mesh.userData.age * 11) * 0.035;
    mesh.rotation.z = Math.sin(mesh.userData.age * 3.8) * 0.016;
    mesh.rotation.x = Math.sin(mesh.userData.age * 5.2) * 0.008;
    return state.speedFactor;
  }
  release(mesh) { mesh.userData.fadeMaterials.forEach(material => material.dispose()); }
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
    resources.forEach(resource => resource.dispose());
    this.model = null;
  }
}
