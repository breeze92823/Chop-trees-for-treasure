// Choppers stall: hold E next to it to open the window (components/ChoppersMenu.jsx,
// useGameStore choppersMenu); walking away closes it. Buy a chopper with cash,
// equip an owned one; the equipped chopper's `strength` is the base Strength per swing.
import { STALLS } from '../world/layout.js'
import { CHOPPER } from '../data/economy.js'
import { CHOPPERS, STARTING_CHOPPER } from '../data/choppers.js'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from './playerState.js'
import { addSystem } from './loop.js'
import { clearInteractTarget, setInteractTarget } from './interact.js'
import { showActionResult } from './actionResult.js'
import { formatNumber } from '../utils/format.js'
import { playCashSpend } from './sfx.js'

const stall = STALLS.find((s) => s.id === 'choppers')
const KEY = 'choppers:stall'

export const chopperInfo = (id) => CHOPPERS.find((c) => c.id === id)

// Base Strength per landed swing from the equipped chopper.
export function chopperStrength(state = usePlayerData.getState()) {
  const c = chopperInfo(state.chopper) ?? chopperInfo(STARTING_CHOPPER)
  return c.strength * (1 + (c.bonus ?? 0) / 100)
}

export function openChoppersMenu() {
  useGameStore.setState({ choppersMenu: true, artifactsMenu: false, upgradesMenu: false, sellMenu: false, aurasMenu: false, autoSpin: false, petsMenu: false, indexMenu: false, rebirthMenu: false, questsMenu: false, eggMenu: null, autoHatch: false, forgeMenu: false })
}

export function closeChoppersMenu() {
  useGameStore.setState({ choppersMenu: false })
}

export function equipChopper(id) {
  const s = usePlayerData.getState()
  if (!s.choppers.includes(id) || s.chopper === id) return
  usePlayerData.setState({ chopper: id })
  if (currency !== 'gems') playCashSpend()
}

// Buys with cash ('cash') or Robux gems ('gems') and equips it.
export function buyChopper(id, currency = 'cash') {
  const s = usePlayerData.getState()
  const c = chopperInfo(id)
  if (!c || s.choppers.includes(id)) return
  const price = currency === 'gems' ? c.gems : c.cost
  if (price == null) {
    showActionResult(c.how ? `Get ${c.name} from ${c.how}` : 'Not for sale', false)
    return
  }
  const balance = currency === 'gems' ? s.robux : s.cash
  if (balance < price) {
    showActionResult(currency === 'gems' ? `Not enough Robux! Need ${price}` : `Not enough cash! Need $${formatNumber(price)}`, false)
    return
  }
  usePlayerData.setState({ [currency === 'gems' ? 'robux' : 'cash']: balance - price, choppers: [...s.choppers, id], chopper: id })
  showActionResult(`Bought and equipped ${c.name}`, true)
}

function step() {
  const d = Math.hypot(player.position.x - stall.x, player.position.z - stall.z)
  if (useGameStore.getState().choppersMenu) {
    clearInteractTarget(KEY)
    if (d > CHOPPER.close) closeChoppersMenu()
    return
  }
  if (d < CHOPPER.open) setInteractTarget(KEY, 'Open Choppers', openChoppersMenu)
  else clearInteractTarget(KEY)
}

export function install() {
  return addSystem(step)
}
