// Train Strength trees (world/TrainingArea.jsx): standing on a tree's pad swings
// the axe at it with no click (systems/chop.js) and trains Strength x the tree's
// multiplier; the tree never falls. A pad needs its label's price as a minimum:
// rebirths for 'rebirth' trees, $ cash held (not spent) for the 'coin' trees.
import { STRENGTH_TREES, TRAIN } from '../world/layout.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from './playerState.js'
import { showActionResult } from './actionResult.js'
import { formatNumber } from '../utils/format.js'

const hitListeners = new Set()

// fn(tree) after every landed swing on a Train Strength tree (drives its leaf burst).
export function onPadHit(fn) {
  hitListeners.add(fn)
  return () => hitListeners.delete(fn)
}

export function emitPadHit(tree) {
  for (const fn of hitListeners) fn(tree)
}

const HALF = 1.7// half the 3.4 m dark base slab
const PAD_TOP = 0.3 // pad lift + slab height above its tier

// Strength tree whose base slab the player stands on, else null.
export function strengthPadAt() {
  const { x, y, z } = player.position
  for (const t of STRENGTH_TREES) {
    if (Math.abs(x - t.x) > HALF || Math.abs(z - t.z) > HALF) continue
    const top = (t.tier === 1 ? TRAIN.tier1.h : TRAIN.tier2.h) + PAD_TOP
    if (Math.abs(y - top) < 1.5) return t
  }
  return null
}

function required(t) {
  return t.cost === 'free' ? 0 : t.cost
}

export function padUnlocked(t) {
  const s = usePlayerData.getState()
  return (t.cur === 'rebirth' ? s.rebirths : s.cash) >= required(t)
}

// 'x1.5' -> 1.5
export function padMultiplier(t) {
  return parseFloat(t.mult.slice(1)) || 1
}

// Call every frame with the pad underfoot: shows the error once per visit to a locked pad.
let noticed = null
export function noticePad(t) {
  if (t === noticed) return
  noticed = t
  if (t && !padUnlocked(t)) {
    const n = required(t)
    showActionResult(t.cur === 'rebirth' ? `Need ${n} rebirth${n === 1 ? '' : 's'} to use this tree!` : `Need $${formatNumber(n)} to use this tree!`, false)
  }
}
