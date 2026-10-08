import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { REBIRTH } from '../data/economy.js'
import { cashMultiplier, rebirthLevel, rebirthProgress, skipRebirth, strengthMultiplier, tryRebirth } from '../systems/rebirth.js'
import { playButtonClick } from '../systems/sfx.js'
import { grad, T, Icon, stop, Btn, Emoji } from './hudParts.jsx'
import { CashIcon, RebirthIcon } from './hudIcons.jsx'

// Rebirth window (the HUD's Rebirth tile): what the next rebirth turns the
// Strength / cash multipliers and level into, progress toward the level it
// needs, and Rebirth / Skip (Robux). Logic in systems/rebirth.js.

const ROBLUX_CASH = import.meta.env.VITE_ROBLUXCASH === 'true'

const close = () => {
  playButtonClick()
  useGameStore.setState({ rebirthMenu: false })
}
const click = (fn) => () => {
  playButtonClick()
  fn()
}

const mult = (n) => `x${n.toFixed(1)}`

// White double chevron between the "now" and "after" columns.
function Arrow() {
  return (
    <svg className="rebirth-arrow" viewBox="0 0 64 48">
      <path d="M4 6 L30 24 L4 42 Z M30 6 L56 24 L30 42 Z" fill="#9fd8ff" transform="translate(4 3)" />
      <path d="M4 6 L30 24 L4 42 Z M30 6 L56 24 L30 42 Z" fill="#fff" stroke="#e6f4ff" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}

function Cell({ bg, icon, text }) {
  return (
    <div className="rebirth-cell" style={{ '--bg': bg }}>
      {icon}
      <T size={54} w={5}>{text}</T>
    </div>
  )
}

function Row({ bg, icon, now, next }) {
  return (
    <>
      <Cell bg={bg} icon={icon} text={now} />
      <Arrow />
      <Cell bg={bg} icon={icon} text={next} />
    </>
  )
}

export default function RebirthMenu() {
  const open = useGameStore((s) => s.rebirthMenu)
  const hatching = useGameStore((s) => s.hatch !== null)
  const rebirths = usePlayerData((st) => st.rebirths)
  const level = usePlayerData((st) => st.level)
  if (!open || hatching) return null

  const s = { rebirths, level }
  const need = rebirthLevel(s)
  return (
    <div className="rebirth-menu" onPointerDown={stop}>
      <div className="rebirth-title">
        <span className="rebirth-title-icon"><RebirthIcon size={124} /></span>
        <T size={54} w={5}>Rebirth</T>
      </div>
      <button type="button" className="egg-close" aria-label="Close" onPointerDown={stop} onClick={close} />

      <div className="rebirth-grid">
        <Row bg="#f08a2a" icon={<Emoji size={58}>💪</Emoji>} now={mult(strengthMultiplier(s))} next={mult(strengthMultiplier(s, s.rebirths + 1))} />
        <Row bg="#46cf3a" icon={<CashIcon size={70} />} now={mult(cashMultiplier(s))} next={mult(cashMultiplier(s, s.rebirths + 1))} />
        <Row bg="#3aaef0" icon={<Emoji size={56}>📊</Emoji>} now={`Lvl. ${need}`} next="Lvl. 1" />
      </div>

      <div className="rebirth-bar">
        <div className="rebirth-bar-fill" style={{ width: `${rebirthProgress(s) * 100}%` }} />
        <T size={32} w={4}>{`Lvl. ${Math.min(s.level, need)} / ${need}`}</T>
      </div>

      <div className="rebirth-actions">
        <Btn className="rebirth-btn" style={{ '--bg': '#2fa83a' }} onClick={click(tryRebirth)}>
          <T size={40} w={5}>Rebirth</T>
        </Btn>
        {ROBLUX_CASH && (
          <Btn className="rebirth-btn" style={{ '--bg': '#4ab8ff' }} onClick={click(skipRebirth)}>
            <T size={40} w={5}>Skip</T>
            <span className="rebirth-skip-price">
              <Icon name="robux" size={30} />
              <T size={28} w={4}>{REBIRTH.skipRobux}</T>
            </span>
          </Btn>
        )}
      </div>

      <div className="rebirth-warn">
        <Emoji size={36}>⚠️</Emoji>
        <T size={34} w={4} fill={grad('#ff6a5a', '#e8243a')} stroke="#2a0a0a">Rebirthing resets Strength!</T>
        <Emoji size={36}>⚠️</Emoji>
      </div>
    </div>
  )
}
