// Chopping: click (or tap) the world while standing next to a tree to swing
// at it; holding keeps swinging every CHOP.cooldownMs. Each swing turns the
// player to the tree, plays the 'swing' pose (synced to everyone by net.js)
// and adds CHOP.wood x zone mult x woodMultiplier() to usePlayerData's wood.
// components/ChopFx.jsx shows the "+wood" pop from onChop().
import { CHOP } from '../data/economy.js'
import { FOREST_TREES } from '../world/forestTrees.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from './playerState.js'
import { addSystem } from './loop.js'
import { isInputLocked } from './input.js'
import { woodMultiplier } from './pets.js'

let held = false
let lastChop = -Infinity
const listeners = new Set()

// fn(gain) after every landed swing.
export function onChop(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function nearestTree() {
  const { x, y, z } = player.position
  let best = null
  let bestD = CHOP.range
  for (const t of FOREST_TREES) {
    if (Math.abs(y - t.y) > 1.5) continue
    const d = Math.hypot(x - t.x, z - t.z)
    if (d < bestD) {
      bestD = d
      best = t
    }
  }
  return best
}

function chop(now) {
  const tree = nearestTree()
  if (!tree) return
  lastChop = now
  player.facing = Math.atan2(tree.x - player.position.x, tree.z - player.position.z)
  player.pose = 'swing'
  const gain = Math.round(CHOP.wood * tree.mult * woodMultiplier())
  usePlayerData.setState((s) => ({ wood: s.wood + gain }))
  for (const fn of listeners) fn(gain)
}

function step() {
  const now = performance.now()
  if (held && !isInputLocked() && now - lastChop >= CHOP.cooldownMs) chop(now)
  if (player.pose === 'swing' && now - lastChop > CHOP.swingMs) player.pose = null
}

// Only presses on the 3D view chop; HUD buttons stop propagation before
// the event reaches window, and anything else (menus, text) isn't a canvas.
function onPointerDown(e) {
  if (e.button !== 0 || e.target?.tagName !== 'CANVAS') return
  held = true
}
function onPointerUp() {
  held = false
}

export function install() {
  window.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  window.addEventListener('blur', onPointerUp)
  return addSystem(step)
}
