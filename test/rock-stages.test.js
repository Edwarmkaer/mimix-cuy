import test from 'node:test';
import assert from 'node:assert/strict';
import {stageForScore, hitsRock} from '../game/stages.js';
test('five rock color stages independent of speed', () => {
  for (const [score,index] of [[0,0],[499,0],[500,1],[1200,2],[2200,3],[3500,4],[100000,4]]) assert.equal(stageForScore(score).index,index);
});
test('rocks admit jumps; tall cones always require dodging', () => {
  const dimensions={width:2,depth:2,height:2.1};
  const rock={x:0,z:2};
  assert.equal(hitsRock({x:0,y:2.8,z:2},0,rock,0,dimensions,false),false);
  assert.equal(hitsRock({x:0,y:2.8,z:2},0,rock,0,dimensions,true),true);
  assert.equal(hitsRock({x:2.5,y:0,z:2},0,rock,0,dimensions,true),false);
  assert.equal(hitsRock({x:0,y:0,z:1},0,rock,-2,dimensions,false),true);
});
