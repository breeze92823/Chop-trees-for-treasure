// Procedural 3D models for every chopper (data/choppers.js `model`), built in the
// same rig units as the original lumberjack axe (systems/axeProp.js): the fist
// grips the group's origin, the handle runs down -Y, the head sits near y = -2.9
// and its cutting edge faces +Z. Swapping `buildAxe(id)` into the axe pivot is
// all it takes to change the player's weapon.
//
// A model spec is { type, wood, grip, head, accent, glow }:
//   type   'axe' | 'twin' | 'hook' | 'saw' | 'halberd' | 'maul' | 'crescent' | 'disc' | 'guillotine' | 'sword'
//   wood   handle colour (hilt colour for a sword)
//   grip   leather wrap around the fist (defaults to `accent`)
//   head   blade colour          accent  trim / inlay / spikes
//   glow   optional emissive colour for magic and fire weapons
//
// Blades are real profiles (THREE.Shape) extruded with a bevel, with a smaller
// inlay of the accent colour on top; handles have a wrapped grip, studs, collars
// and a capped pommel. Everything is built once per chopper id and the
// geometries / materials are shared.
import {
  CylinderGeometry,
  ConeGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
} from 'three'
import { MATERIAL_PBR } from '../data/materials.js'
import { CHOPPERS, STARTING_CHOPPER } from '../data/choppers.js'

const geoCache = new Map()
const geo = (key, make) => {
  if (!geoCache.has(key)) geoCache.set(key, make())
  return geoCache.get(key)
}

const matCache = new Map()
function mat(color, glow, metal = 0.3, rough = null) {
  const key = `${color}|${glow ?? ''}|${metal}|${rough ?? ''}`
  if (!matCache.has(key)) {
    matCache.set(
      key,
      new MeshStandardMaterial({
        ...MATERIAL_PBR.PLAYER,
        color,
        metalness: metal,
        ...(rough != null && { roughness: rough }),
        ...(glow && { emissive: glow, emissiveIntensity: 0.6 }),
      }),
    )
  }
  return matCache.get(key)
}

function part(g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const o = new Mesh(g, m)
  o.position.set(x, y, z)
  o.rotation.set(rx, ry, rz)
  o.castShadow = true
  return o
}

const HEAD_Y = -2.9

// Blade profile -> bevelled slab. The profile is drawn in (forward, up) = (x, y)
// with the handle at x = 0; the slab is `depth` thick across the handle's X axis.
function slab(shape, depth, bevel = 0.035) {
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 10 })
  g.translate(0, 0, -depth / 2)
  g.rotateY(-Math.PI / 2) // shape x -> world +Z, extrusion -> world X
  return g
}

// --- profiles ----------------------------------------------------------------------
// `sign` mirrors the profile to the back of the head, `k` shrinks it about its
// centre (used for the accent inlay).
function bearded(sign = 1, k = 1) {
  const X = (x) => sign * (0.75 + (x - 0.75) * k)
  const Y = (y) => y * k
  const s = new Shape()
  s.moveTo(X(0.15), Y(0.6))
  s.quadraticCurveTo(X(0.9), Y(1.05), X(1.4), Y(0.85))
  s.bezierCurveTo(X(1.08), Y(0.35), X(1.08), Y(-0.35), X(1.45), Y(-0.95))
  s.quadraticCurveTo(X(0.85), Y(-0.85), X(0.15), Y(-0.6))
  s.closePath()
  return s
}

function cleaver(k = 1) {
  const X = (x) => 0.65 + (x - 0.65) * k
  const Y = (y) => y * k
  const s = new Shape()
  s.moveTo(X(0.15), Y(-1.0))
  s.lineTo(X(1.05), Y(-1.0))
  s.quadraticCurveTo(X(1.25), Y(-0.9), X(1.25), Y(-0.6))
  s.lineTo(X(1.25), Y(0.8))
  // serrated spine
  const n = 6
  for (let i = 0; i < n; i++) {
    const t = 1.25 - ((i + 0.5) * (1.1)) / n
    s.lineTo(X(t + 0.08), Y(1.1))
    s.lineTo(X(t - 0.04), Y(0.82))
  }
  s.lineTo(X(0.15), Y(0.8))
  s.closePath()
  return s
}

function sickle(k = 1) {
  // A thin crescent whose cutting edge bulges forward.
  const s = new Shape()
  const oc = 0.2, or = 1.0, ta = 1.1
  s.absarc(oc, 0, or, -ta, ta, false)
  const tx = oc + or * Math.cos(ta), ty = or * Math.sin(ta)
  const c = -1.99, r = Math.hypot(tx - c, ty)
  const a = Math.atan2(ty, tx - c)
  s.absarc(c, 0, r, a, -a, true)
  s.closePath()
  if (k !== 1) {
    // inlay: scale the outline toward its centre
    const pts = s.getPoints(24).map((p) => ({ x: 0.9 + (p.x - 0.9) * k, y: p.y * k }))
    const t = new Shape()
    t.moveTo(pts[0].x, pts[0].y)
    for (const p of pts.slice(1)) t.lineTo(p.x, p.y)
    t.closePath()
    return t
  }
  return s
}

function sawDisc(k = 1) {
  const cx = 0.95
  const s = new Shape()
  const n = 14
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2
    const r = (i % 2 === 0 ? 1.0 : 0.82) * k
    const x = cx + Math.cos(a) * r, y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  return s
}

function guillotine(k = 1) {
  const X = (x) => 0.85 + (x - 0.85) * k
  const Y = (y) => y * k
  const s = new Shape()
  s.moveTo(X(0.15), Y(0.7))
  s.lineTo(X(1.55), Y(0.7))
  s.lineTo(X(1.55), Y(0.5))
  s.lineTo(X(0.95), Y(-0.75))
  s.lineTo(X(0.15), Y(-0.75))
  s.closePath()
  return s
}

function beak() {
  const s = new Shape()
  s.moveTo(0.05, 0.45)
  s.bezierCurveTo(-0.3, 0.55, -0.7, 0.9, -0.78, 1.55)
  s.bezierCurveTo(-0.45, 1.05, -0.15, 0.85, 0.2, 0.75)
  s.closePath()
  return s
}

function roundRect(x0, y0, x1, y1, r) {
  const s = new Shape()
  s.moveTo(x0 + r, y0)
  s.lineTo(x1 - r, y0)
  s.quadraticCurveTo(x1, y0, x1, y0 + r)
  s.lineTo(x1, y1 - r)
  s.quadraticCurveTo(x1, y1, x1 - r, y1)
  s.lineTo(x0 + r, y1)
  s.quadraticCurveTo(x0, y1, x0, y1 - r)
  s.lineTo(x0, y0 + r)
  s.quadraticCurveTo(x0, y0, x0 + r, y0)
  return s
}

function swordBlade(k = 1) {
  // (x = across, y = along the handle line, tip at the bottom). x maps to world Z.
  const s = new Shape()
  s.moveTo(0.27 * k, -1.1)
  s.lineTo(0.23 * k, -3.75 + (k < 1 ? 0.3 : 0))
  s.lineTo(0, -4.25 + (k < 1 ? 0.4 : 0))
  s.lineTo(-0.23 * k, -3.75 + (k < 1 ? 0.3 : 0))
  s.lineTo(-0.27 * k, -1.1)
  s.closePath()
  return s
}

// --- shared pieces -----------------------------------------------------------------
// Handle with a leather-wrapped grip, studs, collars and a capped pommel.
function shaft(g, s, short = false) {
  const wood = mat(s.wood, null, 0.1)
  const wrap = mat(s.grip ?? s.accent ?? '#d6303a', null, 0.05, 0.9)
  const metal = mat(s.accent ?? '#c8ccd6', s.glow, 0.7, 0.35)
  const dark = mat('#2c3e5c', null, 0.5)
  const len = short ? 1.2 : 3.5
  const mid = short ? -0.3 : -1.25
  g.add(part(geo(`handle${len}`, () => new CylinderGeometry(0.12, 0.145, len, 12)), wood, 0, mid, 0))
  g.add(part(geo('grip', () => new CylinderGeometry(0.17, 0.17, 1.1, 12)), wrap, 0, -0.05, 0))
  const ring = geo('wrap', () => new TorusGeometry(0.175, 0.03, 6, 14))
  for (let i = 0; i < 7; i++) g.add(part(ring, wrap, 0, 0.42 - i * 0.155, 0, Math.PI / 2))
  const collar = geo('collar', () => new CylinderGeometry(0.2, 0.2, 0.12, 12))
  g.add(part(collar, metal, 0, -0.64, 0))
  g.add(part(collar, metal, 0, 0.5, 0))
  g.add(part(geo('pommel', () => new SphereGeometry(0.23, 12, 10)), metal, 0, 0.66, 0))
  g.add(part(geo('pommelgem', () => new OctahedronGeometry(0.1)), mat(s.accent ?? '#ffffff', s.glow ?? s.accent, 0.2), 0, 0.9, 0))
  if (!short) {
    const stud = geo('stud', () => new TorusGeometry(0.14, 0.025, 6, 12))
    for (let i = 0; i < 4; i++) g.add(part(stud, dark, 0, -1.2 - i * 0.45, 0, Math.PI / 2))
    g.add(part(geo('butt', () => new ConeGeometry(0.14, 0.4, 8)), metal, 0, -3.3, 0, Math.PI))
  }
}

// Collar + socket the head sits in, with a glowing gem.
function socket(g, s) {
  const metal = mat(s.accent ?? '#c8ccd6', s.glow, 0.7, 0.35)
  g.add(part(geo('socket', () => new CylinderGeometry(0.2, 0.17, 0.85, 10)), mat('#2c3e5c', null, 0.5), 0, HEAD_Y + 0.05, 0))
  g.add(part(geo('collar2', () => new CylinderGeometry(0.26, 0.26, 0.12, 12)), metal, 0, HEAD_Y + 0.5, 0))
  g.add(part(geo('collar3', () => new CylinderGeometry(0.26, 0.26, 0.12, 12)), metal, 0, HEAD_Y - 0.4, 0))
  g.add(part(geo('socketgem', () => new OctahedronGeometry(0.12)), mat(s.accent ?? '#ffffff', s.glow ?? s.accent, 0.2), 0, HEAD_Y + 0.05, 0.22))
}

// Blade body + an accent inlay + a pair of rivets on the near face.
function blade(g, s, shape, inlay, depth = 0.17, y = HEAD_Y) {
  g.add(part(geo(`slab:${shape.uuid}`, () => slab(shape, depth)), mat(s.head, s.glow, 0.55, 0.4), 0, y, 0))
  if (inlay) g.add(part(geo(`inlay:${inlay.uuid}`, () => slab(inlay, depth + 0.07, 0.015)), mat(s.accent ?? '#ffffff', s.glow, 0.6, 0.35), 0, y, 0))
}

const rivet = (g, s, x, y, z) => g.add(part(geo('rivet', () => new SphereGeometry(0.06, 6, 5)), mat(s.accent ?? '#c8ccd6', null, 0.7), x, y, z))

const tip = (g, s, y, len = 1.2, r = 0.17) => g.add(part(geo(`tip${len}${r}`, () => new ConeGeometry(r, len, 5)), mat(s.accent ?? s.head, s.glow, 0.6, 0.35), 0, y - len / 2, 0, Math.PI, Math.PI / 5, 0))

// Profiles are cached by builder + args so identical heads share geometry.
const profiles = new Map()
function profile(key, make) {
  if (!profiles.has(key)) profiles.set(key, make())
  return profiles.get(key)
}

const BUILDERS = {
  axe(g, s) {
    socket(g, s)
    blade(g, s, profile('bearded1', () => bearded(1, 1)), profile('bearded1i', () => bearded(1, 0.55)))
    rivet(g, s, 0.1, HEAD_Y + 0.25, 0.4)
    rivet(g, s, 0.1, HEAD_Y - 0.25, 0.4)
    rivet(g, s, -0.1, HEAD_Y + 0.25, 0.4)
    rivet(g, s, -0.1, HEAD_Y - 0.25, 0.4)
    // spike on the back of the head
    g.add(part(geo('backspike', () => new ConeGeometry(0.13, 0.55, 6)), mat(s.accent ?? s.head, s.glow, 0.6), 0, HEAD_Y, -0.4, -Math.PI / 2))
  },
  twin(g, s) {
    socket(g, s)
    blade(g, s, profile('bearded1', () => bearded(1, 1)), profile('bearded1i', () => bearded(1, 0.55)))
    blade(g, s, profile('bearded-1', () => bearded(-1, 1)), profile('bearded-1i', () => bearded(-1, 0.55)))
    tip(g, s, HEAD_Y - 0.5, 0.8, 0.14)
  },
  hook(g, s) {
    socket(g, s)
    blade(g, s, profile('bearded1h', () => bearded(1, 0.92)), profile('bearded1hi', () => bearded(1, 0.5)))
    g.add(part(geo('beak', () => slab(beak(), 0.14, 0.03)), mat(s.accent ?? s.head, s.glow, 0.6, 0.35), 0, HEAD_Y, 0))
    tip(g, s, HEAD_Y - 0.5, 0.7, 0.13)
  },
  saw(g, s) {
    socket(g, s)
    blade(g, s, profile('cleaver1', () => cleaver(1)), profile('cleaver1i', () => cleaver(0.55)), 0.15)
    rivet(g, s, 0.1, HEAD_Y + 0.6, 0.35)
    rivet(g, s, 0.1, HEAD_Y - 0.6, 0.35)
  },
  halberd(g, s) {
    socket(g, s)
    blade(g, s, profile('bearded1b', () => bearded(1, 0.9)), profile('bearded1bi', () => bearded(1, 0.5)))
    blade(g, s, profile('bearded-1s', () => bearded(-1, 0.55)), null, 0.12)
    tip(g, s, HEAD_Y - 0.5, 1.5, 0.19)
  },
  maul(g, s) {
    socket(g, s)
    blade(g, s, profile('maulhead', () => roundRect(-0.55, -0.55, 1.05, 0.55, 0.14)), profile('maulinlay', () => roundRect(-0.3, -0.3, 0.8, 0.3, 0.1)), 0.9, HEAD_Y - 0.05)
    // bands round the head
    for (const y of [-0.42, 0.42]) g.add(part(geo('maulband', () => new CylinderGeometry(0.3, 0.3, 0.1, 10)), mat(s.accent ?? '#c8ccd6', s.glow, 0.7), 0, HEAD_Y - 0.05 + y, 0))
    blade(g, s, profile('bearded1m', () => bearded(1, 0.55)), null, 0.3, HEAD_Y - 0.05)
  },
  crescent(g, s) {
    socket(g, s)
    g.add(part(geo('neck', () => slab(roundRect(0.1, -0.2, 0.95, 0.2, 0.08), 0.16, 0.03)), mat(s.accent ?? s.head, s.glow, 0.6), 0, HEAD_Y, 0))
    blade(g, s, profile('sickle1', () => sickle(1)), profile('sickle1i', () => sickle(0.6)), 0.17)
    tip(g, s, HEAD_Y - 0.5, 0.7, 0.13)
  },
  disc(g, s) {
    socket(g, s)
    g.add(part(geo('neck', () => slab(roundRect(0.1, -0.2, 0.95, 0.2, 0.08), 0.16, 0.03)), mat(s.accent ?? s.head, s.glow, 0.6), 0, HEAD_Y, 0))
    blade(g, s, profile('disc1', () => sawDisc(1)), profile('disc1i', () => sawDisc(0.62)), 0.14)
    g.add(part(geo('hub', () => new TorusGeometry(0.34, 0.06, 6, 16)), mat(s.accent ?? '#ffffff', s.glow, 0.6), 0, HEAD_Y, 0.95, 0, Math.PI / 2, 0))
    g.add(part(geo('hubgem', () => new SphereGeometry(0.2, 12, 10)), mat('#ffffff', s.glow ?? s.accent, 0.2), 0, HEAD_Y, 0.95))
  },
  guillotine(g, s) {
    socket(g, s)
    blade(g, s, profile('guill1', () => guillotine(1)), profile('guill1i', () => guillotine(0.6)), 0.16)
    g.add(part(geo('guilltrim', () => slab(roundRect(0.1, 0.62, 1.6, 0.82, 0.05), 0.24, 0.02)), mat(s.accent ?? '#e8d8b0', null, 0.5), 0, HEAD_Y, 0))
    rivet(g, s, 0.12, HEAD_Y + 0.4, 0.5)
    rivet(g, s, 0.12, HEAD_Y + 0.4, 1.2)
  },
  // Sword: short hilt, a winged crossguard, then the blade down the handle line with a
  // glowing fuller. `wood` is the hilt, `head` the blade.
  sword(g, s) {
    const metal = mat(s.accent ?? '#c89a40', s.glow, 0.7, 0.35)
    g.add(part(geo('guard', () => slab(roundRect(-0.65, -0.12, 0.65, 0.12, 0.05), 0.26, 0.03)), metal, 0, -1.0, 0))
    for (const z of [-0.7, 0.7]) g.add(part(geo('guardball', () => new SphereGeometry(0.15, 8, 6)), metal, 0, -1.0, z))
    g.add(part(geo('guardgem', () => new OctahedronGeometry(0.17)), mat(s.accent ?? '#fff', s.glow ?? s.accent, 0.2), 0, -1.0, 0.0))
    blade(g, s, profile('sword1', () => swordBlade(1)), profile('sword1i', () => swordBlade(0.28)), 0.13, 0)
  },
}

// Builds the model group (named 'axe') for chopper `id`; falls back to the starter axe.
export function buildAxe(id) {
  const info = CHOPPERS.find((c) => c.id === id) ?? CHOPPERS.find((c) => c.id === STARTING_CHOPPER)
  const s = info.model
  const g = new Group()
  g.name = 'axe'
  shaft(g, s, s.type === 'sword')
  ;(BUILDERS[s.type] ?? BUILDERS.axe)(g, s)
  return g
}
