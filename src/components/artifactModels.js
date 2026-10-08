import * as THREE from 'three'

// Procedural 3D models for the Artifacts window previews (components/ArtifactPreview.jsx).
// Each builder returns a THREE.Group facing +Z, roughly 2 units across; the preview
// normalises size and spins it. Keyed by artifact id (data/artifacts.js).

const mat = (color, { metal = 0.1, rough = 0.55, emissive = 0, glow = 0.6, ...rest } = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough, ...(emissive && { emissive: new THREE.Color(emissive), emissiveIntensity: glow }), ...rest })

const mesh = (geo, material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, material)
  m.position.set(x, y, z)
  return m
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

const slab = (w, h, d, r, bevel = 0.04) => {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), { depth: d, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 8 })
  g.translate(0, 0, -d / 2)
  return g
}

const cylZ = (rt, rb, h, seg = 24) => {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg)
  g.rotateX(Math.PI / 2)
  return g
}

// --- Treasure Pack: leather backpack with a flap, straps, gold buckles and a green gem ---
function treasurePack() {
  const g = new THREE.Group()
  const leather = mat('#8a4f22', { rough: 0.8 })
  const dark = mat('#5e3214', { rough: 0.8 })
  const strap = mat('#c58a4a', { rough: 0.75 })
  const gold = mat('#ffcf3a', { metal: 0.7, rough: 0.3 })
  g.add(mesh(slab(1.25, 1.55, 0.7, 0.3), leather, 0, 0, 0))
  g.add(mesh(slab(1.3, 0.8, 0.14, 0.28, 0.03), dark, 0, 0.5, 0.42))
  // side pockets
  for (const sx of [-1, 1]) g.add(mesh(slab(0.28, 0.7, 0.4, 0.1, 0.03), dark, sx * 0.72, -0.35, 0.05))
  // front pocket + coins
  g.add(mesh(slab(0.95, 0.5, 0.18, 0.12, 0.03), leather, 0, -0.5, 0.42))
  for (let i = 0; i < 3; i++) {
    const coin = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 16), gold, -0.18 + i * 0.18, -0.2 + (i % 2) * 0.03, 0.46)
    coin.rotation.x = Math.PI / 2 - 0.3
    g.add(coin)
  }
  // straps over the flap, buckles
  for (const sx of [-0.38, 0.38]) {
    g.add(mesh(new THREE.BoxGeometry(0.14, 1.05, 0.05), strap, sx, 0.12, 0.5))
    g.add(mesh(new THREE.BoxGeometry(0.2, 0.2, 0.07), gold, sx, 0.02, 0.53))
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 0.09), dark, sx, 0.02, 0.54))
  }
  // gem on the flap
  g.add(mesh(new THREE.OctahedronGeometry(0.17, 0), mat('#3fe05a', { rough: 0.15, emissive: '#1fa83a', glow: 0.8 }), 0, 0.5, 0.56))
  g.add(mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 16), gold, 0, 0.5, 0.52))
  // carry handle and shoulder straps
  const handle = mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 16, Math.PI), dark, 0, 0.78, 0)
  g.add(handle)
  for (const sx of [-0.35, 0.35]) g.add(mesh(new THREE.BoxGeometry(0.16, 1.2, 0.06), dark, sx, -0.05, -0.38))
  return g
}

// --- Fortune Amulet: stone octagon, blue ring, green gems, carved face, chain loop ---
function fortuneAmulet() {
  const g = new THREE.Group()
  const stone = mat('#a39a88', { metal: 0.45, rough: 0.45 })
  const dstone = mat('#7d7566', { metal: 0.4, rough: 0.5 })
  const blue = mat('#2f6fd0', { metal: 0.3, rough: 0.35, emissive: '#1a3a8a', glow: 0.4 })
  const green = mat('#3fe05a', { rough: 0.15, emissive: '#1fa83a', glow: 0.8 })
  const oct = cylZ(1, 1, 0.26, 8)
  oct.rotateZ(Math.PI / 8)
  g.add(mesh(oct, stone))
  const inner = cylZ(0.82, 0.82, 0.3, 8)
  inner.rotateZ(Math.PI / 8)
  g.add(mesh(inner, dstone))
  g.add(mesh(new THREE.TorusGeometry(0.64, 0.09, 10, 32), blue, 0, 0, 0.16))
  g.add(mesh(cylZ(0.56, 0.56, 0.2, 24), mat('#1f5a3a', { rough: 0.5 }), 0, 0, 0.12))
  // carved face
  const face = mesh(new THREE.SphereGeometry(0.34, 20, 16), stone, 0, 0.02, 0.2)
  face.scale.set(1, 1.1, 0.45)
  g.add(face)
  for (const ex of [-0.11, 0.11]) g.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), mat('#2a2a22'), ex, 0.1, 0.33))
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 0.06), mat('#2a2a22'), 0, -0.05, 0.33))
  // gems at the diagonals
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2
    g.add(mesh(new THREE.OctahedronGeometry(0.11, 0), green, Math.cos(a) * 0.82, Math.sin(a) * 0.82, 0.2))
  }
  // octagon studs
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    g.add(mesh(new THREE.SphereGeometry(0.06, 8, 8), dstone, Math.cos(a) * 0.93, Math.sin(a) * 0.93, 0.14))
  }
  // chain loop
  g.add(mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 16), stone, 0, 1.18, 0))
  const link = mesh(new THREE.TorusGeometry(0.14, 0.035, 8, 16), dstone, 0, 1.42, 0)
  link.rotation.y = Math.PI / 2
  g.add(link)
  return g
}

// --- Explorer Compass: bronze case, teal ring, four-point star ---
function explorerCompass() {
  const g = new THREE.Group()
  const bronze = mat('#a0622a', { metal: 0.55, rough: 0.4 })
  const dbronze = mat('#6e3f18', { metal: 0.5, rough: 0.5 })
  const teal = mat('#2a8a8a', { metal: 0.3, rough: 0.35, emissive: '#0f5a5a', glow: 0.4 })
  const tan = mat('#c89a5a', { rough: 0.7 })
  const gold = mat('#e8b84a', { metal: 0.7, rough: 0.3 })
  g.add(mesh(cylZ(1, 1, 0.3, 40), bronze))
  g.add(mesh(new THREE.TorusGeometry(1, 0.07, 10, 40), dbronze, 0, 0, 0.15))
  g.add(mesh(cylZ(0.8, 0.8, 0.34, 40), tan, 0, 0, -0.01))
  g.add(mesh(new THREE.TorusGeometry(0.82, 0.07, 10, 40), teal, 0, 0, 0.17))
  // tick marks
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8
    const tick = mesh(new THREE.BoxGeometry(0.04, i % 2 ? 0.08 : 0.14, 0.04), dbronze, Math.cos(a) * 0.68, Math.sin(a) * 0.68, 0.19)
    tick.rotation.z = a - Math.PI / 2
    g.add(tick)
  }
  // star: long cardinal points + short diagonals
  const star = (len, wid, color, rot, z) => {
    for (let i = 0; i < 4; i++) {
      const a = rot + (i * Math.PI) / 2
      const cone = mesh(new THREE.ConeGeometry(wid, len, 4), color, Math.cos(a) * len * 0.5, Math.sin(a) * len * 0.5, z)
      cone.scale.z = 0.3
      cone.rotation.z = a - Math.PI / 2
      g.add(cone)
    }
  }
  star(0.52, 0.12, dbronze, Math.PI / 4, 0.2)
  star(0.7, 0.14, gold, 0, 0.23)
  g.add(mesh(new THREE.SphereGeometry(0.09, 12, 12), mat('#ff5a3a', { emissive: '#aa2a10', glow: 0.5 }), 0, 0, 0.26))
  // cardinal teal studs on the rim
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    g.add(mesh(new THREE.BoxGeometry(0.22, 0.22, 0.12), teal, Math.cos(a) * 1.02, Math.sin(a) * 1.02, 0.1).rotateZ(a))
  }
  g.rotation.x = -0.25
  return g
}

// --- Dragon Totem: dark banded pillar with a gold dragon head ---
function dragonTotem() {
  const g = new THREE.Group()
  const body = mat('#34204f', { metal: 0.3, rough: 0.5 })
  const black = mat('#1c1228', { metal: 0.3, rough: 0.5 })
  const gold = mat('#e8a82a', { metal: 0.7, rough: 0.3 })
  const red = mat('#b02a2a', { metal: 0.2, rough: 0.5, emissive: '#601010', glow: 0.4 })
  g.add(mesh(new THREE.BoxGeometry(1.2, 0.3, 1.2), black, 0, -1.05, 0))
  g.add(mesh(new THREE.BoxGeometry(1.3, 0.08, 1.3), gold, 0, -0.88, 0))
  const col = new THREE.CylinderGeometry(0.5, 0.65, 1.5, 8)
  g.add(mesh(col, body, 0, -0.1, 0))
  // gold rings + red front tablet with a meander pattern
  for (const y of [-0.75, 0.15, 0.6]) g.add(mesh(new THREE.CylinderGeometry(0.58 - (y + 0.1) * 0.12, 0.6 - (y + 0.1) * 0.12, 0.07, 8), gold, 0, y, 0))
  g.add(mesh(new THREE.BoxGeometry(0.62, 0.6, 0.12), red, 0, -0.3, 0.55))
  for (const [x, y, w, h] of [[-0.18, -0.18, 0.3, 0.07], [0.0, -0.3, 0.07, 0.3], [0.14, -0.42, 0.3, 0.07], [-0.18, -0.42, 0.07, 0.2]]) g.add(mesh(new THREE.BoxGeometry(w, h, 0.05), gold, x, y, 0.62))
  // head
  g.add(mesh(new THREE.BoxGeometry(0.85, 0.5, 0.8), black, 0, 0.88, 0.05))
  g.add(mesh(new THREE.BoxGeometry(0.55, 0.28, 0.5), body, 0, 0.8, 0.55))
  for (const sx of [-0.14, 0.14]) g.add(mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), gold, sx, 0.86, 0.82))
  for (const sx of [-0.28, 0.28]) {
    g.add(mesh(new THREE.SphereGeometry(0.07, 8, 8), mat('#ffe03a', { emissive: '#ffb010', glow: 1 }), sx, 1.0, 0.45))
    const horn = mesh(new THREE.ConeGeometry(0.1, 0.7, 6), gold, sx * 1.4, 1.38, -0.12)
    horn.rotation.set(-0.35, 0, -Math.sign(sx) * 0.5)
    g.add(horn)
  }
  // crest spines down the back
  for (let i = 0; i < 3; i++) {
    const spine = mesh(new THREE.ConeGeometry(0.09, 0.3, 5), red, 0, 1.2 - i * 0.02, -0.3 - i * 0.05)
    spine.rotation.x = -0.6
    g.add(spine)
  }
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), gold, 0, 0.5, 0.36))
  return g
}

// --- Celestial Wings: layered blue and gold feathers around a sapphire clasp ---
function featherGeo(len, wid) {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(wid, len * 0.2, wid * 1.1, len * 0.7, 0, len)
  s.bezierCurveTo(-wid * 0.9, len * 0.7, -wid * 0.7, len * 0.2, 0, 0)
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1 })
  return g
}

function celestialWings() {
  const g = new THREE.Group()
  const navy = mat('#1c2fa0', { metal: 0.25, rough: 0.4, emissive: '#0a1460', glow: 0.35 })
  const blue = mat('#3a6aff', { metal: 0.25, rough: 0.4, emissive: '#1a3ad0', glow: 0.35 })
  const gold = mat('#f0b830', { metal: 0.6, rough: 0.3 })
  const wing = (side) => {
    const w = new THREE.Group()
    // back layer (long), then front layer (shorter), fanned from the shoulder
    for (let layer = 0; layer < 2; layer++) {
      const n = layer ? 5 : 7
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1)
        const ang = (layer ? 1.25 : 1.45) - t * (layer ? 1.7 : 2.3)
        const len = (layer ? 1.2 : 1.7) * (1 - 0.28 * Math.abs(t - 0.35))
        const f = mesh(featherGeo(len, layer ? 0.17 : 0.2), layer ? (i % 2 ? gold : navy) : (i % 3 === 2 ? gold : i % 2 ? blue : navy), 0, 0, layer ? 0.04 : -0.02 - i * 0.004)
        f.rotation.z = ang - Math.PI / 2
        w.add(f)
      }
    }
    // gold shoulder plate
    const plate = mesh(new THREE.SphereGeometry(0.2, 12, 10), gold, 0.02, 0.04, 0.08)
    plate.scale.set(1.2, 0.8, 0.5)
    w.add(plate)
    w.position.set(side * 0.28, 0, 0)
    w.scale.x = side
    return w
  }
  g.add(wing(1), wing(-1))
  g.add(mesh(new THREE.SphereGeometry(0.2, 16, 16), mat('#3a6aff', { rough: 0.1, emissive: '#2040ff', glow: 1 }), 0, 0, 0.14))
  g.add(mesh(new THREE.TorusGeometry(0.27, 0.06, 10, 24), gold, 0, 0, 0.12))
  for (const sy of [-1, 1]) g.add(mesh(new THREE.ConeGeometry(0.09, 0.3, 4), gold, 0, sy * 0.38, 0.1).rotateZ(sy > 0 ? 0 : Math.PI))
  g.position.y = -0.7
  const root = new THREE.Group()
  root.add(g)
  return root
}

// --- Chrono Crown: dark purple band, silver rims, tall spikes with violet gems ---
function chronoCrown() {
  const g = new THREE.Group()
  const purple = mat('#2c1856', { metal: 0.35, rough: 0.4, side: THREE.DoubleSide })
  const inner = mat('#5a2fa8', { metal: 0.2, rough: 0.5, side: THREE.DoubleSide })
  const silver = mat('#9a9ab0', { metal: 0.75, rough: 0.3 })
  const gem = mat('#b070ff', { rough: 0.1, emissive: '#7a30e0', glow: 0.9 })
  g.add(mesh(new THREE.CylinderGeometry(0.95, 0.85, 0.55, 20, 1, true), purple, 0, 0, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.88, 0.8, 0.55, 20, 1, true), inner, 0, 0.0, 0))
  for (const y of [-0.28, 0.28]) g.add(mesh(new THREE.TorusGeometry(y < 0 ? 0.85 : 0.95, 0.05, 8, 32), silver, 0, y, 0).rotateX(Math.PI / 2))
  const N = 6
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + 0.3
    const tall = i === 2
    const h = tall ? 1.35 : 0.7 + (i % 2) * 0.2
    const spike = mesh(new THREE.ConeGeometry(0.17, h, 4), purple, Math.cos(a) * 0.92, 0.28 + h / 2 - 0.02, Math.sin(a) * 0.92)
    spike.rotation.y = a
    g.add(spike)
    g.add(mesh(new THREE.SphereGeometry(0.06, 8, 8), gem, Math.cos(a) * 0.92, 0.3 + h, Math.sin(a) * 0.92))
    g.add(mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 10), silver, Math.cos(a) * 0.92, 0.36, Math.sin(a) * 0.92).rotateX(Math.PI / 2))
  }
  // front diamond and rune studs
  const diamond = mesh(new THREE.OctahedronGeometry(0.17, 0), gem, 0, 0, 0.97)
  diamond.scale.set(0.8, 1.2, 0.6)
  g.add(diamond)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2
    g.add(mesh(new THREE.SphereGeometry(0.045, 6, 6), silver, Math.cos(a) * 0.93, 0, Math.sin(a) * 0.93))
  }
  g.rotation.x = 0.25
  return g
}

// --- Creator Core: iridescent orb held in a bronze cage on a pedestal ---
function orbTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const x = c.getContext('2d')
  const grd = x.createLinearGradient(0, 0, 256, 256)
  grd.addColorStop(0, '#6af0d8')
  grd.addColorStop(0.35, '#7ab0ff')
  grd.addColorStop(0.65, '#ff8ae0')
  grd.addColorStop(1, '#ffe07a')
  x.fillStyle = grd
  x.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 24; i++) {
    x.fillStyle = `hsla(${(i * 47) % 360}, 90%, 70%, 0.28)`
    x.beginPath()
    x.arc((i * 83) % 256, (i * 131) % 256, 20 + ((i * 17) % 40), 0, Math.PI * 2)
    x.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function creatorCore() {
  const g = new THREE.Group()
  const bronze = mat('#4a3a26', { metal: 0.7, rough: 0.4 })
  const dark = mat('#2a2218', { metal: 0.6, rough: 0.5 })
  const gold = mat('#d8a63a', { metal: 0.8, rough: 0.28 })
  const tex = orbTexture()
  g.add(mesh(new THREE.SphereGeometry(0.62, 32, 24), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.55, roughness: 0.08, metalness: 0.1 }), 0, 0.25, 0))
  g.add(mesh(new THREE.SphereGeometry(0.66, 24, 18), new THREE.MeshStandardMaterial({ color: '#cfeaff', transparent: true, opacity: 0.18, roughness: 0.02 }), 0, 0.25, 0))
  // pedestal
  g.add(mesh(new THREE.CylinderGeometry(0.75, 0.95, 0.28, 12), dark, 0, -0.85, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.55, 0.75, 0.3, 12), bronze, 0, -0.58, 0))
  g.add(mesh(new THREE.TorusGeometry(0.58, 0.05, 8, 24), gold, 0, -0.42, 0).rotateX(Math.PI / 2))
  // cage: four angled arcs and a top ring
  for (let i = 0; i < 4; i++) {
    const arc = mesh(new THREE.TorusGeometry(0.8, 0.045, 8, 28, Math.PI * 0.95), i % 2 ? bronze : gold, 0, 0.25, 0)
    arc.rotation.set(0, (i * Math.PI) / 4, Math.PI * 0.025)
    g.add(arc)
  }
  g.add(mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 20), gold, 0, 1.03, 0).rotateX(Math.PI / 2))
  g.add(mesh(new THREE.OctahedronGeometry(0.11, 0), mat('#7ad8ff', { emissive: '#2f9ff0', glow: 0.9 }), 0, 1.2, 0))
  // infinity-ish side wings on the base
  for (const sx of [-1, 1]) {
    const lug = mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 16), gold, sx * 0.9, -0.2, 0)
    lug.rotation.y = Math.PI / 2
    g.add(lug)
  }
  return g
}

export const ARTIFACT_MODELS = {
  treasurepack: treasurePack,
  fortuneamulet: fortuneAmulet,
  explorercompass: explorerCompass,
  dragontotem: dragonTotem,
  celestialwings: celestialWings,
  chronocrown: chronoCrown,
  creatorcore: creatorCore,
}
