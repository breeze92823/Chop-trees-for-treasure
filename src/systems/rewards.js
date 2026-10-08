// Quest Gold shop (Rewards tab of the Quests window): buy gear / pets /
// potions with usePlayerData `questGold`, and drink potions. Never throws.
import { POTION_MS, rewardInfo } from '../data/rewards.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { showActionResult } from './actionResult.js'
import { tryHatch } from './hatch.js'
import { formatNumber } from '../utils/format.js'

export function addQuestGold(n) {
  usePlayerData.setState((s) => ({ questGold: s.questGold + n }))
}

export function isOwned(r, s = usePlayerData.getState()) {
  if (r.type === 'gear') return s.rewards.includes(r.id)
  if (r.type === 'pet') return s.pets.some((p) => p.egg === r.egg)
  return false
}

// Returns true if the purchase went ahead.
export function buyReward(id) {
  const r = rewardInfo(id)
  const s = usePlayerData.getState()
  if (!r) return false
  if (isOwned(r, s)) {
    showActionResult(`You already own ${r.name}`, false)
    return false
  }
  if (s.questGold < r.price) {
    showActionResult(`Not enough Gold! Need ${formatNumber(r.price)}`, false)
    return false
  }
  if (r.type === 'pet') return tryHatch(r.egg, 1) // pays the Gold itself, then reveals the pet
  if (r.type === 'gear') usePlayerData.setState({ questGold: s.questGold - r.price, rewards: [...s.rewards, r.id] })
  else usePlayerData.setState({ questGold: s.questGold - r.price, potions: { ...s.potions, [r.id]: (s.potions[r.id] ?? 0) + 1 } })
  showActionResult(`Bought ${r.name}!`, true)
  return true
}

// Drink one potion: each boost runs POTION_MS from now (time stacks).
export function drinkPotion(id) {
  const r = rewardInfo(id)
  const s = usePlayerData.getState()
  if (!r || r.type !== 'potion') return false
  if ((s.potions[id] ?? 0) < 1) {
    showActionResult(`You have no ${r.name}`, false)
    return false
  }
  const now = Date.now()
  const update = { potions: { ...s.potions, [id]: s.potions[id] - 1 } }
  const boostUntil = { ...s.boostUntil }
  for (const kind of r.boosts) {
    if (kind === 'luck') update.luckUntil = Math.max(now, s.luckUntil) + POTION_MS
    else boostUntil[kind] = Math.max(now, boostUntil[kind] ?? 0) + POTION_MS
  }
  usePlayerData.setState({ ...update, boostUntil })
  showActionResult(`${r.name} active for ${POTION_MS / 60_000} minutes!`, true)
  return true
}
