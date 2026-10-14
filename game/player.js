import * as THREE from 'three';
import { jumpHeight } from './rules.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LANES, PLAYER_START_Z, PLAYER_LANE_CHANGE_COOLDOWN } from './constants.js';

export class Player {
  constructor() {
    this.mesh = new THREE.Group();
    this.jumpStartY = 0.02;
    this.jumpDuration = 1.2;
    this.modelLoaded = false;
    this.reset();
    this.ready = new GLTFLoader().loadAsync('/assets/models/cuy/cuy-animated-v2.glb').then(gltf => {
      const model = gltf.scene;
      if (this.disposed) {
        model.traverse(object => { object.geometry?.dispose(); object.skeleton?.dispose(); for (const material of [object.material].flat()) material?.dispose(); });
        return;
      }
      model.scale.setScalar(0.65);
      model.rotation.y = Math.PI;
      this.mesh.add(model);
      this.mixer = new THREE.AnimationMixer(model);
      this.actions = new Map();
      for (const source of gltf.animations.filter(clip => ['Run', 'Jump', 'Idle'].includes(clip.name))) {
        const clip = source.clone();
        // Game physics owns height/collisions; do not add the baked jump twice.
        clip.tracks = clip.tracks.filter(track => !track.name.startsWith('Root.'));
        this.actions.set(clip.name, this.mixer.clipAction(clip));
      }
      this.modelLoaded = true;
      this.play('Idle');
    });
  }
  play(name) {
    const next = this.actions?.get(name);
    if (!next || next === this.currentAnimation) return;
    this.currentAnimation?.fadeOut(0.12);
    next.reset().setLoop(name === 'Jump' ? THREE.LoopOnce : THREE.LoopRepeat, name === 'Jump' ? 1 : Infinity);
    next.clampWhenFinished = name === 'Jump';
    next.timeScale = name === 'Jump' ? next.getClip().duration / this.jumpDuration : 1;
    next.fadeIn(0.12).play(); this.currentAnimation = next;
  }
  reset() {
    this.targetLane = this.currentLane = 1;
    this.cooldownTimer = this.jumpTimer = 0;
    this.isJumping = false;
    this.mesh.position.set(LANES[1], this.jumpStartY, PLAYER_START_Z);
    this.mixer?.stopAllAction(); this.currentAnimation = null;
    this.startRunAnimation();
  }
  setTargetLane(lane, immediate = false) {
    if (!immediate && this.cooldownTimer > 0) return;
    const target = Math.max(0, Math.min(2, lane));
    if (target !== this.targetLane) { this.targetLane = target; this.cooldownTimer = PLAYER_LANE_CHANGE_COOLDOWN; }
  }
  jump() {
    if (this.isJumping || !this.modelLoaded) return;
    this.isJumping = true; this.jumpTimer = 0; this.play('Jump');
  }
  startRunAnimation() { this.play('Run'); }
  stopRunAnimation() { this.play('Idle'); }
  update(dt) {
    this.mixer?.update(dt);
    this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    if (this.isJumping) {
      this.jumpTimer += dt;
      const t = Math.min(1, this.jumpTimer / this.jumpDuration);
      this.mesh.position.y = jumpHeight(t, this.jumpStartY);
      if (t === 1) { this.isJumping = false; this.startRunAnimation(); }
    }
    const target = LANES[this.targetLane];
    this.mesh.position.x += (target - this.mesh.position.x) * (1 - Math.exp(-25 * dt));
    if (Math.abs(target - this.mesh.position.x) < 0.01) { this.mesh.position.x = target; this.currentLane = this.targetLane; }
    this.mesh.position.z = PLAYER_START_Z;
  }
}
