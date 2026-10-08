import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide } from 'three'
import { glow, plastic } from '../materials/world.js'
import { canvasTexture } from '../utils/textures.js'
import { LAWN_TOP, PORTAL } from './layout.js'
import { Label, LampPost, Sack, Stump, useColliders } from './common.jsx'

// WORLDS portal: a glowing pink oval ring on a stepped round base, with a
// slowly turning swirl inside. Faces the plaza centre.
function swirlTexture() {
  return canvasTexture('portal-swirl', 256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(255,255,255,0.95)')
    g.addColorStop(0.35, 'rgba(255,140,235,0.9)')
    g.addColorStop(1, 'rgba(200,40,190,0.75)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 6
    for (let a = 0; a < 4; a++) {
      ctx.beginPath()
      for (let t = 0; t < 1; t += 0.02) {
        const r = t * w * 0.48
        const ang = a * (Math.PI / 2) + t * 5
        ctx.lineTo(w / 2 + Math.cos(ang) * r, h / 2 + Math.sin(ang) * r)
      }
      ctx.stroke()
    }
  })
}

export function Portal() {
  const { x, z } = PORTAL
  const face = Math.atan2(-x, -z)
  const swirl = useRef()
  useFrame((_s, dt) => {
    if (swirl.current) swirl.current.rotation.z -= dt * 0.8
  })
  useColliders([{ x0: x - 2.4, x1: x + 2.4, z0: z - 2.4, z1: z + 2.4, top: LAWN_TOP + 0.6 }])
  const tiers = [
    { r: 2.7, c: '#e83ab8' },
    { r: 2.25, c: '#ff5fd0' },
    { r: 1.8, c: '#ff8ce4' },
  ]
  const ringY = LAWN_TOP + 0.9 + 1.75 * 1.3
  return (
    <group position={[x, 0, z]} rotation={[0, face, 0]}>
      {tiers.map((t, i) => (
        <mesh key={i} position={[0, LAWN_TOP + 0.1 + i * 0.25, 0]} material={plastic(t.c, { roughness: 0.4 })} castShadow receiveShadow>
          <cylinderGeometry args={[t.r, t.r + 0.1, 0.25, 28]} />
        </mesh>
      ))}
      <group position={[0, ringY, 0]} scale={[1, 1.3, 1]}>
        <mesh material={glow('#ff4fd0', 1.6)} castShadow>
          <torusGeometry args={[1.75, 0.26, 12, 40]} />
        </mesh>
        <mesh ref={swirl}>
          <circleGeometry args={[1.6, 40]} />
          <meshBasicMaterial map={swirlTexture()} transparent opacity={0.85} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <Label lines={[{ text: 'WORLDS', size: 100, colors: ['#ffc2f5', '#c44ce8'], stroke: '#3a0a4a' }]} position={[0, ringY + 3.1, 0]} height={1.1} />
    </group>
  )
}

// Loose props around the plaza, matching the screenshots: treasure sacks
// behind Sell Treasure, cut stumps near the stalls and the training steps.
const SACKS = [
  [19.2, -14.2, 0.2, 1.1], [19.9, -12.9, 1.4, 0.9], [19.1, -11.4, 2.6, 1], [20.3, -10.6, 0.9, 0.8],
  [-18.9, -5.6, 1.1, 0.9], [-18.9, 5.8, 2.2, 0.9],
  [24.5, 9.2, 0.6, 1], [25.3, 10.1, 1.9, 0.85],
]
const STUMPS = [
  [-19.5, -13.5, 1], [-19.2, 13.8, 1.1], [-18.8, -18.5, 0.9], [-18.8, 18.8, 0.9],
  [7.8, -17.5, 0.8], [-7.6, -19.5, 0.9], [11.5, -19.2, 1], [-10.4, 14.5, 0.8], [23.2, 8.4, 0.9],
]

// Fillers for the bare plaza and lawn space: lamp posts, benches, bushes and
// flower beds. [x, z, ...]; on the plaza (LAWN_TOP) or a lawn (LAWN_TOP).
const LAMPS = [
  [-5, -7], [5, -7], [-5, -14], [5, -14], [-5, -21], [5, -21], // north path to the forest
  [-5, 7], [5, 7], [-5, 13], [5, 13], // spawn path
]
const BENCHES = [ // [x, z, yaw]; face the path
  [-8, -10, Math.PI / 2], [8, -10, -Math.PI / 2], [-8, -17.5, Math.PI / 2], [8, -17.5, -Math.PI / 2],
  [-8, 10, Math.PI / 2], [8, 10, -Math.PI / 2],
]
const BUSHES = [ // [x, z, scale]
  [-8, -25, 1.3], [8, -25, 1.3], [-12.5, -24, 1.4], [12.5, -24, 1.4], [-6, -26.3, 1], [6, -26.3, 1],
  [-11, -19, 1.3], [-6.5, -6, 1.2], [6.5, -6, 1.2], [-6.5, -22.2, 1], [6.5, -22.2, 1], [-6.5, 6, 1.2], [6.5, 6, 1.2], [-6.5, 15, 1.2], [6.5, 15, 1.2], [-17.5, -19.5, 1.1], [-11, -6.5, 1.1], [-17.5, -6.5, 1],
  [22, -8, 1.4], [25.5, -12, 1.2], [29, -9, 1.5], [28.5, -15, 1.1], [23, -17, 1.2],
  [27.5, 7, 1.3], [29.5, 11, 1.5], [27, 15, 1.2], [29, 21, 1.4], [25.5, 25, 1.2],
  [-11, 25, 1.2], [-17.5, 25, 1.2],
]
const FLOWER_COLORS = ['#ff5fa8', '#ffd24a', '#ffffff', '#ff7a3a', '#b57bff']
const FLOWERS = [ // [x, z, count]
  [-10, -25, 7], [10, -25, 7], [-6, -24, 5], [6, -24, 5],
  [-7, -13.5, 6], [7, -13.5, 6], [-7, -20, 5], [7, -20, 5], [-7, 8.5, 5], [7, 8.5, 5], [-7, 13, 5], [7, 13, 5],
  [-11.5, -14, 7], [-17, -12, 6], [24, -13, 8], [20, -17, 6], [28, -5.8, 6], [-17.5, 6.3, 5],
  [27, 12, 8], [24, 22, 7], [-12, 18, 6], [-17, 15, 5],
]

function Bush({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#2f9e2a" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.5, 0.35, 0.2]} castShadow>
        <dodecahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#3fb534" roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

function Bench({ position, yaw = 0 }) {
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.5, 0]} material={plastic('#a8683a')} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.18, 0.7]} />
      </mesh>
      <mesh position={[0, 0.95, -0.3]} material={plastic('#8a4f27')} castShadow>
        <boxGeometry args={[2.4, 0.5, 0.12]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.05, 0.24, 0]} material={plastic('#2b2b31')} castShadow>
          <boxGeometry args={[0.14, 0.48, 0.6]} />
        </mesh>
      ))}
    </group>
  )
}

function Flowers({ position, count }) {
  const dots = useMemo(() => {
    let seed = Math.round(position[0] * 31 + position[2] * 17)
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: count }, (_, i) => ({ x: (rnd() - 0.5) * 2.6, z: (rnd() - 0.5) * 2.6, c: FLOWER_COLORS[i % FLOWER_COLORS.length] }))
  }, [position, count])
  return (
    <group position={position}>
      {dots.map((d, i) => (
        <group key={i} position={[d.x, 0, d.z]}>
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.05, 0.36, 0.05]} />
            <meshStandardMaterial color="#2f8a2a" flatShading />
          </mesh>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.22, 0.14, 0.22]} />
            <meshStandardMaterial color={d.c} roughness={0.7} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Scatter() {
  useColliders([
    ...LAMPS.map(([x, z]) => ({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3, top: LAWN_TOP + 3.6 })),  ])
  return (
    <group>
      {SACKS.map(([x, z, r, s], i) => <Sack key={i} position={[x, LAWN_TOP, z]} rotation={r} scale={s} />)}
      {STUMPS.map(([x, z, s], i) => <Stump key={i} position={[x, LAWN_TOP, z]} scale={s} />)}
      {LAMPS.map(([x, z], i) => <LampPost key={i} position={[x, LAWN_TOP, z]} />)}
      {BENCHES.map(([x, z, yaw], i) => <Bench key={i} position={[x, LAWN_TOP, z]} yaw={yaw} />)}
      {BUSHES.map(([x, z, s], i) => <Bush key={i} position={[x, LAWN_TOP, z]} scale={s} />)}
      {FLOWERS.map(([x, z, n], i) => <Flowers key={i} position={[x, LAWN_TOP, z]} count={n} />)}
    </group>
  )
}
