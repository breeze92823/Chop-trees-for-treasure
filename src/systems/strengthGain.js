// Strength gain: every landed chop counts as one click (systems/chop.js). The
// gain also fills the level bar (xp); passing xpNeeded raises `level`, which
// components/LevelUpPopup.jsx watches for the banner + jingle.
import { usePlayerData } from '../store/usePlayerData.js'
import { strengthForNextLevel } from '../data/levels.js'
import { strengthMultiplier } from './rebirth.js'
import { indexBonus } from './treasureIndex.js'
import { auraMultiplier } from './auras.js'
import { artifactBonus } from './artifacts.js'
import { potionMultiplier } from './potions.js'
import { addQuestProgress } from './quests.js'
import { AURA } from '../data/economy.js'

// Adds `base` x the rebirth, Index and equipped-aura and equipped-artifact Strength multipliers; returns the Strength actually gained.
export function gainStrength(base) {
  const amount = base * strengthMultiplier() * indexBonus() * auraMultiplier() * (1 + artifactBonus('strength')) * potionMultiplier('strength')
  usePlayerData.setState((s) => {
    let { level, xp, xpNeeded } = s
    xp += amount
    while (xp >= xpNeeded) {
      xp -= xpNeeded
      level += 1
      xpNeeded = strengthForNextLevel(level)
    }
    const rolls = Math.floor(level / AURA.levelsPerRoll) - Math.floor(s.level / AURA.levelsPerRoll)
    return { strength: s.strength + amount, level, xp, xpNeeded, ...(rolls > 0 && { luckyRolls: s.luckyRolls + rolls }) }
  })
  addQuestProgress('strength', amount)
  return amount
}
