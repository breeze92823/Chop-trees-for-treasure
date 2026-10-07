// Tunables for the held-E interaction sounds (systems/sfx.js).

// Success "pop" when a held-E hold completes. 0..1, multiplies on top of the
// master volume bus.
export const POWER_GAIN_SOUND_URL = '/audio/power_gain.mp3'
export const POWER_GAIN_GAIN = 0.135

// Failure buzz fired by showActionResult(text, false) (systems/actionResult.js).
// Synthesized: two short descending square-wave notes, rendered once via
// OfflineAudioContext and cached like a decoded file.
export const ACTION_FAIL_GAIN = 0.14
export const ACTION_FAIL_SYNTH_NOTES_HZ = [220, 164.81] // A3 down to E3
export const ACTION_FAIL_SYNTH_NOTE_GAP_S = 0.09 // time between each note's start
export const ACTION_FAIL_SYNTH_ATTACK_S = 0.004
export const ACTION_FAIL_SYNTH_DECAY_S = 0.16

// HUD button press tick: a quick high sine tone plus a short filtered noise
// burst for tactile texture, also synthesized once and cached.
export const BUTTON_CLICK_GAIN = 0.075
export const BUTTON_CLICK_SYNTH_FREQ_HZ = 1050 // sine tone pitch
export const BUTTON_CLICK_SYNTH_ATTACK_S = 0.002
export const BUTTON_CLICK_SYNTH_DECAY_S = 0.045
export const BUTTON_CLICK_SYNTH_NOISE_GAIN = 0.22 // 0..1, mixed under the tone
export const BUTTON_CLICK_SYNTH_NOISE_DECAY_S = 0.02
