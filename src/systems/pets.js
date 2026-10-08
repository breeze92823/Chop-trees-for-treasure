// Owned-pet helpers over store/usePlayerData.js: lookup, equip limits, and
// the boosts equipped pets and passes give. Chopping (not built yet) should
// scale its wood gain by woodMultiplier().
import { EGG_SHOP, PET_SLOTS, RARITY_ORDER } from '../data/eggs.js'
import { FORGE_TIERS } from '../data/forge.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { petSlotBonus } from './upgrades.js'
import { showActionResult } from './actionResult.js'
import { potionMultiplier } from './potions.js'

// Full data for an owned pet ({ id, egg, name }) — emoji, rarity, power...
export function petInfo(pet) {
  return EGG_SHOP[pet.egg]?.pets.find((p) => p.name === pet.name)
}

// Forge tier of an owned pet (0 Normal ... 3 Void); saves from before the Forge have none.
export const petTier = (pet) => pet.tier ?? 0

// A pet's power with its Forge tier bonus applied (Golden +50%, Diamond +150%, Void +250%).
export function petPower(pet) {
  const info = petInfo(pet)
  return info ? info.power * (1 + FORGE_TIERS[petTier(pet)].bonus) : 0
}

// Index key for a pet species (usePlayerData `discovered`).
export const petKey = (pet) => `${pet.egg}:${pet.name}`

// Network ids (data/eggs.js pets[].id) of the equipped pets, strongest first.
export function equippedPetIds(state = usePlayerData.getState()) {
  const owned = new Map(state.pets.map((p) => [p.id, p]))
  return sortedPets(state.equipped.slice(0, petSlots(state)).map((id) => owned.get(id)).filter(Boolean))
    .map((p) => petInfo(p)?.id)
    .filter(Boolean)
}

export function petSlots(state = usePlayerData.getState()) {
  return PET_SLOTS + (state.passes.slots ? 3 : 0) + petSlotBonus(state)
}

// 1 + the summed power of every equipped pet, e.g. 1.85 = "x1.85".
export function petMultiplier(state = usePlayerData.getState()) {
  const byId = new Map(state.pets.map((p) => [p.id, p]))
  let m = 1
  // An older save may have more equipped than the slots now allow.
  for (const id of state.equipped.slice(0, petSlots(state))) {
    const pet = byId.get(id)
    if (pet) m += petPower(pet)
  }
  return m
}

export function woodMultiplier(state = usePlayerData.getState()) {
  return petMultiplier(state) * (state.passes.wood2x ? 2 : 1) * potionMultiplier('wood', state)
}

export function toggleEquip(id) {
  const s = usePlayerData.getState()
  if (s.equipped.includes(id)) {
    usePlayerData.setState({ equipped: s.equipped.filter((e) => e !== id) })
    return
  }
  if (s.equipped.length >= petSlots(s)) {
    showActionResult(`Only ${petSlots(s)} pets can be equipped!`, false)
    return
  }
  usePlayerData.setState({ equipped: [...s.equipped, id] })
}

const strength = (pet) => {
  const info = petInfo(pet)
  return info ? petPower(pet) * 10 + RARITY_ORDER.indexOf(info.rarity) * 0.001 : -1
}

// Owned pets, strongest first.
export function sortedPets(pets) {
  return [...pets].sort((a, b) => strength(b) - strength(a) || a.id - b.id)
}

export function equipBest() {
  const s = usePlayerData.getState()
  usePlayerData.setState({ equipped: sortedPets(s.pets).slice(0, petSlots(s)).map((p) => p.id) })
}

export function deletePet(id) {
  const s = usePlayerData.getState()
  usePlayerData.setState({ pets: s.pets.filter((p) => p.id !== id), equipped: s.equipped.filter((e) => e !== id) })
}
