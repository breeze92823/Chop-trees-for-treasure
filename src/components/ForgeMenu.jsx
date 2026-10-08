import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { FORGE_GUARANTEE_ROBUX, FORGE_SLOTS, FORGE_TIERS } from '../data/forge.js'
import { RARITY_BG } from '../data/eggs.js'
import { canPlace, closeForgeMenu, forge, forgeChance, MAX_TIER, placePet, removePet } from '../systems/forge.js'
import { petInfo, petPower, petTier, sortedPets } from '../systems/pets.js'
import { playButtonClick } from '../systems/sfx.js'
import { grad, T, Icon, stop, Btn, Emoji } from './hudParts.jsx'

// Forge window, opened by hold-E at the lava pool (systems/forge.js): your pets on
// the left (click to place one), the three fuse slots, the success chance and the
// tier bonuses on the right. Chance = filled slots / 3; Guarantee costs Robux.

const click = (fn) => () => {
  playButtonClick()
  fn()
}
const tierLabel = (t) => FORGE_TIERS[t].name

function PetCard({ pet, onClick, dim }) {
  const info = petInfo(pet)
  if (!info) return null
  const tier = petTier(pet)
  return (
    <div
      className={`pet-card${dim ? ' dim' : ''}`}
      style={{ '--bg': RARITY_BG[info.rarity] }}
      title={`${tier ? `${tierLabel(tier)} ` : ''}${info.name}`}
      onClick={onClick}
    >
      <Emoji size={64}>{info.emoji}</Emoji>
      {tier > 0 && <T size={18} w={3} fill={grad(FORGE_TIERS[tier].color)} className="pet-card-tier">{tierLabel(tier)}</T>}
      <T size={20} w={3} className="pet-card-power">{`+${Math.round(petPower(pet) * 100)}%`}</T>
    </div>
  )
}

export default function ForgeMenu() {
  const open = useGameStore((s) => s.forgeMenu)
  const slots = useGameStore((s) => s.forgeSlots)
  const result = useGameStore((s) => s.forgeResult)
  const pets = usePlayerData((s) => s.pets)
  const robux = usePlayerData((s) => s.robux)
  if (!open) return null

  const byId = new Map(pets.map((p) => [p.id, p]))
  const placed = slots.map((id) => byId.get(id)).filter(Boolean)
  const pct = Math.round(forgeChance(placed.length) * 100)
  const nextTier = placed.length ? petTier(placed[0]) + 1 : 1
  const listed = sortedPets(pets).filter((p) => !slots.includes(p.id))

  return (
    <div className="hud-window forge-window" onPointerDown={stop}>
      <div className="hud-window-title" style={{ '--bg': '#e8741c' }}>
        <Emoji size={44}>🔨</Emoji>
        <T size={46} w={5}>Forge</T>
      </div>
      <button type="button" className="egg-close" aria-label="Close" onPointerDown={stop} onClick={click(closeForgeMenu)} />

      <div className="forge-body">
        <div className="pet-grid forge-pets">
          {pets.length === 0 && <T size={28} w={4} fill={grad('#d8dcf0', '#aab0cc')} className="pet-empty">No pets yet. Hatch an egg!</T>}
          {listed.map((p) => {
            const ok = canPlace(p, slots)
            return <PetCard key={p.id} pet={p} dim={!ok} onClick={click(() => ok && placePet(p.id))} />
          })}
        </div>

        <div className="forge-side">
          <div className="forge-slots">
            {Array.from({ length: FORGE_SLOTS }, (_, i) => {
              const pet = placed[i]
              return (
                <div key={i} className="forge-slot" onClick={pet ? click(() => removePet(pet.id)) : undefined}>
                  {pet && <PetCard pet={pet} />}
                </div>
              )
            })}
          </div>

          <div className="forge-chance">
            <div className="forge-chance-fill" style={{ width: `${pct}%` }} />
            <T size={40} w={5} className="forge-chance-text">{`${pct}% Chance`}</T>
          </div>

          <div className="forge-tiers">
            {FORGE_TIERS.slice(1).map((t, i) => (
              <T key={t.name} size={28} w={4} fill={grad(t.color)} stroke="#15151a" className={nextTier === i + 1 && placed.length ? 'on' : undefined}>
                {`${t.name}: +${Math.round(t.bonus * 100)}% Strength`}
              </T>
            ))}
          </div>

          {result && <T size={32} w={4} fill={grad(result.color)} className="forge-result">{result.text}</T>}

          <Btn className="forge-btn" style={{ '--bg': robux >= FORGE_GUARANTEE_ROBUX ? '#ffc21a' : '#a08a5a' }} onClick={click(() => forge(true))}>
            <T size={38} w={5}>Guarantee</T>
            <span className="forge-cost"><Icon name="robux" size={26} /><T size={26} w={4}>{FORGE_GUARANTEE_ROBUX}</T></span>
          </Btn>
          <Btn className="forge-btn" style={{ '--bg': placed.length && petTier(placed[0]) < MAX_TIER ? '#e8741c' : '#8a6a52' }} onClick={click(() => forge(false))}>
            <T size={46} w={5}>Forge</T>
          </Btn>
        </div>
      </div>
    </div>
  )
}
