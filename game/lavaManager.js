import {rowDistance, lookAhead} from './difficulty.js';
import { hitsRock, stageForScore } from './stages.js';
import { SpawnPlanner } from './spawn-planner.js';
import { Motorcycle } from './motorcycle.js';
import { hitsMotorcycle } from './motorcycle-rules.js';
import {prepareFade, updateFade, releaseFade} from './presentation.js';
import { RunnerAsset } from './runner-assets.js';
import { Rocks } from './rocks.js';
import { LANES, LANE_WIDTH, GAME_AREA_LENGTH } from './constants.js';

// Kept as the existing host interface for rocks, cones and vehicles.
export class LavaManager {
  constructor(scene, spawnPowerup, spawnCoins = () => {}) {
    this.scene = scene; this.spawnPowerup = spawnPowerup; this.spawnCoins = spawnCoins;
    this.motorcycle = new Motorcycle();
    this.rocks = new Rocks();
    this.cone = new RunnerAsset('./assets/traffic-cone.glb', 3.3, true);
    this.cone.ready = this.cone.ready.then(() => {
      if (this.cone.disposed || !this.cone.model) return;
      const widthScale = Math.min(1, 1.8 / Math.max(this.cone.width, this.cone.depth));
      this.cone.model.scale.set(widthScale, 3.3 / this.cone.height, widthScale);
      this.cone.width *= widthScale; this.cone.depth *= widthScale; this.cone.height = 3.3;
    });
    this.ready = Promise.all([this.motorcycle.ready, this.rocks.ready, this.cone.ready]);
    this.planner = new SpawnPlanner();
    this.lavaHazards = []; this.reset();
  }
  reset() {
    this.lavaHazards.forEach(item => {
      item.removeFromParent();
      if (item.userData.kind === 'motorcycle') this.motorcycle.release(item);
      else releaseFade(item);
    });
    this.lavaHazards = []; this.elapsed = 0; this.pending = null; this.planner.reset();
    this.distanceUntilSpawn = 8; this.groupRows = []; this.lastRowZ = null;
  }
  spawn(z, plan, stage, withCoins = true, speed = 12) {
    if (plan.kind === 'group') {
      for (const obstacle of plan.obstacles) this.spawn(z, obstacle, stage, false);
      if (plan.bottleLane !== undefined) this.spawnPowerup(LANES[plan.bottleLane], z - speed * .65);
      for (const reward of plan.rewards) {
        const blockers=this.lavaHazards.filter(item=>Math.abs(item.position.x-LANES[reward.lane])<1.2).map(item=>({z:item.position.z,...item.userData.dimensions}));
        this.spawnCoins(LANES[reward.lane], z, {...reward, speed, blockers});
      }
      return;
    }
    const {kind, safeLane} = plan;
    if (kind === 'powerup') {
      const lane = safeLane;
      this.spawnPowerup(LANES[lane], z);
      this.spawnCoins(LANES[lane], z + 12);
      return;
    }
    const moto = kind === 'motorcycle';
    const item = moto ? this.motorcycle.create() : kind === 'cone' ? this.cone.create() : this.rocks.create(stage, plan.large ?? false);
    if (!moto) prepareFade(item);
    if (kind === 'cone') item.userData.dimensions = {width:this.cone.width, height:this.cone.height, depth:this.cone.depth};
    const lane = plan.lane;
    const x = moto ? (safeLane === 2 ? -LANE_WIDTH / 2 : LANE_WIDTH / 2) : LANES[lane];
    item.userData.kind = kind;
    item.userData.previousZ = z;
    item.position.set(x, 0, z);
    this.scene.add(item); this.lavaHazards.push(item);
    // Coin rows use the open lane and end ahead of this wave. At the minimum
    // speed, successive waves remain more than a row length apart.
    const freeLane = safeLane;
    if (withCoins) this.spawnCoins(LANES[freeLane], z + 12);
  }
  update(dt, playerZ, speed, score = 0) {
    this.elapsed += dt;
    this.distanceUntilSpawn -= speed * dt;
    if (this.lastRowZ !== null) this.lastRowZ += speed * dt;
    if (this.distanceUntilSpawn <= 0) {
      if (!this.groupRows.length) this.groupRows = this.planner.group(this.elapsed);
      const plan = this.groupRows[0];
      // Mixed vehicle rows use the same spacing contract as ordinary rows.
      if (plan) {
        const distance = rowDistance(speed, this.elapsed);
        const z = Math.min(playerZ - lookAhead(speed), this.lastRowZ === null ? Infinity : this.lastRowZ - distance);
        this.spawn(z, plan, stageForScore(score).index, true, speed);
        this.lastRowZ = z;
        this.groupRows.shift();
        if (plan.vehicle) this.planner.motorcycleAt = this.elapsed + this.planner.delay(14,18);
        if (plan.bottleLane !== undefined) this.planner.powerupAt = this.elapsed + this.planner.delay(45,55);
        this.distanceUntilSpawn = distance;
      }
    }
    for (let i = this.lavaHazards.length - 1; i >= 0; i--) {
      const item = this.lavaHazards[i], moto = item.userData.kind === 'motorcycle';
      if (moto) this.motorcycle.update(item, dt, playerZ);
      // Mixed rows share arrival time; vehicles must never overtake a playable route.
      const factor = 1;
      item.userData.previousZ = item.position.z;
      item.position.z += speed * dt * factor;
      if (!moto) updateFade(item, dt, item.position.z - playerZ);
      if (item.position.z > playerZ + (moto ? 20 : 14)) {
        item.removeFromParent(); if (moto) this.motorcycle.release(item); else releaseFade(item);
        this.lavaHazards.splice(i, 1);
      }
    }
  }
  checkCollision(player) {
    const p = player.mesh.position;
    return this.lavaHazards.some(item => {
      if (item.userData.kind === 'motorcycle') return hitsMotorcycle(p.x, p.z, item.position.x, item.userData.previousZ, item.position.z);
      return hitsRock(p, player.jumpStartY, item.position, item.userData.previousZ, item.userData.dimensions, item.userData.kind === 'cone');
    });
  }
  dispose() { this.reset(); this.motorcycle.dispose(); this.rocks.dispose(); this.cone.dispose(); }
}
