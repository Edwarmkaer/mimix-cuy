import test from 'node:test';
import assert from 'node:assert/strict';
import {KeyboardControls} from '../game/keyboard-controls.js';

test('keyboard reacts immediately, repeats on simulation time and releases cleanly', () => {
  const player = {targetLane:1, jump(){}, setTargetLane(lane, immediate){ assert.equal(immediate,true); this.targetLane = Math.max(0,Math.min(2,lane)); }};
  const keys = new KeyboardControls(player);
  keys.press('KeyA'); assert.equal(player.targetLane,0);
  keys.release('KeyA'); keys.press('KeyD'); assert.equal(player.targetLane,1);
  keys.press('KeyD'); assert.equal(player.targetLane,1);
  keys.update(.18); assert.equal(player.targetLane,2);
  keys.release('KeyD'); keys.update(1); assert.equal(player.targetLane,2);
  keys.press('KeyA'); keys.reset(); keys.update(1); assert.equal(player.targetLane,1);
});
