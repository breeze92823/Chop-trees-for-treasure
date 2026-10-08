// Egg shop contents, keyed by the egg `kind` in world/layout.js EGGS.list.
// An egg with no entry here has no hatch window (and no E prompt).
//   cost/currency — paid from store/usePlayerData.js's matching balance
//   pets[].power  — added to the wood multiplier while equipped
//                   (systems/pets.js: 1 + the sum over equipped pets)
//   pets[].id     — stable slug sent over the network (followers, announcements)
export const PHOENIX_PRICE = 1_000_000_000_000 // 1 Trillion cash

export const EGG_SHOP = {
  spotted: {
    name: 'Safari Egg',
    cost: 25000,
    currency: 'wood',
    colors: ['#ffb36b', '#e8541c'],
    pets: [
      { id: 'bear', name: 'Bear', emoji: '🐻', chance: 55, rarity: 'common', power: 0.1 },
      { id: 'eagle', name: 'Eagle', emoji: '🦅', chance: 25, rarity: 'uncommon', power: 0.2 },
      { id: 'elephant', name: 'Elephant', emoji: '🐘', chance: 15, rarity: 'rare', power: 0.4 },
      { id: 'panther', name: 'Panther', emoji: '🐈‍⬛', chance: 4.5, rarity: 'epic', power: 1 },
      { id: 'lion', name: 'Lion', emoji: '🦁', chance: 0.5, rarity: 'legendary', power: 3 },
    ],
  },
  void: {
    name: 'Ultimate Egg',
    cost: 250000,
    currency: 'wood',
    colors: ['#b6ff8a', '#2fcf3a'],
    pets: [
      { id: 'snow_cat', name: 'Snow Cat', emoji: '🐱', chance: 50, rarity: 'rare', power: 1.5 },
      { id: 'imp', name: 'Imp', emoji: '😈', chance: 30, rarity: 'epic', power: 2.5 },
      { id: 'frost_dragon', name: 'Frost Dragon', emoji: '🐉', chance: 20, rarity: 'legendary', power: 5, tag: '25% Stronger!' },
    ],
  },
  // Not an egg on the platform: the featured Blazing Phoenix pad on the south lawn
  // (world/SouthArea.jsx, systems/phoenix.js) sells this one pet outright for cash.
  // `power` 17.5 = 250% stronger than the best egg pet (Frost Dragon, 5).
  phoenix: {
    name: 'Blazing Phoenix',
    cost: PHOENIX_PRICE,
    currency: 'cash',
    colors: ['#ffe08a', '#ff7a1a'],
    pets: [
      { id: 'blazing_phoenix', name: 'Blazing Phoenix', emoji: '🔥', chance: 100, rarity: 'legendary', power: 17.5, tag: '250% Stronger!' },
    ],
  },
  // Quest Gold rewards (data/rewards.js, systems/rewards.js): one pet each, bought outright.
  // `power` 7.5 = 50% stronger than Frost Dragon (5); the unicorn is x140 as advertised.
  galaxy_dragon: {
    name: 'Galaxy Dragon',
    cost: 2500,
    currency: 'questGold',
    colors: ['#e86aff', '#6a2fc0'],
    pets: [
      { id: 'galaxy_dragon', name: 'Galaxy Dragon', emoji: '🐲', chance: 100, rarity: 'legendary', power: 7.5, tag: '50% Stronger!' },
    ],
  },
  void_unicorn: {
    name: 'Void Robot Unicorn',
    cost: 1000,
    currency: 'questGold',
    colors: ['#d8b0ff', '#6a2fc0'],
    pets: [
      { id: 'void_unicorn', name: 'Void Robot Unicorn', emoji: '🦄', chance: 100, rarity: 'legendary', power: 140, tag: 'x140 Strength!' },
    ],
  },
}

// Every pet by network id, with the egg it hatches from.
export const PETS_BY_ID = Object.fromEntries(
  Object.entries(EGG_SHOP).flatMap(([egg, e]) => e.pets.map((p) => [p.id, { ...p, egg }])),
)

// A new save's balances. Robux here is an in-game stand-in until real
// platform purchases are wired up.
// With no way to buy Robux yet, a new save starts with enough to try the
// Ultimate Egg and the boosts; wood comes from chopping.
export const STARTING_BALANCE = { wood: 0, robux: 200, strength: 10 }

export const CURRENCY_ICON = { wood: 'log', robux: 'robux', cash: 'cash' }

export const RARITY_BG = {
  common: '#c9c9cf',
  uncommon: '#46cf3a',
  rare: '#3a7ef0',
  epic: '#9a3fe0',
  legendary: '#ff9a1f',
}
export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']
export const RARITY_TEXT = {
  common: ['#ffffff', '#d8d8de'],
  uncommon: ['#c6ff9a', '#3fcf3a'],
  rare: ['#9ad8ff', '#3a8ef0'],
  epic: ['#e6b0ff', '#a24ff0'],
  legendary: ['#fff3a0', '#ff9a1f'],
}

// Luck! boost: `factor` x the odds of `rarities` for `minutes` per purchase
// (stacking time). `friends` is the extra factor while a Bloxity friend is in
// the same server ("Boosted Odds for Playing with Friends!").
export const LUCK = { factor: 2, minutes: 15, rarities: ['rare', 'epic', 'legendary'], friends: 1.25 }

// Hatches of these rarities are announced to everyone in the server.
export const ANNOUNCE_RARITIES = ['epic', 'legendary']

// Cash boosts down the window's left side (systems/hatch.js buyBoost):
// luck is timed, the others are permanent passes in usePlayerData `passes`.
// Cash prices sit where the Choppers shop puts the same gem counts
// (19 gems ~ 10K, 45 ~ 500K, 115 ~ 50M).
export const EGG_BOOSTS = [
  { id: 'luck', label: 'Luck!', icon: 'clover', price: 500_000, bg: '#46cf3a' },
  { id: 'slots', label: '+3 Pets!', emoji: '🐾', price: 50_000_000, bg: '#c04fe0' },
  { id: 'wood2x', label: 'x2 Wood!', icon: 'log', price: 10_000, bg: '#a8683a' },
]

export const PET_SLOTS = 1 // equipped at start; more come from the Upgrades stall's Equip Pets (and the +3 Pets! pass)
export const PET_INVENTORY_MAX = 60

// Horizontal distance from an egg's centre: within `open` the E prompt shows;
// past `close` an open window shuts (a little hysteresis so it doesn't flicker).
export const EGG_RANGE = { open: 4.5, close: 6.5 }

// Hatch animation phases in ms (components/HatchOverlay.jsx); Auto plays
// them at `autoSpeed` of the time.
export const HATCH_MS = { shake: 1700, reveal: 1900, autoSpeed: 0.55 }
