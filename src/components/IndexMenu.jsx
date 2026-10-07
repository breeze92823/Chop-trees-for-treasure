import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { EGG_SHOP, RARITY_BG } from '../data/eggs.js'
import { petKey } from '../systems/pets.js'
import { playButtonClick } from '../systems/sfx.js'
import { grad, T, stop, Emoji } from './hudParts.jsx'

// Pet Index (the HUD's Index tile): every pet of every egg, revealed once
// it has been hatched at least once (usePlayerData `discovered`).

const close = () => {
  playButtonClick()
  useGameStore.setState({ indexMenu: false })
}

const ALL = Object.entries(EGG_SHOP).flatMap(([egg, e]) => e.pets.map((p) => ({ ...p, egg })))

export default function IndexMenu() {
  const open = useGameStore((s) => s.indexMenu)
  const hatching = useGameStore((s) => s.hatch !== null)
  const discovered = usePlayerData((s) => s.discovered)
  if (!open || hatching) return null

  const found = new Set(discovered)
  const count = ALL.filter((p) => found.has(petKey(p))).length
  return (
    <div className="hud-window" onPointerDown={stop}>
      <div className="hud-window-title" style={{ '--bg': '#a066f2' }}>
        <Emoji size={44}>📗</Emoji>
        <T size={46} w={5}>Index</T>
      </div>
      <button type="button" className="egg-close" aria-label="Close" onPointerDown={stop} onClick={close} />
      <div className="hud-window-bar">
        <T size={26} w={3}>{`Discovered ${count}/${ALL.length}`}</T>
      </div>
      <div className="index-list">
        {Object.entries(EGG_SHOP).map(([egg, e]) => (
          <section key={egg}>
            <T size={30} w={4} fill={grad('#fff3a0', '#ffb21f')} stroke="#4a2a00">{e.name}</T>
            <div className="pet-grid inline">
              {e.pets.map((p) => {
                const seen = found.has(petKey({ egg, name: p.name }))
                return (
                  <div key={p.id} className={`pet-card${seen ? '' : ' unknown'}`} style={{ '--bg': RARITY_BG[p.rarity] }} title={seen ? p.name : '???'}>
                    {seen ? <Emoji size={64}>{p.emoji}</Emoji> : <T size={56} w={4}>?</T>}
                    <T size={18} w={3} className="pet-card-power">{seen ? p.name : '???'}</T>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
