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
import { step as stepHold } from './interactHold.js'
import { playPowerGainPop, preload as preloadSfx } from './sfx.js'

export const interactState = {
  key: null, // identifies the interactable in range, null when none
  label: '', // e.g. "Chop Tree" — shown after the E keycap
  onConfirm: null,
}

export function setInteractTarget(key, label, onConfirm) {
  interactState.key = key
  interactState.label = label
  interactState.onConfirm = onConfirm
}

export function clearInteractTarget(key) {
  if (interactState.key !== key) return
  interactState.key = null
  interactState.label = ''
  interactState.onConfirm = null
}

function step() {
  const confirmed = stepHold(interactState.key, isKeyDown(INTERACT_KEY))
  if (!confirmed) return
  playPowerGainPop()
  interactState.onConfirm?.()
}

export function install() {
  preloadSfx()
  return addSystem(step)
}
