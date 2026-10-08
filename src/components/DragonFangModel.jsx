// Dragon's Fang display model (featured chopper pad, world/SouthArea.jsx): a tall
// faceted crystal blade with a glowing cyan fuller, a dragon-wing crossguard, a
// fang pommel and a coiled grip, wrapped in animation: the whole sword spins and
// hovers, three rune rings orbit it at different tilts, shards circle the blade,
// violet/cyan embers rise off it in additive particles, flickering lightning arcs
// crackle along the edge and a halo + ground ring pulse. Hilt at the bottom, tip up,
// origin at the sword's centre.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const VIOLET = '#9a5cff'
const DEEP = '#3a1a7a'
const CYAN = '#4ae0e0'
const PINK = '#ff6af0'

let glowTex
function glowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(0.35, 'rgba(255,255,255,0.5)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 64, 64)
  glowTex = new THREE.CanvasTexture(c)
  return glowTex
}

// Blade outline (x across, y along): wide at the guard, a slight belly, a long taper.
function bladeGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, -1.0)
  s.lineTo(0.2, -0.95)
  s.lineTo(0.27, 0.2)
  s.lineTo(0.2, 1.3)
  s.lineTo(0, 1.95)
  s.lineTo(-0.2, 1.3)
  s.lineTo(-0.27, 0.2)
  s.lineTo(-0.2, -0.95)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 2 })
  g.translate(0, 0, -0.05)
  // vertex-colour gradient: deep violet at the guard -> bright cyan at the tip
  const pos = g.attributes.position
  const col = new Float32Array(pos.count * 3)
  const lo = new THREE.Color(DEEP)
  const mid = new THREE.Color(VIOLET)
  const hi = new THREE.Color('#9af4ff')
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp((pos.getY(i) + 1) / 3, 0, 1)
    if (t < 0.55) c.copy(lo).lerp(mid, t / 0.55)
    else c.copy(mid).lerp(hi, (t - 0.55) / 0.45)
    col.set([c.r, c.g, c.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}

// One curved dragon wing of the crossguard, sweeping out (+x) and up.
function wingGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, 0.05)
  s.bezierCurveTo(0.35, 0.05, 0.75, 0.2, 1.05, 0.62)
  s.lineTo(0.88, 0.5)
  s.lineTo(0.92, 0.28)
  s.lineTo(0.7, 0.3)
  s.lineTo(0.62, 0.08)
  s.lineTo(0.4, 0.1)
  s.lineTo(0.3, -0.12)
  s.bezierCurveTo(0.18, -0.2, 0.06, -0.16, 0, -0.1)
  s.closePath()
  return new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 })
}

const PARTICLES = 90
const PALETTE = [CYAN, VIOLET, PINK, '#ffffff'].map((c) => new THREE.Color(c))

export default function DragonFangModel() {
  const root = useRef()
  const ringA = useRef()
  const ringB = useRef()
  const ringC = useRef()
  const shards = useRef()
  const halo = useRef()
  const floorRing = useRef()
  const fuller = useRef()
  const arcs = useRef()
  const points = useRef()

  const blade = useMemo(bladeGeometry, [])
  const wing = useMemo(wingGeometry, [])

  const sim = useMemo(() => {
    const pos = new Float32Array(PARTICLES * 3)
    const col = new Float32Array(PARTICLES * 3)
    const life = new Float32Array(PARTICLES)
    const seed = new Float32Array(PARTICLES * 2)
    for (let i = 0; i < PARTICLES; i++) {
      life[i] = Math.random()
      seed[i * 2] = Math.random() * Math.PI * 2
      seed[i * 2 + 1] = 0.25 + Math.random() * 0.8
      const c = PALETTE[i % 4]
      col.set([c.r, c.g, c.b], i * 3)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return { geo, pos, life, seed }
  }, [])

  // Lightning arcs: short jagged polylines re-rolled a few times a second.
  const arcGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 2 * 4 * 6), 3))
    return g
  }, [])
  const arcTimer = useRef(0)

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (root.current) {
      root.current.rotation.y = t * 0.9
      root.current.position.y = 2.95 + Math.sin(t * 1.8) * 0.14
      root.current.rotation.z = Math.sin(t * 0.9) * 0.05
    }
    if (ringA.current) ringA.current.rotation.z = t * 1.2
    if (ringB.current) ringB.current.rotation.z = -t * 0.8
    if (ringC.current) ringC.current.rotation.z = t * 0.5
    if (shards.current) {
      shards.current.rotation.y = -t * 1.6
      shards.current.position.y = Math.sin(t * 2.4) * 0.12
    }
    const pulse = 0.5 + 0.5 * Math.sin(t * 3)
    if (halo.current) {
      halo.current.material.opacity = 0.35 + pulse * 0.25
      const sc = 4.4 + pulse * 0.8
      halo.current.scale.set(sc, sc * 1.5, 1)
    }
    if (fuller.current) fuller.current.material.emissiveIntensity = 1.4 + pulse * 1.4
    if (floorRing.current) {
      const k = (t * 0.45) % 1
      floorRing.current.scale.setScalar(0.6 + k * 1.5)
      floorRing.current.material.opacity = (1 - k) * 0.7
    }

    // embers rise in a spiral around the blade, fading in then out via size-less
    // colour fade (additive blending: darker = more transparent)
    const { pos, life, seed, geo } = sim
    const col = geo.attributes.color
    for (let i = 0; i < PARTICLES; i++) {
      life[i] += dt * (0.22 + seed[i * 2 + 1] * 0.2)
      if (life[i] > 1) life[i] -= 1
      const u = life[i]
      const a = seed[i * 2] + u * 5 + t * 0.6
      const r = 0.35 + u * 0.55 * seed[i * 2 + 1]
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = -1.4 + u * 4.2
      pos[i * 3 + 2] = Math.sin(a) * r
      const fade = Math.sin(u * Math.PI)
      const p = PALETTE[i % 4]
      col.setXYZ(i, p.r * fade, p.g * fade, p.b * fade)
    }
    geo.attributes.position.needsUpdate = true
    col.needsUpdate = true

    arcTimer.current -= dt
    if (arcTimer.current <= 0 && arcs.current) {
      arcTimer.current = 0.07 + Math.random() * 0.1
      const a = arcGeo.attributes.position.array
      let n = 0
      for (let k = 0; k < 4; k++) {
        const side = k % 2 ? 1 : -1
        let x = side * 0.28
        let y = -0.6 + Math.random() * 1.8
        let z = (Math.random() - 0.5) * 0.1
        for (let s = 0; s < 6; s++) {
          const nx = x + side * (0.1 + Math.random() * 0.25)
          const ny = y + (Math.random() - 0.3) * 0.35
          const nz = z + (Math.random() - 0.5) * 0.3
          if (s < 5) {
            a[n++] = x; a[n++] = y; a[n++] = z
            a[n++] = nx; a[n++] = ny; a[n++] = nz
          }
          x = nx; y = ny; z = nz
        }
        n += 3 * 2 // keep stride (unused segment collapses to origin)
      }
      arcGeo.attributes.position.needsUpdate = true
      arcs.current.visible = Math.random() > 0.2
    }
  })

  const crystalMat = (
    <meshStandardMaterial vertexColors metalness={0.35} roughness={0.2} emissive={VIOLET} emissiveIntensity={0.55} transparent opacity={0.95} />
  )
  const metal = <meshStandardMaterial color="#2a1a4a" metalness={0.8} roughness={0.3} emissive={DEEP} emissiveIntensity={0.4} />
  const gold = <meshStandardMaterial color="#e8c870" metalness={0.9} roughness={0.25} emissive="#b08020" emissiveIntensity={0.3} />

  return (
    <group>
      {/* pulsing ground ring on the pad */}
      <mesh ref={floorRing} position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <ringGeometry args={[0.85, 0.95, 40]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>

      <group ref={root} position={[0, 2.95, 0]}>
        {/* blade + glowing fuller + edge highlight */}
        <mesh geometry={blade} castShadow>{crystalMat}</mesh>
        <mesh ref={fuller} position={[0, 0.45, 0]} scale={[1, 1, 1]}>
          <boxGeometry args={[0.07, 2.3, 0.3]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.55, 0]} scale={[0.12, 0.55, 0.32]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#ffffff" emissive={CYAN} emissiveIntensity={2} toneMapped={false} />
        </mesh>

        {/* dragon-wing crossguard with a central eye gem */}
        {[1, -1].map((s) => (
          <mesh key={s} geometry={wing} position={[s * 0.02, -1.0, -0.05]} scale={[s, 1, 1]} castShadow>
            {metal}
          </mesh>
        ))}
        <mesh position={[0, -1.03, 0.12]} scale={[0.17, 0.26, 0.12]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={PINK} emissive={PINK} emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <mesh position={[0, -1.03, 0]}>
          <boxGeometry args={[0.5, 0.14, 0.2]} />
          {gold}
        </mesh>

        {/* grip with gold rings, fang pommel */}
        <mesh position={[0, -1.6, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.95, 10]} />
          <meshStandardMaterial color="#1e1230" metalness={0.3} roughness={0.7} />
        </mesh>
        {[-1.35, -1.6, -1.85].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.1, 0.025, 6, 12]} />
            {gold}
          </mesh>
        ))}
        <mesh position={[0, -2.2, 0]} rotation={[Math.PI, 0, 0]} scale={[1, 1, 1]} castShadow>
          <coneGeometry args={[0.15, 0.6, 5]} />
          {gold}
        </mesh>
        <mesh position={[0, -2.0, 0]}>
          <sphereGeometry args={[0.15, 10, 8]} />
          {gold}
        </mesh>

        {/* orbiting rune rings, each on its own tilt */}
        {[[ringA, 1.25, 0.12, 0.5, CYAN], [ringB, 1.55, 0.1, -0.7, VIOLET], [ringC, 1.9, 0.08, 1.1, PINK]].map(([ref, r, tube, tilt, color], i) => (
          <group key={i} rotation={[Math.PI / 2 + tilt * 0.4, 0, tilt * 0.5]} position={[0, 0.2, 0]}>
            <group ref={ref}>
              <mesh>
                <torusGeometry args={[r, tube * 0.3, 6, 56]} />
                <meshBasicMaterial color={color} transparent opacity={0.75} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <mesh key={k} position={[Math.cos((k / 6) * Math.PI * 2) * r, Math.sin((k / 6) * Math.PI * 2) * r, 0]} rotation={[0, 0, (k / 6) * Math.PI * 2]} scale={[tube * 1.1, tube * 1.9, tube * 0.5]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshBasicMaterial color={color} toneMapped={false} />
                </mesh>
              ))}
            </group>
          </group>
        ))}

        {/* crystal shards circling the blade */}
        <group ref={shards}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2
            const h = 0.3 + (i % 3) * 0.5
            return (
              <mesh key={i} position={[Math.cos(a) * 0.95, h - 0.4, Math.sin(a) * 0.95]} rotation={[0.4, a, 0.3]} scale={[0.07, 0.24 + (i % 2) * 0.1, 0.07]}>
                <octahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color={i % 2 ? CYAN : VIOLET} emissive={i % 2 ? CYAN : VIOLET} emissiveIntensity={1.4} toneMapped={false} />
              </mesh>
            )
          })}
        </group>

        {/* lightning arcs along the edge */}
        <lineSegments ref={arcs} geometry={arcGeo}>
          <lineBasicMaterial color="#d6faff" transparent opacity={0.95} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
        </lineSegments>

        {/* rising embers (local to the sword so they sway with it) */}
        <points ref={points} geometry={sim.geo} frustumCulled={false}>
          <pointsMaterial size={0.13} vertexColors map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} sizeAttenuation />
        </points>

        <sprite ref={halo} position={[0, 0.3, -0.2]} renderOrder={1}>
          <spriteMaterial map={glowTexture()} color={VIOLET} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
      </group>
    </group>
  )
}
