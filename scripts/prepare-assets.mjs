import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { loadEnv } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const threeRoot = path.resolve(path.dirname(require.resolve('three')), '..')
const game = path.join(root, 'public/experiences/floor-is-lava')
await rm(game, { recursive: true, force: true })
await mkdir(game, { recursive: true })
await cp(path.join(root, 'game'), game, { recursive: true })

for (const name of ['fx/GalaxyLoading.js', 'fx/GalaxyBackground.js', 'fx/reactbits/galaxy-shader.js', 'fx/reactbits/LICENSE.md', 'config/theme.js']) {
  const destination = path.join(game, 'shared', name)
  await mkdir(path.dirname(destination), { recursive: true })
  await cp(path.join(root, 'src/scene', name), destination)
}
await cp(path.join(root, 'public/fonts/LilitaOne-Regular.ttf'), path.join(game, 'LilitaOne-Regular.ttf'))
await cp(path.join(root, 'public/fonts/OFL.txt'), path.join(game, 'OFL.txt'))

const vendor = path.join(root, 'public/vendor')
await mkdir(path.join(vendor, 'three'), { recursive: true })
await cp(path.join(threeRoot, 'build/three.module.js'), path.join(vendor, 'three/three.module.js'))
for (const name of ['loaders/GLTFLoader.js', 'utils/BufferGeometryUtils.js']) {
  const destination = path.join(vendor, 'three/examples/jsm', name)
  await mkdir(path.dirname(destination), { recursive: true })
  await cp(path.join(threeRoot, 'examples/jsm', name), destination)
}
await mkdir(path.join(vendor, 'draco'), { recursive: true })
for (const name of ['draco_decoder.js', 'draco_wasm_wrapper.js', 'draco_decoder.wasm']) {
  await cp(require.resolve(`three/examples/jsm/libs/draco/gltf/${name}`), path.join(vendor, 'draco', name))
}
await cp(path.join(threeRoot, 'LICENSE'), path.join(vendor, 'three/LICENSE'))

// The game keeps its independent HTML entry; provide local ESM SDK modules.
// Pin and serve the detector locally: no CDN dependency during camera startup.
const visionRoot = path.dirname(require.resolve('@mediapipe/tasks-vision'))
const visionVendor = path.join(vendor, 'mediapipe')
await mkdir(visionVendor, { recursive: true })
await cp(path.join(visionRoot, 'vision_bundle.mjs'), path.join(visionVendor, 'vision_bundle.mjs'))
await cp(path.join(visionRoot, 'wasm'), path.join(visionVendor, 'wasm'), { recursive: true })

const convexVendor = path.join(vendor, 'convex')
await mkdir(convexVendor, { recursive: true })
const convexRoot = path.dirname(require.resolve('convex/package.json'))
await cp(path.join(convexRoot, 'LICENSE'), path.join(convexVendor, 'LICENSE'))
await cp(path.join(convexRoot, 'src/vendor/jwt-decode/LICENSE'), path.join(convexVendor, 'JWT_DECODE_LICENSE'))
for (const [name, contents] of [
  ['browser', "export { ConvexHttpClient } from 'convex/browser'"],
  ['references', "export { makeFunctionReference } from 'convex/server'"],
]) await build({ stdin: { contents, resolveDir: root }, outfile: path.join(convexVendor, `${name}.js`), bundle: true, format: 'esm', platform: 'browser', minify: true })
const indexPath = path.join(game, 'index.html')
const html = await readFile(indexPath, 'utf8')
await writeFile(indexPath, html.replace(/<script type="importmap">(.*?)<\/script>/s, (_match, json) => {
  const map = JSON.parse(json)
  map.imports['convex/browser'] = '/vendor/convex/browser.js'
  map.imports['convex/server'] = '/vendor/convex/references.js'
  return `<script type="importmap">${JSON.stringify(map)}</script>`
}))
const convexUrl = process.env.VITE_CONVEX_URL ?? loadEnv('production', root, 'VITE_').VITE_CONVEX_URL ?? ''
await writeFile(path.join(game, 'ranking-config.js'), `export const CONVEX_URL = ${JSON.stringify(convexUrl)}\n`)
