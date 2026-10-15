import test from 'node:test';
import assert from 'node:assert/strict';
import { PoseTracker } from '../game/poseTracker.js';

test('downloads start before permission completes and cancellation stops a late camera stream', async () => {
  const oldCancel = globalThis.cancelAnimationFrame;
  globalThis.cancelAnimationFrame = () => {};
  let releaseCamera, downloads = false, stops = 0;
  const video = { srcObject: null, play: async () => { throw Error('Cancelled camera must not play'); } };
  const tracker = new PoseTracker(video, () => {}, {
    loadResources: () => { downloads = true; return Promise.resolve({}); },
    mediaDevices: { getUserMedia: () => new Promise(resolve => { releaseCamera = resolve; }) },
  });
  try {
    const pending = tracker.initialize();
    assert.equal(downloads, true);
    tracker.stop();
    releaseCamera({ getTracks: () => [{ stop: () => stops++ }] });
    await pending;
    assert.equal(stops, 1);
    assert.equal(video.srcObject, null);
  } finally { globalThis.cancelAnimationFrame = oldCancel; }
});

test('cancelling during detector construction closes a late detector and stops the stream', async () => {
  const oldCancel = globalThis.cancelAnimationFrame;
  globalThis.cancelAnimationFrame = () => {};
  let releaseDetector, notifyConstruction, closed = 0, stopped = 0;
  const constructing = new Promise(resolve => { notifyConstruction = resolve; });
  const video = { srcObject: null, play: async () => {} };
  const tracker = new PoseTracker(video, () => {}, {
    mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => stopped++ }] }) },
    loadResources: async () => ({ files: {}, model: new Uint8Array(1), PoseLandmarker: {
      createFromOptions: () => { notifyConstruction(); return new Promise(resolve => { releaseDetector = resolve; }); },
    } }),
  });
  try {
    const pending = tracker.initialize();
    await constructing;
    tracker.stop();
    releaseDetector({ close: () => closed++ });
    await pending;
    assert.equal(closed, 1);
    assert.equal(stopped, 1);
    assert.equal(video.srcObject, null);
  } finally { globalThis.cancelAnimationFrame = oldCancel; }
});
