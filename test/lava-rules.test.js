import test from 'node:test'
import assert from 'node:assert/strict'
import { PoseControls } from '../game/pose-controls.js'
import { jumpHeight, clearsLava } from '../game/rules.js'

test('lava jump lands at the original height and only clears lava above its threshold', () => {
  assert.equal(jumpHeight(0),0.02); assert.equal(jumpHeight(1),0.02)
  assert.equal(jumpHeight(0.5),2.82)
  assert.equal(clearsLava(true,0.32,0.02),false)
  assert.equal(clearsLava(true,0.33,0.02),true)
  assert.equal(clearsLava(false,2,0.02),false)
})
test('body controls match the original: immediate lanes and adaptive jump baseline', () => {
  const lanes = []; let jumps = 0
  const player = {isJumping:false,setTargetLane: lane=>lanes.push(lane),jump:()=>jumps++}
  const input = new PoseControls(player)
  input.update(0.9,0.5); assert.equal(lanes.at(-1),0)
  assert.equal(input.baseline,0.5)
  input.update(0.1,0.5); assert.equal(lanes.at(-1),2)
  input.update(0.5,0.4); assert.equal(jumps,1)
  assert.ok(Math.abs(input.baseline - 0.43) < 1e-12)
  for(let i=0;i<60;i++) input.update(0.5,0.4)
  assert.equal(jumps,1, 'holding the raised pose must not repeat the jump')
  input.update(0.5,0.6)
  assert.ok(input.baseline > 0.43, 'resting shoulders adapt back gradually')
  input.reset(); assert.equal(input.baseline,null); assert.equal(input.cooldown,0)
})


test('original pose tracking accepts inferred hips and does not reset on missing detections', async () => {
  const { PoseTracker } = await import('../game/poseTracker.js')
  const received = []
  const tracker = new PoseTracker({}, (...values) => received.push(values))
  const landmarks = []
  landmarks[23] = {x:0.2,visibility:0.01}; landmarks[24] = {x:0.4,visibility:0.01}
  landmarks[11] = {y:0.3,visibility:0.9}; landmarks[12] = {y:0.5,visibility:0.9}
  tracker.updatePose({landmarks:[landmarks]})
  assert.equal(received.length,1)
  assert.ok(Math.abs(received[0][0]-0.3) < 1e-12)
  assert.equal(received[0][1],0.4)
  tracker.updatePose({landmarks:[]})
  assert.equal(received.length,1, 'missing pose leaves the previous input unchanged')
  tracker.updatePose({landmarks:[[]]})
  assert.deepEqual(received[1],[0.5,0.5])
})
