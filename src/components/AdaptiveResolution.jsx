import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

// Drops the render resolution when the frame rate sags and restores it when
// there is headroom. Samples fps over WINDOW_S; `base` is the preset's pixel
// ratio ceiling (utils/graphics.js), and the scale never goes below MIN_SCALE.
const WINDOW_S = 1.5
const WARMUP_S = 4 // loading/shader compiles would read as slowness
const LOW_FPS = 40
const HIGH_FPS = 56
const STEP = 0.15
const MIN_SCALE = 0.6
const UP_AFTER = 3 // consecutive healthy windows before stepping back up

export default function AdaptiveResolution({ max }) {
  const setDpr = useThree((s) => s.setDpr)
  const s = useRef({ t: 0, frames: 0, warm: 0, scale: 1, good: 0 })

  useFrame((_state, dt) => {
    const a = s.current
    if (dt > 0.25) return // tab switch / breakpoint, not real load
    if (a.warm < WARMUP_S) {
      a.warm += dt
      return
    }
    a.t += dt
    a.frames++
    if (a.t < WINDOW_S) return
    const fps = a.frames / a.t
    a.t = 0
    a.frames = 0
    let next = a.scale
    if (fps < LOW_FPS) {
      next = Math.max(MIN_SCALE, a.scale - STEP)
      a.good = 0
    } else if (fps > HIGH_FPS && ++a.good >= UP_AFTER) {
      next = Math.min(1, a.scale + STEP)
      a.good = 0
    }
    if (next !== a.scale) {
      a.scale = next
      setDpr(Math.max(0.75, max * next))
    }
  })
  return null
}
