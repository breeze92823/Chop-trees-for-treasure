// Tree health and felling. Hp / phase are flat typed arrays indexed by the
// tree's id (world/forestTrees.js), so nothing is allocated per hit. A hit
// (damageTree, from chop.js) removes the player's Strength; at 0 hp the tree's
// collider is removed at once (the player can walk through) and it topples
// away from the player for TREE.fallMs while fading out over TREE.fadeMs,
// then is gone for good. world/TreeFx.jsx draws the health bars and the
// falling copies from this state; Forest.jsx hides the static instances.
import { TREE } from '../data/economy.js'
import { FOREST_TREES, inForestCorridor } from '../world/forestTrees.js'
import { player } from './playerState.js'
import { addSystem } from './loop.js'

export const ALIVE = 0
export const FALLING = 1
export const GONE = 2
export const MAX_FALLING = 8 // pool size in TreeFx; the oldest finishes early beyond this

const N = FOREST_TREES.length
export const treeHp = new Float32Array(N).fill(TREE.hp)
export const treePhase = new Uint8Array(N)
// Trees currently toppling / fading: { tree, t (s), dx, dz (unit fall direction) }
export const felling = []
// Bumped whenever any hp / phase changes, so the bars only redraw when needed.
export const treeVersion = { v: 0 }

const colliderRemovers = new Array(N).fill(null)
const fellListeners = new Set()

// Forest.jsx hands over each tree's collider remover.
export function bindTreeCollider(id, remove) {
  colliderRemovers[id] = remove
}

// fn(tree) when a tree starts falling.
export function onTreeFelled(fn) {
  fellListeners.add(fn)
  return () => fellListeners.delete(fn)
}

function fell(tree, fromX, fromZ) {
  const id = tree.id
  treePhase[id] = FALLING
  colliderRemovers[id]?.()
  colliderRemovers[id] = null
  let dx = tree.x - fromX
  let dz = tree.z - fromZ
  const len = Math.hypot(dx, dz)
  if (len > 0.001) {
    dx /= len
    dz /= len
  } else {
    dx = 0
    dz = -1
  }
  if (felling.length >= MAX_FALLING) treePhase[felling.shift().tree.id] = GONE
  felling.push({ tree, t: 0, dx, dz })
  for (const fn of fellListeners) fn(tree)
}

// Returns true when this hit felled the tree.
export function damageTree(tree, damage, fromX, fromZ) {
  const id = tree.id
  if (treePhase[id] !== ALIVE) return false
  treeHp[id] = Math.max(0, treeHp[id] - damage)
  treeVersion.v++
  if (treeHp[id] > 0) return false
  fell(tree, fromX, fromZ)
  return true
}

const FADE_S = TREE.fadeMs / 1000

// Every tree back to full health and standing; Forest.jsx restores meshes and
// colliders through onTreesReset.
const resetListeners = new Set()
export function onTreesReset(fn) {
  resetListeners.add(fn)
  return () => resetListeners.delete(fn)
}

function resetTrees() {
  treeHp.fill(TREE.hp)
  treePhase.fill(ALIVE)
  felling.length = 0
  treeVersion.v++
  for (const fn of resetListeners) fn()
}

const RESET_DELAY_S = TREE.resetDelayMs / 1000
let wasInForest = false
let resetIn = -1 // seconds until the forest regrows; < 0 = not pending

function step(dt) {
  // Leaving the corridor for the hub regrows the forest after a short delay;
  // stepping back in cancels it.
  const inForest = inForestCorridor(player.position.x, player.position.z)
  if (wasInForest && !inForest) resetIn = RESET_DELAY_S
  if (inForest) resetIn = -1
  wasInForest = inForest
  if (resetIn >= 0 && (resetIn -= dt) < 0) resetTrees()

  for (let i = felling.length - 1; i >= 0; i--) {
    const f = felling[i]
    f.t += dt
    if (f.t >= FADE_S) {
      treePhase[f.tree.id] = GONE
      felling.splice(i, 1)
    }
  }
}

export function install() {
  return addSystem(step)
}
