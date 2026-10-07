import { create } from 'zustand'
import { STARTING_BALANCE } from '../data/eggs.js'

// The local player's progress: balances, owned pets, boosts. Saved to this
// browser's localStorage on every change — single-player for now; moving it
// server-side means extending systems/net.js and WorldRoom.ts.
//   pets[]   — { id, egg, name } — egg + name key into data/eggs.js EGG_SHOP
//   equipped — pet ids, at most petSlots() (systems/pets.js)
//   discovered — `${egg}:${name}` of every pet ever hatched (the Index)
const SAVE_KEY = 'chop-trees:save:v1'

function fresh() {
  return {
    ...STARTING_BALANCE,
    pets: [],
    equipped: [],
    discovered: [],
    nextPetId: 1,
    level: 1,
    xp: 0, // strength gained toward the next level
    xpNeeded: 10, // data/levels.js strengthForNextLevel(level)
    passes: { slots: false, wood2x: false },
    luckUntil: 0, // ms timestamp the Luck! boost runs out
  }
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY))
    if (saved && typeof saved === 'object') return { ...fresh(), ...saved, passes: { ...fresh().passes, ...saved.passes } }
  } catch {
    // private window / blocked storage / corrupt save — start fresh
  }
  return fresh()
}

export const usePlayerData = create(load)

usePlayerData.subscribe((state) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable — progress just won't survive a reload
  }
})

// Dev reset: __game.resetSave()
export function resetSave() {
  usePlayerData.setState(fresh(), true)
}
