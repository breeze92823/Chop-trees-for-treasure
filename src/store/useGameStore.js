import { create } from 'zustand'

// Cross-cutting UI/loading state only. A theme adds its own fields here (cash,
// inventory, quest step...) and, if they should persist or be visible to
// others, extends systems/net.js and the server's WorldRoom.ts.
export const useGameStore = create(() => ({
  // 'connecting' until the first join succeeds or times out; 'offline' = the
  // game runs single-player (and keeps retrying quietly); 'online' = synced.
  netStatus: 'connecting',
  avatarLoaded: false, // player character (incl. Bloxity accessories) finished loading; gates the loading screen
  eggMenu: null, // egg kind whose hatch window is open (systems/eggs.js), null when closed
  hatch: null, // { egg, pets, id } while the hatch animation plays (systems/hatch.js)
  autoHatch: false, // Auto button: keep hatching while the window stays open
  autoChop: false, // Auto Chop button: swing whenever a tree is in range, no click needed (systems/chop.js)
  petsMenu: false, // Pets inventory window (components/PetsMenu.jsx)
  worldLoot: [], // loot lying where trees fell: { id, name, rarity, x, y, z } (systems/loot.js)
  indexMenu: false, // pet Index window (components/IndexMenu.jsx)
  rebirthMenu: false, // Rebirth window (components/RebirthMenu.jsx)
  aurasMenu: false, // Auras window, opened by hold-E at the stall (systems/auras.js)
  aurasIndex: false, // Auras Index page of the Auras window (the "i" button)
  aurasOwned: false, // "My Auras" page of the Auras window (equip / unequip)
  autoSpin: false, // Auto Spin toggle in the Auras window
  autoStop: null, // Auto Spin stops after landing this rarity or better (null = never)
  auraBurst: null, // { at, color } of the latest spin, drives the stall flash (world/AuraStallFx.jsx)
  upgradesMenu: false, // Upgrades window, opened by hold-E at the stall (systems/upgrades.js)
  artifactsMenu: false, // Artifacts window, opened by hold-E at the Craft bench (systems/artifacts.js)
  artifactCraft: null, // artifact id whose ingredient/craft page is showing inside the Artifacts window
  choppersMenu: false, // Choppers window, opened by hold-E at the stall (systems/choppers.js)
  forgeMenu: false, // Forge window, opened by hold-E at the lava pool (systems/forge.js)
  forgeSlots: [], // pet ids placed in the Forge's fuse slots
  forgeResult: null, // { success, text, color } of the last fuse, shown in the window
  forgeBurst: null, // { at, success } of the last fuse, drives the lava flare (world/Forge.jsx)
  sellMenu: false, // Sell Treasure window, opened by hold-E at the stall (systems/sell.js)
}))
