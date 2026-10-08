import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { UPGRADES, upgradeCash, upgradeGems } from '../data/upgrades.js'
import { buyUpgrade, closeUpgradesMenu } from '../systems/upgrades.js'
import { playButtonClick } from '../systems/sfx.js'
import { formatNumber } from '../utils/format.js'
import { T, Icon, stop, Btn, Emoji } from './hudParts.jsx'

// Upgrades window, opened by hold-E at the Upgrades stall (systems/upgrades.js):
// one purple row per upgrade from data/upgrades.js — name, level, effect per level —
// with a cash price (green when affordable, grey when not) and a Robux price.
// Reuses the Sell window frame; layout in reference pixels (gameHud.css).

const click = (fn) => () => {
  playButtonClick()
  fn()
}

function Row({ u, level, cash, robux }) {
  const maxed = level >= u.max
  const cashPrice = upgradeCash(u, level)
  const gemPrice = upgradeGems(u, level)
  return (
    <div className="upgrade-row">
      <span className="upgrade-icon"><Emoji size={110}>{u.emoji}</Emoji></span>
      <T size={58} w={5} className="upgrade-name">{u.name}</T>
      <T size={38} w={4} className="upgrade-level">{`Level ${level} / ${u.max}`}</T>
      <T size={u.info.length > 20 ? 32 : 50} w={5} className="upgrade-info">{u.info}</T>
      <div className="upgrade-btns">
        {maxed ? (
          <Btn className="upgrade-btn big static" style={{ '--bg': '#ffb21f' }}>
            <T size={46} w={5}>MAX</T>
          </Btn>
        ) : (
          <>
            <Btn className="upgrade-btn" style={{ '--bg': cash >= cashPrice ? '#2fa83a' : '#7a8094' }} onClick={click(() => buyUpgrade(u.id, 'cash'))}>
              <T size={34} w={4}>{`$${formatNumber(cashPrice)}`}</T>
            </Btn>
            <Btn className="upgrade-btn" style={{ '--bg': robux >= gemPrice ? '#ffb21f' : '#a08a5a' }} onClick={click(() => buyUpgrade(u.id, 'gems'))}>
              <span className="upgrade-gem">
                <Icon name="robux" size={34} />
                <T size={34} w={4}>{gemPrice}</T>
              </span>
            </Btn>
          </>
        )}
      </div>
    </div>
  )
}

export default function UpgradesMenu() {
  const open = useGameStore((s) => s.upgradesMenu)
  const hatching = useGameStore((s) => s.hatch !== null)
  const levels = usePlayerData((s) => s.upgrades)
  const cash = usePlayerData((s) => s.cash)
  const robux = usePlayerData((s) => s.robux)
  if (!open || hatching) return null

  return (
    <div className="sell-menu upgrades-menu" onPointerDown={stop} onWheel={stop}>
      <div className="sell-title upgrades-title">
        <span className="upgrade-title-icon"><Emoji size={110}>⬆️</Emoji></span>
        <T size={62} w={6}>Upgrades</T>
      </div>
      <button type="button" className="egg-close" aria-label="Close" onPointerDown={stop} onClick={click(closeUpgradesMenu)} />
      <div className="chopper-list">
        {UPGRADES.map((u) => <Row key={u.id} u={u} level={levels?.[u.id] ?? 0} cash={cash} robux={robux} />)}
      </div>
    </div>
  )
}
