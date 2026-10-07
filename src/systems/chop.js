// Chopping: click (or tap) the world while standing next to a tree to swing
// at it; holding keeps swinging every CHOP.cooldownMs. Each swing turns the
// player to the tree, plays the 'swing' pose (synced to everyone by net.js)
// and adds CHOP.wood x zone mult x woodMultiplier() to usePlayerData's wood.
// components/ChopFx.jsx shows the "+wood" pop from onChop().
import { CHOP, CHOP_TIMING } from '../data/economy.js'
import { FOREST_TREES } from '../world/forestTrees.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from './playerState.js'
import { addSystem } from './loop.js'
import { CHOP_HIT_TWIST, CHOP_AIM, chopSide } from './avatarAnim.js'
import { isInputLocked } from './input.js'
import { playChopHit } from './sfx.js'
import { woodMultiplier } from './pets.js'
import { gainStrength } from './strengthGain.js'
import { ALIVE, damageTree, install as installTrees, treePhase } from './treeHealth.js'

let held = false
const listeners = new Set()

// fn(woodGain, strengthGain) after every landed swing.
export function onChop(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Closest standing tree in range (felled ones are skipped).
const RANGE_SQ = CHOP.range * CHOP.range
function nearestTree() {
  const { x, y, z } = player.position
  let best = null
  let bestD = RANGE_SQ
  for (const t of FOREST_TREES) {
    if (treePhase[t.id] !== ALIVE || Math.abs(y - t.y) > 1.5) continue
    const dx = x - t.x
    const dz = z - t.z
    const d = dx * dx + dz * dz
    if (d < bestD) {
      bestD = d
      best = t
    }
  }
  return best
}

// A swing cycle starts when the player holds the mouse next to a tree; wood
// lands at CHOP_TIMING.impact, when the blade meets the trunk in the pose.
let cycleStart = null
let landed = false
let sideBase = 0 // swings completed in earlier sessions, so the side keeps alternating across pauses
let cycleCount = 0 // swings since the pose started; parity picks the side (see chopSide)
const IMPACT_MS = CHOP_TIMING.impact * 1000

function land(tree) {
  if (!tree) return
  playChopHit()
  // Damage is the Strength held before this swing's gain; wood only drops when the tree falls.
  const felled = damageTree(tree, usePlayerData.getState().strength, player.position.x, player.position.z)
  const gain = felled ? Math.round(CHOP.wood * tree.mult * woodMultiplier()) : 0
  if (gain) usePlayerData.setState((s) => ({ wood: s.wood + gain }))
  gainStrength(CHOP.strengthGain)
  for (const fn of listeners) fn(gain, CHOP.strengthGain)
}

// Stand close with the tree on the character's left: the pelvis is turned
// CHOP_AIM + CHOP_HIT_TWIST away from it, the torso twist in the 'swing' pose does the rest.
// Pelvis yaw + hit twist = bearing to the tree - CHOP_AIM, so the blade lands
// at the same spot every swing.
function faceSideways(tree, side) {
  const p = player.position
  const dx = tree.x - p.x
  const dz = tree.z - p.z
  const dist = Math.hypot(dx, dz)
  player.facing = Math.atan2(dx, dz) - side * (CHOP_AIM + CHOP_HIT_TWIST)
  const gap = dist - CHOP.standDist
  if (gap > 0.02 && dist > 0.001) {
    const stepLen = Math.min(gap, 0.06)
    p.x += (dx / dist) * stepLen
    p.z += (dz / dist) * stepLen
  }
}

function step() {
  const now = performance.now()
  const wants = held && !isInputLocked()
  if (cycleStart === null && !wants) return // idle: skip the tree scan
  const tree = nearestTree() // one scan per frame
  if (cycleStart === null) {
    if (!tree) return
    cycleStart = now
    cycleCount = 0
    landed = false
    player.pose = 'swing'
  }
  const elapsed = now - cycleStart
  if (tree) faceSideways(tree, chopSide(sideBase + cycleCount, elapsed / 1000))
  if (!landed && elapsed >= IMPACT_MS) {
    landed = true
    land(tree)
  }
  if (elapsed >= CHOP.cooldownMs) {
    // Finish the whole cycle before stopping; loop straight on while held.
    if (wants && tree) {
      cycleStart += CHOP.cooldownMs
      cycleCount++
      landed = false
    } else {
      sideBase += cycleCount + 1
      cycleStart = null
      player.pose = null
    }
  }
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
  const removeTrees = installTrees()
  const removeStep = addSystem(step)
  return () => {
    removeTrees()
    removeStep()
  }
}
