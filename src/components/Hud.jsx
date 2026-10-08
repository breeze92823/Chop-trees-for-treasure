import { useEffect, useState } from 'react'
import { useAuth } from '../systems/bloxityHooks.js'
import { authState, login } from '../systems/bloxity.js'
import { DEV_MODE } from '../data/bloxity.js'
import { settings } from '../systems/settingsState.js'

// Minimal status overlay: login button and (when the portal's show_fps
// setting is on) an FPS counter. The theme's real HUD goes
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
  return (
    <>
      {authState.ready && !authState.user && !DEV_MODE && (
        <button type="button" className="bloxity-login" onClick={() => login()}>
          Log in with Bloxity
        </button>
      )}
      {settings.show_fps && (
        <div className="hud">
          <Fps />
        </div>
      )}
    </>
  )
}
