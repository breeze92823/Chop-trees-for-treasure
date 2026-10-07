// Tree loot: in the x1 Luck zone, 22 of its trees (X1_DROPS) are loot trees —
// 3 Uncommon, the rest Common — picked evenly across the whole zone. Zones x2 and up
// scale with luck: more loot trees, more items per tree, higher rarity (LUCK_LOOT);
// x66 drops 4 top-tier (Divine) items from every tree. Felling one
// leaves a floating item where it stood (store worldLoot, drawn by
// world/Loot.jsx); stand next to it and press E (instant, no hold) to put it in
// the Bag (usePlayerData bag, capacity BAG_MAX). The loot trees re-arm when the
// forest regrows (treeHealth onTreesReset), dropping anything left lying.
import { BAG_MAX, ITEM_INFO, LOOT_PICKUP_RANGE, LUCK_LOOT, RARITIES, X1_DROPS } from '../data/loot.js'
import { FOREST_TREES } from '../world/forestTrees.js'
import { FOREST } from '../world/layout.js'
import { seededRandom } from '../utils/random.js'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { onTreeFelled, onTreesReset } from './treeHealth.js'
import { showActionResult } from './actionResult.js'
import { discoverItem } from './treasureIndex.js'
import { player } from './playerState.js'
import { addSystem } from './loop.js'
import { clearInteractTarget, setInteractTarget } from './interact.js'

const POOLS = {}
for (const [name, { rarity }] of Object.entries(ITEM_INFO)) (POOLS[rarity] ??= []).push(name)
// Rarity tiers that actually have items (Secret has none), lowest to highest.
const TIERS = RARITIES.filter((r) => POOLS[r]?.length)
const LAST_ZONE = FOREST.zones.length - 1
const X1_SHARE = X1_DROPS.trees / FOREST_TREES.filter((t) => t.zone === 0).length

// Higher zones: share of trees that drop loot, items per tree, and each item's rarity,
// all rising with the zone index (see LUCK_LOOT). The last zone always rolls the top tier.
const dropChance = (zone) => Math.min(1, X1_SHARE + (1 - X1_SHARE) * (zone / LUCK_LOOT.fullAt))
const dropCount = (zone) => 1 + Math.floor(((LUCK_LOOT.maxItems - 1) * zone) / LAST_ZONE)
function rollTier(zone) {
  const pos = (zone / LAST_ZONE) * (TIERS.length - 1)
  let k = Math.floor(pos)
  if (Math.random() < pos - k) k++
  if (Math.random() < LUCK_LOOT.bonus) k++
  return TIERS[Math.min(k, TIERS.length - 1)]
}

// tree id -> 'Common' | 'Uncommon', for the loot trees only.
function planDrops() {
  const zone = FOREST.zones[0]
  const trees = FOREST_TREES.filter((t) => t.z <= zone.z0 && t.z > zone.z1)
  const count = Math.min(X1_DROPS.trees, trees.length)
  const rand = seededRandom(5)
  // One tree from each of `count` equal slices of the zone's trees (row by row), so the
  // loot trees spread over every row and column instead of clumping.
  const picked = Array.from({ length: count }, (_, k) => {
    const lo = Math.floor((k * trees.length) / count)
    const hi = Math.floor(((k + 1) * trees.length) / count)
    return trees[lo + Math.floor(rand() * (hi - lo))]
  })
  // The Uncommon ones are spaced evenly through the picks.
  const uncommonAt = new Set(Array.from({ length: X1_DROPS.uncommon }, (_, u) => Math.floor(((u + 0.5) * count) / X1_DROPS.uncommon)))
  return new Map(picked.map((t, k) => [t.id, uncommonAt.has(k) ? 'Uncommon' : 'Common']))
}

export const LOOT_PLAN = planDrops()

let nextId = 1

function spawn(tree) {
  const drops = []
  const add = (rarity, x, z) => {
    const pool = POOLS[rarity]
    const name = pool[Math.floor(Math.random() * pool.length)]
    drops.push({ id: nextId++, name,rarity, value: ITEM_INFO[name].value, x, y: tree.y, z })
  }
  if (tree.zone === 0) {
    const rarity = LOOT_PLAN.get(tree.id)
    if (rarity) add(rarity, tree.x, tree.z)
  } else if (Math.random() < dropChance(tree.zone)) {
    // Several items fan out in a small ring round the stump (all within pickup range).
    const n = dropCount(tree.zone)
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + Math.PI / 4
      const r = n > 1 ? 0.9 : 0
      add(rollTier(tree.zone), tree.x + Math.cos(a) * r, tree.z + Math.sin(a) * r)
    }
  }
  if (drops.length) useGameStore.setState((s) => ({ worldLoot: [...s.worldLoot, ...drops] }))
}

function collect(drop) {
  const bag = usePlayerData.getState().bag
  if (bag.length >= BAG_MAX) {
    const now = performance.now()
    if (now - lastFull > 700) showActionResult('Bag full!', false) // E held repeats every frame
    lastFull = now
    return false
  }
  usePlayerData.setState({ bag: [...bag, { name: drop.name, rarity: drop.rarity, value: ITEM_INFO[drop.name].value }] })
  useGameStore.setState((s) => ({ worldLoot: s.worldLoot.filter((d) => d.id !== drop.id) }))
  discoverItem(drop.name)
  showActionResult(`Collected ${drop.name}`, true)
}
let lastFull = 0

let promptKey = null
function step() {
  const { x, z, y } = player.position
  let nearest = null
  let best = LOOT_PICKUP_RANGE * LOOT_PICKUP_RANGE
  for (const d of useGameStore.getState().worldLoot) {
    const dd = (x - d.x) ** 2 + (z - d.z) ** 2
    if (dd < best && Math.abs(y - d.y) < 2) {
      best = dd
      nearest = d
    }
  }
  const key = nearest ? `loot:${nearest.id}` : null
  if (promptKey && promptKey !== key) clearInteractTarget(promptKey)
  promptKey = key
  if (nearest) setInteractTarget(key, `Collect ${nearest.name}`, () => collect(nearest), 0)
}

export function install() {
  const offFelled = onTreeFelled(spawn)
  const offReset = onTreesReset(() => useGameStore.setState({ worldLoot: [] }))
  const offStep = addSystem(step)
  return () => {
    offFelled()
    offReset()
    offStep()
  }
}
