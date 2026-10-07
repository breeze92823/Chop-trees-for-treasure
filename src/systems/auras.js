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

const stall = STALLS.find((s) => s.id === 'auras')
const KEY = 'auras:stall'

export const auraInfo = (id) => AURAS.find((a) => a.id === id)

export function auraMultiplier(state = usePlayerData.getState()) {
  return auraInfo(state.aura)?.mult ?? 1
}

export function openAurasMenu() {
  useGameStore.setState({ aurasMenu: true, choppersMenu: false, aurasIndex: false, petsMenu: false, indexMenu: false, rebirthMenu: false, sellMenu: false, eggMenu: null, autoHatch: false })
}

export function closeAurasMenu() {
  useGameStore.setState({ aurasMenu: false, aurasIndex: false, autoSpin: false })
}

function roll(s, lucky) {
  // Pity: a tier that has gone its full count is guaranteed.
  for (const tier of ['Secret', 'Mythic']) {
    if (s.pity[tier] + 1 >= AURA_PITY[tier]) return AURAS.find((a) => a.rarity === tier)
  }
  const pool = AURAS.filter((a) => a.weight > 0 && (!lucky || a.mult >= 1.5))
  let r = Math.random() * pool.reduce((n, a) => n + a.weight, 0)
  for (const a of pool) if ((r -= a.weight) < 0) return a
  return pool[0]
}

// Returns false when the spin could not run (so Auto Spin stops).
export function spin(lucky = false) {
  const s = usePlayerData.getState()
  if (lucky ? s.luckyRolls < 1 : s.cash < AURA.spinCost) {
    showActionResult(lucky ? 'No Lucky Rolls left!' : `Not enough cash! Need $${formatNumber(AURA.spinCost)}`, false)
    return false
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
  if (won.mult >= 1.5) playLevelUp()
  showActionResult(`${won.emoji} ${won.name} (${won.rarity}) x${won.mult} Strength, +${won.speed}% Run Speed`, true)
  return true
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
      if (!spin()) useGameStore.setState({ autoSpin: false })
    }
    return
  }
  if (d < AURA.open) setInteractTarget(KEY, 'Open Auras', openAurasMenu)
  else clearInteractTarget(KEY)
}

// The equipped aura's run speed bonus (%) on top of the base move speed.
function syncSpeed() {
  player.moveSpeed = PHYSICS.moveSpeed * (1 + (auraInfo(usePlayerData.getState().aura)?.speed ?? 0) / 100)
}

export function install() {
  syncSpeed()
  let last = usePlayerData.getState().aura
  const offSub = usePlayerData.subscribe((s) => {
    if (s.aura === last) return
    last = s.aura
    syncSpeed()
  })
  const offStep = addSystem(step)
  return () => {
    offSub()
    offStep()
  }
}
