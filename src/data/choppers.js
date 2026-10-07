// Choppers (axes) sold at the Choppers stall (systems/choppers.js, components/
// ChoppersMenu.jsx), in window order. The equipped one sets the base Strength
// gained per landed swing (systems/chop.js), before the rebirth / Index / aura
// multipliers.
//   strength — base Strength per swing
//   bonus    — optional "N% Stronger!" (Secret / Unique / Admin): the per-swing
//              Strength is strength x (1 + bonus / 100)
//   cost     — cash price (null = not sold for cash); 0 = owned from the start
//   gems     — Robux ("gem") price (null = not sold for Robux)
//   how      — shown instead of a price for choppers that cannot be bought ('Lucky', 'Event')
//   model    — 3D model spec for systems/axeModels.js
// Icons are public/ui/choppers/<id>.png, cut from the reference screenshots.
export const CHOPPERS = [
  { id: 'pinechip', name: 'Pinechip Hatchet', rarity: 'Common', strength: 1, cost: 0, gems: null, model: { type: 'axe', wood: '#e8742a', grip: '#d6303a', head: '#8a94a6', accent: '#e8742a' } },
  { id: 'camp', name: 'Camp Splitter', rarity: 'Common', strength: 2, cost: 100, gems: 2, model: { type: 'axe', wood: '#c9722e', grip: '#e8d9b0', head: '#2c2c34', accent: '#9aa0b0' } },
  { id: 'hookbeak', name: 'Hookbeak Cutter', rarity: 'Uncommon', strength: 4, cost: 250, gems: 3, model: { type: 'hook', wood: '#1f2a55', grip: '#c0612a', head: '#2f8f8a', accent: '#e0a030' } },
  { id: 'birch', name: 'Birch Twinaxe', rarity: 'Uncommon', strength: 8, cost: 500, gems: 6, model: { type: 'twin', wood: '#2a3a6a', grip: '#9aa8c8', head: '#c8ccd6', accent: '#e8ecf4' } },
  { id: 'sawtooth', name: 'Sawtooth Chopper', rarity: 'Uncommon', strength: 15, cost: 1000, gems: 8, model: { type: 'saw', wood: '#5a3a14', grip: '#d8a030', head: '#1f5a30', accent: '#d8a030' } },
  { id: 'amber', name: 'Amber Sap Axe', rarity: 'Rare', strength: 25, cost: 2500, gems: 11, model: { type: 'axe', wood: '#7a4a14', grip: '#f0a030', head: '#f09020', accent: '#ffd060', glow: '#ff9a1f' } },
  { id: 'frostpine', name: 'Frostpine Cutter', rarity: 'Rare', strength: 40, cost: 5000, gems: 14, model: { type: 'twin', wood: '#cfe0f0', grip: '#4aa0f0', head: '#4aa0f0', accent: '#d8f4ff', glow: '#7fd0ff' } },
  { id: 'crimson', name: 'Crimson Thorn Cleaver', rarity: 'Rare', strength: 70, cost: 10000, gems: 19, model: { type: 'axe', wood: '#a01820', grip: '#3a3a42', head: '#3a3a42', accent: '#e04030' } },
  { id: 'jungle', name: 'Jungle Fang Axe', rarity: 'Rare', strength: 120, cost: 25000, gems: 25, model: { type: 'crescent', wood: '#6a4a1c', grip: '#3fa84a', head: '#d8f0b0', accent: '#3fe05a', glow: '#3fe05a' } },
  { id: 'moonwood', name: 'Moonwood Crescent', rarity: 'Epic', strength: 200, cost: 50000, gems: 29, model: { type: 'axe', wood: '#2a3260', grip: '#8a90ff', head: '#242c58', accent: '#c0c8ff', glow: '#8a90ff' } },
  { id: 'bloomstorm', name: 'Bloomstorm Halberd', rarity: 'Epic', strength: 350, cost: 100000, gems: 35, model: { type: 'halberd', wood: '#5a7a2a', grip: '#ff6aa8', head: '#ff6aa8', accent: '#4ab8ff' } },
  { id: 'runestone', name: 'Runestone Timbermaul', rarity: 'Epic', strength: 600, cost: 250000, gems: 40, model: { type: 'maul', wood: '#7a4a2a', grip: '#2a7a7a', head: '#2a7a7a', accent: '#6affe0', glow: '#2fe0c0' } },
  { id: 'magma', name: 'Magma Rootsplitter', rarity: 'Epic', strength: 1000, cost: 500000, gems: 45, model: { type: 'twin', wood: '#3a2a1a', grip: '#f06a10', head: '#f06a10', accent: '#ffc040', glow: '#ff5a10' } },
  { id: 'sunstag', name: 'Sunstag Great Axe', rarity: 'Legendary', strength: 1800, cost: 1000000, gems: 49, model: { type: 'halberd', wood: '#7a4a2a', grip: '#e07020', head: '#e8c890', accent: '#e07020', glow: '#ffb050' } },
  { id: 'thunderbark', name: 'Thunderbark Twinaxe', rarity: 'Legendary', strength: 3000, cost: 2500000, gems: 59, model: { type: 'twin', wood: '#1a2040', grip: '#e8c050', head: '#3a5ad0', accent: '#e8c050', glow: '#4a6aff' } },
  { id: 'dragonjaw', name: 'Dragonjaw Feller', rarity: 'Legendary', strength: 5000, cost: 5000000, gems: 75, model: { type: 'hook', wood: '#2a2a3a', grip: '#d0a030', head: '#2faa5a', accent: '#d0a030', glow: '#2fe070' } },
  { id: 'aurora', name: 'Aurora Sawblade', rarity: 'Legendary', strength: 9000, cost: 10000000, gems: 85, model: { type: 'disc', wood: '#3a3a5a', grip: '#4ad0ff', head: '#8a90b0', accent: '#c04cff', glow: '#4ad0ff' } },
  { id: 'redwood', name: 'Royal Redwood Guillotine', rarity: 'Legendary', strength: 15000, cost: 25000000, gems: 105, model: { type: 'guillotine', wood: '#8a1c24', grip: '#e8d8b0', head: '#a82030', accent: '#e8d8b0' } },
  { id: 'primal', name: 'Primal Worldtree Executioner', rarity: 'Mythic', strength: 25000, cost: 50000000, gems: 115, model: { type: 'twin', wood: '#2a4a3a', grip: '#5affc0', head: '#2a8ad0', accent: '#5affc0', glow: '#2fd0ff' } },
  { id: 'eclipse', name: 'Eclipse Reaper Axe', rarity: 'Mythic', strength: 45000, cost: 100000000, gems: 129, model: { type: 'twin', wood: '#2a2a34', grip: '#a050e0', head: '#5a5a6a', accent: '#a050e0', glow: '#a050e0' } },
  { id: 'phoenixheart', name: 'Phoenixheart Cleaver', rarity: 'Mythic', strength: 90000, cost: 250000000, gems: 139, model: { type: 'halberd', wood: '#8a2a1a', grip: '#f0a030', head: '#f0a030', accent: '#ffe060', glow: '#ff7a20' } },
  { id: 'voidroot', name: 'Voidroot Devourer', rarity: 'Mythic', strength: 200000, cost: 500000000, gems: 159, model: { type: 'crescent', wood: '#2a1a30', grip: '#c040ff', head: '#6a2aa0', accent: '#c040ff', glow: '#c040ff' } },
  { id: 'genesis', name: 'Genesis Worldcutter', rarity: 'Mythic', strength: 500000, cost: 1000000000, gems: 169, model: { type: 'twin', wood: '#4a3a1a', grip: '#ffe080', head: '#c8a860', accent: '#ffe080', glow: '#ffe080' } },
  { id: 'solar', name: 'Solar Crown', rarity: 'Secret', strength: 7, bonus: 250, cost: null, gems: 279, model: { type: 'sword', wood: '#e8a050', head: '#ffd8a0', accent: '#e8b050', glow: '#ffb050' } },
  { id: 'infinity', name: 'Infinity Blade', rarity: 'Secret', strength: 12, bonus: 500, cost: null, gems: 559, model: { type: 'sword', wood: '#3a3a8a', head: '#6a7aff', accent: '#9a8aff', glow: '#9a8aff' } },
  { id: 'dragonsfang', name: "Dragon's Fang", rarity: 'Secret', strength: 17, bonus: 750, cost: null, gems: 839, model: { type: 'sword', wood: '#3a2a5a', head: '#7a4ad0', accent: '#4ae0e0', glow: '#4ae0e0' } },
  { id: 'pathfinder', name: 'Pathfinder Axe', rarity: 'Unique', strength: 12, bonus: 500, cost: null, gems: null, how: 'Lucky', model: { type: 'twin', wood: '#8a6a2a', grip: '#3a8ad0', head: '#d8b860', accent: '#3a8ad0' } },
  { id: 'admin', name: 'Admin Greatsword', rarity: 'Admin', strength: 8, bonus: 300, cost: null, gems: null, how: 'Event', model: { type: 'sword', wood: '#1a2a1a', head: '#1a2a1a', accent: '#30ff50', glow: '#30ff50' } },
]

export const STARTING_CHOPPER = 'pinechip'
