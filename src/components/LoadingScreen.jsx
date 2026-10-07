import { useEffect, useMemo, useState } from 'react'
import { subscribeAuth } from '../systems/bloxity.js'
import { DEV_MODE } from '../data/bloxity.js'
import { GAME_TITLE } from '../data/config.js'
import { useGameStore } from '../store/useGameStore.js'

// Opaque until the scene has resolved AND Bloxity auth has settled AND the
// character has loaded AND the first server join has finished (or given up —
// the game then plays offline), then fades out. VITE_DEV_MODE=true skips it.
// Drop the game logo at public/ui/logo.png; the title text shows until it exists.
const FADE_MS = 450
const LOGO_SRC = `${import.meta.env.BASE_URL}ui/logo.png`
const DRIFT_ITEMS = ['🪓', '🪵', '🪓', '🪵', '🪵', '🪓', '🪵', '🪓', '🪓', '🪵', '🪓', '🪵']

export default function LoadingScreen({ sceneReady }) {
  const [authReady, setAuthReady] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const [pct, setPct] = useState(0)
  const avatarLoaded = useGameStore((s) => s.avatarLoaded)
  const netStatus = useGameStore((s) => s.netStatus)

  useEffect(() => subscribeAuth((s) => setAuthReady(s.ready)), [])

  const netDone = netStatus !== 'connecting'
  const ready = sceneReady && authReady && avatarLoaded && netDone
  const target = ready ? 100 : Math.round(([sceneReady, authReady, avatarLoaded, netDone].filter(Boolean).length / 4) * 90)

  // Ease the shown percentage toward the real step progress.
  useEffect(() => {
    const id = setInterval(() => setPct((p) => (p < target ? Math.min(target, p + Math.max(1, Math.ceil((target - p) / 8))) : p)), 30)
    return () => clearInterval(id)
  }, [target])

  useEffect(() => {
    if (!ready) return
    const id = setTimeout(() => setHidden(true), FADE_MS)
    return () => clearTimeout(id)
  }, [ready])

  const items = useMemo(() => DRIFT_ITEMS.map((ch, i) => ({
    ch, left: (i * 83 + 7) % 100, size: 28 + ((i * 17) % 28), delay: -((i * 1.7) % 14), dur: 9 + ((i * 5) % 7),
  })), [])

  if (DEV_MODE || hidden) return null

  const status = pct >= 100 ? 'Ready!' : !sceneReady ? 'Building the world…' : !authReady ? 'Signing in…' : !avatarLoaded ? 'Dressing your character…' : 'Joining the world…'

  return (
    <div className={`loading${ready ? ' is-done' : ''}`} style={{ transitionDuration: `${FADE_MS}ms` }}>
      <div className="loading-drift" aria-hidden="true">
        {items.map((it, i) => (
          <span key={i} style={{ left: `${it.left}%`, fontSize: it.size, animationDelay: `${it.delay}s`, animationDuration: `${it.dur}s` }}>{it.ch}</span>
        ))}
      </div>
      {logoFailed
        ? <h1>{GAME_TITLE}</h1>
        : <img className="loading-logo" src={LOGO_SRC} alt={GAME_TITLE} draggable={false} onError={() => setLogoFailed(true)} />}
      <p>{status}</p>
      <div className="loading-track">
        <div className="loading-fill" style={{ width: `${pct}%` }} />
        <span className="loading-pct">{pct}%</span>
      </div>
    </div>
  )
}
