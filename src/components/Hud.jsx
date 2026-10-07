import { useEffect, useState } from 'react'
import { useAuth } from '../systems/bloxityHooks.js'
import { authState, getDisplayName, login } from '../systems/bloxity.js'
import { DEV_MODE } from '../data/bloxity.js'
import { settings } from '../systems/settingsState.js'
import { useGameStore } from '../store/useGameStore.js'
import { useRemoteStore } from '../store/useRemoteStore.js'

// Minimal status overlay: who you are, whether you're synced, and (when the
// portal's show_fps setting is on) an FPS counter. The theme's real HUD goes
// next to this.
function Fps() {
  const [fps, setFps] = useState(0)
  useEffect(() => {
    let frames = 0
    let last = performance.now()
    let raf = requestAnimationFrame(function tick(now) {
      frames++
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)))
        frames = 0
        last = now
      }
      raf = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [])
  return <div>{fps} FPS</div>
}

export default function Hud() {
  useAuth()
  const netStatus = useGameStore((s) => s.netStatus)
  const others = useRemoteStore((s) => s.ids.length)
  return (
    <>
      {authState.ready && !authState.user && !DEV_MODE && (
        <button type="button" className="bloxity-login" onClick={() => login()}>
          Log in with Bloxity
        </button>
      )}
      <HudStatus netStatus={netStatus} others={others} />
    </>
  )
}

function HudStatus({ netStatus, others }) {
  return (
    <div className="hud">
      <div><b>{getDisplayName()}</b>{authState.user ? '' : ' (guest)'}</div>
      <div>{netStatus === 'online' ? `Online · ${others + 1} in room` : netStatus === 'offline' ? 'Offline (single-player)' : 'Connecting…'}</div>
      {settings.show_fps && <Fps />}
    </div>
  )
}
