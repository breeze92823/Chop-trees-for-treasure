import { useEffect, useRef, useState } from 'react'
import { pressTouchJump, setTouchInteract, setTouchMove, subscribeTouchMode, touchState } from '../systems/input.js'
import { setChopHeld } from '../systems/chop.js'
import { interactState } from '../systems/interact.js'
import { useGameStore } from '../store/useGameStore.js'
import '../styles/touch.css'

// Full-screen windows hide the controls so they don't sit over the menu.
const WINDOWS = ['petsMenu', 'indexMenu', 'rebirthMenu', 'questsMenu', 'aurasMenu', 'upgradesMenu', 'artifactsMenu', 'choppersMenu', 'forgeMenu', 'sellMenu']

// Browsers only allow orientation.lock() from a user gesture, and mostly in
// fullscreen; both can be refused (iOS Safari), in which case the rotate hint stays.
async function forceLandscape() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })
  } catch {}
  try {
    await screen.orientation?.lock?.('landscape')
  } catch {}
}

const STICK_R = 44 // px of knob travel at full tilt

// Virtual stick: writes camera-relative analog movement via setTouchMove.
function Stick() {
  const baseRef = useRef(null)
  const knobRef = useRef(null)
  const idRef = useRef(null)

  const update = (e) => {
    const r = baseRef.current.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const len = Math.hypot(dx, dy)
    if (len > STICK_R) {
      dx = (dx / len) * STICK_R
      dy = (dy / len) * STICK_R
    }
    knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`
    const m = len < 8 ? 0 : 1
    setTouchMove((dx / STICK_R) * m, (-dy / STICK_R) * m)
  }
  const release = (e) => {
    if (e.pointerId !== idRef.current) return
    idRef.current = null
    knobRef.current.style.transform = ''
    setTouchMove(0, 0)
  }

  return (
    <div
      ref={baseRef}
      className="touch-stick"
      onPointerDown={(e) => {
        e.stopPropagation()
        if (idRef.current !== null) return
        idRef.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        update(e)
      }}
      onPointerMove={(e) => e.pointerId === idRef.current && update(e)}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div ref={knobRef} className="touch-knob" />
    </div>
  )
}

// Press-and-hold button: onDown/onUp bracket the finger being on it.
function HoldButton({ className, label, onDown, onUp }) {
  const idRef = useRef(null)
  const up = (e) => {
    if (e.pointerId !== idRef.current) return
    idRef.current = null
    e.currentTarget.classList.remove('down')
    onUp?.()
  }
  return (
    <button
      type="button"
      className={`touch-btn ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.stopPropagation()
        if (idRef.current !== null) return
        idRef.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        e.currentTarget.classList.add('down')
        onDown()
      }}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {label}
    </button>
  )
}

// On-screen controls for touch devices (input.js flips touchState.active on the
// first touch / a coarse primary pointer): stick, Chop, Jump and an Interact
// button that appears next to anything with a hold-E prompt. Dragging the 3D
// view orbits the camera and pinching zooms (input.js).
export default function TouchControls() {
  const [active, setActive] = useState(touchState.active)
  const [canInteract, setCanInteract] = useState(false)
  const windowOpen = useGameStore((s) => WINDOWS.some((k) => !!s[k]) || !!s.hatch || !!s.eggMenu || !!s.offlineEarnings)

  useEffect(() => subscribeTouchMode(setActive), [])
  // The first tap anywhere also tries to lock landscape.
  useEffect(() => {
    if (!active) return
    window.addEventListener('pointerdown', forceLandscape, { once: true })
    return () => window.removeEventListener('pointerdown', forceLandscape)
  }, [active])
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setCanInteract(interactState.key !== null), 100)
    return () => clearInterval(id)
  }, [active])

  if (!active) return null
  return (
    <>
    <div className="rotate-hint" onPointerDown={forceLandscape}>
      <div>
        <div className="rotate-icon">📱↻</div>
        <div>Please switch to landscape to play</div>
        <div className="rotate-sub">Rotate your phone, or tap to lock landscape</div>
      </div>
    </div>
    <div className="touch-controls" style={windowOpen ? { display: 'none' } : undefined}>
      <Stick />
      <div className="touch-actions">
        {canInteract && <HoldButton className="interact" label="E" onDown={() => setTouchInteract(true)} onUp={() => setTouchInteract(false)} />}
        <HoldButton className="jump" label="⤒" onDown={pressTouchJump} />
        <HoldButton className="chop" label="🪓" onDown={() => setChopHeld(true)} onUp={() => setChopHeld(false)} />
      </div>
    </div>
    </>
  )
}
