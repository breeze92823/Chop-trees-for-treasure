// Auras stall: hold E next to it to open the window (components/AurasMenu.jsx,
// useGameStore aurasMenu); walking away closes it. Spin pays AURA.spinCost cash
// for a random aura (weights in data/auras.js, Mythic / Secret pity). The
// equipped aura multiplies Strength gain (auraMultiplier, used by strengthGain.js).
import { STALLS } from '../world/layout.js'
import { AURA } from '../data/economy.js'
import { AURAS, AURA_PITY } from '../data/auras.js'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from './playerState.js'
import { addSystem } from './loop.js'
import { clearInteractTarget, setInteractTarget } from './interact.js'
import { showActionResult } from './actionResult.js'
import { playLevelUp } from './sfx.js'
import { formatNumber } from '../utils/format.js'
import { PHYSICS } from '../data/config.js'
import { RARITIES } from '../data/loot.js'
import { friendInServer } from './net.js'
import { moveBonus } from './upgrades.js'

const stall = STALLS.find((s) => s.id === 'auras')
const KEY = 'auras:stall'

export const auraInfo = (id) => AURAS.find((a) => a.id === id)

export function auraMultiplier(state = usePlayerData.getState()) {
  return auraInfo(state.aura)?.mult ?? 1
}

export function openAurasMenu() {
  useGameStore.setState({ aurasMenu: true, artifactsMenu: false, upgradesMenu: false, choppersMenu: false, aurasIndex: false, aurasOwned: false, petsMenu: false, indexMenu: false, rebirthMenu: false, questsMenu: false, sellMenu: false, eggMenu: null, autoHatch: false, forgeMenu: false })
}

export function closeAurasMenu() {
  useGameStore.setState({ aurasMenu: false, aurasIndex: false, aurasOwned: false, autoSpin: false })
}

function roll(s, lucky) {
  // Pity: a tier that has gone its full count is guaranteed.
  for (const tier of ['Secret', 'Mythic']) {
    if (s.pity[tier] + 1 >= AURA_PITY[tier]) return AURAS.find((a) => a.rarity === tier)
  }
  const pool = AURAS.filter((a) => a.weight > 0 && (!lucky || a.mult >= 1.5))
  const w = (a) => a.weight * (friends && a.mult >= 1.85 ? AURA.friendLuck : 1)
  const friends = friendInServer()
  let r = Math.random() * pool.reduce((n, a) => n + w(a), 0)
  for (const a of pool) if ((r -= w(a)) < 0) return a
  return pool[0]
}

// Equip an owned aura, or null to take it off.
export function equipAura(id) {
  const s = usePlayerData.getState()
  if (id !== null && !s.auras.includes(id)) return
  usePlayerData.setState({ aura: id })
}

// Buy one Lucky Roll with cash.
export function buyLuckyRoll() {
  const s = usePlayerData.getState()
  if (s.cash < AURA.luckyRollCash) {
    showActionResult(`Not enough cash! Need $${formatNumber(AURA.luckyRollCash)}`, false)
    return false
  }
  usePlayerData.setState({ cash: s.cash - AURA.luckyRollCash, luckyRolls: s.luckyRolls + 1 })
  showActionResult('+1 Lucky Roll', true)
  return true
}

export const AUTO_STOP_STEPS = [null, 'Epic', 'Legendary', 'Mythic', 'Secret']

// Returns the aura won, or null when the spin could not run (so Auto Spin stops).
export function spin(lucky = false) {
  const s = usePlayerData.getState()
  if (lucky ? s.luckyRolls < 1 : s.cash < AURA.spinCost) {
    showActionResult(lucky ? 'No Lucky Rolls left!' : `Not enough cash! Need $${formatNumber(AURA.spinCost)}`, false)
    return null
  }
  const won = roll(s, lucky)
  const pity = { ...s.pity }
  for (const tier of Object.keys(AURA_PITY)) pity[tier] = won.rarity === tier ? 0 : pity[tier] + 1
  const better = (auraInfo(s.aura)?.mult ?? 0) < won.mult
  usePlayerData.setState({
    cash: lucky ? s.cash : s.cash - AURA.spinCost,
    luckyRolls: lucky ? s.luckyRolls - 1 : s.luckyRolls,
    auras: s.auras.includes(won.id) ? s.auras : [...s.auras, won.id],
    aura: better ? won.id : s.aura,
    spins: s.spins + 1,
    pity,
  })
  useGameStore.setState({ auraBurst: { at: performance.now(), color: won.color } })
  if (won.mult >= 1.5) playLevelUp()
  showActionResult(`${won.emoji} ${won.name} (${won.rarity}) x${won.mult} Strength, +${won.speed}% Run Speed`, true)
  return won
}

let autoAt = 0
function step() {
  const d = Math.hypot(player.position.x - stall.x, player.position.z - stall.z)
  const g = useGameStore.getState()
  if (g.aurasMenu) {
    clearInteractTarget(KEY)
    if (d > AURA.close) closeAurasMenu()
    else if (g.autoSpin && performance.now() - autoAt > AURA.autoMs) {
      autoAt = performance.now()
      const won = spin()
      const stop = g.autoStop
      if (!won || (stop && RARITIES.indexOf(won.rarity) >= RARITIES.indexOf(stop))) useGameStore.setState({ autoSpin: false })
    }
    return
  }
  if (d < AURA.open) setInteractTarget(KEY, 'Open Auras', openAurasMenu)
  else clearInteractTarget(KEY)
}

// The equipped aura's run speed bonus (%) on top of the base move speed.
function syncSpeed() {
  const s = usePlayerData.getState()
  player.moveSpeed = PHYSICS.moveSpeed * (1 + (auraInfo(s.aura)?.speed ?? 0) / 100 + moveBonus(s))
}

export function install() {
  syncSpeed()
  const key = (s) => `${s.aura}:${s.upgrades?.move ?? 0}`
  let last = key(usePlayerData.getState())
  const offSub = usePlayerData.subscribe((s) => {
    if (key(s) === last) return
    last = key(s)
    syncSpeed()
  })
  const offStep = addSystem(step)
  return () => {
    offSub()
    offStep()
  }
}
