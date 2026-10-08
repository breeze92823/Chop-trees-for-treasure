// Egg hatching: pay, roll the egg's odds, add the pets, and hand the result to
// the hatch animation (components/HatchOverlay.jsx) via useGameStore's
// `hatch`. The overlay calls finishHatch() when it's done, which re-rolls
// straight away while Auto is on. Also sells the window's Robux boosts.
import { ANNOUNCE_RARITIES, EGG_BOOSTS, EGG_SHOP, LUCK, PET_INVENTORY_MAX } from '../data/eggs.js'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { showActionResult } from './actionResult.js'
import { petInfo, petKey, petSlots } from './pets.js'
import { eggLuckBonus } from './upgrades.js'
import { announceHatch, friendInServer } from './net.js'
import { formatNumber } from '../utils/format.js'

const CURRENCY_NAME = { wood: 'Wood', robux: 'Robux' }
const AUTO_DELAY_MS = 350

export const isLuckActive = (state = usePlayerData.getState()) => state.luckUntil > Date.now()

// The egg's pets with the odds actually rolled right now (Luck! and the
// friends bonus applied), as percentages summing to 100.
export function currentOdds(kind, luck = isLuckActive()) {
  const pets = EGG_SHOP[kind]?.pets ?? []
  const factor = (luck ? LUCK.factor : 1) * (friendInServer() ? LUCK.friends : 1)
  const weights = pets.map((p) => p.chance * (LUCK.rarities.includes(p.rarity) ? factor : 1))
  const total = weights.reduce((a, b) => a + b, 0) || 1
  const odds = pets.map((p, i) => ({ ...p, chance: (weights[i] / total) * 100 }))
  // Egg Luck upgrade: Legendary pets gain points, everything else shrinks to make room.
  const legendary = odds.filter((p) => p.rarity === 'Legendary')
  const have = legendary.reduce((a, p) => a + p.chance, 0)
  const extra = legendary.length ? Math.min(eggLuckBonus(), 100 - have - 0.001) : 0
  if (extra <= 0) return odds
  const squeeze = (100 - have - extra) / (100 - have)
  return odds.map((p) => ({ ...p, chance: p.rarity === 'Legendary' ? p.chance + (extra * p.chance) / have : p.chance * squeeze }))
}

function roll(odds) {
  let r = Math.random() * 100
  return odds.find((p) => (r -= p.chance) < 0) ?? odds[odds.length - 1]
}

let lastCount = 1

// Returns true if the hatch went ahead.
export function tryHatch(kind, count = 1) {
  const egg = EGG_SHOP[kind]
  if (!egg || useGameStore.getState().hatch) return false
  const s = usePlayerData.getState()
  if (s.pets.length + count > PET_INVENTORY_MAX) {
    showActionResult('Pet inventory full! Delete some pets.', false)
    return false
  }
  const price = egg.cost * count
  if (s[egg.currency] < price) {
    showActionResult(`Not enough ${CURRENCY_NAME[egg.currency]}! Need ${formatNumber(price)}`, false)
    return false
  }

  const odds = currentOdds(kind)
  let nextPetId = s.nextPetId
  const hatched = Array.from({ length: count }, () => ({ id: nextPetId++, egg: kind, name: roll(odds).name }))
  // Fill any free equip slots with the new pets.
  const free = Math.max(0, petSlots(s) - s.equipped.length)
  // Index: flag first-ever hatches so the reveal can show NEW!
  const discovered = new Set(s.discovered)
  const fresh = hatched.map((p) => !discovered.has(petKey(p)) && discovered.add(petKey(p)))
  usePlayerData.setState({
    [egg.currency]: s[egg.currency] - price,
    pets: [...s.pets, ...hatched],
    equipped: [...s.equipped, ...hatched.slice(0, free).map((p) => p.id)],
    discovered: [...discovered],
    nextPetId,
  })

  const rare = hatched.map(petInfo).filter((p) => p && ANNOUNCE_RARITIES.includes(p.rarity))
  if (rare.length) announceHatch(rare.map((p) => p.id))

  lastCount = count
  useGameStore.setState((g) => ({
    hatch: { egg: kind, pets: hatched.map((p, i) => ({ ...p, isNew: fresh[i] })), id: (g.hatch?.id ?? 0) + 1 },
  }))
  return true
}

export function finishHatch() {
  const { hatch, autoHatch, eggMenu } = useGameStore.getState()
  useGameStore.setState({ hatch: null })
  if (!hatch || !autoHatch) return
  setTimeout(() => {
    const g = useGameStore.getState()
    if (!g.autoHatch || g.eggMenu !== hatch.egg) return
    if (!tryHatch(hatch.egg, lastCount)) useGameStore.setState({ autoHatch: false })
  }, AUTO_DELAY_MS)
}

export function toggleAutoHatch(kind) {
  const on = !useGameStore.getState().autoHatch
  useGameStore.setState({ autoHatch: on })
  if (on && !tryHatch(kind, lastCount)) useGameStore.setState({ autoHatch: false })
}

export function buyBoost(id) {
  const boost = EGG_BOOSTS.find((b) => b.id === id)
  const s = usePlayerData.getState()
  if (!boost) return
  if (id !== 'luck' && s.passes[id]) {
    showActionResult(`You already own ${boost.label}`, false)
    return
  }
  if (s.robux < boost.price) {
    showActionResult(`Not enough Robux! Need ${boost.price}`, false)
    return
  }
  const update = { robux: s.robux - boost.price }
  if (id === 'luck') update.luckUntil = Math.max(Date.now(), s.luckUntil) + LUCK.minutes * 60_000
  else update.passes = { ...s.passes, [id]: true }
  usePlayerData.setState(update)
  showActionResult(id === 'luck' ? `Luck x${LUCK.factor} for ${LUCK.minutes} minutes!` : `Bought ${boost.label}`, true)
}
