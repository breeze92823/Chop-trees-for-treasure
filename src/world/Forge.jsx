import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, CanvasTexture, Object3D, RepeatWrapping, SRGBColorSpace } from 'three'
import { MAT, glow, plastic } from '../materials/world.js'
import { FORGE, LAWN_TOP } from './layout.js'
import { Label, useColliders } from './common.jsx'
import { useGameStore } from '../store/useGameStore.js'

// The Forge: two brown spire towers with lit lanterns flank a dark stepped
// furnace (bomb, chimney, bar-chart plaque) that looks over a lava pool; a
// ramp of slabs on the west, a lamp post, barrels, a sack and a boulder on the
// east. Everything is local to FORGE, the lava pool faces the plaza (-Z).
// Fire: flame cubes, rising embers, fuse sparks, chimney smoke, flickering
// point lights, a scrolling lava texture and soft glow halos.
const Y = LAWN_TOP

const brown = plastic('#7d5a3d', { flatShading: true })
const brownLight = plastic('#946d4a', { flatShading: true })
const brownDark = plastic('#4e3624', { flatShading: true })
const slate = plastic('#3b3c42', { flatShading: true })
const slateLight = plastic('#55565e', { flatShading: true })
const obsidian = plastic('#17171b', { flatShading: true, roughness: 0.4 })
const beam = plastic('#3a2616', { flatShading: true })
const orangeGlow = glow('#ff7a1a', 1.8)
const yellowGlow = glow('#ffd21f', 2)

// --- textures ----------------------------------------------------------------------
let lavaTex
function lavaTexture() {
  if (lavaTex) return lavaTex
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#ff4a00'
  g.fillRect(0, 0, 256, 256)
  let s = 7
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const blob = (color, n, rMin, rMax) => {
    g.fillStyle = color
    for (let i = 0; i < n; i++) {
      const x = rnd() * 256
      const y = rnd() * 256
      const r = rMin + rnd() * (rMax - rMin)
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) {
        g.beginPath()
        g.arc(x + ox, y + oy, r, 0, Math.PI * 2)
        g.fill()
      }
    }
  }
  blob('#c92a00', 18, 14, 30)
  blob('#ff8a10', 26, 8, 22)
  blob('#ffd23a', 18, 4, 11)
  blob('#fff2a0', 8, 2, 5)
  lavaTex = new CanvasTexture(c)
  lavaTex.wrapS = lavaTex.wrapT = RepeatWrapping
  lavaTex.colorSpace = SRGBColorSpace
  return lavaTex
}

let haloTex
function haloTexture() {
  if (haloTex) return haloTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  haloTex = new CanvasTexture(c)
  return haloTex
}

function Halo({ position, color, size, opacity = 0.7, pulse = 0 }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current && pulse) ref.current.material.opacity = opacity * (1 + Math.sin(state.clock.elapsedTime * 7 + position[0]) * pulse)
  })
  return (
    <sprite ref={ref} position={position} scale={[size, size, 1]} renderOrder={2}>
      <spriteMaterial map={haloTexture()} color={color} transparent opacity={opacity} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </sprite>
  )
}

// --- particles ---------------------------------------------------------------------
// Voxel cubes that rise from `origin`, shrink and recycle. One draw call each.
const dummy = new Object3D()
function Particles({ origin, spread = [1, 1], count = 20, rise = 1.5, drift = 0.3, size = 0.14, life = 1.2, color = '#ffb21f', additive = true, grow = false }) {
  const ref = useRef()
  const seed = useMemo(() => {
    const a = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      a[i * 4] = Math.random()
      a[i * 4 + 1] = Math.random() - 0.5
      a[i * 4 + 2] = Math.random() - 0.5
      a[i * 4 + 3] = Math.random() - 0.5
    }
    return a
  }, [count])
  useFrame((state) => {
    const mesh = ref.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const age = (t / life + seed[i * 4]) % 1
      const wob = Math.sin(t * 3 + seed[i * 4] * 20) * 0.06
      dummy.position.set(
        origin[0] + seed[i * 4 + 1] * spread[0] + seed[i * 4 + 3] * drift * age * 2 + wob,
        origin[1] + age * rise,
        origin[2] + seed[i * 4 + 2] * spread[1] + wob,
      )
      dummy.rotation.set(age * 4 + i, age * 3, i)
      dummy.scale.setScalar(Math.max(0.001, size * (grow ? 0.4 + age * 1.6 : 1 - age) * (grow ? 1 - age * age : 1)))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[null, null, count]} frustumCulled={false} renderOrder={4}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={additive ? 1 : 0.55} depthWrite={false} blending={additive ? AdditiveBlending : undefined} toneMapped={false} />
    </instancedMesh>
  )
}

function FlickerLight({ position, color, intensity, distance = 12, speed = 9, amount = 0.25 }) {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed
    if (ref.current) ref.current.intensity = intensity * (1 + (Math.sin(t) * 0.5 + Math.sin(t * 2.3 + 1) * 0.3 + Math.sin(t * 5.1) * 0.2) * amount)
  })
  return <pointLight ref={ref} position={position} color={color} intensity={intensity} distance={distance} decay={2} />
}

// --- parts -------------------------------------------------------------------------
// Spire tower: tapering brown tiers, ledges, a thin spike, and a lit lantern on
// its inner face with X braces and flames on the roof. s = -1 west, +1 east.
const TIERS = [[1.5, 0.9], [1.28, 1.0], [1.08, 1.1], [0.88, 1.1], [0.68, 1.0]]
function Tower({ s }) {
  let y = 0
  const parts = TIERS.map(([w, h], i) => {
    const el = (
      <group key={i}>
        <mesh position={[0, y + h / 2, 0]} material={i % 2 ? brownLight : brown} castShadow receiveShadow>
          <boxGeometry args={[w, h, w]} />
        </mesh>
        <mesh position={[0, y + h + 0.04, 0]} material={brownDark} castShadow>
          <boxGeometry args={[w + 0.14, 0.1, w + 0.14]} />
        </mesh>
      </group>
    )
    y += h + 0.08
    return el
  })
  const top = y
  return (
    <group position={[s * 2.55, 0, 0.3]}>
      {parts}
      <mesh position={[0, top + 0.8, 0]} rotation={[0, Math.PI / 4, 0]} material={brownDark} castShadow>
        <coneGeometry args={[0.3, 1.6, 4]} />
      </mesh>
      <mesh position={[0, top + 1.7, 0]} material={orangeGlow}>
        <boxGeometry args={[0.08, 0.2, 0.08]} />
      </mesh>
      {/* lantern, hung on the plaza side toward the furnace */}
      <group position={[-s * 0.5, 2.0, -0.95]}>
        <mesh material={beam} castShadow>
          <boxGeometry args={[1.35, 1.75, 0.9]} />
        </mesh>
        {[-s, s].map((side) => (
          <mesh key={side} position={[side * 0.69, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={orangeGlow}>
            <planeGeometry args={[0.7, 1.3]} />
          </mesh>
        ))}
        <mesh position={[0, 0, -0.455]} rotation={[0, Math.PI, 0]} material={orangeGlow}>
          <planeGeometry args={[1.05, 1.4]} />
        </mesh>
        {/* frame + X braces over the glass */}
        {[-0.55, 0.55].map((px) => (
          <mesh key={px} position={[px, 0, -0.47]} material={beam}>
            <boxGeometry args={[0.16, 1.8, 0.1]} />
          </mesh>
        ))}
        {[-0.8, 0.8].map((py) => (
          <mesh key={py} position={[0, py, -0.47]} material={beam}>
            <boxGeometry args={[1.4, 0.16, 0.1]} />
          </mesh>
        ))}
        {[0.62, -0.62].map((a) => (
          <mesh key={a} position={[0, 0, -0.49]} rotation={[0, 0, a]} material={beam}>
            <boxGeometry args={[0.12, 1.8, 0.08]} />
          </mesh>
        ))}
        <mesh position={[0, 1.0, 0]} material={brownDark} castShadow>
          <boxGeometry args={[1.65, 0.22, 1.15]} />
        </mesh>
        <mesh position={[0, 1.2, 0]} material={brownDark} castShadow>
          <boxGeometry args={[1.2, 0.2, 0.8]} />
        </mesh>
        {/* flames on the roof */}
        {[[-0.3, 0, 0.4], [0.25, 0.1, -0.1], [0, 0.25, 0.25]].map(([fx, fy, fz], i) => (
          <mesh key={i} position={[fx, 1.45 + fy, fz]} material={i === 2 ? yellowGlow : orangeGlow}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
          </mesh>
        ))}
        <Particles origin={[0, 1.45, 0]} spread={[0.7, 0.5]} count={16} rise={1.4} size={0.24} life={0.9} color="#ffc21f" />
        <Particles origin={[0, 1.5, 0]} spread={[0.5, 0.4]} count={10} rise={2.4} size={0.1} life={1.6} color="#ff6a10" drift={0.8} />
        <Halo position={[0, 1.7, -0.2]} color="#ff9a2a" size={3.2} opacity={0.55} pulse={0.15} />
        <Halo position={[0, 0, -0.9]} color="#ff7a1a" size={3.4} opacity={0.35} />
        <FlickerLight position={[0, 0.4, -1.3]} color="#ff8a2a" intensity={14} distance={9} />
      </group>
    </group>
  )
}

function Furnace() {
  const rubble = [[-1.0, 1.9, 0.1, 0.34, 0.26], [0.95, 1.9, 0.2, 0.3, 0.22], [-0.6, 1.3, -0.45, 0.3, 0.24], [1.1, 1.3, -0.4, 0.26, 0.2], [-1.45, 0.7, -0.5, 0.35, 0.28]]
  return (
    <group position={[0, 0, 0.3]}>
      <mesh position={[0, 0.35, 0]} material={slate} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.7, 2.6]} />
      </mesh>
      <mesh position={[0, 1.0, 0.05]} material={slateLight} castShadow receiveShadow>
        <boxGeometry args={[2.9, 0.6, 2.0]} />
      </mesh>
      <mesh position={[0, 1.6, 0.1]} material={slate} castShadow receiveShadow>
        <boxGeometry args={[2.1, 0.6, 1.4]} />
      </mesh>
      {rubble.map(([rx, ry, rz, w, h], i) => (
        <mesh key={i} position={[rx, ry + h / 2, rz]} rotation={[0, i * 0.7, 0]} material={i % 2 ? slateLight : slate} castShadow>
          <boxGeometry args={[w, h, w * 0.9]} />
        </mesh>
      ))}
      {/* bar-chart plaque on the middle step */}
      <group position={[0, 1.0, -0.98]}>
        <mesh material={yellowGlow}>
          <boxGeometry args={[0.62, 0.5, 0.05]} />
        </mesh>
        <mesh position={[0, 0, -0.02]} material={obsidian}>
          <boxGeometry args={[0.52, 0.4, 0.05]} />
        </mesh>
        {[[-0.14, 0.12], [0, 0.2], [0.14, 0.28]].map(([bx, bh]) => (
          <mesh key={bx} position={[bx, -0.17 + bh / 2, -0.05]} material={yellowGlow}>
            <boxGeometry args={[0.08, bh, 0.03]} />
          </mesh>
        ))}
      </group>
      {/* bomb with a lit fuse */}
      <group position={[0.15, 1.9, 0]}>
        <mesh position={[0, 0.3, 0]} material={obsidian} castShadow>
          <sphereGeometry args={[0.3, 14, 10]} />
        </mesh>
        <mesh position={[0, 0.62, 0]} material={slateLight}>
          <cylinderGeometry args={[0.1, 0.12, 0.12, 8]} />
        </mesh>
        <mesh position={[0.04, 0.78, 0]} rotation={[0, 0, -0.5]} material={brownDark}>
          <cylinderGeometry args={[0.02, 0.02, 0.28, 5]} />
        </mesh>
        <mesh position={[0.14, 0.9, 0]} material={yellowGlow}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
        </mesh>
        <Particles origin={[0.14, 0.92, 0]} spread={[0.1, 0.1]} count={10} rise={0.8} size={0.06} life={0.7} color="#ffe27a" drift={1.5} />
        <Halo position={[0.14, 0.92, 0]} color="#ffd25a" size={0.9} opacity={0.8} pulse={0.4} />
      </group>
      {/* chimney */}
      <group position={[-0.65, 2.1, 0.1]}>
        <mesh position={[0, 0.3, 0]} material={slateLight} castShadow>
          <boxGeometry args={[0.45, 0.6, 0.45]} />
        </mesh>
        <mesh position={[0, 0.65, 0]} material={obsidian}>
          <boxGeometry args={[0.6, 0.12, 0.6]} />
        </mesh>
        <Particles origin={[0, 0.8, 0]} spread={[0.2, 0.2]} count={14} rise={3.4} size={0.4} life={3.2} color="#6a6a70" additive={false} grow drift={1.2} />
      </group>
    </group>
  )
}

// One-off flare when a pet is fused (systems/forge.js sets forgeBurst): a bright
// light spike, an expanding halo and a fountain of sparks; gold on success, red on failure.
const FLARE_MS = 1600
function ForgeFlare() {
  const group = useRef()
  const light = useRef()
  const halo = useRef()
  useFrame(() => {
    const burst = useGameStore.getState().forgeBurst
    const age = burst ? (performance.now() - burst.at) / FLARE_MS : 1
    const on = age >= 0 && age < 1
    if (group.current) group.current.visible = on
    if (!on) {
      if (light.current) light.current.intensity = 0
      return
    }
    const k = 1 - age
    light.current.color.set(burst.success ? '#ffe27a' : '#ff3a1a')
    light.current.intensity = 160 * k * k
    halo.current.scale.setScalar(4 + age * 9)
    halo.current.material.opacity = 0.9 * k
    halo.current.material.color.set(burst.success ? '#ffd84a' : '#ff4a2a')
  })
  return (
    <group position={[0, 0.9, 0]}>
      <pointLight ref={light} intensity={0} distance={18} decay={2} />
      <group ref={group} visible={false}>
        <sprite ref={halo} renderOrder={5}>
          <spriteMaterial map={haloTexture()} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </sprite>
        <Particles origin={[0, 0, 0]} spread={[1.4, 1]} count={40} rise={5} size={0.2} life={0.8} color="#ffe27a" drift={3} />
      </group>
    </group>
  )
}

function LavaPool() {
  const ref = useRef()
  const map = useMemo(() => lavaTexture().clone(), [])
  useMemo(() => {
    map.wrapS = map.wrapT = RepeatWrapping
    map.repeat.set(2.4, 1.2)
    map.needsUpdate = true
  }, [map])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    map.offset.set(t * 0.03, Math.sin(t * 0.4) * 0.05 + t * 0.015)
    if (ref.current) ref.current.color.setScalar(0.85 + Math.sin(t * 3) * 0.1 + Math.sin(t * 7.3) * 0.05)
  })
  return (
    <group position={[0, 0, -2.5]}>
      <mesh position={[0, 0.25, 0]} material={obsidian} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.5, 2.5]} />
      </mesh>
      {[-1.15, 1.15].map((bz) => (
        <mesh key={bz} position={[0, 0.58, bz]} material={obsidian} castShadow>
          <boxGeometry args={[4.4, 0.2, 0.26]} />
        </mesh>
      ))}
      {[-2.07, 2.07].map((bx) => (
        <mesh key={bx} position={[bx, 0.58, 0]} material={obsidian} castShadow>
          <boxGeometry args={[0.26, 0.2, 2.5]} />
        </mesh>
      ))}
      <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[3.9, 2.1]} />
        <meshBasicMaterial ref={ref} map={map} toneMapped={false} />
      </mesh>
      {/* treasure chest plaque sunk into the lava */}
      <group position={[0, 0.62, -0.1]} rotation={[0.25, 0, 0]}>
        <mesh material={plastic('#c23a1a', { flatShading: true })} castShadow>
          <boxGeometry args={[1.1, 0.55, 0.4]} />
        </mesh>
        <mesh position={[0, 0.3, 0]} material={obsidian}>
          <boxGeometry args={[1.2, 0.1, 0.46]} />
        </mesh>
        {[-0.3, 0, 0.3].map((dx) => (
          <mesh key={dx} position={[dx, 0, -0.21]} material={yellowGlow}>
            <boxGeometry args={[0.14, 0.2, 0.04]} />
          </mesh>
        ))}
      </group>
      <Particles origin={[0, 0.6, 0]} spread={[3.6, 1.9]} count={34} rise={2.8} size={0.1} life={2.2} color="#ff8a1a" drift={1} />
      <Particles origin={[0, 0.6, 0]} spread={[3.4, 1.8]} count={14} rise={1.2} size={0.16} life={1.1} color="#ffd23a" />
      <ForgeFlare />
      <Halo position={[0, 1.0, 0]} color="#ff5a10" size={7} opacity={0.5} pulse={0.1} />
      <FlickerLight position={[0, 1.4, -0.3]} color="#ff6a14" intensity={26} distance={14} speed={6} amount={0.3} />
    </group>
  )
}

function Ramp() {
  return (
    <group position={[-3.75, 0, 0.1]}>
      {[[0, 0.28, 0.6, 1.5], [0.1, 0.62, -0.3, 1.2], [0.2, 0.86, 0.9, 0.9]].map(([dx, dy, dz, w], i) => (
        <mesh key={i} position={[dx, dy, dz]} rotation={[0.1 * (i + 1), 0.15 * i, -0.3 - i * 0.08]} material={i % 2 ? brownLight : brown} castShadow receiveShadow>
          <boxGeometry args={[w, 0.55, 1.2]} />
        </mesh>
      ))}
    </group>
  )
}

function Barrel({ position, tilt = 0 }) {
  return (
    <group position={position} rotation={[0, tilt, 0]}>
      <mesh position={[0, 0.6, 0]} material={MAT.woodLight} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.2, 12]} />
      </mesh>
      <mesh position={[0, 0.6, 0]} material={MAT.woodLight} castShadow>
        <cylinderGeometry args={[0.56, 0.56, 0.5, 12]} />
      </mesh>
      {[0.12, 0.6, 1.08].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={beam}>
          <cylinderGeometry args={[0.575, 0.575, 0.1, 12]} />
        </mesh>
      ))}
    </group>
  )
}

function Lamp({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} material={brownDark} castShadow>
        <boxGeometry args={[0.9, 0.5, 0.9]} />
      </mesh>
      <mesh position={[0, 2.0, 0]} material={brown} castShadow>
        <cylinderGeometry args={[0.2, 0.34, 3.2, 8]} />
      </mesh>
      {[0.9, 1.9].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={brownDark}>
          <cylinderGeometry args={[0.3, 0.3, 0.12, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 3.7, 0]} material={brownDark} castShadow>
        <cylinderGeometry args={[0.5, 0.22, 0.4, 8]} />
      </mesh>
      <mesh position={[0, 4.25, 0]} material={yellowGlow}>
        <sphereGeometry args={[0.52, 14, 10]} />
      </mesh>
      <Halo position={[0, 4.25, 0]} color="#ffd84a" size={4.5} opacity={0.7} pulse={0.08} />
      <pointLight position={[0, 4.2, 0]} color="#ffcf5a" intensity={12} distance={10} decay={2} />
    </group>
  )
}

function Sack({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.65, 0]} scale={[1, 1.05, 1]} material={plastic('#d9741c', { flatShading: true })} castShadow>
        <sphereGeometry args={[0.7, 12, 9]} />
      </mesh>
      <mesh position={[0.05, 1.45, 0]} rotation={[0, 0, -0.2]} material={plastic('#c8651a', { flatShading: true })} castShadow>
        <coneGeometry args={[0.38, 0.8, 8]} />
      </mesh>
    </group>
  )
}

export default function Forge() {
  const { x, z } = FORGE
  useColliders([
    { x0: x - 3.3, x1: x + 3.3, z0: z - 1.4, z1: z + 1.4, top: 7 },
    { x0: x - 2.2, x1: x + 2.2, z0: z - 3.8, z1: z - 1.3, top: Y + 0.55 },
    { x0: x - 4.4, x1: x - 3.2, z0: z - 0.9, z1: z + 1.1, top: Y + 1 },
    { x0: x + 3.1, x1: x + 5.1, z0: z - 1.2, z1: z + 0.5, top: Y + 1.2 },
    { x0: x + 4.4, x1: x + 5.9, z0: z + 0.5, z1: z + 2.1, top: Y + 1.7 },
    { x0: x + 3.2, x1: x + 4.0, z0: z - 2.2, z1: z - 1.4, top: Y + 4.6 },
  ])
  return (
    <group position={[x, Y, z]}>
      <Tower s={-1} />
      <Tower s={1} />
      <Furnace />
      <LavaPool />
      <Ramp />
      <Barrel position={[3.7, 0, -0.5]} />
      <Barrel position={[4.5, 0, -0.1]} tilt={0.6} />
      <Barrel position={[4.1, 0, 0.8]} tilt={1.2} />
      <Lamp position={[3.6, 0, -1.8]} />
      <Sack position={[3.0, 0, 1.9]} />
      <mesh position={[5.1, 0.85, 1.3]} scale={[1.1, 1.4, 0.9]} rotation={[0, 0.6, 0.1]} material={plastic('#8a8248', { flatShading: true })} castShadow>
        <icosahedronGeometry args={[0.9, 0]} />
      </mesh>
      <Label lines={[{ text: 'Forge', size: 100, colors: ['#ffd27a', '#f07a12'], stroke: '#4a1c02' }]} position={[0, 8.6, 0]} height={1.4} />
    </group>
  )
}
