// Forge (systems/forge.js, components/ForgeMenu.jsx): fuse up to SLOTS copies of
// the same pet at the same tier for a chance at the next tier. Each filled slot
// adds 1/SLOTS to the chance; a failed fuse burns the pets. `bonus` multiplies
// the pet's power (systems/pets.js petPower): Golden +50%, Diamond +150%, Void +250%.
export const FORGE_TIERS = [
  { name: 'Normal', bonus: 0, color: '#d8dcf0' },
  { name: 'Golden', bonus: 0.5, color: '#ffc21a' },
  { name: 'Diamond', bonus: 1.5, color: '#3ab8ff' },
  { name: 'Void', bonus: 2.5, color: '#a040e0' },
]

export const FORGE_SLOTS = 3
export const FORGE_GUARANTEE_ROBUX = 25 // makes a fuse certain whatever the slot count
// hold E within `open` metres of the lava pool; past `close` the window shuts.
export const FORGE_RANGE = { open: 5, close: 8 }
