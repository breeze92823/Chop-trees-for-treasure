// Treasure Index progress over store/usePlayerData.js `discoveredItems` (item
// names, added the first time one is collected — systems/loot.js). Each one
// raises the Strength gain multiplier (data/economy.js INDEX); UI in components/IndexMenu.jsx.
import { INDEX } from '../data/economy.js'
import { usePlayerData } from '../store/usePlayerData.js'

// e.g. 6 discovered = x1.15
export function indexBonus(state = usePlayerData.getState()) {
  return 1 + state.discoveredItems.length * INDEX.perItem
}

export function discoverItem(name) {
  const found = usePlayerData.getState().discoveredItems
  if (!found.includes(name)) usePlayerData.setState({ discoveredItems: [...found, name] })
}
