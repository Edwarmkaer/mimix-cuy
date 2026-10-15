let resourcesPromise;
// Warm downloads only: camera permission is still requested by the Play click.
export function preloadPoseResources() {
  if (!resourcesPromise) {
    resourcesPromise = Promise.all([
      import('https://esm.sh/@mediapipe/tasks-vision@0.10.14').then(async ({ PoseLandmarker, FilesetResolver }) => ({
        PoseLandmarker,
        files: await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'),
      })),
      fetch('https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task')
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
    const resources = this.loadResources();
    // Permission prompts may remain open after a download fails.
    resources.catch(() => {});
    if (!this.mediaDevices?.getUserMedia) throw new Error('CameraUnavailable');
    const stream = await this.mediaDevices.getUserMedia({video:{width:640,height:480},audio:false});
    if (this.disposed) { stream.getTracks().forEach(t=>t.stop()); return; }
    this.video.srcObject = stream; await this.video.play();
    if (this.disposed) return;
    this.stage = 'detector';
    const { PoseLandmarker, files, model } = await resources;
    if (this.disposed) return;
    const detector = await PoseLandmarker.createFromOptions(files, { baseOptions: {
      modelAssetBuffer: model, delegate: 'GPU',
    }, runningMode: 'VIDEO', numPoses: 1 });
    if (this.disposed) { detector.close(); return; }
    this.detector = detector;
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
