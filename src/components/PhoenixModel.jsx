// Blazing Phoenix: a procedural fire bird — gradient body with a glowing chest
// chevron, fanned feather wings (red -> orange -> yellow), a flame crest, long
// trailing tail plumes, plus additive flame / ember particles and a halo.
// Used for the featured display on the south lawn (`display`) and as the
// equipped pet model (components/petModels.jsx). Faces +Z, feet on y = 0.
//   flap   — wing beat speed in rad/s (display idles slowly, flying pets beat fast)
//   lite   — fewer particles, for followers
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// --- shared resources --------------------------------------------------------------
let glowTex
function glowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 64, 64)
  glowTex = new THREE.CanvasTexture(c)
  return glowTex
}

const PALETTES = {
  outer: ['#a80f0c', '#ff3d12', '#ff9a1a', '#ffe14d'],
  inner: ['#ff5a14', '#ff9a1a', '#ffd23a', '#fff6a8'],
  tail: ['#c4180f', '#ff4a14', '#ffa820', '#fff08a'],
}

// A leaf-shaped feather along +Y (length `len`, half-width `wid`) with the
// palette's four stops painted as a vertex-colour gradient base -> tip.
const featherCache = new Map()
function featherGeo(len, wid, palette) {
  const key = `${len}|${wid}|${palette}`
  if (featherCache.has(key)) return featherCache.get(key)
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(wid * 1.2, len * 0.15, wid * 1.0, len * 0.7, 0, len)
  s.bezierCurveTo(-wid * 1.0, len * 0.7, -wid * 1.2, len * 0.15, 0, 0)
  const geo = new THREE.ShapeGeometry(s, 10)
  const stops = PALETTES[palette].map((c) => new THREE.Color(c))
  const pos = geo.attributes.position
  const col = new Float32Array(pos.count * 3)
  const tmp = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const u = Math.min(1, Math.max(0, pos.getY(i) / len)) * (stops.length - 1)
    const k = Math.min(stops.length - 2, Math.floor(u))
    tmp.copy(stops[k]).lerp(stops[k + 1], u - k)
    col.set([tmp.r, tmp.g, tmp.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  featherCache.set(key, geo)
  return geo
}

const fireMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false })

// Round body/head gradient (red belly -> orange flanks -> golden chest).
function bodyGeo() {
  const geo = new THREE.SphereGeometry(0.5, 24, 18)
  const pos = geo.attributes.position
  const col = new Float32Array(pos.count * 3)
  const lo = new THREE.Color('#c4180f')
  const mid = new THREE.Color('#ff5a14')
  const hi = new THREE.Color('#ffc42a')
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) + 0.5
    if (y < 0.5) c.copy(lo).lerp(mid, y * 2)
    else c.copy(mid).lerp(hi, (y - 0.5) * 2)
    if (pos.getZ(i) > 0.25) c.lerp(hi, 0.45) // bright chest
    col.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return geo
}

const sharedGeo = {
  body: bodyGeo(),
  sphere: new THREE.SphereGeometry(1, 14, 10),
  cone: new THREE.ConeGeometry(1, 1, 8),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 8),
  diamond: new THREE.OctahedronGeometry(1, 0),
}
const bodyMat = new THREE.MeshStandardMaterial({
  vertexColors: true, roughness: 0.55, emissive: '#ff4a10', emissiveIntensity: 0.55, toneMapped: false,
})
const mat = {
  beak: new THREE.MeshStandardMaterial({ color: '#ffb81c', emissive: '#ff8a10', emissiveIntensity: 0.6, roughness: 0.4, toneMapped: false }),
  leg: new THREE.MeshStandardMaterial({ color: '#ff8a1a', emissive: '#ff5a00', emissiveIntensity: 0.5, roughness: 0.5, toneMapped: false }),
  eye: new THREE.MeshBasicMaterial({ color: '#fff7b0', toneMapped: false }),
  pupil: new THREE.MeshBasicMaterial({ color: '#2a0600' }),
  gold: new THREE.MeshBasicMaterial({ color: '#ffe04a', toneMapped: false }),
  red: new THREE.MeshBasicMaterial({ color: '#e8241c', toneMapped: false }),
}

// --- particles --------------------------------------------------------------------
const PCOL = [new THREE.Color('#fff3a0'), new THREE.Color('#ffa21a'), new THREE.Color('#e8300e'), new THREE.Color('#5a0c04')]
const _c = new THREE.Color()

function spawn(p, i, src) {
  // Emit from the body, the wing sweep or the tail, in the phoenix's local space.
  const r = Math.random()
  let x, y, z
  if (r < 0.4) {
    x = (Math.random() - 0.5) * 0.5
    y = 0.4 + Math.random() * 0.7
    z = (Math.random() - 0.5) * 0.5
  } else if (r < 0.75) {
    const side = Math.random() < 0.5 ? -1 : 1
    x = side * (0.3 + Math.random() * 1.1)
    y = 0.7 + Math.random() * 0.9
    z = (Math.random() - 0.5) * 0.3
  } else {
    x = (Math.random() - 0.5) * 0.7
    y = 0.1 + Math.random() * 0.5
    z = -0.3 - Math.random() * 0.9
  }
  p.pos.set([x, y, z], i * 3)
  p.vel.set([(Math.random() - 0.5) * 0.25, src.rise[0] + Math.random() * (src.rise[1] - src.rise[0]), (Math.random() - 0.5) * 0.25], i * 3)
  p.life[i] = src.life[0] + Math.random() * (src.life[1] - src.life[0])
  p.age[i] = 0
}

function FireParticles({ count, size, rise, life, additive = true, swirl = 1 }) {
  const ref = useRef()
  const state = useMemo(() => {
    const p = {
      pos: new Float32Array(count * 3),
      vel: new Float32Array(count * 3),
      col: new Float32Array(count * 3),
      life: new Float32Array(count),
      age: new Float32Array(count),
    }
    const src = { rise, life }
    for (let i = 0; i < count; i++) {
      spawn(p, i, src)
      p.age[i] = Math.random() * p.life[i] // start spread over the cycle
    }
    return { p, src }
  }, [count]) // eslint-disable-line react-hooks/exhaustive-deps
  useFrame((_, delta) => {
    const g = ref.current?.geometry
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const { p, src } = state
    for (let i = 0; i < count; i++) {
      p.age[i] += dt
      if (p.age[i] >= p.life[i]) spawn(p, i, src)
      const u = p.age[i] / p.life[i]
      const k = i * 3
      p.pos[k] += (p.vel[k] + Math.sin(p.age[i] * 4 + i) * 0.18 * swirl) * dt
      p.pos[k + 1] += p.vel[k + 1] * dt
      p.pos[k + 2] += (p.vel[k + 2] + Math.cos(p.age[i] * 3.3 + i) * 0.18 * swirl) * dt
      // yellow -> orange -> red -> dark, fading in over the first few percent
      const s = u * (PCOL.length - 1)
      const j = Math.min(PCOL.length - 2, Math.floor(s))
      _c.copy(PCOL[j]).lerp(PCOL[j + 1], s - j)
      const fade = Math.min(1, u * 12) * (1 - u)
      p.col[k] = _c.r * fade
      p.col[k + 1] = _c.g * fade
      p.col[k + 2] = _c.b * fade
    }
    g.attributes.position.needsUpdate = true
    g.attributes.color.needsUpdate = true
  })
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={state.p.pos} count={count} itemSize={3} usage={THREE.DynamicDrawUsage} />
        <bufferAttribute attach="attributes-color" array={state.p.col} count={count} itemSize={3} usage={THREE.DynamicDrawUsage} />
      </bufferGeometry>
      <pointsMaterial
        map={glowTexture()}
        size={size}
        vertexColors
        transparent
        depthWrite={false}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
        toneMapped={false}
      />
    </points>
  )
}

// --- wings, tail, crest --------------------------------------------------------------
const WING_LEN = [0.7, 0.92, 1.08, 1.12, 1.04, 0.88, 0.66]

function Wing({ innerRef, feathers }) {
  // +X wing; the left one is this mirrored. Feather i fans from near-vertical
  // (i = 0) to hanging out/down (i = last), each with a lighter inner layer.
  return (
    <group ref={innerRef}>
      <mesh geometry={sharedGeo.sphere} material={mat.red} scale={[0.2, 0.12, 0.06]} position={[0.1, 0.02, 0]} />
      {WING_LEN.map((len, i) => {
        const a = -(0.35 + (i / (WING_LEN.length - 1)) * 1.75)
        return (
          <group key={i} ref={(g) => { feathers.current[i] = g }} rotation={[0, 0, a]} position={[0, 0, -0.005 * i]}>
            <mesh geometry={featherGeo(len, 0.14, 'outer')} material={fireMat} />
            <mesh geometry={featherGeo(len * 0.62, 0.095, 'inner')} material={fireMat} position={[0, 0.02, 0.01]} />
          </group>
        )
      })}
    </group>
  )
}

const TAIL = [-0.95, -0.5, 0, 0.5, 0.95]

// --- the bird -----------------------------------------------------------------------
export default function PhoenixModel({ display = false, flap = 2.4, lite = false }) {
  const root = useRef()
  const wingR = useRef()
  const wingL = useRef()
  const fR = useRef([])
  const fL = useRef([])
  const head = useRef()
  const plumes = useRef([])
  const crest = useRef([])
  const halo = useRef()
  const floorGlow = useRef()
  const sparks = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Wing beat: the display idles, then every few seconds gives a big flap.
    const big = display ? Math.pow(Math.max(0, Math.sin(t * 0.7)), 3) : 1
    const beat = Math.sin(t * flap) * (display ? 0.12 + 0.4 * big : 0.5)
    const lift = display ? 0.1 + 0.25 * big : 0.18
    if (wingR.current) {
      wingR.current.rotation.z = lift + beat * 0.6
      wingR.current.rotation.y = -0.15 - beat * 0.15
    }
    if (wingL.current) {
      wingL.current.rotation.z = lift + beat * 0.6
      wingL.current.rotation.y = -0.15 - beat * 0.15
    }
    // Feathers lag behind the arm so the wing ripples.
    for (const set of [fR.current, fL.current]) {
      set.forEach((f, i) => {
        if (f) f.rotation.z = -(0.35 + (i / (WING_LEN.length - 1)) * 1.75) + Math.sin(t * flap - i * 0.45) * 0.1 * (0.4 + (display ? big : 1))
      })
    }
    if (head.current) {
      head.current.rotation.y = display ? Math.sin(t * 0.8) * 0.35 : Math.sin(t * 1.3) * 0.12
      head.current.rotation.x = Math.sin(t * 1.7) * 0.06
    }
    plumes.current.forEach((p, i) => {
      if (!p) return
      p.rotation.y = TAIL[i] * 0.55 + Math.sin(t * 2.1 + i * 0.9) * 0.1
      p.rotation.x = Math.sin(t * 2.7 + i * 1.3) * 0.06
    })
    crest.current.forEach((c, i) => {
      if (!c) return
      const f = 1 + Math.sin(t * 9 + i * 1.7) * 0.12
      c.scale.set(1, f, 1)
    })
    const pulse = 1 + Math.sin(t * 3.2) * 0.1
    if (halo.current) halo.current.scale.setScalar((display ? 4.6 : 3.2) * pulse)
    if (floorGlow.current) floorGlow.current.scale.setScalar(2.4 * pulse)
    if (sparks.current) sparks.current.rotation.y = t * 0.9
    if (root.current) root.current.rotation.x = Math.sin(t * flap) * (display ? 0.02 : 0.05) // body heave with each beat
  })

  return (
    <group>
      {/* additive glow behind the bird and on the ground beneath it */}
      <sprite ref={halo} position={[0, 0.85, -0.25]} renderOrder={1}>
        <spriteMaterial map={glowTexture()} color="#ff7a1a" transparent opacity={display ? 0.55 : 0.4} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      {display && (
        <mesh ref={floorGlow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} renderOrder={1}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={glowTexture()} color="#ff5a14" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      )}
      {display && (
        <group ref={sparks} position={[0, 0.9, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} geometry={sharedGeo.diamond} material={i % 2 ? mat.gold : mat.red} scale={0.06} position={[Math.cos((i * Math.PI) / 2) * 1.5, Math.sin(i * 1.7) * 0.4, Math.sin((i * Math.PI) / 2) * 1.5]} />
          ))}
        </group>
      )}

      <group ref={root}>
        {/* legs + talons */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.13, 0, 0.02]}>
            <mesh geometry={sharedGeo.cyl} material={mat.leg} scale={[0.035, 0.34, 0.035]} position={[0, 0.2, 0]} />
            {[-0.07, 0, 0.07].map((tx, k) => (
              <mesh key={k} geometry={sharedGeo.cone} material={mat.beak} scale={[0.03, 0.17, 0.03]} position={[tx, 0.025, 0.07]} rotation={[Math.PI / 2 + 0.2, 0, tx * 3]} />
            ))}
          </group>
        ))}

        {/* body + glowing chest chevrons */}
        <mesh geometry={sharedGeo.body} material={bodyMat} scale={[0.62, 0.82, 0.58]} position={[0, 0.68, 0]} rotation={[0.12, 0, 0]} castShadow />
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={sharedGeo.diamond} material={i % 2 ? mat.red : mat.gold} scale={[0.14 - i * 0.02, 0.1, 0.03]} position={[0, 0.88 - i * 0.17, 0.3 - i * 0.015]} />
        ))}

        {/* neck + head */}
        <group ref={head} position={[0, 1.18, 0.1]}>
          <mesh geometry={sharedGeo.sphere} material={bodyMat} scale={0.2} castShadow />
          <mesh geometry={sharedGeo.cone} material={mat.beak} scale={[0.07, 0.24, 0.07]} position={[0, -0.03, 0.26]} rotation={[Math.PI / 2, 0, 0]} />
          {[-1, 1].map((sx) => (
            <group key={sx} position={[sx * 0.1, 0.05, 0.15]}>
              <mesh geometry={sharedGeo.sphere} material={mat.eye} scale={[0.05, 0.06, 0.035]} />
              <mesh geometry={sharedGeo.sphere} material={mat.pupil} scale={[0.022, 0.035, 0.02]} position={[0, 0, 0.025]} />
            </group>
          ))}
          {/* cheek tufts */}
          {[-1, 1].map((sx) => (
            <mesh key={sx} geometry={featherGeo(0.22, 0.05, 'inner')} material={fireMat} position={[sx * 0.18, -0.03, 0.02]} rotation={[0.2, sx * 0.4, -sx * 1.9]} />
          ))}
          {/* flame crest fanning up and back */}
          {[-2, -1, 0, 1, 2].map((k, i) => (
            <group key={k} rotation={[0, k * 0.28, 0]} position={[0, 0.16, -0.02]}>
              <group ref={(g) => { crest.current[i] = g }}>
                <mesh geometry={featherGeo(0.42 - Math.abs(k) * 0.05, 0.065, 'outer')} material={fireMat} rotation={[-0.75, 0, 0]} />
              </group>
            </group>
          ))}
        </group>

        {/* wings */}
        <group position={[0.28, 0.9, 0]}>
          <Wing innerRef={wingR} feathers={fR} />
        </group>
        <group position={[-0.28, 0.9, 0]} scale={[-1, 1, 1]}>
          <Wing innerRef={wingL} feathers={fL} />
        </group>

        {/* tail plumes trailing back and down */}
        <group position={[0, 0.5, -0.3]}>
          {TAIL.map((k, i) => (
            <group key={k} ref={(g) => { plumes.current[i] = g }} rotation={[0, k * 0.55, 0]}>
              <group rotation={[-Math.PI / 2 - 0.55, 0, 0]}>
                <mesh geometry={featherGeo(1.3 - Math.abs(k) * 0.25, 0.1, 'tail')} material={fireMat} />
              </group>
            </group>
          ))}
        </group>

        {/* fire */}
        <FireParticles count={lite ? 22 : 70} size={lite ? 0.22 : 0.3} rise={[0.5, 1.1]} life={[0.8, 1.5]} />
        <FireParticles count={lite ? 10 : 30} size={0.07} rise={[0.9, 1.8]} life={[1.2, 2.4]} swirl={2} />
      </group>
    </group>
  )
}
