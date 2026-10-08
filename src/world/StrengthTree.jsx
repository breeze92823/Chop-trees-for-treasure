import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending, BoxGeometry, BufferGeometry, Object3D, CanvasTexture, Color, CylinderGeometry, Euler, Float32BufferAttribute,
  IcosahedronGeometry, Matrix4, MeshBasicMaterial, MeshStandardMaterial, OctahedronGeometry, Quaternion,
  SphereGeometry, Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { seededRandom } from '../utils/random.js'
import { onPadHit } from '../systems/strengthTrees.js'

// The ten Train Strength trees. Each `kind` is a full look: a twisting,
// tapering trunk with roots and forked branches, leaf clumps built from many
// faceted blobs (or fronds / crystals / flames), plus its own particles and glow.
//
//   h trunk height   wobble/twist trunk curl   branches/reach/size/blobs crown shape
//   shape 'ico' | 'octa' (+ sy stretch)   fronds / weeping / embers  special crowns
//   glow   emissive leaf colour + halo      fx  particles (see TreeFx)
export const KINDS = {
  green: {
    trunk: '#d2691e', leaves: ['#52d83a', '#2fa82c', '#86e84e', '#3fbf30'],
    h: 1.9, wobble: 0.35, twist: 1.2, branches: 5, reach: 1.5, size: 0.8, blobs: 5,
    fx: { mode: 'fall', color: '#9bff6a', count: 10, r: 1.8, h: 3.6, speed: 0.12, size: 0.22 },
  },
  blue: {
    trunk: '#2a1f4a', leaves: ['#2f6df0', '#4f9bff', '#1f4fd0', '#7fb8ff'],
    h: 2.0, wobble: 0.5, twist: 1.6, branches: 5, reach: 1.5, size: 0.75, blobs: 5,
    glow: '#2f6df0', glowAmt: 0.18, halo: '#4f8bff',
    fx: { mode: 'orbit', color: '#8fc4ff', count: 12, r: 1.7, h: 3.4, speed: 0.6, size: 0.2 },
  },
  autumn: {
    trunk: '#4a1a10', leaves: ['#ff5a1f', '#ffb21f', '#e8241c', '#ff8a2a'],
    h: 2.1, wobble: 0.4, twist: 1.0, branches: 6, reach: 1.6, size: 0.8, blobs: 6,
    fx: { mode: 'fall', color: '#ff9a2a', count: 16, r: 1.9, h: 3.9, speed: 0.14, size: 0.26 },
  },
  lilac: {
    trunk: '#6a3a7a', leaves: ['#c58bff', '#ff8fe0', '#9a6af0', '#6fa8ff'],
    h: 2.0, wobble: 0.6, twist: 2.4, branches: 5, reach: 1.6, size: 0.7, blobs: 5,
    glow: '#c58bff', glowAmt: 0.2, halo: '#e0a8ff',
    fx: { mode: 'fall', color: '#ffa8f0', count: 16, r: 1.9, h: 3.8, speed: 0.12, size: 0.24 },
  },
  palm: {
    trunk: '#2a1a10', leaves: ['#1e7a2a', '#2f9e2f', '#124a1c', '#3fbf3a'],
    h: 1.6, wobble: 0.45, twist: 1.0, branches: 4, reach: 1.2, size: 0.9, blobs: 5, fronds: true,
    fx: { mode: 'fall', color: '#a8ff7a', count: 8, r: 1.8, h: 3.4, speed: 0.1, size: 0.2 },
  },
  lava: {
    trunk: '#1a0f0c', leaves: ['#ff3a1a', '#ff8a1a', '#c8160c', '#ffc21a'],
    h: 2.0, wobble: 0.5, twist: 1.8, branches: 6, reach: 1.5, size: 0.75, blobs: 5,
    shape: 'octa', sy: 1.35, embers: true,
    glow: '#ff4a10', glowAmt: 0.55, halo: '#ff5a14', ring: '#ff5a14',
    fx: { mode: 'rise', color: '#ff7a24', count: 30, r: 1.5, h: 4.6, speed: 0.35, size: 0.2 },
  },
  ghost: {
    trunk: '#1c1c22', leaves: ['#f4f4f8', '#c9cbd3', '#9a9ca6', '#ffffff'],
    h: 2.1, wobble: 0.5, twist: 1.4, branches: 6, reach: 1.6, size: 0.8, blobs: 5, weeping: true,
    glow: '#ffffff', glowAmt: 0.12, halo: '#e8ecff', ring: '#ffffff',
    fx: { mode: 'rise', color: '#e8ecff', count: 16, r: 1.5, h: 4.2, speed: 0.15, size: 0.34 },
  },
  ice: {
    trunk: '#6ab8e8', leaves: ['#c8f6ff', '#6fe3ff', '#9fdcff', '#ffffff'],
    h: 1.9, wobble: 0.45, twist: 1.3, branches: 5, reach: 1.5, size: 0.75, blobs: 5,
    shape: 'octa', sy: 1.15, crystal: true,
    glow: '#7fe8ff', glowAmt: 0.4, halo: '#7fe8ff', ring: '#7fe8ff',
    fx: { mode: 'twinkle', color: '#d8fbff', count: 30, r: 1.9, h: 3.8, speed: 2.2, size: 0.24 },
  },
  violet: {
    trunk: '#2a1050', leaves: ['#8a3ff0', '#c03ff0', '#5a2fd0', '#d070ff'],
    h: 2.0, wobble: 0.6, twist: 2.2, branches: 6, reach: 1.55, size: 0.75, blobs: 5,
    glow: '#9a3fff', glowAmt: 0.3, halo: '#b060ff', ring: '#c070ff',
    fx: { mode: 'orbit', color: '#e07aff', count: 16, r: 1.8, h: 3.8, speed: 0.8, size: 0.24 },
  },
  jungle: {
    trunk: '#3a2010', leaves: ['#2f8a2a', '#4fb83a', '#1f6a24', '#6fd04a'],
    h: 2.0, wobble: 0.5, twist: 1.5, branches: 6, reach: 1.6, size: 0.85, blobs: 6,
    fx: { mode: 'twinkle', color: '#e8ff7a', count: 12, r: 1.9, h: 3.6, speed: 1.5, size: 0.2 },
  },
}

const UP = new Vector3(0, 1, 0)
const ONE = new Vector3(1, 1, 1)
const icoGeo = new IcosahedronGeometry(1, 0)
const octaGeo = new OctahedronGeometry(1, 0)

// ----- geometry --------------------------------------------------------------

// Everything is collected per (type, colour) and merged, so a whole tree is a
// handful of draw calls however many blobs and branches it has.
function buildTree(k, seed) {
  const rand = seededRandom(seed)
  const buckets = new Map()
  const push = (type, color, geo) => {
    const key = type + color
    if (!buckets.has(key)) buckets.set(key, { type, color, geos: [] })
    buckets.get(key).geos.push(geo.index ? geo.toNonIndexed() : geo)
  }
  const m = new Matrix4()
  const q = new Quaternion()
  const e = new Euler()
  const place = (type, color, base, pos, scale, rot, order = 'XYZ') => {
    const g = base.clone()
    m.compose(new Vector3(...pos), q.setFromEuler(e.set(rot[0], rot[1], rot[2], order)), new Vector3(...scale))
    g.applyMatrix4(m)
    push(type, color, g)
  }
  const limb = (a, b, r0, r1, color = k.trunk) => {
    const dir = new Vector3().subVectors(b, a)
    const len = dir.length()
    const g = new CylinderGeometry(r1, r0, len, 6, 1)
    m.compose(new Vector3().addVectors(a, b).multiplyScalar(0.5), q.setFromUnitVectors(UP, dir.normalize()), ONE)
    g.applyMatrix4(m)
    push('trunk', color, g)
    const j = new SphereGeometry(r1 * 1.05, 6, 4)
    j.translate(b.x, b.y, b.z)
    push('trunk', color, j)
  }

  // trunk: a curling path, thick at the root and tapering up
  const N = 5
  const phase = rand() * Math.PI * 2
  const pts = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const ang = phase + t * k.twist * Math.PI
    const off = k.wobble * Math.pow(t, 1.2)
    pts.push(new Vector3(Math.cos(ang) * off, k.h * t, Math.sin(ang) * off))
  }
  const rAt = (t) => 0.4 - 0.26 * t
  for (let i = 0; i < N; i++) limb(pts[i], pts[i + 1], rAt(i / N), rAt((i + 1) / N))
  const pointAt = (t) => {
    const f = Math.min(N - 1e-6, t * N)
    const i = Math.floor(f)
    return new Vector3().lerpVectors(pts[i], pts[i + 1], f - i)
  }

  // roots
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rand() * 0.6
    limb(new Vector3(Math.cos(a) * 0.2, 0.32, Math.sin(a) * 0.2), new Vector3(Math.cos(a) * 0.8, 0.0, Math.sin(a) * 0.8), 0.17, 0.05)
  }

  // glowing ember cracks scattered over a charred trunk
  if (k.embers) {
    for (let i = 0; i < 9; i++) {
      const p = pointAt(0.08 + rand() * 0.8)
      const a = rand() * Math.PI * 2
      place('glow', '#ff7a1a', icoGeo, [p.x + Math.cos(a) * 0.24, p.y, p.z + Math.sin(a) * 0.24], [0.06, 0.12 + rand() * 0.1, 0.06], [rand() * 3, rand() * 3, 0])
    }
  }

  const leafColor = (i) => k.leaves[i % k.leaves.length]

  const frondCluster = (c, s) => {
    const n = 7
    for (let f = 0; f < n; f++) {
      const a = (f / n) * Math.PI * 2 + rand() * 0.4
      const len = s * (1.5 + rand() * 0.4)
      place('leaf', leafColor(f + 1), octaGeo,
        [c.x + Math.cos(a) * len * 0.45, c.y - len * 0.1, c.z + Math.sin(a) * len * 0.45],
        [len * 0.55, 0.07, len * 0.17], [0, -a, -0.3 - rand() * 0.2], 'YZX')
    }
    place('leaf', leafColor(0), icoGeo, [c.x, c.y + 0.05, c.z], [s * 0.3, s * 0.22, s * 0.3], [0, 0, 0])
  }

  const cluster = (c, s) => {
    if (k.fronds) return frondCluster(c, s)
    const geo = k.shape === 'octa' ? octaGeo : icoGeo
    const sy = k.sy || 0.82
    for (let j = 0; j < k.blobs; j++) {
      const a = rand() * Math.PI * 2
      const r = s * 0.62 * Math.sqrt(rand())
      const rad = s * (0.5 + rand() * 0.28)
      place('leaf', leafColor(j + Math.floor(rand() * 3)), geo,
        [c.x + Math.cos(a) * r, c.y + (rand() - 0.25) * s * 0.55, c.z + Math.sin(a) * r],
        [rad, rad * sy, rad], [rand() * 3, rand() * 6, rand() * 3])
    }
    // small bright tufts round the rim so the clump reads as layered leaves
    for (let j = 0; j < 4; j++) {
      const a = (j / 4) * Math.PI * 2 + rand()
      const rad = s * 0.3
      place('leaf', leafColor(j * 2 + 1), geo,
        [c.x + Math.cos(a) * s * 0.88, c.y - s * 0.12 + rand() * 0.2, c.z + Math.sin(a) * s * 0.88],
        [rad, rad * sy, rad], [rand() * 3, rand() * 6, rand() * 3])
    }
    if (k.weeping) {
      for (let j = 0; j < 3; j++) {
        const a = rand() * Math.PI * 2
        const rad = s * (0.2 + rand() * 0.1)
        place('leaf', leafColor(j + 2), icoGeo,
          [c.x + Math.cos(a) * s * 0.6, c.y - s * (0.75 + rand() * 0.4), c.z + Math.sin(a) * s * 0.6],
          [rad, rad * 1.6, rad], [0, rand() * 3, 0])
      }
    }
  }

  // forked branches, each ending in a clump
  for (let b = 0; b < k.branches; b++) {
    const start = pointAt(0.3 + 0.62 * (b / k.branches) + rand() * 0.06)
    const yaw = (b / k.branches) * Math.PI * 2 + rand() * 0.7
    const L = k.reach * (0.8 + rand() * 0.4)
    const mid = new Vector3(start.x + Math.cos(yaw) * L * 0.5, start.y + L * 0.32, start.z + Math.sin(yaw) * L * 0.5)
    const tip = new Vector3(start.x + Math.cos(yaw) * L, start.y + L * 0.62, start.z + Math.sin(yaw) * L)
    limb(start, mid, 0.13, 0.095)
    limb(mid, tip, 0.095, 0.05)
    cluster(tip.clone().add(new Vector3(0, k.size * 0.25, 0)), k.size * (0.85 + rand() * 0.2))
    // a short side twig with its own small clump
    const yaw2 = yaw + (rand() > 0.5 ? 0.9 : -0.9)
    const tip2 = new Vector3(mid.x + Math.cos(yaw2) * L * 0.5, mid.y + L * 0.3, mid.z + Math.sin(yaw2) * L * 0.5)
    limb(mid, tip2, 0.07, 0.035)
    cluster(tip2.clone().add(new Vector3(0, k.size * 0.15, 0)), k.size * 0.55)
  }
  // crown
  const top = pts[N]
  limb(top, new Vector3(top.x, top.y + 0.5, top.z), 0.14, 0.06)
  cluster(new Vector3(top.x, top.y + 0.85, top.z), k.size * 1.3)

  return [...buckets.values()].map((b) => ({ type: b.type, color: b.color, geo: mergeGeometries(b.geos) }))
}

// ----- materials -------------------------------------------------------------

const mats = new Map()
function material(k, type, color) {
  const key = `${type}${color}${k.glow}${k.crystal}`
  if (!mats.has(key)) {
    if (type === 'glow') mats.set(key, new MeshBasicMaterial({ color, toneMapped: false }))
    else if (type === 'trunk') mats.set(key, new MeshStandardMaterial({ color, roughness: 0.85, flatShading: true }))
    else {
      mats.set(key, new MeshStandardMaterial({
        color,
        roughness: k.crystal ? 0.25 : 0.75,
        metalness: k.crystal ? 0.15 : 0,
        flatShading: true,
        emissive: new Color(k.glow || '#000000'),
        emissiveIntensity: k.glow ? k.glowAmt ?? 0.4 : 0,
      }))
    }
  }
  return mats.get(key)
}

// ----- glow + particles ------------------------------------------------------

const softMap = (() => {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new CanvasTexture(c)
})()

// Particles animated analytically from the clock, so there's no per-particle
// state. Fade is baked into the vertex colour (additive blending => black = gone).
function TreeFx({ fx }) {
  const data = useMemo(() => {
    const rand = seededRandom(Math.round(fx.speed * 977 + fx.count))
    const seeds = Array.from({ length: fx.count }, () => ({ a: rand() * Math.PI * 2, r: rand(), ph: rand() }))
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(new Float32Array(fx.count * 3), 3))
    geo.setAttribute('color', new Float32BufferAttribute(new Float32Array(fx.count * 3), 3))
    return { seeds, geo, base: new Color(fx.color) }
  }, [fx])
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const pos = data.geo.attributes.position
    const col = data.geo.attributes.color
    const { r: R, h: H, speed, mode } = fx
    data.seeds.forEach((s, i) => {
      let x, y, z, fade = 1
      const u = (t * speed + s.ph) % 1
      if (mode === 'rise' || mode === 'fall') {
        const rad = R * s.r
        const a = s.a + t * 0.3
        x = Math.cos(a) * rad + Math.sin(t * 1.3 + s.ph * 9) * 0.15
        z = Math.sin(a) * rad + Math.cos(t * 1.1 + s.ph * 7) * 0.15
        y = mode === 'rise' ? 0.3 + u * H : 0.3 + (1 - u) * H
        fade = Math.sin(Math.PI * u)
      } else if (mode === 'orbit') {
        const a = s.a + t * speed
        const rad = R * (0.6 + 0.4 * s.r)
        x = Math.cos(a) * rad
        z = Math.sin(a) * rad
        y = H * (0.25 + 0.5 * s.ph) + Math.sin(t * 1.5 + s.ph * 6) * 0.2
        fade = 0.6 + 0.4 * Math.sin(t * 3 + s.ph * 20)
      } else {
        const rad = R * Math.sqrt(s.r)
        x = Math.cos(s.a) * rad
        z = Math.sin(s.a) * rad
        y = 0.4 + H * s.ph
        fade = Math.pow(0.5 + 0.5 * Math.sin(t * speed + s.ph * 40), 3)
      }
      pos.setXYZ(i, x, y, z)
      col.setXYZ(i, data.base.r * fade, data.base.g * fade, data.base.b * fade)
    })
    pos.needsUpdate = true
    col.needsUpdate = true
  })
  return (
    <points ref={ref} geometry={data.geo} frustumCulled={false}>
      <pointsMaterial map={softMap} size={fx.size * 2.2} vertexColors transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
    </points>
  )
}

// Soft light pool on the pad plus a halo around the crown (fake lighting: no
// real point lights, so the scene's light count stays fixed).
function TreeGlow({ k }) {
  const ground = useRef()
  const halo = useRef()
  useFrame(({ clock }) => {
    const p = 0.8 + 0.2 * Math.sin(clock.elapsedTime * 1.8 + k.h * 3)
    if (ground.current) ground.current.opacity = 0.7 * p
    if (halo.current) halo.current.opacity = 0.32 * p
  })
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} renderOrder={2}>
        <planeGeometry args={[5, 5]} />
        <meshBasicMaterial ref={ground} map={softMap} color={k.halo} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <sprite position={[0, k.h + 0.9, 0]} scale={[5.2, 4.4, 1]} renderOrder={2}>
        <spriteMaterial ref={halo} map={softMap} color={k.halo} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </>
  )
}

// Green shiny cubes thrown out of the crown on every landed swing; they arc
// outward, fall, shrink and vanish within ~0.9 s. Pooled in one InstancedMesh.
const BURST_MAX = 90
const BURST_PER_HIT = 22
const BURST_LIFE = 0.9
const BURST_COLORS = ['#4dff2a', '#9bff4a', '#2ee86a', '#c8ff6a'].map((c) => new Color(c))
const burstGeo = new BoxGeometry(1, 1, 1)
const burstMat = new MeshBasicMaterial({ color: '#ffffff', toneMapped: false })

function HitBurst({ k, x, z }) {
  const ref = useRef()
  const pool = useMemo(() => Array.from({ length: BURST_MAX }, () => ({ age: BURST_LIFE, life: 1, p: new Vector3(), v: new Vector3(), s: 0, spin: 0 })), [])
  const next = useRef(0)
  const dummy = useMemo(() => new Object3D(), [])

  useEffect(() => onPadHit((t) => {
    if (t.x !== x || t.z !== z) return
    for (let i = 0; i < BURST_PER_HIT; i++) {
      const idx = next.current++ % BURST_MAX
      const o = pool[idx]
      const a = Math.random() * Math.PI * 2
      const r = Math.random() * 1.3
      o.p.set(Math.cos(a) * r, k.h + 0.6 + Math.random() * 1.3, Math.sin(a) * r)
      const out = 0.6 + Math.random() * 1.6
      o.v.set(Math.cos(a) * out, 0.8 + Math.random() * 2.2, Math.sin(a) * out)
      o.age = 0
      o.life = BURST_LIFE * (0.6 + Math.random() * 0.4)
      o.s = 0.1 + Math.random() * 0.16
      o.spin = Math.random() * 6
      ref.current.setColorAt(idx, BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)])
    }
    ref.current.instanceColor.needsUpdate = true
  }), [pool, k, x, z])

  useFrame((_, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const d = Math.min(dt, 0.05)
    pool.forEach((o, i) => {
      if (o.age >= o.life) {
        dummy.scale.setScalar(0)
      } else {
        o.age += d
        o.v.y -= 6 * d
        o.p.addScaledVector(o.v, d)
        const f = Math.max(0, 1 - o.age / o.life)
        dummy.position.copy(o.p)
        dummy.rotation.set(o.age * o.spin, o.age * o.spin * 0.7, 0)
        dummy.scale.setScalar(o.s * Math.min(1, f * 2.5))
      }
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[burstGeo, burstMat, BURST_MAX]} frustumCulled={false} renderOrder={3} />
}

export default function StrengthTree({ kind, seed, x, z }) {
  const k = KINDS[kind]
  const parts = useMemo(() => buildTree(k, seed), [k, seed])
  return (
    <group>
      <HitBurst k={k} x={x} z={z} />
      {parts.map((p) => (
        <mesh key={p.type + p.color} geometry={p.geo} material={material(k, p.type, p.color)} castShadow={p.type !== 'glow'} />
      ))}
      {k.halo && <TreeGlow k={k} />}
      {k.fx && <TreeFx fx={k.fx} />}
    </group>
  )
}
