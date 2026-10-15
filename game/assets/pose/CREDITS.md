# MediaPipe Pose Landmarker Lite

- Runtime: Google MediaPipe Tasks Vision 0.10.14, pinned in package.json.
- Runtime source: https://github.com/google-ai-edge/mediapipe/tree/v0.10.14
- Model: Pose Landmarker Lite, float16, revision 1 (unmodified).
- Model source: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
- Model SHA-256: 59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a
- MediaPipe license: Apache 2.0, included in LICENSE.

The runtime, WASM and model are served by the application itself. Camera startup
requires no requests to esm.sh, jsdelivr or Google Storage. Video stays in the
browser; this change does not upload camera frames.
