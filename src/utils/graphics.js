import { LIGHT } from '../data/config.js'

// The portal's graphics_quality setting (data/bloxity.js SETTINGS) -> renderer
// options. `shadowMap` is the sun shadow texture size (0 = shadows off).
const PRESETS = {
  Low: { shadows: false, antialias: false, dpr: [1, 1], shadowMap: 0 },
  Medium: { shadows: true, antialias: false, dpr: [1, 1.5], shadowMap: 2048 },
  High: { shadows: true, antialias: true, dpr: [1, 2], shadowMap: LIGHT.shadowMapSize },
  Ultra: { shadows: true, antialias: true, dpr: [1, 2], shadowMap: LIGHT.shadowMapSize },
}

// Phones/tablets (coarse primary pointer) get a hard cap whatever the setting:
// no MSAA, pixel ratio <= 1.25 and a small shadow map. A chosen Low stays Low.
export const IS_MOBILE =
  typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches

const MOBILE = { dprMax: 1.25, shadowMap: 1024 }

export function graphicsPreset(quality) {
  const p = PRESETS[quality] ?? PRESETS.High
  if (!IS_MOBILE) return p
  return {
    shadows: p.shadows,
    antialias: false,
    dpr: [1, Math.min(p.dpr[1], MOBILE.dprMax)],
    shadowMap: p.shadows ? Math.min(p.shadowMap, MOBILE.shadowMap) : 0,
  }
}
