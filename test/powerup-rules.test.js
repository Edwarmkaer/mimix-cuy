import test from 'node:test';
import assert from 'node:assert/strict';
import {PowerupState, collectsBottle} from '../game/powerup-rules.js';

test('protection lasts twelve simulation seconds and splits score at expiry', () => {
  const state = new PowerupState();
  assert.equal(state.advance(1), 1);
  state.activate();
  assert.equal(state.active, true);
  assert.equal(state.advance(11.5), 23);
  assert.equal(state.advance(1), 1.5);
  assert.equal(state.active, false);
  assert.equal(state.remaining, 0);
});
test('collecting again refreshes duration; restarting clears protection', () => {
  const state = new PowerupState(); state.activate(); state.advance(4);
  state.activate(); assert.equal(state.remaining, 12);
  state.reset(); assert.equal(state.active, false);
});
test('collection detects crossed bottle without collecting adjacent lanes', () => {
  assert.equal(collectsBottle(0, 2, 0, 0, 4), true);
  assert.equal(collectsBottle(2.5, 2, 0, 0, 4), false);
  assert.equal(collectsBottle(0, 2, 0, -10, -8), false);
});
