// Timed potion boosts (data/rewards.js POTION_MS): usePlayerData `boostUntil`
// holds the ms timestamp each of strength / cash / wood runs out. Luck uses the
// egg window's `luckUntil` (systems/hatch.js isLuckActive).
import { usePlayerData } from '../store/usePlayerData.js'

export const boostActive = (kind, state = usePlayerData.getState()) => (state.boostUntil?.[kind] ?? 0) > Date.now()

// x2 while the potion runs, else x1.
export const potionMultiplier = (kind, state = usePlayerData.getState()) => (boostActive(kind, state) ? 2 : 1)
