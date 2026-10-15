import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('camera deployment includes the verified model and both WASM variants locally', async () => {
  const root = new URL('../public/', import.meta.url);
  const model = await readFile(new URL('experiences/floor-is-lava/assets/pose/pose_landmarker_lite.task', root));
  assert.equal(createHash('sha256').update(model).digest('hex'), '59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a');
  for (const file of ['vision_bundle.mjs', 'wasm/vision_wasm_internal.js', 'wasm/vision_wasm_internal.wasm', 'wasm/vision_wasm_nosimd_internal.js', 'wasm/vision_wasm_nosimd_internal.wasm']) {
    assert.ok((await stat(new URL(`vendor/mediapipe/${file}`, root))).size > 0, file);
  }
});
