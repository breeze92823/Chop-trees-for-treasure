import { seededRandom } from '../utils/random.js'
import { FOREST } from './layout.js'
import { TREE } from '../data/economy.js'

// Every tree in the forest: { id, x, z, y, s, zone (index), mult, bx0, bx1, bz0, bz1 } (b* = its solid cell) — id is the index (health
// and phase live in systems/treeHealth.js arrays), y is the zone floor, s a
// size jitter, mult the zone's wood multiplier, hp its max health, color its canopy tint. Shared by world/Forest.jsx
// (drawing + colliders) and systems/chop.js (what can be chopped).
// Trees sit on a jittered grid (one per cell, offset up to JITTER from the cell
// centre) so the forest looks natural, then are clamped so the whole canopy
// stays inside its own zone.
const JITTER = 1.3 // m: max offset from the grid cell centre
const WALL_GAP = 3 // m: edge cells reach past the corridor edge into the cliff walls (their faces are pushed back up to ~1.4 m), so there is no strip beside the trees to slip through
const EDGE = 1.7// m: canopy half-width, the closest a trunk gets to a zone edge

// hp of one tree in a zone with luck multiplier `mult` (see TREE in data/economy.js).
const HP_POWER = Math.log(TREE.anchor.hp / TREE.hp) / Math.log(TREE.anchor.luck)
export function zoneHp(mult) {
  const raw = TREE.hp * mult ** HP_POWER
  const mag = 10 ** Math.max(0, Math.floor(Math.log10(raw)) - 1)
  return mult === TREE.anchor.luck ? TREE.anchor.hp : Math.max(TREE.hp, Math.round(raw / mag) * mag)
}

function buildForest() {
  const rand = seededRandom(11)
  const trees = []
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  for (const [zi, zone] of FOREST.zones.entries()) {
    for (let z = zone.z0 - 2.2; z > zone.z1 + 1.5; z -= FOREST.spacing) {
      for (let x = FOREST.x0 + 2; x < FOREST.x1 - 1.5; x += FOREST.spacing) {
        const tx = clamp(x + (rand() * 2 - 1) * JITTER, FOREST.x0 + EDGE, FOREST.x1 - EDGE)
        const tz = clamp(z + (rand() * 2 - 1) * JITTER, zone.z1 + EDGE, zone.z0 - EDGE)
        // Solid cell: the tree's whole grid cell, stretched to the zone/corridor
        // edges at the ends so there is no gap to slip through.
        const cell = {
          bx0: x - FOREST.spacing / 2 < FOREST.x0 + 2 ? FOREST.x0 - WALL_GAP : x - FOREST.spacing / 2,
          bx1: x + FOREST.spacing >= FOREST.x1 - 1.5 ? FOREST.x1 + WALL_GAP : x + FOREST.spacing / 2,
          bz0: z - FOREST.spacing <= zone.z1 + 1.5 ? zone.z1 : z - FOREST.spacing / 2,
          bz1: z + FOREST.spacing / 2 > zone.z0 ? zone.z0 : z + FOREST.spacing / 2,
        }
        trees.push({ id: trees.length, x: tx, z: tz, y: zone.y, s: 0.92 + rand() * 0.16, zone: zi, mult: zone.mult, hp: zoneHp(zone.mult), color: zone.color, ...cell })
      }
    }
  }
  return trees
}

export const FOREST_TREES = buildForest()

// True inside the tree corridor (north of the first zone's south edge).
export function inForestCorridor(x, z) {
  return x >= FOREST.x0 && x <= FOREST.x1 && z < FOREST.zones[0].z0
}
