import test from 'node:test';
import assert from 'node:assert/strict';
import { hitsCone } from '../game/cone-rules.js';
test('cone blocks its lane, can be jumped and detects fast crossings', () => {
  const cone = {x:0,z:2}, dimensions = {width:1,depth:1,height:1.3};
  assert.equal(hitsCone({x:0,y:.02,z:2},.02,cone,1.5,dimensions),true);
  assert.equal(hitsCone({x:2.5,y:.02,z:2},.02,cone,1.5,dimensions),false);
  assert.equal(hitsCone({x:0,y:1.5,z:2},.02,cone,1.5,dimensions),false);
  assert.equal(hitsCone({x:0,y:.02,z:0},.02,cone,-2,dimensions),true);
});
