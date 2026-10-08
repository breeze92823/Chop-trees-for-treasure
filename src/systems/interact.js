// Hold-E interaction: whichever system owns a nearby interactable registers it
// each frame with setInteractTarget(key, label, onConfirm) and clears it with
// clearInteractTarget(key) when the player walks away. Holding E against the
// registered target fills the ring (systems/interactHold.js, HOLD_MS) and, on
// completion, plays the success pop and runs onConfirm — which may report a
// blocked attempt with showActionResult(text, false). An early release resets
// the ring. Stepped once per frame via install() -> systems/loop.js; the prompt
// card (components/InteractPrompt.jsx) polls interactState/interactHoldState.
import { isKeyDown, INTERACT_KEY } from './input.js'
import { addSystem } from './loop.js'
import { HOLD_MS, step as stepHold } from './interactHold.js'
import { playPowerGainPop, preload as preloadSfx } from './sfx.js'

export const interactState = {
  key: null, // identifies the interactable in range, null when none
  label: '', // e.g. "Chop Tree" — shown after the E keycap
  onConfirm: null,
  holdMs: HOLD_MS, // 0 = instant (loot pickups)
}

export function setInteractTarget(key, label, onConfirm, holdMs = HOLD_MS) {
  interactState.key = key
  interactState.label = label
  interactState.onConfirm = onConfirm
  interactState.holdMs = holdMs
}

export function clearInteractTarget(key) {
  if (interactState.key !== key) return
  interactState.key = null
  interactState.label = ''
  interactState.onConfirm = null
}

function step() {
  const confirmed = stepHold(interactState.key, isKeyDown(INTERACT_KEY), interactState.holdMs)
  if (!confirmed) return
  // onConfirm returns false when it was blocked (it shows its own failure popup), so skip the success pop.
  const blocked = interactState.onConfirm?.() === false
  if (!blocked) playPowerGainPop()
}

export function install() {
  preloadSfx()
  return addSystem(step)
}
