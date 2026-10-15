import * as THREE from 'three'
import { GalaxyBackground } from './GalaxyBackground.js'

// Temporary scene: the same Galaxy shader as home, with no models or wordmark.
export function mountGalaxyLoading(container) {
  let renderer, galaxy, frame, observer, previous = performance.now(), elapsed = 0
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0d1117')
  const camera = new THREE.Camera()
  function dispose() {
    cancelAnimationFrame(frame)
    observer?.disconnect()
    galaxy?.dispose()
    renderer?.dispose()
    renderer?.forceContextLoss()
    renderer?.domElement.remove()
  }
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false })
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5))
    renderer.domElement.setAttribute('aria-hidden', 'true')
    container.prepend(renderer.domElement)
    galaxy = new GalaxyBackground(scene, { renderer, intro: false })
    const resize = () => renderer.setSize(container.clientWidth, container.clientHeight)
    observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()
    const tick = now => {
      const dt = Math.min((now - previous) / 1000, .05)
      previous = now
      if (!document.hidden) {
        elapsed += dt
        galaxy.setTransitionProgress(.3 + Math.sin(elapsed * .8) * .08)
        galaxy.update(dt)
        renderer.render(scene, camera)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return dispose
  } catch {
    dispose()
    // Static star fallback remains visible if another WebGL context is unavailable.
    return () => {}
  }
}
