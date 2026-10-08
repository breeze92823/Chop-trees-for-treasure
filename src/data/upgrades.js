// Permanent upgrades sold at the Upgrades stall (systems/upgrades.js,
// components/UpgradesMenu.jsx); levels live in usePlayerData `upgrades`.
//   id      — key in usePlayerData `upgrades`
//   max     — highest level
//   perLevel— effect per level (range / speed / move: fraction; eggluck: percentage points; backpack / petslots: slots)
//   cash    — price of level 1; each next level costs `cashGrowth` x more
//   gems    — Robux price of level 1; each next level adds `gems` x `gemStep` more
//   info    — per-level effect text shown in the window
export const UPGRADES = [
  { id: 'range', name: 'Swing Range', emoji: '🪓', max: 40, perLevel: 0.05, cash: 10000, cashGrowth: 1.18, gems: 29, gemStep: 0.25, info: '+5% Per Level' },
  { id: 'speed', name: 'Swing Speed', emoji: '⚡', max: 40, perLevel: 0.025, cash: 15000, cashGrowth: 1.18, gems: 29, gemStep: 0.25, info: '+2.5% Per Level' },
  { id: 'backpack', name: 'Backpack Slots', emoji: '🎒', max: 25, perLevel: 1, cash: 125000, cashGrowth: 1.3, gems: 49, gemStep: 0.3, info: '+1 Slot Per Level' },
  { id: 'move', name: 'Movement Speed', emoji: '👟', max: 39, perLevel: 0.05, cash: 10000, cashGrowth: 1.15, gems: 29, gemStep: 0.25, info: '+5% Per Level' },
  { id: 'eggluck', name: 'Egg Luck', emoji: '🍀', max: 18, perLevel: 0.25, cash: 10000, cashGrowth: 1.3, gems: 29, gemStep: 0.3, info: '+0.25% Legendary Per Level' },
  { id: 'petslots', name: 'Equip Pets', emoji: '🐾', max: 6, perLevel: 1, cash: 250000, cashGrowth: 2.2, gems: 29, gemStep: 0.6, info: '+1 Pet Equipped Per Level' },
]

export const upgradeInfo = (id) => UPGRADES.find((u) => u.id === id)

// Price of the next level (level = current level), rounded to 3 significant figures.
export function upgradeCash(u, level) {
  const raw = u.cash * u.cashGrowth ** level
  const mag = 10 ** (Math.floor(Math.log10(raw)) - 2)
  return Math.round(raw / mag) * mag
}

export const upgradeGems = (u, level) => Math.round(u.gems * (1 + level * u.gemStep))
