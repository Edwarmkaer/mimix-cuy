import { useEffect, useRef, useState } from 'react'
import './welcome.css'

export default function Welcome() {
  const canvas = useRef(null)
  const [state, setState] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    let scene
    setState('loading')
    import('./scene/welcome.js').then(({ mountWelcome }) => {
      if (!active) return
      scene = mountWelcome(canvas.current)
      return scene.ready.then(() => { if (active) setState('ready') })
    }).catch(() => { if (active) { scene?.dispose(); setState('error') } })
    return () => { active = false; scene?.dispose() }
  }, [attempt])
  return <main className="space-home" aria-label="Bienvenida a Mimix">
    <h1 className="space-home-sr">MIMIX</h1>
    <canvas ref={canvas} aria-label="El cuy flota entre estrellas y saluda. Mueve el cursor para interactuar." />
    {state === 'ready' && <a className="space-play" href="/experiences/floor-is-lava/index.html" aria-label="Play: jugar El suelo es lava" title="Jugar">
      <svg aria-hidden="true" viewBox="0 0 32 32" width="32" height="32"><path d="M10 5.5 Q10 3.5 12 4.7 L27 14.2 Q29 16 27 17.8 L12 27.3 Q10 28.5 10 26.5Z" fill="currentColor" /></svg>
    </a>}
    {state !== 'ready' && <div className="space-status" role="status">{state === 'error' ? <>No pudimos preparar la bienvenida. <button onClick={() => setAttempt(attempt + 1)}>Reintentar</button></> : 'Preparando a tu compañero…'}</div>}
  </main>
}
