// Sell Treasure stall: hold E next to it to open the window
// (components/SellMenu.jsx, useGameStore sellMenu); walking away closes it.
// Sells the Bag (usePlayerData bag) for cash x the rebirth cash multiplier.
import { STALLS } from '../world/layout.js'
import { SELL } from '../data/economy.js'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from './playerState.js'
import { addSystem } from './loop.js'
import { clearInteractTarget, setInteractTarget } from './interact.js'
import { cashMultiplier } from './rebirth.js'
import { showActionResult } from './actionResult.js'
import { formatNumber } from '../utils/format.js'

const stall = STALLS.find((s) => s.id === 'sell')
const KEY = 'sell:stall'

export function openSellMenu() {
  useGameStore.setState({ sellMenu: true, choppersMenu: false, aurasMenu: false, autoSpin: false, petsMenu: false, indexMenu: false, rebirthMenu: false, eggMenu: null, autoHatch: false })
}

export function closeSellMenu() {
  useGameStore.setState({ sellMenu: false })
}

// Bag items grouped by name: [{ name, rarity, count, value }] (value = total $ before multipliers).
export function groupBag(bag) {
  const groups = new Map()
  for (const it of bag) {
    const g = groups.get(it.name) ?? { name: it.name, rarity: it.rarity, count: 0, value: 0 }
    g.count += 1
    g.value += it.value
    groups.set(it.name, g)
  }
  return [...groups.values()]
}

export const bagValue = (bag) => bag.reduce((n, it) => n + it.value, 0)

// What `value` base $ pays out after the rebirth cash multiplier.
export const payout = (value) => Math.round(value * cashMultiplier())

function pay(items) {
  const s = usePlayerData.getState()
  const gain = payout(bagValue(items))
  const sold = new Set(items)
  usePlayerData.setState({ cash: s.cash + gain, bag: s.bag.filter((it) => !sold.has(it)) })
  return gain
}

export function sellItem(name) {
  const items = usePlayerData.getState().bag.filter((it) => it.name === name)
  if (!items.length) return
  showActionResult(`Sold for $${formatNumber(pay(items))}`, true)
}

export function sellAll() {
  const bag = usePlayerData.getState().bag
  if (!bag.length) {
    showActionResult('Nothing to sell!', false)
    return
  }
  showActionResult(`Sold for $${formatNumber(pay(bag))}`, true)
}

function step() {
  const d = Math.hypot(player.position.x - stall.x, player.position.z - stall.z)
  if (useGameStore.getState().sellMenu) {
    clearInteractTarget(KEY)
    if (d > SELL.close) closeSellMenu()
    return
  }
  if (d < SELL.open) setInteractTarget(KEY, 'Sell Treasure', openSellMenu)
  else clearInteractTarget(KEY)
}

export function install() {
  return addSystem(step)
}
