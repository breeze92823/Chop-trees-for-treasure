// Held-E interaction sounds: the success pop (a real audio file, fetched and
// decoded once), plus the action-fail buzz and button-click tick (synthesized
// once via OfflineAudioContext and cached). All play through audio.js's shared
// AudioContext/master bus, so the portal's master volume controls them.
import { unlock, getMasterBus } from './audio.js'
import {
  POWER_GAIN_SOUND_URL,
  POWER_GAIN_GAIN,
  LEVEL_UP_SOUND_URL,
  LEVEL_UP_PEAK,
  LEVEL_UP_MAX_SECONDS,
  LEVEL_UP_FADE_OUT_S,
  LEVEL_UP_GAIN,
  CHOP_HIT_SOUND_URL,
  CHOP_HIT_PEAK,
  CHOP_HIT_MAX_SECONDS,
  CHOP_HIT_FADE_OUT_S,
  CHOP_HIT_GAIN,
  CHOP_HIT_RATE_JITTER,
  BUTTON_CLICK_GAIN,
  BUTTON_CLICK_SYNTH_FREQ_HZ,
  BUTTON_CLICK_SYNTH_ATTACK_S,
  BUTTON_CLICK_SYNTH_DECAY_S,
  BUTTON_CLICK_SYNTH_NOISE_GAIN,
  BUTTON_CLICK_SYNTH_NOISE_DECAY_S,
  ACTION_FAIL_GAIN,
  ACTION_FAIL_SYNTH_NOTES_HZ,
  ACTION_FAIL_SYNTH_NOTE_GAP_S,
  ACTION_FAIL_SYNTH_ATTACK_S,
  ACTION_FAIL_SYNTH_DECAY_S,
} from '../data/sfx.js'

const bufferCache = new Map() // url -> Promise<AudioBuffer|null>

function loadBuffer(ctx, url) {
  if (!bufferCache.has(url)) {
    bufferCache.set(
      url,
      fetch(url)
        .then((res) => res.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .catch((err) => {
          console.warn(`[sfx] failed to load ${url}`, err)
          bufferCache.delete(url)
          return null
        }),
    )
  }
  return bufferCache.get(url)
}

function playBuffer(ctx, buffer, level) {
  if (!buffer) return
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.value = level
  source.connect(gain)
  gain.connect(getMasterBus())
  source.start(0)
}

let actionFailBufferPromise = null

function synthesizeActionFailBuffer(ctx) {
  if (!actionFailBufferPromise) {
    const noteMs = (ACTION_FAIL_SYNTH_ATTACK_S + ACTION_FAIL_SYNTH_DECAY_S) * 1000
    const totalMs =
      ACTION_FAIL_SYNTH_NOTE_GAP_S * 1000 * (ACTION_FAIL_SYNTH_NOTES_HZ.length - 1) + noteMs + 50
    const sampleRate = ctx.sampleRate
    const offline = new OfflineAudioContext(1, Math.ceil((totalMs / 1000) * sampleRate), sampleRate)

    ACTION_FAIL_SYNTH_NOTES_HZ.forEach((freq, i) => {
      const start = i * ACTION_FAIL_SYNTH_NOTE_GAP_S
      const peak = start + ACTION_FAIL_SYNTH_ATTACK_S
      const end = peak + ACTION_FAIL_SYNTH_DECAY_S

      const osc = offline.createOscillator()
      osc.type = 'square'
      osc.frequency.value = freq

      const gain = offline.createGain()
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.7, peak)
      gain.gain.exponentialRampToValueAtTime(0.001, end)

      osc.connect(gain)
      gain.connect(offline.destination)
      osc.start(start)
      osc.stop(end + 0.05)
    })
    actionFailBufferPromise = offline.startRendering()
  }
  return actionFailBufferPromise
}

let buttonClickBufferPromise = null

function synthesizeButtonClickBuffer(ctx) {
  if (!buttonClickBufferPromise) {
    const toneEnd = BUTTON_CLICK_SYNTH_ATTACK_S + BUTTON_CLICK_SYNTH_DECAY_S
    const totalS = Math.max(toneEnd, BUTTON_CLICK_SYNTH_NOISE_DECAY_S) + 0.02
    const sampleRate = ctx.sampleRate
    const offline = new OfflineAudioContext(1, Math.ceil(totalS * sampleRate), sampleRate)

    const osc = offline.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = BUTTON_CLICK_SYNTH_FREQ_HZ

    const toneGain = offline.createGain()
    toneGain.gain.setValueAtTime(0, 0)
    toneGain.gain.linearRampToValueAtTime(1, BUTTON_CLICK_SYNTH_ATTACK_S)
    toneGain.gain.exponentialRampToValueAtTime(0.001, toneEnd)

    const noiseLength = Math.ceil(BUTTON_CLICK_SYNTH_NOISE_DECAY_S * sampleRate)
    const noiseBuffer = offline.createBuffer(1, noiseLength, sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseLength; i++) noiseData[i] = Math.random() * 2 - 1

    const noiseSource = offline.createBufferSource()
    noiseSource.buffer = noiseBuffer

    const noiseFilter = offline.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = BUTTON_CLICK_SYNTH_FREQ_HZ * 3
    noiseFilter.Q.value = 1.5

    const noiseGain = offline.createGain()
    noiseGain.gain.setValueAtTime(BUTTON_CLICK_SYNTH_NOISE_GAIN, 0)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, BUTTON_CLICK_SYNTH_NOISE_DECAY_S)

    osc.connect(toneGain)
    toneGain.connect(offline.destination)
    noiseSource.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(offline.destination)

    osc.start(0)
    osc.stop(toneEnd + 0.02)
    noiseSource.start(0)

    buttonClickBufferPromise = offline.startRendering()
  }
  return buttonClickBufferPromise
}

// Warms the decode/synthesis caches so the first interaction doesn't wait on
// a fetch. Safe at boot — building the context needs no user gesture, only
// actually producing sound does (audio.js's gesture-triggered unlock()).
export function preload() {
  const ctx = unlock()
  if (!ctx) return
  loadBuffer(ctx, POWER_GAIN_SOUND_URL)
  loadChopBuffer(ctx)
  synthesizeActionFailBuffer(ctx)
  synthesizeButtonClickBuffer(ctx)
}

// Fire-and-forget success pop — the moment a held-E hold actually does something.
export function playPowerGainPop() {
  const ctx = unlock()
  if (!ctx) return
  loadBuffer(ctx, POWER_GAIN_SOUND_URL).then((b) => playBuffer(ctx, b, POWER_GAIN_GAIN))
}

// Fire-and-forget buzz, called from showActionResult(text, false).
export function playActionFail() {
  const ctx = unlock()
  if (!ctx) return
  synthesizeActionFailBuffer(ctx).then((b) => playBuffer(ctx, b, ACTION_FAIL_GAIN))
}

// Fire-and-forget tick for any HUD button press; call first in an onClick.
export function playButtonClick() {
  const ctx = unlock()
  if (!ctx) return
  synthesizeButtonClickBuffer(ctx).then((b) => playBuffer(ctx, b, BUTTON_CLICK_GAIN))
}

// Level-up jingle: same trim / peak-normalize / fade treatment as Lift-rock's.
let levelUpBufferPromise = null
function loadLevelUpBuffer(ctx) {
  if (!levelUpBufferPromise) {
    levelUpBufferPromise = fetch(LEVEL_UP_SOUND_URL)
      .then((r) => r.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((src) => {
        const rate = src.sampleRate
        const chans = Array.from({ length: src.numberOfChannels }, (_, c) => src.getChannelData(c))
        let len = Math.min(src.length, Math.floor(LEVEL_UP_MAX_SECONDS * rate))
        while (len > 0 && chans.every((d) => Math.abs(d[len - 1]) < 0.005)) len--
        len = Math.max(len, 1)
        let peak = 0
        for (const d of chans) for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]))
        const k = peak > 0 ? LEVEL_UP_PEAK / peak : 1
        const fade = Math.min(Math.floor(LEVEL_UP_FADE_OUT_S * rate), len)
        const out = ctx.createBuffer(src.numberOfChannels, len, rate)
        chans.forEach((d, c) => {
          const b = out.getChannelData(c)
          for (let i = 0; i < len; i++) b[i] = d[i] * k
          for (let i = 0; i < fade; i++) b[len - 1 - i] *= i / fade
        })
        return out
      })
      .catch(() => null)
  }
  return levelUpBufferPromise
}

// Axe hit: trim leading/trailing silence, cap length, peak-normalize, fade out.
let chopBufferPromise = null
function loadChopBuffer(ctx) {
  if (!chopBufferPromise) {
    chopBufferPromise = fetch(CHOP_HIT_SOUND_URL)
      .then((r) => r.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((src) => {
        const rate = src.sampleRate
        const chans = Array.from({ length: src.numberOfChannels }, (_, c) => src.getChannelData(c))
        const quiet = (i) => chans.every((d) => Math.abs(d[i]) < 0.01)
        let start = 0
        while (start < src.length - 1 && quiet(start)) start++
        let end = Math.min(src.length, start + Math.floor(CHOP_HIT_MAX_SECONDS * rate))
        while (end > start + 1 && quiet(end - 1)) end--
        const len = Math.max(end - start, 1)
        let peak = 0
        for (const d of chans) for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[start + i]))
        const k = peak > 0 ? CHOP_HIT_PEAK / peak : 1
        const fade = Math.min(Math.floor(CHOP_HIT_FADE_OUT_S * rate), len)
        const out = ctx.createBuffer(src.numberOfChannels, len, rate)
        chans.forEach((d, c) => {
          const b = out.getChannelData(c)
          for (let i = 0; i < len; i++) b[i] = d[start + i] * k
          for (let i = 0; i < fade; i++) b[len - 1 - i] *= i / fade
        })
        return out
      })
      .catch(() => null)
  }
  return chopBufferPromise
}

// Fire-and-forget thunk when the axe lands on a tree.
export function playChopHit() {
  const ctx = unlock()
  if (!ctx) return
  loadChopBuffer(ctx).then((buffer) => {
    if (!buffer) return
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = 1 + (Math.random() * 2 - 1) * CHOP_HIT_RATE_JITTER
    const gain = ctx.createGain()
    gain.gain.value = CHOP_HIT_GAIN
    source.connect(gain)
    gain.connect(getMasterBus())
    source.start(0)
  })
}

export function playLevelUp() {
  const ctx = unlock()
  if (!ctx) return
  loadLevelUpBuffer(ctx).then((b) => playBuffer(ctx, b, LEVEL_UP_GAIN))
}
