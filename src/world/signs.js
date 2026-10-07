import { CanvasTexture, SRGBColorSpace } from 'three'
import { FONT_FAMILY } from '../utils/labels.js'
import { canvasTexture } from '../utils/textures.js'
import { seededRandom } from '../utils/random.js'

// Canvas painters for the hub's signage: floating Roblox-style labels
// (gradient fill, heavy outline, drop shadow, optional currency icon), the
// Leaderboards / Train Strength banners, leaderboard panels and egg skins.
// Everything is painted once and cached by key.

const font = (size) => `700 ${size}px ${FONT_FAMILY}, system-ui, sans-serif`

// --- Icons --------------------------------------------------------------------
// Each draws centred on (x, y) with `s` the icon height.
function hexPath(ctx, x, y, r) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
  }
  ctx.closePath()
}

const ICONS = {
  coin(ctx, x, y, s) {
    const r = s * 0.48
    hexPath(ctx, x, y, r)
    ctx.fillStyle = '#c98a00'
    ctx.fill()
    hexPath(ctx, x - r * 0.06, y - r * 0.06, r * 0.86)
    ctx.fillStyle = '#ffc928'
    ctx.fill()
    hexPath(ctx, x, y, r * 0.45)
    ctx.fillStyle = '#e9a80c'
    ctx.fill()
    ctx.lineWidth = s * 0.06
    ctx.strokeStyle = '#7a5200'
    hexPath(ctx, x, y, r)
    ctx.stroke()
  },
  rebirth(ctx, x, y, s) {
    const r = s * 0.42
    ctx.lineWidth = s * 0.08
    ctx.strokeStyle = '#1b1b1f'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#e8332e'
    ctx.beginPath()
    ctx.arc(x, y, r, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x - r, y)
    ctx.lineTo(x + r, y)
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, r * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  },
  log(ctx, x, y, s) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-0.35)
    const w = s * 1.05
    const h = s * 0.5
    ctx.lineWidth = s * 0.06
    ctx.strokeStyle = '#4a1405'
    ctx.fillStyle = '#d8401c'
    ctx.beginPath()
    ctx.roundRect(-w / 2, -h / 2, w, h, h / 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#f7a84a'
    ctx.beginPath()
    ctx.ellipse(w / 2 - h * 0.3, 0, h * 0.32, h / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.strokeStyle = '#d06a1c'
    ctx.beginPath()
    ctx.ellipse(w / 2 - h * 0.3, 0, h * 0.14, h * 0.24, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  },
  robux(ctx, x, y, s) {
    const r = s * 0.46
    hexPath(ctx, x, y, r)
    ctx.fillStyle = '#1f9e35'
    ctx.fill()
    hexPath(ctx, x, y, r * 0.82)
    ctx.fillStyle = '#3fe05a'
    ctx.fill()
    ctx.fillStyle = '#167a28'
    ctx.fillRect(x - r * 0.3, y - r * 0.3, r * 0.6, r * 0.6)
  },
  clover(ctx, x, y, s) {
    const r = s * 0.2
    ctx.fillStyle = '#1e8f2c'
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ctx.beginPath()
      ctx.arc(x + dx * r * 0.95, y + dy * r * 0.95, r * 1.15, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#3fe05a'
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ctx.beginPath()
      ctx.arc(x + dx * r * 0.95, y + dy * r * 0.95, r * 0.85, 0, Math.PI * 2)
      ctx.fill()
    }
  },
  cash(ctx, x, y, s) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-0.25)
    ctx.lineWidth = s * 0.06
    ctx.strokeStyle = '#0f4a17'
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 2 ? '#7cf06a' : '#3fbf3a'
      ctx.beginPath()
      ctx.roundRect(-s * 0.48, -s * 0.28 - i * s * 0.12 + s * 0.12, s * 0.96, s * 0.42, s * 0.05)
      ctx.fill()
      ctx.stroke()
    }
    ctx.restore()
  },
  trophy: (ctx, x, y, s) => emoji(ctx, '🏆', x, y, s),
  arm: (ctx, x, y, s) => emoji(ctx, '💪', x, y, s),
  clock: (ctx, x, y, s) => emoji(ctx, '⏱️', x, y, s),
}

function emoji(ctx, ch, x, y, s) {
  ctx.save()
  ctx.font = `${Math.round(s * 0.9)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(ch, x, y + s * 0.05)
  ctx.restore()
}

export function drawIcon(ctx, name, x, y, s) {
  ICONS[name]?.(ctx, x, y, s)
}

// --- Floating labels -------------------------------------------------------
// lines: [{ text, size = 100, colors: [top, bottom] | string, stroke, icon }]
function strokeFillText(ctx, text, x, y, size, colors, stroke) {
  ctx.font = font(size)
  ctx.lineJoin = 'round'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  // Drop shadow: a thick dark copy nudged down, the "3D" Roblox text look.
  ctx.lineWidth = size * 0.24
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'
  ctx.strokeText(text, x, y + size * 0.08)
  ctx.strokeStyle = stroke
  ctx.strokeText(text, x, y)
  const [top, bottom] = Array.isArray(colors) ? colors : [colors, colors]
  const g = ctx.createLinearGradient(0, y - size * 0.45, 0, y + size * 0.4)
  g.addColorStop(0, top)
  g.addColorStop(1, bottom)
  ctx.fillStyle = g
  ctx.fillText(text, x, y)
}

export function labelTexture(lines) {
  const key = 'label|' + JSON.stringify(lines)
  return cached(key, () => {
    const probe = document.createElement('canvas').getContext('2d')
    const rows = lines.map((l) => {
      const size = l.size ?? 100
      probe.font = font(size)
      const iconW = l.icon ? size * 1.15 : 0
      return { ...l, size, iconW, w: probe.measureText(l.text).width + iconW }
    })
    const pad = 40
    const w = Math.ceil(Math.max(...rows.map((r) => r.w)) + pad * 2)
    const h = Math.ceil(rows.reduce((a, r) => a + r.size * 1.22, 0) + pad)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    let y = pad / 2
    for (const r of rows) {
      const cy = y + r.size * 0.61
      let x = (w - r.w) / 2
      if (r.icon) {
        drawIcon(ctx, r.icon, x + r.size * 0.5, cy, r.size * 0.95)
        x += r.iconW
      }
      strokeFillText(ctx, r.text, x, cy, r.size, r.colors ?? '#ffffff', r.stroke ?? '#1b1b1f')
      y += r.size * 1.22
    }
    return { canvas, aspect: w / h }
  })
}

const labelCache = new Map()
function cached(key, paint) {
  if (labelCache.has(key)) return labelCache.get(key)
  const { canvas, aspect } = paint()
  const map = new CanvasTexture(canvas)
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 8
  const entry = { map, aspect }
  labelCache.set(key, entry)
  return entry
}

// --- Banners ---------------------------------------------------------------
// A checkered panel with an icon + title, e.g. the Leaderboards and Train
// Strength arches.
export function bannerTexture(key, { text, icon, a, b, w = 1024, h = 256, cell = 32, colors, stroke }) {
  return canvasTexture('banner|' + key, w, h, (ctx) => {
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        ctx.fillStyle = ((x + y) / cell) % 2 ? a : b
        ctx.fillRect(x, y, cell, cell)
      }
    }
    // Bevelled border
    ctx.lineWidth = 14
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.strokeRect(7, 7, w - 14, h - 14)
    const size = h * 0.42
    ctx.font = font(size)
    const iconW = icon ? size * 1.3 : 0
    const tw = ctx.measureText(text).width + iconW
    let x = (w - tw) / 2
    if (icon) {
      drawIcon(ctx, icon, x + size * 0.55, h / 2, size * 1.2)
      x += iconW
    }
    strokeFillText(ctx, text, x, h / 2, size, colors ?? ['#ffffff', '#f1f1f1'], stroke ?? '#2a1660')
  })
}

// Small flat sign plate on a stall's counter.
export function plateTexture(text, bg, fg = '#ffffff') {
  return canvasTexture(`plate|${text}|${bg}`, 512, 128, (ctx, w, h) => {
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.roundRect(4, 4, w - 8, h - 8, 24)
    ctx.fill()
    ctx.lineWidth = 8
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.stroke()
    ctx.font = font(64)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 10
    ctx.lineJoin = 'round'
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'
    ctx.strokeText(text, w / 2, h / 2 + 2)
    ctx.fillStyle = fg
    ctx.fillText(text, w / 2, h / 2 + 2)
  })
}

// --- Leaderboard panel --------------------------------------------------------
const NAMES = ['Blox_King', 'TreeSlayer', 'xXAxeLordXx', 'Lumberjack77', 'NoobMaster', 'Timberrr', 'OakSmash', 'PineDream', 'LogCollector', 'ChopChop']
export function leaderboardTexture(title, icon, color) {
  return canvasTexture(`board|${title}`, 640, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3b2312'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#5a3a1f'
    ctx.fillRect(12, 12, w - 24, h - 24)
    // header
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(22, 20, w - 44, 76, 14)
    ctx.fill()
    const titleSize = 44
    ctx.font = font(titleSize)
    const tw = ctx.measureText(title).width + 64
    drawIcon(ctx, icon, (w - tw) / 2 + 26, 58, 50)
    strokeFillText(ctx, title, (w - tw) / 2 + 64, 59, titleSize, ['#ffffff', '#f4f4f4'], '#2a1608')
    const rand = seededRandom(title.length * 31)
    let value = 9e6 + rand() * 9e6
    for (let i = 0; i < 10; i++) {
      const y = 106 + i * 36
      ctx.fillStyle = i % 2 ? '#6d4826' : '#7a5530'
      ctx.fillRect(26, y, w - 52, 33)
      const rankColor = ['#ffd23a', '#d7dde6', '#e0915a'][i] ?? '#ffffff'
      ctx.font = font(22)
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillStyle = rankColor
      ctx.fillText(`#${i + 1}`, 38, y + 17)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(NAMES[(i + title.length) % NAMES.length], 92, y + 17)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffe48a'
      ctx.fillText(shortNum(value), w - 38, y + 17)
      value *= 0.55 + rand() * 0.3
    }
    ctx.textAlign = 'center'
    ctx.font = font(22)
    ctx.fillStyle = '#ffd77a'
    ctx.fillText('Refreshes in 0:53', w / 2, h - 24)
  })
}

function shortNum(n) {
  const units = ['', 'K', 'M', 'B', 'T']
  let u = 0
  while (n >= 1000 && u < units.length - 1) {
    n /= 1000
    u++
  }
  return (n >= 100 ? n.toFixed(0) : n.toFixed(1)) + units[u]
}

// --- Egg skins (equirectangular) ------------------------------------------------
export function spottedEggTexture() {
  return canvasTexture('egg|spotted', 512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#fbfbf6'
    ctx.fillRect(0, 0, w, h)
    const rand = seededRandom(5)
    const colors = ['#2fc4f2', '#ff4fc8', '#ffd21f', '#8a3ff0', '#3fe05a', '#ff6a3a']
    for (let i = 0; i < 22; i++) {
      const x = rand() * w
      const y = 40 + rand() * (h - 80)
      const r = 14 + rand() * 22
      ctx.fillStyle = colors[i % colors.length]
      for (const dx of [-w, 0, w]) {
        ctx.beginPath()
        ctx.ellipse(x + dx, y, r * 1.3, r, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  })
}

export function voidEggTexture() {
  return canvasTexture('egg|void', 512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#16161c'
    ctx.fillRect(0, 0, w, h)
    const rand = seededRandom(9)
    ctx.strokeStyle = '#3ff3ff'
    ctx.lineCap = 'round'
    for (let i = 0; i < 9; i++) {
      let x = rand() * w
      let y = 30 + rand() * (h - 60)
      ctx.lineWidth = 3 + rand() * 4
      ctx.beginPath()
      ctx.moveTo(x, y)
      for (let k = 0; k < 6; k++) {
        x += (rand() - 0.3) * 40
        y += (rand() - 0.5) * 40
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  })
}
