// Auras rolled at the Auras stall (systems/auras.js, components/AurasMenu.jsx).
// `weight` is the roll chance in % (the Auras Index's CHANCE column), `mult` the
// Strength gain multiplier and `speed` the extra run speed (%) while equipped.
// All ten are from the reference Auras Index; Eclipse / Prismatic double as the Mythic / Secret pity targets.
// Rarity names/colours for the result pop come from data/loot.js RARITY.
export const AURAS = [
  { id: 'ash', name: 'Ash', rarity: 'Common', weight: 35, mult: 1.25, speed: 10, emoji: '🌫️', color: '#8d8f99' },
  { id: 'flame', name: 'Flame', rarity: 'Uncommon', weight: 25, mult: 1.5, speed: 15, emoji: '🔥', color: '#d6d6dc' },
  { id: 'emerald', name: 'Emerald', rarity: 'Rare', weight: 19, mult: 1.85, speed: 20, emoji: '🟢', color: '#3fcf5a' },
  { id: 'sapphire', name: 'Sapphire', rarity: 'Rare', weight: 13, mult: 2.25, speed: 25, emoji: '🔵', color: '#3fb04a' },
  { id: 'volt', name: 'Volt', rarity: 'Epic', weight: 4, mult: 3, speed: 35, emoji: '⚡', color: '#2f6df0' },
  { id: 'frostflare', name: 'Frostflare', rarity: 'Epic', weight: 2, mult: 3.5, speed: 40, emoji: '❄️', color: '#3a7ef0' },
  { id: 'nebula', name: 'Nebula', rarity: 'Legendary', weight: 1, mult: 4.25, speed: 50, emoji: '🌌', color: '#a24ff0' },
  { id: 'inferno', name: 'Inferno', rarity: 'Legendary', weight: 0.6, mult: 5, speed: 60, emoji: '🌋', color: '#ff8a1f' },
  { id: 'eclipse', name: 'Eclipse', rarity: 'Mythic', weight: 0.3, mult: 6.25, speed: 75, emoji: '🌑', color: '#e8303a' },
  { id: 'prismatic', name: 'Prismatic', rarity: 'Secret', weight: 0.1, mult: 7.5, speed: 100, emoji: '🌈', color: 'rainbow' },
]

// Guaranteed after this many spins without that tier (the window's PITY bars).
export const AURA_PITY = { Mythic: 300, Secret: 1000 }
