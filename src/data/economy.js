// Chopping tunables (systems/chop.js).
// Each swing that lands on a tree gives `wood` x the forest zone's `mult`
// (world/layout.js FOREST.zones) x systems/pets.js woodMultiplier() (equipped
// pets and the x2 Wood! pass). Holding the mouse keeps swinging every
// `cooldownMs`.
export const CHOP = {
  wood: 10, // wood per felled tree (before zone mult and pet boost)
  strengthGain: 1, // unused: base Strength per swing now comes from the equipped chopper (data/choppers.js)
  standDist: 1.5, // the player shuffles up to this distance from the trunk centre while chopping
  range: 5.2, // trunk centre to the player's feet, horizontal (also the auto-chop / click search radius)
  cooldownMs: 500, // one full chop cycle (CHOP_TIMING.cycle)
  swingMs: 500, // the 'swing' pose holds this long after the last chop
}

// Tree health (systems/treeHealth.js). Every landed swing removes the player's
// current Strength from the tree's hp, so Strength >= hp fells it in one hit.
// Zone hp (world/forestTrees.js): x1 Luck trees have `hp`; it grows as a power of
// the zone's luck multiplier, fitted so the `anchor` zone has exactly anchor.hp
// (x5 Luck = 8000), then rounded to 2 significant figures.
export const TREE = {
  hp: 10,
  anchor: { luck: 5, hp: 8000 },
  fallMs: 1100, // topple animation (accelerating, pivoting on the base)
  fadeMs: 3000, // from the moment it starts falling until it has fully faded out
  resetDelayMs: 2000, // after the player leaves the forest corridor, the trees regrow
}

// Rebirth (systems/rebirth.js, components/RebirthMenu.jsx). Reaching `level`
// lets the player rebirth: Strength and level go back to the start, and each
// rebirth adds `strengthPer` to the Strength gain multiplier and `cashPer` to
// the cash multiplier. Skip rebirths early for `skipRobux` Robux.
export const REBIRTH = {
  level: 25, // level needed for the first rebirth
  levelStep: 0, // extra levels needed for every rebirth already done
  strengthPer: 0.5, // x1.0 -> x1.5 -> x2.0 ...
  cashPer: 0.2, // x1.0 -> x1.2 -> x1.4 ...
  skipRobux: 20,
}

// Treasure Index (components/IndexMenu.jsx, systems/treasureIndex.js): every
// treasure discovered (first collected) adds `perItem` to the Strength gain multiplier.
export const INDEX = { perItem: 0.025 }

// Sell Treasure stall (systems/sell.js, components/SellMenu.jsx): hold E within
// `open` metres of it (world/layout.js STALLS 'sell'); walking past `close`
// shuts the window.
export const SELL = {
  open: 3.5,
  close: 7,
}

// Choppers stall (systems/choppers.js, components/ChoppersMenu.jsx): hold E within
// `open` metres of it (world/layout.js STALLS 'choppers'); past `close` the window shuts.
export const CHOPPER = {
  open: 3.5,
  close: 7,
}

// Auras stall (systems/auras.js, components/AurasMenu.jsx): hold E within `open`
// metres of it (world/layout.js STALLS 'auras'); past `close` the window shuts.
export const AURA = {
  open: 3.5,
  close: 7,
  spinCost: 100000, // cash per spin
  autoMs: 1200, // Auto Spin pace
}

// Seconds into one chop cycle (systems/avatarAnim.js 'swing' pose; chop.js
// awards wood at `impact`). Wind-up is deliberately slower than the swing.
export const CHOP_TIMING = {
  windup: 0.225, // slow lift back over the shoulder
  top: 0.265, // brief pause at the top
  impact: 0.335, // fast swing lands on the trunk
  hold: 0.38, // heavy beat: arms absorb the hit
  cycle: 0.5, // recovery runs to here, then it loops
}
