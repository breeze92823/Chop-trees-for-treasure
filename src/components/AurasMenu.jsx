import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { AURA } from '../data/economy.js'
import { AURAS, AURA_PITY } from '../data/auras.js'
import { RARITY } from '../data/loot.js'
import { useRemoteStore } from '../store/useRemoteStore.js'
import { AUTO_STOP_STEPS, auraInfo, buyLuckyRoll, closeAurasMenu, equipAura, spin } from '../systems/auras.js'
import { friendInServer } from '../systems/net.js'
import { playButtonClick } from '../systems/sfx.js'
import { formatNumber } from '../utils/format.js'
import { RAINBOW, grad, T, Icon, stop, Btn, Emoji } from './hudParts.jsx'
import { CashIcon } from './hudIcons.jsx'

// Auras window, opened by hold-E at the Auras stall (systems/auras.js): the
// equipped aura, Auto Spin / Spin / Lucky Roll, and the Mythic / Secret pity
// counters. Layout is in reference pixels (gameHud.css).

const click = (fn) => () => {
  playButtonClick()
  fn()
}

const setIndex = (aurasIndex) => useGameStore.setState({ aurasIndex })
const setOwned = (aurasOwned) => useGameStore.setState({ aurasOwned })
const pct = (n) => `${+n.toFixed(1)}%`

// Auras Index page (the "i" button): every aura's chance and ability.
function AurasIndex() {
  const owned = usePlayerData((s) => s.auras)
  return (
    <>
      <div className="auras-title wide">
        <span className="auras-title-icon"><Emoji size={92}>👤</Emoji></span>
        <T size={62} w={6}>Auras Index</T>
      </div>
      <button type="button" className="egg-close" aria-label="Back" onPointerDown={stop} onClick={click(() => setIndex(false))} />
      <T size={36} w={4} className="aix-h aix-aura">AURA</T>
      <T size={36} w={4} className="aix-h aix-chance">CHANCE</T>
      <T size={36} w={4} className="aix-h aix-ability">ABILITY</T>
      <div className="aix-list" onWheel={stop}>
        {AURAS.map((a) => (
          <div key={a.id} className={`aix-row${owned.includes(a.id) ? ' owned' : ' locked'}`}>
            {owned.includes(a.id) && <span className="aix-check">✔</span>}
            <T size={64} w={5} fill={a.color === 'rainbow' ? RAINBOW : grad(a.color)} className="aix-name">{a.name}</T>
            <T size={64} w={5} fill={grad('#ffd24a', '#f0a41c')} stroke="#3a2406" className="aix-pct">{pct(a.weight || 0)}</T>
            <div className="aix-ability-col">
              <T size={44} w={5} fill={grad('#ff6a6a', '#e8303a')} stroke="#2a0a0a">{`x${a.mult} Strength`}</T>
              <T size={44} w={5} fill={grad('#a8ff7a', '#3fcf3a')} stroke="#0c3a10">{`+${a.speed}% Run Speed`}</T>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// "My Auras" page (the bag button): every aura you own, click one to equip it.
function AurasOwned() {
  const owned = usePlayerData((s) => s.auras)
  const equipped = usePlayerData((s) => s.aura)
  const list = AURAS.filter((a) => owned.includes(a.id))
  return (
    <>
      <div className="auras-title wide">
        <span className="auras-title-icon"><Emoji size={92}>🎒</Emoji></span>
        <T size={62} w={6}>My Auras</T>
      </div>
      <button type="button" className="egg-close" aria-label="Back" onPointerDown={stop} onClick={click(() => setOwned(false))} />
      <T size={32} w={4} className="aix-h aix-aura">{`${list.length}/${AURAS.length} COLLECTED`}</T>
      <div className="aix-list" onWheel={stop}>
        {list.length === 0 && <T size={44} w={5} fill={grad('#d8dcf0', '#aab0cc')} className="auras-owned-empty">No auras yet. Spin!</T>}
        {list.map((a) => {
          const on = equipped === a.id
          return (
            <div key={a.id} className="aix-row">
              <span className="auras-owned-emoji"><Emoji size={72}>{a.emoji}</Emoji></span>
              <T size={60} w={5} fill={a.color === 'rainbow' ? RAINBOW : grad(a.color)} className="auras-owned-name">{a.name}</T>
              <div className="auras-owned-stats">
                <T size={34} w={5} fill={grad('#ff6a6a', '#e8303a')} stroke="#2a0a0a">{`x${a.mult} Strength`}</T>
                <T size={34} w={5} fill={grad('#a8ff7a', '#3fcf3a')} stroke="#0c3a10">{`+${a.speed}% Run Speed`}</T>
              </div>
              <Btn className="auras-owned-btn" style={{ '--bg': on ? '#e8303a' : '#46cf3a' }} onClick={click(() => equipAura(on ? null : a.id))}>
                <T size={34} w={6}>{on ? 'UNEQUIP' : 'EQUIP'}</T>
              </Btn>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default function AurasMenu() {
  const open = useGameStore((s) => s.aurasMenu)
  const index = useGameStore((s) => s.aurasIndex)
  const auto = useGameStore((s) => s.autoSpin)
  const hatching = useGameStore((s) => s.hatch !== null)
  const equipped = usePlayerData((s) => s.aura)
  const lucky = usePlayerData((s) => s.luckyRolls)
  const pity = usePlayerData((s) => s.pity)
  const ownedPage = useGameStore((s) => s.aurasOwned)
  const autoStop = useGameStore((s) => s.autoStop)
  const friends = useRemoteStore((s) => s.ids.length > 0) && friendInServer()
  if (!open || hatching) return null

  if (ownedPage) return <div className="auras-menu" onPointerDown={stop}><AurasOwned /></div>
  if (index) return <div className="auras-menu" onPointerDown={stop}><AurasIndex /></div>

  const aura = auraInfo(equipped)
  return (
    <div className="auras-menu" onPointerDown={stop}>
      <div className="auras-title">
        <span className="auras-title-icon"><Emoji size={92}>{aura?.emoji ?? '👤'}</Emoji></span>
        <T size={62} w={6}>Auras</T>
      </div>
      <button type="button" className="egg-close" aria-label="Close" onPointerDown={stop} onClick={click(closeAurasMenu)} />

      <div className="auras-info">
        <button type="button" className="auras-i" aria-label="Auras Index" onPointerDown={stop} onClick={click(() => setIndex(true))}>i</button>
        <button type="button" className="auras-i auras-bag" aria-label="My Auras" onPointerDown={stop} onClick={click(() => setOwned(true))}>
          <Emoji size={40}>🎒</Emoji>
        </button>
        {friends
          ? <T size={28} w={3} fill={grad('#c6ff9a', '#3fcf3a')} stroke="#0c3a10" className="auras-hint">Boosted Odds for Playing with Friends!</T>
          : <T size={28} w={3} className="auras-hint">Play with friends to boost odds!</T>}
        <Btn className="auras-stop" style={{ '--bg': autoStop ? '#8a4ff0' : '#5a5d68' }} onClick={click(() => useGameStore.setState({ autoStop: AUTO_STOP_STEPS[(AUTO_STOP_STEPS.indexOf(autoStop) + 1) % AUTO_STOP_STEPS.length] }))}>
          <T size={26} w={4}>{autoStop ? `AUTO STOPS AT ${autoStop.toUpperCase()}+` : 'AUTO NEVER STOPS'}</T>
        </Btn>
        {aura ? (
          <div className="auras-equipped">
            <Emoji size={84}>{aura.emoji}</Emoji>
            <T size={64} w={6} fill={grad('#ffffff', RARITY[aura.rarity].glow)}>{aura.name}</T>
            <T size={34} w={4} fill={grad('#fff6dc', '#ffd77a')} stroke="#3a2406">{`x${aura.mult} Strength`}</T>
          </div>
        ) : (
          <T size={72} w={6} fill={grad('#ff5a9a', '#9a5af0')} className="auras-none">No Aura Equipped</T>
        )}
      </div>

      <T size={38} w={4} className="auras-l auras-l-auto">AUTO SPIN</T>
      <span className="auras-l auras-l-cost">
        <CashIcon size={42} />
        <T size={38} w={4}>{formatNumber(AURA.spinCost)}</T>
      </span>
      <span className="auras-l auras-l-have">
        <button type="button" className="auras-buy" aria-label={`Buy a Lucky Roll for ${AURA.luckyRollRobux} Robux`} title={`+1 Lucky Roll: ${AURA.luckyRollRobux} Robux`} onPointerDown={stop} onClick={click(buyLuckyRoll)}>
          <Icon name="robux" size={26} />
          <T size={22} w={4}>{`+${AURA.luckyRollRobux}`}</T>
        </button>
        <T size={38} w={4} fill={grad('#c6ff9a', '#3fcf3a')}>{`YOU HAVE ${lucky}`}</T>
      </span>

      <Btn className="auras-btn auras-auto" style={{ '--bg': auto ? '#46cf3a' : '#e8303a' }} onClick={click(() => useGameStore.setState({ autoSpin: !auto }))}>
        <T size={56} w={6}>{auto ? 'ON' : 'OFF'}</T>
      </Btn>
      <Btn className="auras-btn auras-spin" style={{ '--bg': '#46cf3a' }} onClick={click(() => spin())}>
        <T size={56} w={6}>SPIN</T>
      </Btn>
      <Btn className="auras-btn auras-lucky" style={{ '--bg': '#8a4ff0' }} onClick={click(() => spin(true))}>
        <T size={48} w={6}>LUCKY ROLL</T>
      </Btn>

      <div className="auras-pity" style={{ top: 'calc(517 * var(--s))' }}>
        <T size={40} w={4}>MYTHIC PITY</T>
        <T size={40} w={4}>{`${pity.Mythic}/${AURA_PITY.Mythic}`}</T>
      </div>
      <div className="auras-pity" style={{ top: 'calc(591 * var(--s))' }}>
        <T size={40} w={4}>SECRET PITY</T>
        <T size={40} w={4}>{`${pity.Secret}/${AURA_PITY.Secret}`}</T>
      </div>
    </div>
  )
}
