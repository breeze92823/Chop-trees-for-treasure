// Artifacts crafted at the Craft Artifacts bench (systems/artifacts.js,
// components/ArtifactsMenu.jsx). One artifact is equipped at a time; owned ids
// live in usePlayerData `artifacts`, the equipped one in `artifact`.
//   rarity — keys the row colour + label colours in components/ArtifactsMenu.jsx
//   gems   — Robux price to craft (null = starter, owned from the start)
//   stats  — [kind, value] in reading order (two columns, top to bottom, left first); kinds:
//     cash / strength / swing / move : percent, added to that multiplier
//     backpack                       : extra Bag slots
//     flight                         : label only (Flight Unlocked) — no gameplay hook yet
//   recipe — crafting by ingredients (ArtifactCraft.jsx): `cells` is the 3x3 grid in reading order
//            (loot item names from data/loot.js, null = empty; repeats count twice), plus `wood`;
//            ingredients are taken from the Bag. The Robux price buys it outright instead.
export const ARTIFACTS = [
  { id: 'treasurepack', name: 'Treasure Pack', rarity: 'Common', gems: null, stats: [['backpack', 1], ['cash', 20], ['strength', 15]] },
  { id: 'fortuneamulet', name: 'Fortune Amulet', rarity: 'Uncommon', gems: 115, stats: [['cash', 45], ['strength', 30], ['backpack', 1], ['swing', 6]], recipe: { cells: [null, 'Gem', null, 'Beaded Bracelet', 'Anchor', 'Beaded Bracelet', null, null, null], wood: 2000 } },
  { id: 'explorercompass', name: 'Explorer Compass', rarity: 'Rare', gems: 169, stats: [['move', 10], ['cash', 72], ['strength', 55]], recipe: { cells: [null, 'Sapphire', null, 'Ancient Scroll', 'Pocket Watch', 'Ancient Scroll', null, 'Ruby', null], wood: 6000 } },
  { id: 'dragontotem', name: 'Dragon Totem', rarity: 'Epic', gems: 225, stats: [['strength', 85], ['move', 8], ['swing', 10]], recipe: { cells: [null, 'Jade Idol', null, 'War Drum', 'Magic Lamp', 'War Drum', null, 'Dragon Egg', 'Siren Harp'], wood: 20000 } },
  { id: 'celestialwings', name: 'Celestial Wings', rarity: 'Legendary', gems: 279, stats: [['flight', 1], ['move', 18], ['strength', 110]], recipe: { cells: ['Star Fragment', 'Phoenix Feather', 'Star Fragment', 'Titan Gauntlet', 'Sun Medallion', 'Titan Gauntlet', null, 'Kraken Eye', null], wood: 60000 } },
  { id: 'chronocrown', name: 'Chrono Crown', rarity: 'Mythic', gems: 339, stats: [['strength', 128], ['cash', 130], ['backpack', 2], ['swing', 15]], recipe: { cells: ['Time Crystal', 'Celestial Harp', 'Time Crystal', 'Dream Catcher', 'Phoenix Heart', 'Dream Catcher', 'Obsidian Throne', null, 'Obsidian Throne'], wood: 200000 } },
  { id: 'creatorcore', name: 'Creator Core', rarity: 'Secret', gems: 395, stats: [['strength', 150], ['cash', 150], ['move', 25], ['backpack', 2], ['swing', 20]], recipe: { cells: ['Galaxy Pearl', 'Aurora Veil', 'Galaxy Pearl', 'Void Orb', 'Excalibur', 'Void Orb', 'Astral Blade', 'Rainbow Diamond', 'Astral Blade'], wood: 1000000 } },
]

// [{ name, need }] in grid order, duplicates merged.
export function recipeNeeds(a) {
  const counts = new Map()
  for (const n of a.recipe?.cells ?? []) if (n) counts.set(n, (counts.get(n) ?? 0) + 1)
  return [...counts].map(([name, need]) => ({ name, need }))
}

export const artifactInfo = (id) => ARTIFACTS.find((a) => a.id === id)

// Display per stat kind: gradient fill [top, bottom], outline, text from the value.
export const STAT = {
  cash: { fill: ['#7aff5a', '#1fb82a'], stroke: '#0c3a10', text: (n) => `Cash +${n}%` },
  strength: { fill: ['#ffb040', '#ff7a10'], stroke: '#4a2000', text: (n) => `Strength +${n}%` },
  backpack: { fill: ['#c070ff', '#8a30e0'], stroke: '#1a0a4a', text: (n) => `+${n} Backpack Slot${n > 1 ? 's' : ''}` },
  swing: { fill: ['#ff7ae0', '#c030d0'], stroke: '#3a0a4a', text: (n) => `Swing Speed +${n}%` },
  move: { fill: ['#6ac0ff', '#2f8ff0'], stroke: '#0a2a5a', text: (n) => `Movement Speed +${n}%` },
  flight: { fill: ['#8af0ff', '#20b8e0'], stroke: '#06304a', text: () => 'Flight Unlocked' },
}
