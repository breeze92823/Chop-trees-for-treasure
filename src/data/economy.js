// Chopping tunables (systems/chop.js).
// Each swing that lands on a tree gives `wood` x the forest zone's `mult`
// (world/layout.js FOREST.zones) x systems/pets.js woodMultiplier() (equipped
// pets and the x2 Wood! pass). Holding the mouse keeps swinging every
// `cooldownMs`.
export const CHOP = {
  wood: 10, // wood per felled tree (before zone mult and pet boost)
  strengthGain: 1, // Strength added per landed swing (each hit counts as one click)
  standDist: 1.5, // the player shuffles up to this distance from the trunk centre while chopping
  range: 2.6, // trunk centre to the player's feet, horizontal
  cooldownMs: 500, // one full chop cycle (CHOP_TIMING.cycle)
  swingMs: 500, // the 'swing' pose holds this long after the last chop
}

// Tree health (systems/treeHealth.js). Every landed swing removes the player's
// current Strength from the tree's hp, so Strength >= hp fells it in one hit.
export const TREE = {
  hp: 10,
  fallMs: 1100, // topple animation (accelerating, pivoting on the base)
  fadeMs: 3000, // from the moment it starts falling until it has fully faded out
  resetDelayMs: 2000, // after the player leaves the forest corridor, the trees regrow
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
