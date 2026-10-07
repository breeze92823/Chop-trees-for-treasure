import { useEffect, useState } from 'react'
import { subscribeAuth } from '../systems/bloxity.js'
import { DEV_MODE } from '../data/bloxity.js'
import { GAME_TITLE } from '../data/config.js'
import { useGameStore } from '../store/useGameStore.js'

// Opaque until the scene has resolved AND Bloxity auth has settled AND the
// character has loaded AND the first server join has finished (or given up —
// the game then plays offline), then fades out. VITE_DEV_MODE=true skips it.
const FADE_MS = 450

export default function LoadingScreen({ sceneReady }) {
  const [authReady, setAuthReady] = useState(false)
  const [hidden, setHidden] = useState(false)
  const avatarLoaded = useGameStore((s) => s.avatarLoaded)
  const netStatus = useGameStore((s) => s.netStatus)

  useEffect(() => subscribeAuth((s) => setAuthReady(s.ready)), [])

  const ready = sceneReady && authReady && avatarLoaded && netStatus !== 'connecting'

  useEffect(() => {
    if (!ready) return
    const id = setTimeout(() => setHidden(true), FADE_MS)
    return () => clearTimeout(id)
  }, [ready])

  if (DEV_MODE || hidden) return null

  return (
    <div className={`loading${ready ? ' is-done' : ''}`} style={{ transitionDuration: `${FADE_MS}ms` }}>
      <h1>{GAME_TITLE}</h1>
      <div className="loading-track"><div className="loading-fill" /></div>
      <p>{!sceneReady ? 'Building the world…' : !authReady ? 'Signing in…' : !avatarLoaded ? 'Dressing your character…' : 'Joining the world…'}</p>
    </div>
  )
}
