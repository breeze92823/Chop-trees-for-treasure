import { FOREST, STALLS, STRENGTH_TREES } from '../world/layout.js'
import { useGameStore } from '../store/useGameStore.js'

// Tutorial steps (usePlayerData.tutorialStep, driven by components/Tutorial.jsx, saved with the
// account by systems/net.js; the backend's constants.ts TUTORIAL_DONE_STEP must match):
// 0 train on the x1.5 tree to TUTORIAL_STRENGTH, 1 chop trees in the forest until loot drops,
// 2 "Collect Treasure!" until TUTORIAL_LOOT_VALUE $ of loot is carried, 3 "Sell Treasure!" until
// TUTORIAL_CASH $ is held, 4 "Buy a stronger Chopper!", 5 done.
export const TUTORIAL_DONE = 5
export const TUTORIAL_STRENGTH = 30
export const TUTORIAL_LOOT_VALUE = 100 // base $ of loot to carry before heading to the Sell stall
export const TUTORIAL_CASH = 100 // $ held after selling before heading to the Choppers stall
export const TUTORIAL_COMPLETE_MS = 3500 // how long "Tutorial complete" shows after the last step

const trainTree = STRENGTH_TREES.find((t) => t.mult === 'x1.5')
const stall = (id) => STALLS.find((s) => s.id === id)
const forest = { x: 0, z: FOREST.zones[0].z0 - 6 } // just inside the x1 Luck zone

// Nearest loot lying in the forest, else the forest itself.
function nearestLoot(player) {
  let best = null
  let bestD = Infinity
  for (const d of useGameStore.getState().worldLoot) {
    const dd = (d.x - player.x) ** 2 + (d.z - player.z) ** 2
    if (dd < bestD) {
      bestD = dd
      best = d
    }
  }
  return best ? { x: best.x, z: best.z } : forest
}

// Where the 3D guide arrows lead on each step: a point, a (playerPosition) => point, or null.
export const GUIDE_TARGETS = [
  { x: trainTree.x, z: trainTree.z }, // 0 the x1.5 Train Strength tree
  forest, // 1 chop trees
  nearestLoot, // 2 the loot
  { x: stall('sell').x, z: stall('sell').z },
  { x: stall('choppers').x, z: stall('choppers').z },
  null,
]
