// Strength gain: every landed chop counts as one click (systems/chop.js). The
// gain also fills the level bar (xp); passing xpNeeded raises `level`, which
// components/LevelUpPopup.jsx watches for the banner + jingle.
import { usePlayerData } from '../store/usePlayerData.js'
import { strengthForNextLevel } from '../data/levels.js'

export function gainStrength(amount) {
  usePlayerData.setState((s) => {
    let { level, xp, xpNeeded } = s
    xp += amount
    while (xp >= xpNeeded) {
      xp -= xpNeeded
      level += 1
      xpNeeded = strengthForNextLevel(level)
    }
    return { strength: s.strength + amount, level, xp, xpNeeded }
  })
}
