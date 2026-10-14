import { RunnerAsset } from './runner-assets.js';
export class Rocks {
  constructor() {
    this.small = Array.from({length:5}, (_, i) => new RunnerAsset(`./assets/rock-small-${i}.glb`, 1.15, true));
    this.large = Array.from({length:5}, (_, i) => new RunnerAsset(`./assets/rock-large-${i}.glb`, 2.1, true));
    this.ready = Promise.all([...this.small, ...this.large].map(asset => asset.ready));
  }
  create(stage, large) {
    const asset = (large ? this.large : this.small)[stage];
    const model = asset.create();
    model.userData.large = large;
    model.userData.dimensions = {width:asset.width, height:asset.height, depth:asset.depth};
    return model;
  }
  dispose() { [...this.small, ...this.large].forEach(asset => asset.dispose()); }
}
