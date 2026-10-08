// Forge: hold E next to the lava pool (world/Forge.jsx) to open the window
// (components/ForgeMenu.jsx, useGameStore forgeMenu); walking away closes it.
// Place up to FORGE_SLOTS copies of one pet at one tier; the fuse succeeds with
// chance slots/FORGE_SLOTS (or surely, for Robux) and yields one pet a tier up
// (data/forge.js). A failed fuse burns the pets.
import { FORGE } from '../world/layout.js'
import { FORGE_GUARANTEE_ROBUX, FORGE_RANGE, FORGE_SLOTS, FORGE_TIERS } from '../data/forge.js'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from './playerState.js'
import { addSystem } from './loop.js'
import { clearInteractTarget, setInteractTarget } from './interact.js'
import { showActionResult } from './actionResult.js'
import { petInfo, petKey, petSlots, petTier } from './pets.js'
import { addTrauma } from './cameraShake.js'
import { playPowerGainPop } from './sfx.js'

const KEY = 'forge:lava'
// The lava pool sits 2.5 m in front (-Z) of the Forge origin (world/Forge.jsx LavaPool).
export const FORGE_POOL = { x: FORGE.x, z: FORGE.z - 2.5 }

export const MAX_TIER = FORGE_TIERS.length - 1

export function openForgeMenu() {
  useGameStore.setState({
    forgeMenu: true, forgeSlots: [], forgeResult: null,
    upgradesMenu: false, choppersMenu: false, sellMenu: false, aurasMenu: false, autoSpin: false, artifactsMenu: false,
    petsMenu: false, indexMenu: false, rebirthMenu: false, questsMenu: false, eggMenu: null, autoHatch: false,
  })
}

export function closeForgeMenu() {
  useGameStore.setState({ forgeMenu: false, forgeSlots: [], forgeResult: null })
}

const ownedPets = () => new Map(usePlayerData.getState().pets.map((p) => [p.id, p]))
const sameKind = (a, b) => a.egg === b.egg && a.name === b.name && petTier(a) === petTier(b)

// Can this pet go in the slots right now (not full, not maxed, matches the ones already there)?
export function canPlace(pet, slots = useGameStore.getState().forgeSlots) {
  if (petTier(pet) >= MAX_TIER || slots.length >= FORGE_SLOTS || slots.includes(pet.id)) return false
  const owned = ownedPets()
  const first = owned.get(slots[0])
  return !first || sameKind(first, pet)
}

export function placePet(id) {
  const pet = ownedPets().get(id)
  const { forgeSlots } = useGameStore.getState()
  if (!pet || !canPlace(pet, forgeSlots)) return
  useGameStore.setState({ forgeSlots: [...forgeSlots, id], forgeResult: null })
}

export function removePet(id) {
  useGameStore.setState((g) => ({ forgeSlots: g.forgeSlots.filter((s) => s !== id) }))
}

// Success chance 0..1 for a slot count.
export const forgeChance = (count) => Math.min(1, count / FORGE_SLOTS)

export function forge(guaranteed = false) {
  const g = useGameStore.getState()
  const s = usePlayerData.getState()
  const owned = ownedPets()
  const used = g.forgeSlots.map((id) => owned.get(id)).filter(Boolean)
  if (!used.length) {
    showActionResult('Put a pet in the Forge first!', false)
    return
  }
  if (guaranteed && s.robux < FORGE_GUARANTEE_ROBUX) {
    showActionResult(`Not enough Robux! Need ${FORGE_GUARANTEE_ROBUX}`, false)
    return
  }
  const base = used[0]
  const success = guaranteed || Math.random() < forgeChance(used.length)
  const gone = new Set(used.map((p) => p.id))
  let pets = s.pets.filter((p) => !gone.has(p.id))
  let equipped = s.equipped.filter((id) => !gone.has(id))
  let { nextPetId } = s
  let text
  let color
  if (success) {
    const tier = petTier(base) + 1
    const forged = { id: nextPetId++, egg: base.egg, name: base.name, tier }
    pets = [...pets, forged]
    if (equipped.length < petSlots(s) && used.some((p) => s.equipped.includes(p.id))) equipped = [...equipped, forged.id]
    text = `${FORGE_TIERS[tier].name} ${petInfo(base).name}!`
    color = FORGE_TIERS[tier].color
    showActionResult(text, true)
    playPowerGainPop()
  } else {
    text = 'The pets burned up...'
    color = '#ff6a5a'
    showActionResult(text, false)
  }
  usePlayerData.setState({
    pets, equipped, nextPetId,
    robux: guaranteed ? s.robux - FORGE_GUARANTEE_ROBUX : s.robux,
    discovered: success && !s.discovered.includes(petKey(base)) ? [...s.discovered, petKey(base)] : s.discovered,
  })
  addTrauma(success ? 0.45 : 0.25)
  useGameStore.setState({ forgeSlots: [], forgeResult: { success, text, color }, forgeBurst: { at: performance.now(), success } })
}

function step() {
  const d = Math.hypot(player.position.x - FORGE_POOL.x, player.position.z - FORGE_POOL.z)
  if (useGameStore.getState().forgeMenu) {
    clearInteractTarget(KEY)
    if (d > FORGE_RANGE.close) closeForgeMenu()
    return
  }
  if (d < FORGE_RANGE.open) setInteractTarget(KEY, 'Use Forge', openForgeMenu)
  else clearInteractTarget(KEY)
}

export function install() {
  return addSystem(step)
}
