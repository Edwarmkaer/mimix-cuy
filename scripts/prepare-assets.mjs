import { cp, mkdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const threeRoot = path.resolve(path.dirname(require.resolve('three')), '..')
const game = path.join(root, 'public/experiences/floor-is-lava')
await rm(game, { recursive: true, force: true })
await mkdir(game, { recursive: true })
await cp(path.join(root, 'game'), game, { recursive: true })

for (const name of ['fx/GalaxyBackground.js', 'fx/reactbits/galaxy-shader.js', 'fx/reactbits/LICENSE.md', 'config/theme.js']) {
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
