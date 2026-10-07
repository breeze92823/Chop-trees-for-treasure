// Chopping tunables (systems/chop.js).
// Each swing that lands on a tree gives `wood` x the forest zone's `mult`
// (world/layout.js FOREST.zones) x systems/pets.js woodMultiplier() (equipped
// pets and the x2 Wood! pass). Holding the mouse keeps swinging every
// `cooldownMs`.
export const CHOP = {
  wood: 100,
  range: 2.6, // trunk centre to the player's feet, horizontal
  cooldownMs: 320,
  swingMs: 450, // the 'swing' pose holds this long after the last chop
}
