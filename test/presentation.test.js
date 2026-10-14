import test from 'node:test';
import assert from 'node:assert/strict';
import {objectOpacity, prepareFade, updateFade, releaseFade} from '../game/presentation.js';
test('objects are fully visible during encounter and fade only after passing', () => {
  assert.equal(objectOpacity(0,-60),0);
  assert.equal(objectOpacity(.4,-60),.5);
  for (const z of [-10,0,5]) assert.equal(objectOpacity(1,z),1);
  assert.equal(objectOpacity(1,10),.5);
  assert.equal(objectOpacity(1,14),0);
});
test('instance fades preserve shared source materials and dispose owned clones', () => {
  let disposed = 0;
  const source = {opacity:.8, clone:()=>({dispose:()=>disposed++})};
  const mesh = {isMesh:true, material:source};
  const item = {userData:{},traverse:fn=>fn(mesh),removeFromParent:()=>{}};
  prepareFade(item); updateFade(item,.4,-20);
  assert.equal(source.opacity,.8); assert.equal(mesh.material.opacity,.4);
  releaseFade(item); assert.equal(disposed,1);
});
