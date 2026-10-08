import { create } from 'zustand'
import { STARTING_BALANCE } from '../data/eggs.js'
import { SERVER_URL } from '../data/config.js'

// The local player's progress: balances, owned pets, boosts. In multiplayer
// (a server URL is configured) it is never read from or written to the browser:
// it starts fresh and is hydrated from the server. Only a server-less build
// saves to localStorage. Progress is pushed to the server (systems/net.js `saveProgress`, which stores
// every key of fresh() in Mongo; the server's src/sanitize.ts validates them).
//   pets[]   — { id, egg, name } — egg + name key into data/eggs.js EGG_SHOP
//   equipped — pet ids, at most petSlots() (systems/pets.js)
//   discovered — `${egg}:${name}` of every pet ever hatched (the Index)
//   bag      — loot picked up from felled trees (systems/loot.js)
const SAVE_KEY = 'chop-trees:save:v1'

function fresh() {
  return {
    ...STARTING_BALANCE,
    pets: [],
    equipped: [],
    discovered: [],
    nextPetId: 1,
    bag: [], // collected loot, { name, rarity, value } — capacity BAG_MAX (data/loot.js)
    level: 1,
    xp: 0, // strength gained toward the next level
    xpNeeded: 10, // data/levels.js strengthForNextLevel(level)
    rebirths: 0, // systems/rebirth.js
    cash: 0, // $ from selling loot (systems/sell.js)
    choppers: ['pinechip'], // owned chopper ids (data/choppers.js, systems/choppers.js)
    chopper: 'pinechip', // equipped chopper id
    auras: [], // owned aura ids (data/auras.js, systems/auras.js)
    aura: null, // equipped aura id
    spins: 0, // total aura spins (pity)
    pity: { Mythic: 0, Secret: 0 }, // spins since the last Mythic / Secret
    luckyRolls: 0, // "YOU HAVE n" lucky rolls
    discoveredItems: [], // loot names collected at least once (the Index, systems/treasureIndex.js)
    upgrades: { range: 0, speed: 0, backpack: 0, move: 0, eggluck: 0, petslots: 0 }, // levels bought at the Upgrades stall (data/upgrades.js)
    artifacts: [], // crafted artifact ids (data/artifacts.js, systems/artifacts.js)
    artifact: null, // equipped artifact id
    passes: { slots: false, wood2x: false },
    luckUntil: 0, // ms timestamp the Luck! boost runs out
    questGold: 800, // Gold earned from quests, spent in the Quests window's Rewards tab (data/rewards.js)
    quests: { progress: {}, done: [], epoch: {} }, // quest progress per data/quests.js id, paid ids, reset epoch per group (systems/quests.js)
    rewards: [], // owned one-time Rewards gear ids (Pathfinder Wings)
    potions: { master: 0, luck: 0, cash: 0, strength: 0 }, // potions in stock (systems/rewards.js)
    boostUntil: { strength: 0, cash: 0, wood: 0 }, // ms timestamps the potion boosts run out (systems/potions.js)
  }
}

// Keys synced with the server (systems/net.js): everything a new game starts with.
export const SAVED_KEYS = Object.keys(fresh())

// VITE_CASH (see .env.example) overrides cash on every load, saved or not.
const ENV_CASH = Number(import.meta.env.VITE_CASH)
const hasEnvCash = import.meta.env.VITE_CASH !== undefined && import.meta.env.VITE_CASH !== '' && Number.isFinite(ENV_CASH)

function load() {
  let state = fresh()
  if (SERVER_URL) return withEnvCash(state) // multiplayer: systems/net.js hydrates from the backend
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY))
    if (saved && typeof saved === 'object') state = { ...state, ...saved, passes: { ...state.passes, ...saved.passes }, upgrades: { ...state.upgrades, ...saved.upgrades }, potions: { ...state.potions, ...saved.potions }, quests: { ...state.quests, ...saved.quests }, boostUntil: { ...state.boostUntil, ...saved.boostUntil } }
  } catch {
    // private window / blocked storage / corrupt save — start fresh
  }
  return withEnvCash(state)
}

function withEnvCash(state) {
  if (hasEnvCash) state.cash = ENV_CASH
  return state
}

export const usePlayerData = create(load)

if (!SERVER_URL) usePlayerData.subscribe((state) => {
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
