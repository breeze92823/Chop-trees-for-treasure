import { seededRandom } from '../utils/random.js'
import { FOREST } from './layout.js'

// Every tree in the forest: { x, z, y, s, mult } — y is the zone floor, s a
// size jitter, mult the zone's wood multiplier. Shared by world/Forest.jsx
// (drawing + colliders) and systems/chop.js (what can be chopped).
function buildForest() {
  const rand = seededRandom(11)
  const trees = []
  for (const zone of FOREST.zones) {
    for (let z = zone.z0 - 2.2; z > zone.z1 + 1.5; z -= FOREST.spacing) {
      for (let x = FOREST.x0 + 2; x < FOREST.x1 - 1.5; x += FOREST.spacing) {
        trees.push({ x, z, y: zone.y, s: 0.92 + rand() * 0.16, mult: zone.mult })
      }
    }
  }
  return trees
}

export const FOREST_TREES = buildForest()
