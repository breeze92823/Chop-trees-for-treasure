// Rebirth over store/usePlayerData.js: the level gate, the multipliers each
// rebirth grants, and the reset itself. Tunables in data/economy.js REBIRTH;
// UI in components/RebirthMenu.jsx (the HUD's Rebirth tile).
import { REBIRTH } from '../data/economy.js'
import { STARTING_BALANCE } from '../data/eggs.js'
import { strengthForNextLevel } from '../data/levels.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { showActionResult } from './actionResult.js'
import { playLevelUp } from './sfx.js'

// Level needed for the next rebirth.
export function rebirthLevel(state = usePlayerData.getState()) {
  return REBIRTH.level * REBIRTH.levelGrowth ** state.rebirths
}

// Strength gain multiplier after `rebirths` rebirths (default: the player's own).
export function strengthMultiplier(state = usePlayerData.getState(), rebirths = state.rebirths) {
  return 1 + rebirths * REBIRTH.strengthPer
}

// Cash multiplier, for selling loot once cash is live.
export function cashMultiplier(state = usePlayerData.getState(), rebirths = state.rebirths) {
  return 1 + rebirths * REBIRTH.cashPer
}

// 0..1 toward the next rebirth (the HUD tile's % badge and the window's bar).
export function rebirthProgress(state = usePlayerData.getState()) {
  return Math.min(1, state.level / rebirthLevel(state))
}

function rebirth(extra = {}) {
  usePlayerData.setState((s) => ({
    ...extra,
    rebirths: s.rebirths + 1,
    strength: STARTING_BALANCE.strength,
    level: 1,
    xp: 0,
    xpNeeded: strengthForNextLevel(1),
  }))
  playLevelUp()
  showActionResult(`Rebirthed! Strength x${strengthMultiplier()}`, true)
}

export function tryRebirth() {
  const s = usePlayerData.getState()
  const need = rebirthLevel(s)
  if (s.level < need) {
    showActionResult(`Reach Level ${need} to rebirth!`, false)
    return false
  }
  rebirth()
  return true
}

// Rebirth now for Robux, without the level.
export function skipRebirth() {
  const s = usePlayerData.getState()
  if (s.level >= rebirthLevel(s)) return tryRebirth()
  if (s.robux < REBIRTH.skipRobux) {
    showActionResult(`Not enough Robux! Need ${REBIRTH.skipRobux}`, false)
    return false
  }
  rebirth({ robux: s.robux - REBIRTH.skipRobux })
  return true
}
