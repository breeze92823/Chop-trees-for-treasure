// Upgrades stall: hold E next to it to open the window (components/UpgradesMenu.jsx,
// useGameStore upgradesMenu); walking away closes it. Buy levels with cash or Robux
// (data/upgrades.js). Swing Range / Speed scale systems/chop.js; Backpack Slots add to BAG_MAX.
import { STALLS } from '../world/layout.js'
import { UPGRADE } from '../data/economy.js'
import { BAG_MAX } from '../data/loot.js'
import { upgradeCash, upgradeGems, upgradeInfo } from '../data/upgrades.js'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from './playerState.js'
import { artifactBonus } from './artifacts.js'
import { addSystem } from './loop.js'
import { clearInteractTarget, setInteractTarget } from './interact.js'
import { showActionResult } from './actionResult.js'
import { formatNumber } from '../utils/format.js'
import { playCashSpend } from './sfx.js'

const stall = STALLS.find((s) => s.id === 'upgrades')
const KEY = 'upgrades:stall'

export const upgradeLevel = (id, state = usePlayerData.getState()) => state.upgrades?.[id] ?? 0

const bonus = (id, state) => upgradeLevel(id, state) * upgradeInfo(id).perLevel

// Multiplier on the chop search radius.
export const rangeMultiplier = (state = usePlayerData.getState()) => 1 + bonus('range', state)
// Multiplier on swings per second (the chop cycle gets this much shorter).
export const speedMultiplier = (state = usePlayerData.getState()) => 1 + bonus('speed', state) + artifactBonus('swing', state)
// Extra run speed fraction (added to the aura's, systems/auras.js).
export const moveBonus = (state = usePlayerData.getState()) => bonus('move', state) + artifactBonus('move', state)
// Extra Legendary pet chance, in percentage points (systems/hatch.js currentOdds).
export const eggLuckBonus = (state = usePlayerData.getState()) => bonus('eggluck', state)
// Extra equip slots for pets (systems/pets.js petSlots).
export const petSlotBonus = (state = usePlayerData.getState()) => bonus('petslots', state)
// Bag capacity with Backpack Slots.
export const bagMax = (state = usePlayerData.getState()) => BAG_MAX + bonus('backpack', state) + artifactBonus('backpack', state)

export function openUpgradesMenu() {
  useGameStore.setState({ upgradesMenu: true, artifactsMenu: false, choppersMenu: false, sellMenu: false, aurasMenu: false, autoSpin: false, petsMenu: false, indexMenu: false, rebirthMenu: false, questsMenu: false, eggMenu: null, autoHatch: false, forgeMenu: false })
}

export function closeUpgradesMenu() {
  useGameStore.setState({ upgradesMenu: false })
}

// Buys one level with cash ('cash') or Robux ('gems').
export function buyUpgrade(id, currency = 'cash') {
  const s = usePlayerData.getState()
  const u = upgradeInfo(id)
  const level = upgradeLevel(id, s)
  if (!u || level >= u.max) return
  const gems = currency === 'gems'
  const price = gems ? upgradeGems(u, level) : upgradeCash(u, level)
  const balance = gems ? s.robux : s.cash
  if (balance < price) {
    showActionResult(gems ? `Not enough Robux! Need ${price}` : `Not enough cash! Need $${formatNumber(price)}`, false)
    return
  }
  usePlayerData.setState({ [gems ? 'robux' : 'cash']: balance - price, upgrades: { ...s.upgrades, [id]: level + 1 } })
  if (!gems) playCashSpend()
  showActionResult(`${u.name} upgraded to level ${level + 1}`, true)
}

function step() {
  const d = Math.hypot(player.position.x - stall.x, player.position.z - stall.z)
  if (useGameStore.getState().upgradesMenu) {
    clearInteractTarget(KEY)
    if (d > UPGRADE.close) closeUpgradesMenu()
    return
  }
  if (d < UPGRADE.open) setInteractTarget(KEY, 'Open Upgrades', openUpgradesMenu)
  else clearInteractTarget(KEY)
}

export function install() {
  return addSystem(step)
}
