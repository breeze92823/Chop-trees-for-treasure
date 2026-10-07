// The hub map, mapped out from the reference screenshots. Metres, +X east,
// -Z north, +Y up. The plaza centre is (0, 0); the choppable forest is north,
// Train Strength west, Leaderboards east, Craft / eggs / Forge south.
//
//                     x1 / x2 / x3 Luck forest (north)
//        ┌──────────────────────────────────────────────┐
//        │  Choppers ▣        gray plaza       ▣ Sell     ◎ WORLDS
//  Train │  (sword)       ┌───────────┐          Treasure │ Leader-
//  Str.  │ ═══════════════╡  (spawn)  ╞═══════════════════│ boards
//  tiers │  Auras ▣       └───────────┘        ▣ Upgrades │
//        │  Forge  eggs  phoenix  Craft Artifacts  fountain
//        └──────────────────────────────────────────────┘
//
// Components read these numbers for both the meshes and their colliders.

// Inner edge of the terraced cliffs that ring the basin.
export const BASIN = { minX: -34.5, maxX: 54, minZ: -114, maxZ: 28 }
export const CLIFF = { tiers: 3, tierHeight: 3.5, tierDepth: 6 }

// Grey plaza slab and the four raised green lawns that turn it into a plus.
export const PLAZA = { x0: -20, x1: 33, z0: -22, z1: 15, top: 0.1 }
export const LAWN_TOP = 0.2
export const CURB = 0.7 // dark rim width around each lawn
export const LAWNS = [
  { x0: -20, x1: -9, z0: -22, z1: -4.5 }, // NW (Choppers)
  { x0: 9, x1: 31, z0: -22, z1: -4.5 }, // NE (Sell Treasure, WORLDS)
  { x0: -20, x1: -9, z0: 4.5, z1: 27.5 }, // SW (Auras, Forge)
  { x0: 9, x1: 31, z0: 4.5, z1: 27.5 }, // SE (Upgrades, Craft, fountain)
  { x0: -20, x1: 31, z0: 15, z1: 27.5 }, // S (eggs, phoenix); overlaps SW/SE so no seam
]

// Market stalls. `face` is the yaw the counter faces (PI/2 = east).
export const STALLS = [
  { id: 'choppers', label: 'Choppers', x: -14.5, z: -9.5, face: Math.PI / 2, base: '#2f8ff0', base2: '#1f6fd0', stripe: '#2f8ff0', labelColors: ['#bfe6ff', '#4aa6ff'], stroke: '#0d2f6e' },
  { id: 'sell', label: 'Sell Treasure', x: 14.5, z: -9.5, face: -Math.PI / 2, base: '#6a3b1d', base2: '#4f2a12', stripe: '#27b83a', labelColors: ['#b6ff8a', '#2fcf3a'], stroke: '#0c4a14' },
  { id: 'auras', label: 'Auras', x: -14.5, z: 9.5, face: Math.PI / 2, base: '#5a3018', base2: '#3e200f', stripe: '#6b3a1c', labelColors: ['#ff8c8c', '#e8242c'], stroke: '#5a0a10', glowy: true },
  { id: 'upgrades', label: 'Upgrades', x: 14.5, z: 9.5, face: -Math.PI / 2, base: '#ff4fc8', base2: '#e534b0', stripe: '#ff5fd0', labelColors: ['#ffc2f5', '#c44ce8'], stroke: '#4a0f5e' },
]

// Train Strength: two raised terraces west of the plaza with ten priced trees.
export const TRAIN = {
  tier1: { x0: -28.5, x1: -20, z0: -17, z1: 17, h: 0.6 },
  tier2: { x0: -34.5, x1: -26.5, z0: -17, z1: 17, h: 1.2 },
  aisle: 3.2, // half-width of the grey stair aisle down the middle
  arch: { x: -33.1, halfSpan: 11, height: 8.5 },
}
// cost: 'free' | number; cur: 'rebirth' (red/white ball) or 'coin' (gold).
export const STRENGTH_TREES = [
  // front row (tier 1)
  { x: -24, z: -12.5, tier: 1, cost: 'free', cur: 'rebirth', mult: 'x1.5', pad: '#3fcf3a', kind: 'green' },
  { x: -24, z: -6.5, tier: 1, cost: 2, cur: 'rebirth', mult: 'x2', pad: '#2f6df0', kind: 'blue' },
  { x: -24, z: 0, tier: 1, cost: 11, cur: 'rebirth', mult: 'x8', pad: '#f0362f', kind: 'autumn' },
  { x: -24, z: 6.5, tier: 1, cost: 5, cur: 'rebirth', mult: 'x4', pad: '#a36cf2', kind: 'lilac' },
  { x: -24, z: 12.5, tier: 1, cost: 8, cur: 'rebirth', mult: 'x6', pad: '#2fbf3a', kind: 'palm' },
  // back row (tier 2)
  { x: -30, z: -12.5, tier: 2, cost: 1399, cur: 'coin', mult: 'x1000', pad: '#e8401f', kind: 'lava' },
  { x: -30, z: -6.5, tier: 2, cost: 185, cur: 'coin', mult: 'x100', pad: '#26262c', kind: 'ghost' },
  { x: -30, z: 0, tier: 2, cost: 19, cur: 'coin', mult: 'x10', pad: '#33d6ef', kind: 'ice' },
  { x: -30, z: 6.5, tier: 2, cost: 45, cur: 'coin', mult: 'x25', pad: '#8a3ff0', kind: 'violet' },
  { x: -30, z: 12.5, tier: 2, cost: 559, cur: 'coin', mult: 'x300', pad: '#35c23a', kind: 'jungle' },
]

// Choppable forest, split into luck zones by a river and a step.
export const FOREST = {
  x0: -31,
  x1: 50,
  spacing: 4.4,
  zones: [
    { label: 'x1 Luck', z0: -27, z1: -58, y: 0 },
    { label: 'x2 Luck', z0: -70, z1: -90, y: 0 },
    { label: 'x3 Luck', z0: -93, z1: -112, y: 0.6 },
  ],
  river: { z0: -61, z1: -67 },
}

// Leaderboards: purple raised hall at the east end of the plaza.
export const LEADER = {
  x0: 34, x1: 52, z0: -18, z1: 18, h: 1.2,
  steps: [{ x0: 31, h: 0.4 }, { x0: 32.5, h: 0.8 }],
  boards: [
    { title: 'TOP REBIRTHS', icon: 'rebirth', z: -13, color: '#e8332e' },
    { title: 'TOP CASH', icon: 'cash', z: -4.6, color: '#2fbf3a' },
    { title: 'TOP STRENGTH', icon: 'arm', z: 4.6, color: '#f39a1d' },
    { title: 'TOP TIME PLAYED', icon: 'clock', z: 13, color: '#e8b21d' },
  ],
  statues: [
    { z: -8.8, color: '#26262c' },
    { z: 0, color: '#f2efe6' },
    { z: 8.8, color: '#26262c' },
  ],
}

export const PORTAL = { x: 27, z: -19.5, face: -Math.PI * 0.75 }
export const SWORD_DISPLAY = { x: -14.5, z: -16 }
export const PHOENIX_DISPLAY = { x: 5.5, z: 19 }
export const EGGS = {
  platform: { x: -1.5, z: 21, w: 9, d: 5 },
  list: [
    { x: 0.8, z: 21, kind: 'spotted', price: '25K', icon: 'log', colors: ['#ffb36b', '#e8541c'] },
    { x: -3.8, z: 21, kind: 'void', price: '11', icon: 'robux', colors: ['#b6ff8a', '#2fcf3a'] },
  ],
}
export const CRAFT = { x: 11.5, z: 20, face: Math.PI } // bench faces the plaza
export const FOUNTAIN = { x: 21, z: 18 }
export const FORGE = { x: -16, z: 21.5 }
