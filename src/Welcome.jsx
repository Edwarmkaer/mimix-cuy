import { useEffect, useRef, useState } from 'react'
import './welcome.css'

export default function Welcome() {
  const canvas = useRef(null)
  const navigationTimer = useRef(null)
  const [state, setState] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    let scene, revealTimer
    setState('loading')
    import('./scene/welcome.js').then(({ mountWelcome }) => {
      if (!active) return
      scene = mountWelcome(canvas.current)
      return scene.ready.then(() => {
        if (!active) return
        setState('revealing')
        revealTimer = setTimeout(() => { if (active) setState('ready') }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420)
      })
    }).catch(() => { if (active) { scene?.dispose(); setState('error') } })
    return () => { active = false; clearTimeout(revealTimer); clearTimeout(navigationTimer.current); scene?.dispose() }
  }, [attempt])
  useEffect(() => {
    const restore = event => { if (event.persisted) setState('ready') }
    window.addEventListener('pageshow', restore)
    return () => window.removeEventListener('pageshow', restore)
  }, [])
  function enterGame(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    const destination = event.currentTarget.href
    setState('leaving')
    navigationTimer.current = setTimeout(() => location.assign(destination), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 320)
  }
  return <main className="space-home" aria-label="Bienvenida a Mimix">
    <h1 className="space-home-sr">MIMIX</h1>
    <canvas ref={canvas} aria-label="El cuy flota entre estrellas y saluda. Mueve el cursor para interactuar." />
    {state === 'ready' && <a onClick={enterGame} className="space-play" href="/game" aria-label="Play: jugar El suelo es lava" title="Jugar">
      <svg aria-hidden="true" viewBox="0 0 32 32" width="32" height="32"><path d="M10 5.5 Q10 3.5 12 4.7 L27 14.2 Q29 16 27 17.8 L12 27.3 Q10 28.5 10 26.5Z" fill="currentColor" /></svg>
    </a>}
    {['loading', 'revealing', 'leaving'].includes(state) && <GalaxyLoader leaving={state === 'revealing'} entering={state === 'leaving'} />}
    {state === 'error' && <div className="space-status" role="status"><>No pudimos preparar la bienvenida. <button onClick={() => setAttempt(attempt + 1)}>Reintentar</button></></div>}
  </main>
}

function GalaxyLoader({ leaving = false, entering = false }) {
  const container = useRef(null)
  useEffect(() => {
    let active = true, dispose
    import('./scene/fx/GalaxyLoading.js').then(({ mountGalaxyLoading }) => {
      if (active) dispose = mountGalaxyLoading(container.current)
    }).catch(() => { /* Static stars remain while the welcome loads. */ })
    return () => { active = false; dispose?.() }
  }, [])
  return <div ref={container} className={`mimix-loading${leaving ? ' is-leaving' : ''}${entering ? ' is-entering' : ''}`} role="status" aria-label="Cargando" />
}
