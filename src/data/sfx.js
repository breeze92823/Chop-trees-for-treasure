// Tunables for the held-E interaction sounds (systems/sfx.js).

// Success "pop" when a held-E hold completes. 0..1, multiplies on top of the
// master volume bus.
export const POWER_GAIN_SOUND_URL = '/audio/power_gain.mp3'
export const POWER_GAIN_GAIN = 0.135

// Level-up jingle when the level rises; trimmed to LEVEL_UP_MAX_SECONDS,
// peak-normalized, faded out, then scaled by LEVEL_UP_GAIN.
export const LEVEL_UP_SOUND_URL = '/audio/level_up.mp3'
export const LEVEL_UP_PEAK = 0.9
export const LEVEL_UP_MAX_SECONDS = 2
export const LEVEL_UP_FADE_OUT_S = 0.15
export const LEVEL_UP_GAIN = 0.22

// Axe-on-trunk thunk per landed swing (systems/chop.js). Leading silence is
// trimmed, the clip is capped to CHOP_HIT_MAX_SECONDS, peak-normalized, faded
// out, then scaled by CHOP_HIT_GAIN; each play varies pitch by +-CHOP_HIT_RATE_JITTER.
export const CHOP_HIT_SOUND_URL = '/audio/chop_tree_1.mp3'
export const CHOP_HIT_PEAK = 0.9
export const CHOP_HIT_MAX_SECONDS = 0.7
export const CHOP_HIT_FADE_OUT_S = 0.12
export const CHOP_HIT_GAIN = 0.2
export const CHOP_HIT_RATE_JITTER = 0.06

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
