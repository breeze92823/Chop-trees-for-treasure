import { useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { PET_INVENTORY_MAX, RARITY_BG } from '../data/eggs.js'
import { FORGE_TIERS } from '../data/forge.js'
import { deletePet, equipBest, petInfo, petMultiplier, petPower, petSlots, petTier, sortedPets, toggleEquip } from '../systems/pets.js'
import { playButtonClick } from '../systems/sfx.js'
import { RAINBOW, grad, T, stop, Btn, Emoji } from './hudParts.jsx'

// Pets inventory (the HUD's Pets tile): owned pets strongest first. Click a
// pet to equip / unequip it; the bin deletes an unequipped one (click it
// twice — the first press arms it).

const close = () => {
  playButtonClick()
  useGameStore.setState({ petsMenu: false })
}

function PetCard({ pet, equipped, armed, onArm }) {
  const info = petInfo(pet)
  if (!info) return null
  return (
    <div
      className={`pet-card${equipped ? ' equipped' : ''}`}
      style={{ '--bg': RARITY_BG[info.rarity] }}
      title={`${petTier(pet) ? `${FORGE_TIERS[petTier(pet)].name} ` : ''}${info.name}`}
      onClick={() => {
        playButtonClick()
        toggleEquip(pet.id)
      }}
    >
      <Emoji size={64}>{info.emoji}</Emoji>
      <T size={20} w={3} fill={info.rarity === 'legendary' ? RAINBOW : undefined} className="pet-card-power">{`+${Math.round(petPower(pet) * 100)}%`}</T>
      {petTier(pet) > 0 && <T size={18} w={3} fill={grad(FORGE_TIERS[petTier(pet)].color)} className="pet-card-tier">{FORGE_TIERS[petTier(pet)].name}</T>}
      {equipped && <span className="pet-card-check">✔</span>}
      {!equipped && (
        <button
          type="button"
          className={`pet-card-bin${armed ? ' armed' : ''}`}
          aria-label={armed ? 'Confirm delete' : 'Delete'}
          onPointerDown={stop}
          onClick={(e) => {
            e.stopPropagation()
            playButtonClick()
            if (armed) deletePet(pet.id)
            onArm(armed ? null : pet.id)
          }}
        >
          {armed ? '?' : '🗑'}
        </button>
      )}
    </div>
  )
}

export default function PetsMenu() {
  const open = useGameStore((s) => s.petsMenu)
  const hatching = useGameStore((s) => s.hatch !== null)
  const pets = usePlayerData((s) => s.pets)
  const equipped = usePlayerData((s) => s.equipped)
  const slots = usePlayerData(petSlots)
  const mult = usePlayerData(petMultiplier)
  const [armed, setArmed] = useState(null)
  if (!open || hatching) return null

  const on = new Set(equipped)
  return (
    <div className="hud-window" onPointerDown={stop}>
      <div className="hud-window-title" style={{ '--bg': '#3a8ef0' }}>
        <Emoji size={44}>🐾</Emoji>
        <T size={46} w={5}>Pets</T>
      </div>
      <button type="button" className="egg-close" aria-label="Close" onPointerDown={stop} onClick={close} />
      <div className="hud-window-bar">
        <T size={26} w={3}>{`Equipped ${equipped.length}/${slots}`}</T>
        <T size={26} w={3}>{`Stored ${pets.length}/${PET_INVENTORY_MAX}`}</T>
        <T size={26} w={3} fill={grad('#ffe0b0', '#e8a868')} stroke="#3a1a08">{`Wood x${+mult.toFixed(2)}`}</T>
        <Btn
          className="hud-window-btn"
          style={{ '--bg': '#46cf3a' }}
          onClick={() => {
            playButtonClick()
            equipBest()
          }}
        >
          <T size={28} w={4}>Equip Best</T>
        </Btn>
      </div>
      <div className="pet-grid">
        {pets.length === 0 && (
          <T size={30} w={4} fill={grad('#d8dcf0', '#aab0cc')} className="pet-empty">No pets yet. Hatch an egg!</T>
        )}
        {sortedPets(pets).map((p) => (
          <PetCard key={p.id} pet={p} equipped={on.has(p.id)} armed={armed === p.id} onArm={setArmed} />
        ))}
      </div>
    </div>
  )
}
