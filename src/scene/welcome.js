import { Engine } from './core/Engine.js'
import { AssetLoader, disposeObject } from './core/assets.js'
import { GalaxyBackground } from './fx/GalaxyBackground.js'
import { CharacterSpaceLighting } from './fx/CharacterSpaceLighting.js'
import { SpaceWordmark } from './fx/SpaceWordmark.js'
import { WorldIntro } from './systems/WorldIntro.js'
import { CUY } from './entities/cuy/Cuy.js'

// Standalone welcome: no map, challenge zones, physics or exploration host.
export function mountWelcome(canvas) {
  const engine = new Engine(canvas)
  const assets = new AssetLoader()
  const galaxy = new GalaxyBackground(engine.scene, { renderer: engine.renderer })
  let intro, lighting, title, frame, disposed = false, previous = performance.now()
  const ready = assets.load(CUY.modelPath).then(gltf => {
    if (disposed) return
    engine.scene.add(gltf.scene)
    intro = new WorldIntro({ scene: engine.scene, character: gltf.scene, animations: gltf.animations,
      camera: engine.camera, controls: engine.controls, canvas, input: { setEnabled() {} } })
    lighting = new CharacterSpaceLighting({ scene: engine.scene, character: gltf.scene,
      camera: engine.camera, front: engine.keyLight, rim: engine.rimLight })
    title = new SpaceWordmark({ scene: engine.scene, camera: engine.camera, anchor: intro.previewTarget, canvas })
    galaxy.setInteractive(true)
    const tick = now => {
      if (disposed) return
      const delta = Math.min((now - previous) / 1000, 0.05); previous = now
      intro.update(delta); galaxy.update(delta)
      lighting.update(galaxy.warpIntensity, intro.reducedMotion)
      title.update(delta, intro.reducedMotion, galaxy.warpIntensity)
      engine.render(); frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  })
  return { ready, dispose() {
    if (disposed) return
    disposed = true; cancelAnimationFrame(frame)
    intro?.dispose(); lighting?.dispose(); title?.dispose(); galaxy.dispose(); assets.dispose()
    disposeObject(engine.scene); engine.scene.clear(); engine.dispose()
  } }
}
