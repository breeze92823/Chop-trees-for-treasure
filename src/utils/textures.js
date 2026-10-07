import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { seededRandom } from './random.js'

// Procedural canvas textures. Each is built once and cached by key; callers
// share the returned CanvasTexture.
const cache = new Map()

export function canvasTexture(key, w, h, draw, { repeat = false } = {}) {
  if (cache.has(key)) return cache.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext('2d'), w, h)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  if (repeat) texture.wrapS = texture.wrapT = RepeatWrapping
  cache.set(key, texture)
  return texture
}

// Cartoon sky dome (4096x2048 equirect): cyan gradient on top, six rows of
// puffy cloud banks around the horizon, flat pale blue underneath.
export function skyTexture() {
  // Painted at 2x in 2048x1024 logical units so the puffs stay crisp.
  return canvasTexture('sky', 4096, 2048, (ctx, w, h) => {
    ctx.scale(2, 2)
    const W = w / 2
    const H = h / 2
    const horizon = H / 2
    const g = ctx.createLinearGradient(0, 0, 0, horizon)
    g.addColorStop(0, '#3f8fd8')
    g.addColorStop(0.6, '#79b4e6')
    g.addColorStop(1, '#f7d6a8')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    const rand = seededRandom(17)
    const rows = [
      { y: -70, r: [22, 44], body: '#6aa6dc', lit: '#a4cdf0' },
      { y: -42, r: [20, 40], body: '#9cc0e4', lit: '#d0e0f0' },
      { y: -14, r: [18, 38], body: '#d8cdd0', lit: '#fbe6cf' },
      { y: 14, r: [18, 34], body: '#f6d3b0', lit: '#ffe9c4' },
      { y: 42, r: [16, 32], body: '#f9d5a2', lit: '#ffecc0' },
      { y: 70, r: [16, 30], body: '#fbd9a6', lit: '#fff0c8' },
    ]
    const puff = (x, y, r, row) => {
      for (const dx of [-W, 0, W]) {
        const grad = ctx.createRadialGradient(x + dx - r * 0.25, y - r * 0.4, r * 0.1, x + dx, y, r)
        grad.addColorStop(0, row.lit)
        grad.addColorStop(0.55, row.body)
        grad.addColorStop(1, row.body)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x + dx, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    rows.forEach((row, i) => {
      const base = horizon + row.y
      // Solid body under the puffs so each row reads as one bank.
      const next = i + 1 < rows.length ? horizon + rows[i + 1].y : horizon + 110
      ctx.fillStyle = row.body
      ctx.fillRect(0, base, W, next - base + 40)
      let x = rand() * 80
      while (x < W) {
        const r = row.r[0] + rand() * (row.r[1] - row.r[0])
        puff(x, base - r * 0.35 + (rand() - 0.5) * 10, r, row)
        x += r * (0.8 + rand() * 0.6)
      }
    })
    const low = ctx.createLinearGradient(0, horizon + 110, 0, horizon + 180)
    low.addColorStop(0, '#fbd9a6')
    low.addColorStop(1, '#f7d6a8')
    ctx.fillStyle = low
    ctx.fillRect(0, horizon + 110, W, H)
  })
}
