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
// Roblox-style board: dark header strip with the title flanked by big icons,
// an orange-brown frame, RANK / PLAYER / value columns, medal ranks, avatar
// discs, names, a highlighted row for the local player and an "Updates live"
// footer. Rows come from the server (store/useLeaderboardStore.js).
const BOARD_STYLE = {
  cash: { value: '#5cff7a', fmt: (n) => '$' + shortNum(n) },
  arm: { value: '#ffe9a8', fmt: shortNum },
  rebirth: { value: '#ff9ad0', fmt: shortNum },
  trophy: { value: '#9ad7ff', fmt: timePlayed }, // value = seconds
}

// 90 -> "1m", 5400 -> "1h 30m", 200000 -> "2d 7h".
function timePlayed(seconds) {
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d) return `${d}d ${h % 24}h`
  if (h) return `${h}h ${m % 60}m`
  return `${m}m`
}

// `rows` = the top players { name, value } best first (up to 10); `me` = { rank, value } for the
// local player's highlighted bottom row (rank null = outside the list). The key carries the data,
// so each change makes a new texture: release the old one with releaseTexture().
export function leaderboardTexture(title, icon, color, rows = [], me = null) {
  const sig = JSON.stringify([rows.map((r) => [r.name, r.value]), me])
  return canvasTexture(`board2|${title}|${sig}`, 768, 640, (ctx, w, h) => {
    const style = BOARD_STYLE[icon] ?? BOARD_STYLE.arm
    const fontI = (size) => `italic 700 ${size}px ${FONT_FAMILY}, system-ui, sans-serif`
    const outlined = (text, x, y, size, fill, stroke, align = 'left', f = font) => {
      ctx.font = f(size)
      ctx.textAlign = align
      ctx.textBaseline = 'middle'
      ctx.lineJoin = 'round'
      ctx.lineWidth = size * 0.22
      ctx.strokeStyle = stroke
      ctx.strokeText(text, x, y)
      ctx.fillStyle = fill
      ctx.fillText(text, x, y)
    }
    // wooden frame: warm gradient, plank seams, bevel
    const frame = ctx.createLinearGradient(0, 0, 0, h)
    frame.addColorStop(0, '#d0701f')
    frame.addColorStop(0.5, '#a9501a')
    frame.addColorStop(1, '#7c3410')
    ctx.fillStyle = frame
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, 26)
    ctx.fill()
    ctx.strokeStyle = 'rgba(60,20,4,0.35)'
    ctx.lineWidth = 3
    for (const gy of [38, 76, h - 56, h - 30]) {
      ctx.beginPath()
      ctx.moveTo(8, gy)
      ctx.lineTo(w - 8, gy)
      ctx.stroke()
    }
    ctx.lineWidth = 6
    ctx.strokeStyle = '#3a1706'
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, 26)
    ctx.stroke()
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(255,200,120,0.5)'
    ctx.beginPath()
    ctx.roundRect(7, 7, w - 14, h - 14, 20)
    ctx.stroke()

    // title: slanted gold-white text between two big tilted icons
    const titleSize = 66
    ctx.font = fontI(titleSize)
    const tw = ctx.measureText(title).width
    const iconS = 96
    const tx = (w - tw) / 2
    for (const [ix, rot] of [[tx - iconS * 0.7, -0.2], [tx + tw + iconS * 0.7, 0.2]]) {
      ctx.save()
      ctx.translate(ix, 62)
      ctx.rotate(rot)
      drawIcon(ctx, icon, 0, 0, iconS)
      ctx.restore()
    }
    ctx.font = fontI(titleSize)
    ctx.lineJoin = 'round'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = titleSize * 0.26
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.strokeText(title, tx, 68)
    ctx.strokeStyle = '#3a1604'
    ctx.strokeText(title, tx, 62)
    const tg = ctx.createLinearGradient(0, 30, 0, 90)
    tg.addColorStop(0, '#fffbe6')
    tg.addColorStop(1, '#ffc24a')
    ctx.fillStyle = tg
    ctx.fillText(title, tx, 62)

    // table: dark brown well with a green inner rim
    ctx.fillStyle = '#2a1308'
    ctx.beginPath()
    ctx.roundRect(16, 112, w - 32, h - 160, 18)
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = '#1b0a03'
    ctx.stroke()
    ctx.strokeStyle = '#3f8a2a'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(22, 118, w - 44, h - 172, 14)
    ctx.stroke()

    // column headers
    ctx.fillStyle = '#e8b878'
    ctx.font = fontI(18)
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText('RANK', 40, 138)
    ctx.fillText('PLAYER', 150, 134)
    ctx.textAlign = 'right'
    ctx.fillText(icon === 'cash' ? 'CASH' : icon === 'arm' ? 'STRENGTH' : icon === 'rebirth' ? 'REBIRTHS' : 'TIME', w - 40, 134)

    const rowH = 40
    const plaque = [['#ffe27a', '#e0a010'], ['#f4f7fb', '#a9b4c4'], ['#f0aa72', '#b8662c']]
    for (let i = 0; i < 11; i++) {
      const mine = i === 10
      const row = mine ? me : rows[i]
      const y = 152 + i * (rowH + 1.5) + (mine ? 8 : 0)
      const cy = y + rowH / 2
      const x0 = 30
      const rw = w - 60
      if (mine) {
        ctx.save()
        ctx.shadowColor = 'rgba(255,230,90,0.9)'
        ctx.shadowBlur = 16
        const g = ctx.createLinearGradient(0, y, 0, y + rowH)
        g.addColorStop(0, '#fff27a')
        g.addColorStop(1, '#f0b410')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.roundRect(x0 - 4, y - 3, rw + 8, rowH + 6, 12)
        ctx.fill()
        ctx.restore()
        ctx.lineWidth = 3
        ctx.strokeStyle = '#6a3c00'
        ctx.beginPath()
        ctx.roundRect(x0 - 4, y - 3, rw + 8, rowH + 6, 12)
        ctx.stroke()
      } else {
        const g = ctx.createLinearGradient(0, y, 0, y + rowH)
        g.addColorStop(0, i % 2 ? '#8a4a1c' : '#a05a22')
        g.addColorStop(1, i % 2 ? '#6a3412' : '#7e4218')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.roundRect(x0, y, rw, rowH, 10)
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = '#2a1004'
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,220,160,0.14)'
        ctx.fillRect(x0 + 8, y + 3, rw - 16, 3)
      }
      // rank plaque (podium + you) or plain number
      if (i < 3 || mine) {
        const [c1, c2] = mine ? ['#fff6b0', '#f4c020'] : plaque[i]
        const pw = mine ? 70 : 42
        const px = mine ? 36 : 40
        const pg = ctx.createLinearGradient(0, cy - 15, 0, cy + 15)
        pg.addColorStop(0, c1)
        pg.addColorStop(1, c2)
        ctx.fillStyle = pg
        ctx.beginPath()
        ctx.roundRect(px, cy - 15, pw, 30, 8)
        ctx.fill()
        ctx.lineWidth = 3
        ctx.strokeStyle = '#4a2a00'
        ctx.stroke()
        ctx.fillStyle = '#3a2000'
        ctx.font = fontI(mine ? 22 : 24)
        ctx.textAlign = 'center'
        ctx.fillText(mine ? (me?.rank ? String(me.rank) : '100+') : String(i + 1), px + pw / 2, cy + 1)
      } else {
        outlined(String(i + 1), 61, cy + 1, 24, '#ffffff', '#2a1004', 'center', fontI)
      }
      if (!row) continue // an empty slot: just the rank
      const name = mine ? 'You' : row.name
      // avatar disc: tinted by the name, dark ring, green rim
      const ax = mine ? 142 : 124
      let hue = 0
      for (const c of name) hue = (hue * 31 + c.charCodeAt(0)) % 360
      ctx.fillStyle = '#17331a'
      ctx.beginPath()
      ctx.arc(ax, cy, 19, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `hsl(${hue} 55% 48%)`
      ctx.beginPath()
      ctx.arc(ax, cy, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.88)'
      ctx.beginPath()
      ctx.arc(ax, cy - 4, 5.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(ax, cy + 13, 9, Math.PI, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#3fb34a'
      ctx.beginPath()
      ctx.arc(ax, cy, 18, 0, Math.PI * 2)
      ctx.stroke()
      // name + @handle
      const shown = name.length > 14 ? name.slice(0, 13) + '…' : name
      const nx = ax + 28
      outlined(shown, nx, cy - 6, 21, '#ffffff', mine ? '#4a2a00' : '#2a1004', 'left', fontI)
      ctx.font = font(12)
      ctx.textAlign = 'left'
      ctx.fillStyle = mine ? '#6a3c00' : '#e0b07a'
      ctx.fillText('@' + name.toLowerCase(), nx, cy + 12)
      // value
      outlined(style.fmt(row.value), w - 44, cy + 1, 25, mine ? '#41e86a' : style.value, mine ? '#0f4a1c' : '#103a14', 'right', fontI)
    }
    outlined('Updates live', w / 2, h - 24, 30, '#ffd24a', '#4a2200', 'center', fontI)
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
