// Strength gain: every landed chop counts as one click (systems/chop.js). The
// gain also fills the level bar (xp); passing xpNeeded raises `level`, which
// components/LevelUpPopup.jsx watches for the banner + jingle.
import { usePlayerData } from '../store/usePlayerData.js'
import { strengthForNextLevel } from '../data/levels.js'
import { strengthMultiplier } from './rebirth.js'
import { indexBonus } from './treasureIndex.js'
import { auraMultiplier } from './auras.js'

// Adds `base` x the rebirth, Index and equipped-aura Strength multipliers; returns the Strength actually gained.
export function gainStrength(base) {
  const amount = base * strengthMultiplier() * indexBonus() * auraMultiplier()
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
  return amount
}
