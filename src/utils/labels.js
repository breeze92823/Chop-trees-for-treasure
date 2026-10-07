import { CanvasTexture, SRGBColorSpace } from 'three'

export const FONT_FAMILY = 'Fredoka'

const cache = new Map()

// Painted-once billboard texture for a line of text (player nameplates, world
// signs). Returns { map, aspect }. Cached by text + colour, so identical names
// share one texture. The UI font must be loaded first (main.jsx waits for it)
// or the text bakes in the fallback font.
export function billboardTexture(text, { color = '#ffffff', size = 56 } = {}) {
  const key = `${text}|${color}|${size}`
  if (cache.has(key)) return cache.get(key)
  const pad = size * 0.4
  const probe = document.createElement('canvas').getContext('2d')
  const font = `700 ${size}px ${FONT_FAMILY}, system-ui, sans-serif`
  probe.font = font
  const w = Math.ceil(probe.measureText(text).width + pad * 2)
  const h = Math.ceil(size * 1.5)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = size * 0.22
  ctx.strokeStyle = 'rgba(0,0,0,0.85)'
  ctx.strokeText(text, w / 2, h / 2)
  ctx.fillStyle = color
  ctx.fillText(text, w / 2, h / 2)
  const map = new CanvasTexture(canvas)
  map.colorSpace = SRGBColorSpace
  const entry = { map, aspect: w / h }
  cache.set(key, entry)
  return entry
}
