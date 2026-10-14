import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
test('the standalone build includes the local character, game and browser dependencies', async () => {
  for (const path of [
    'public/assets/models/cuy/cuy-animated-v2.glb',
    'public/vendor/three/three.module.js',
    'public/vendor/three/examples/jsm/loaders/GLTFLoader.js',
    'public/vendor/three/examples/jsm/utils/BufferGeometryUtils.js',
    'public/vendor/draco/draco_decoder.wasm',
    'public/vendor/convex/browser.js',
    'public/vendor/convex/references.js',
    'public/vendor/convex/LICENSE',
    'public/experiences/floor-is-lava/score-service.js',
    'public/experiences/floor-is-lava/ranking-config.js',
    'public/experiences/floor-is-lava/index.html',
    'public/experiences/floor-is-lava/shared/fx/GalaxyBackground.js',
    'public/experiences/floor-is-lava/LilitaOne-Regular.ttf',
    'public/experiences/floor-is-lava/assets/ui/cuy-frito-gameover-v3.png',
  ]) assert.ok((await readFile(new URL(path, root))).length > 0, path)
})
