import { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { CURRENCY_ICON, EGG_BOOSTS, EGG_SHOP, LUCK, RARITY_BG } from '../data/eggs.js'
import { closeEggMenu } from '../systems/eggs.js'
import { buyBoost, currentOdds, toggleAutoHatch, tryHatch } from '../systems/hatch.js'
import { playButtonClick } from '../systems/sfx.js'
import { formatNumber } from '../utils/format.js'
import { RAINBOW, grad, T, Icon, stop, Btn, Emoji } from './hudParts.jsx'

// Hatch window for the egg the player confirmed with E (systems/eggs.js):
// Robux boosts on the left, the egg's live odds (Luck! applied), and the
// open buttons. Hidden while the hatch animation plays over it.

const pct = (n) => `${Number.isInteger(n) || n >= 10 ? Math.round(n) : +n.toFixed(1)}%`
const clock = (ms) => `${Math.floor(ms / 60_000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`

// Re-render once a second while `active` (the Luck! countdown).
function useNow(active) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  return now
}

function Boost({ id, label, icon, emoji, price, bg, owned, timeLeft }) {
  return (
    <Btn className={`egg-boost${owned ? ' owned' : ''}`} style={{ '--bg': bg }} onClick={() => { playButtonClick(); buyBoost(id) }}>
      <span className="egg-boost-price">
        {owned
          ? <T size={26} w={3} fill={grad('#c6ff9a', '#3fcf3a')}>OWNED</T>
          : <><Icon name="robux" size={26} /><T size={26} w={3}>{price}</T></>}
      </span>
      {icon ? <Icon name={icon} size={60} /> : <Emoji size={52}>{emoji}</Emoji>}
      <T size={label.length > 6 ? 30 : 34} w={4}>{timeLeft ? clock(timeLeft) : label}</T>
    </Btn>
  )
}

function PetTile({ name, emoji, chance, rarity, tag, lucky }) {
  return (
    <div className="egg-pet" style={{ '--bg': RARITY_BG[rarity] }} title={name}>
      {tag && <T size={26} w={4} fill={RAINBOW} className="egg-pet-tag">{tag}</T>}
      <Emoji size={96}>{emoji}</Emoji>
      {lucky && <T size={22} w={3} fill={grad('#c6ff9a', '#3fcf3a')} className="egg-pet-luck">{`x${LUCK.factor} LUCK`}</T>}
      <T size={36} w={4} fill={rarity === 'legendary' ? RAINBOW : undefined} className="egg-pet-chance">{pct(chance)}</T>
    </div>
  )
}

export default function EggMenu() {
  const kind = useGameStore((s) => s.eggMenu)
  const hatching = useGameStore((s) => s.hatch !== null)
  const auto = useGameStore((s) => s.autoHatch)
  const balance = usePlayerData((s) => (kind && EGG_SHOP[kind] ? s[EGG_SHOP[kind].currency] : 0))
  const passes = usePlayerData((s) => s.passes)
  const luckUntil = usePlayerData((s) => s.luckUntil)
  const now = useNow(luckUntil > Date.now())
  const egg = kind && EGG_SHOP[kind]
  if (!egg || hatching) return null

  const luckLeft = Math.max(0, luckUntil - now)
  const odds = currentOdds(kind, luckLeft > 0)
  const icon = CURRENCY_ICON[egg.currency]
  const priceFill = egg.currency === 'wood' ? { fill: grad('#ffe0b0', '#e8a868'), stroke: '#3a1a08' } : {}
  const click = (fn) => () => { playButtonClick(); fn() }

  return (
    <div className="egg-menu" onPointerDown={stop}>
      <div className="egg-panel">
        <div className="egg-title">
          <span className="egg-art" style={{ '--egg-a': egg.colors[0], '--egg-b': egg.colors[1] }} />
          <T size={50} w={5}>{egg.name}</T>
        </div>
        <button type="button" className="egg-close" aria-label="Close" onPointerDown={stop} onClick={click(closeEggMenu)} />
        <div className="egg-price">
          <Icon name={icon} size={56} />
          <T size={egg.currency === 'wood' ? 46 : 52} w={5} {...priceFill}>{formatNumber(egg.cost)}</T>
        </div>
        <div className="egg-balance">
          <T size={22} w={3} fill={grad('#d8dcf0', '#aab0cc')}>You have</T>
          <Icon name={icon} size={24} />
          <T size={22} w={3} fill={balance >= egg.cost ? grad('#c6ff9a', '#3fcf3a') : grad('#ffb0b0', '#ff4a4a')}>{formatNumber(balance)}</T>
        </div>

        <div className="egg-boosts">
          {EGG_BOOSTS.map((b) => (
            <Boost key={b.id} {...b} owned={b.id !== 'luck' && passes[b.id]} timeLeft={b.id === 'luck' ? luckLeft : 0} />
          ))}
        </div>

        {/* A single row of up to three pets sits mid-panel, like the reference. */}
        <div className={`egg-pets${egg.pets.length <= 3 ? ' few' : ''}`}>
          {odds.map((p) => <PetTile key={p.name} {...p} lucky={luckLeft > 0 && LUCK.rarities.includes(p.rarity)} />)}
        </div>

        <div className="egg-actions">
          <Btn className="egg-open" style={{ '--bg': '#3a8ef0' }} onClick={click(() => tryHatch(kind, 1))}><T size={42} w={5}>Open 1</T></Btn>
          <Btn className="egg-open" style={{ '--bg': '#e8303a' }} onClick={click(() => tryHatch(kind, 3))}><T size={42} w={5}>Open 3</T></Btn>
          <Btn className={`egg-open${auto ? ' on' : ''}`} style={{ '--bg': auto ? '#46cf3a' : '#7a8094' }} onClick={click(() => toggleAutoHatch(kind))}>
            <T size={auto ? 34 : 42} w={5}>{auto ? 'Auto: ON' : 'Auto'}</T>
          </Btn>
        </div>
      </div>
      <T size={42} w={5} className="egg-hint">Boosted Odds for Playing with Friends!</T>
    </div>
  )
}
