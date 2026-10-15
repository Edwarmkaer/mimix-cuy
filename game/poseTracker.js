let resourcesPromise;
// Warm downloads only: camera permission is still requested by the Play click.
export function preloadPoseResources() {
  if (!resourcesPromise) {
    resourcesPromise = Promise.all([
      import('/vendor/mediapipe/vision_bundle.mjs').then(async ({ PoseLandmarker, FilesetResolver }) => ({
        PoseLandmarker,
        files: await FilesetResolver.forVisionTasks('/vendor/mediapipe/wasm'),
      })),
      fetch(new URL('./assets/pose/pose_landmarker_lite.task', import.meta.url))
        .then(response => { if (!response.ok) throw new Error('PoseModelUnavailable'); return response.arrayBuffer(); }),
    ]).then(([runtime, model]) => ({ ...runtime, model: new Uint8Array(model) }))
      .catch(error => { resourcesPromise = null; throw error; });
  }
  return resourcesPromise;
}

export class PoseTracker {
  constructor(video, onPose, { loadResources = preloadPoseResources, mediaDevices = globalThis.navigator?.mediaDevices } = {}) {
    this.video = video; this.onPose = onPose; this.disposed = false;
    this.loadResources = loadResources; this.mediaDevices = mediaDevices;
  }
  async initialize() {
    this.stage = 'camera';
    const started = performance.now();
    const mark = stage => console.debug(`[Camera startup] ${stage}: ${Math.round(performance.now() - started)} ms`);
    const resources = this.loadResources();
    // Permission prompts may remain open after a download fails.
    resources.catch(() => {});
    if (!this.mediaDevices?.getUserMedia) throw new Error('CameraUnavailable');
    // Build the detector while the device/permission/video are becoming ready.
    // Each branch owns late results so cancellation never leaks a camera or GPU context.
    const detectorReady = resources.then(async ({ PoseLandmarker, files, model }) => {
      if (this.disposed) return;
      mark('resources-ready');
      const detector = await PoseLandmarker.createFromOptions(files, { baseOptions: {
        modelAssetBuffer: model, delegate: 'GPU',
      }, runningMode: 'VIDEO', numPoses: 1 });
      if (this.disposed) { detector.close(); return; }
      this.detector = detector;
      mark('detector-ready');
    });
    const videoReady = this.mediaDevices.getUserMedia({video:{width:640,height:480},audio:false}).then(async stream => {
      if (this.disposed) { stream.getTracks().forEach(t => t.stop()); return; }
      mark('stream-ready');
      this.stage = 'video';
      this.video.srcObject = stream;
      await this.video.play();
      mark('video-ready');
      if (!this.disposed && !this.detector) this.stage = 'detector';
    });
    try { await Promise.all([detectorReady, videoReady]); }
    catch (error) { this.stop(); throw error; }
    if (this.disposed) return;
    const detector = this.detector;
    let lastVideo = -1;
    const tick = now => {
      if (this.disposed) return;
      if (this.video.readyState >= 2 && lastVideo !== this.video.currentTime) {
        lastVideo = this.video.currentTime;
        detector.detectForVideo(this.video, now, result => this.updatePose(result));
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
  updatePose(result) {
    // Match the source tutorial: accept any detected pose, including inferred hips.
    const landmarks = result.landmarks?.[0];
    if (!landmarks) return;
    const leftHip = landmarks[23], rightHip = landmarks[24];
    const leftShoulder = landmarks[11], rightShoulder = landmarks[12];
    const x = leftHip && rightHip ? (leftHip.x + rightHip.x) / 2 : 0.5;
    const y = leftShoulder && rightShoulder ? (leftShoulder.y + rightShoulder.y) / 2 : 0.5;
    this.onPose(x, y);
  }
  stop() {
    this.disposed = true; cancelAnimationFrame(this.frame);
    this.video.srcObject?.getTracks().forEach(t=>t.stop()); this.video.srcObject = null;
    this.detector?.close(); this.detector = null;
  }
}
