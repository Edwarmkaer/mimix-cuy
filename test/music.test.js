import test from 'node:test';
import assert from 'node:assert/strict';
import { GameMusic } from '../game/music.js';
function fixture(fetchAudio = async () => ({ ok:true, arrayBuffer:async()=>new ArrayBuffer(0) })) {
  const rates=[],sources=[],effects=[];
  const param = () => ({value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(value){rates.push(value)},exponentialRampToValueAtTime(){},setTargetAtTime(value){this.value=value}});
  class Context {
    currentTime=5;state='suspended';destination={};
    createGain(){return{gain:param(),connect(){},disconnect(){}}}
    createBufferSource(){const s={playbackRate:param(),connect(){},disconnect(){},start(at,offset){this.started=true;this.offset=offset},stop(){this.stopped=true}};sources.push(s);return s}
    createOscillator(){const e={frequency:param(),connect(){},disconnect(){},start(){},stop(){}};effects.push(e);return e}
    async resume(){this.state='running'} async suspend(){this.state='suspended'} async close(){this.state='closed'}
    async decodeAudioData(){return {duration:100}}
  }
  const music = new GameMusic({Context,fetchAudio,storage:{getItem(){return null},setItem(){}}});
  return {music,rates,sources,effects};
}
test('music starts after countdown and resumes from its paused position',async()=>{
  const {music,sources}=fixture();music.unlock();await music.loading;
  assert.equal(sources.length,0);assert.equal(music.context.state,'running');
  music.setRunning(true,true);assert.equal(sources[0].loop,true);
  music.context.currentTime += 4;
  music.setRunning(false);assert.equal(sources[0].stopped,true);
  assert.equal(music.context.state,'running');
  music.setRunning(true);assert.equal(sources[1].offset,4);
  music.setRunning(true,true);assert.equal(sources[2].offset,0);
  music.dispose();assert.equal(music.context.state,'closed');
});
test('countdown and defeat sound while music is stopped; mute suppresses all effects',async()=>{
  const {music,effects}=fixture();music.unlock();await music.loading;
  music.playEffect('tick');assert.equal(effects.length,1);
  music.playEffect('go');assert.equal(effects.length,3);
  music.setRunning(true);music.playEffect('coin');assert.equal(effects.length,5);
  music.setRunning(false);music.playEffect('lose');assert.equal(effects.length,8);
  music.toggleMuted();music.playEffect('coin');assert.equal(effects.length,8);
  assert.equal(music.effectsGain.gain.value,0);music.dispose();
});
test('power changes tempo once each way and mute leaves the run playing',async()=>{
  const {music,rates}=fixture();music.unlock();await music.loading;music.setRunning(true,true);
  music.setBoost(true);music.setBoost(true);music.setBoost(false);assert.deepEqual(rates,[1.2,1]);
  music.toggleMuted();assert.equal(music.gain.gain.value,0);assert.equal(music.running,true);
  music.dispose();
});
test('late music loading cannot start after disposal; failure can retry',async()=>{
  let resolve;const {music,sources}=fixture(()=>new Promise(r=>resolve=r));music.unlock();music.setRunning(true);music.dispose();
  resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)});await music.loading;assert.equal(sources.length,0);
  let attempts=0;const next=fixture(async()=>{attempts++;throw Error('offline')}).music;
  next.unlock();await next.loading;next.unlock();await next.loading;assert.equal(attempts,2);next.dispose();
});

test('browser fetch keeps its global receiver when loading music', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = function () {
    assert.equal(this, globalThis);
    calls++;
    return Promise.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
  };
  const base = fixture().music;
  const music = new GameMusic({ Context: base.Context, storage: base.storage });
  try {
    music.unlock(); await music.loading;
    assert.equal(calls, 1);
    assert.ok(music.buffer);
    music.setRunning(true);
    assert.ok(music.source);
  } finally { music.dispose(); globalThis.fetch = originalFetch; }
});
