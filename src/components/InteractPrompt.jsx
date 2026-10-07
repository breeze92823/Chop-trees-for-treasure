import { useEffect, useRef } from 'react'
import { interactState } from '../systems/interact.js'
import { interactHoldState } from '../systems/interactHold.js'
import { actionResultState } from '../systems/actionResult.js'
import '../styles/interact.css'

// Circumference of the hold ring's r=15 circle — the SVG's stroke-dasharray /
// dashoffset unit. Offset runs from full (empty ring) down to 0 (full ring) as
// the hold approaches HOLD_MS.
const RING_R = 15
const RING_C = 2 * Math.PI * RING_R

const RESULT_ANIM = 'action-result-pop 2.4s cubic-bezier(0.34,1.56,0.64,1) forwards'

// "Press E to ..." card: translucent dark pill with a square E keycap ringed by
// the hold-to-confirm progress. While E is held it strips down to a scaled-up
// circle around just the ring + keycap; release restores the pill.
function Prompt() {
  const rootRef = useRef(null)
  const ringRef = useRef(null)
  const textRef = useRef(null)

  // Written imperatively at ~10Hz off the singletons — never a per-frame
  // React re-render.
  useEffect(() => {
    const id = setInterval(() => {
      const root = rootRef.current
      if (!root) return
      const visible = interactState.key !== null
      root.style.display = visible ? '' : 'none'
      if (!visible) return
      textRef.current.textContent = interactState.label
      const p = interactHoldState.progress
      ringRef.current.style.strokeDashoffset = String(RING_C * (1 - p))
      root.classList.toggle('held', p > 0)
    }, 100)
    return () => clearInterval(id)
  }, [])

  return (
    <div ref={rootRef} className="interact-prompt" style={{ display: 'none' }}>
      <span className="interact-key">
        <svg viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={RING_R} className="ring-track" />
          <circle
            ref={ringRef}
            cx="18"
            cy="18"
            r={RING_R}
            className="ring-fill"
            style={{ strokeDasharray: RING_C, strokeDashoffset: RING_C }}
          />
        </svg>
        <span className="keycap">E</span>
      </span>
      <span ref={textRef} className="interact-label" />
    </div>
  )
}

// Top-center banner for the result of a held-E attempt: green on success, red
// when blocked. Popped by systems/actionResult.js's showActionResult().
function ActionResult() {
  const rootRef = useRef(null)
  const barRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    let lastId = actionResultState.id
    const id = setInterval(() => {
      if (actionResultState.id === lastId) return
      lastId = actionResultState.id
      const root = rootRef.current
      const bar = barRef.current
      const label = textRef.current
      if (!root || !bar || !label) return
      label.textContent = actionResultState.text
      label.style.color = actionResultState.success ? '#4ade80' : '#f87171'
      root.style.display = ''
      // Restart the one-shot animation even if mid-run for a previous message.
      bar.style.animation = 'none'
      void bar.offsetHeight
      bar.style.animation = RESULT_ANIM
    }, 100)
    return () => clearInterval(id)
  }, [])

  return (
    <div ref={rootRef} className="action-result" style={{ display: 'none' }}>
      <div
        ref={barRef}
        className="action-result-bar"
        onAnimationEnd={() => {
          if (rootRef.current) rootRef.current.style.display = 'none'
        }}
      >
        <span ref={textRef} className="action-result-text" />
      </div>
    </div>
  )
}

export default function InteractPrompt() {
  return (
    <>
      <Prompt />
      <ActionResult />
    </>
  )
}
