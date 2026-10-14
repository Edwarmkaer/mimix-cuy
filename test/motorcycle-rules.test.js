import test from 'node:test';
import assert from 'node:assert/strict';
import { hitsMotorcycle } from '../game/motorcycle-rules.js';
test('mototaxi blocks two lanes and leaves the opposite lane clear', () => {
  for (const center of [-1.25,1.25]) {
    const hits = [-2.5,0,2.5].map(x=>hitsMotorcycle(x,2,center,1.8,2));
    assert.deepEqual(hits,center<0?[true,true,false]:[false,true,true]);
  }
});
test('collision sweeps through fast frames and is independent of jump height', () => {
  assert.equal(hitsMotorcycle(0,2,-1.25,-1,4),true);
  assert.equal(hitsMotorcycle(0,2,-1.25,-10,-8),false);
  // No Y/jump exemption: ground and airborne use the same footprint.
  for (const y of [0,1,2.82]) {
    const player = {x:0,y,z:2};
    assert.equal(hitsMotorcycle(player.x,player.z,1.25,1.8,2),true);
  }
});

test('approach fades in smoothly and departure fades only after clearing the player', async () => {
  const { motorcyclePresentation } = await import('../game/motorcycle-rules.js');
  assert.equal(motorcyclePresentation(0,-60).opacity,0);
  assert.equal(motorcyclePresentation(.45,-60).opacity,.5);
  assert.equal(motorcyclePresentation(1,0).opacity,1);
  assert.equal(motorcyclePresentation(1,6).opacity,1);
  assert.equal(motorcyclePresentation(1,12).opacity,.5);
  assert.equal(motorcyclePresentation(1,18).opacity,0);
  assert.equal(motorcyclePresentation(1,-30).speedFactor,1.35);
});
