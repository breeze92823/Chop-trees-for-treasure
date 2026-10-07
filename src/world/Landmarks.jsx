import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide } from 'three'
import { glow, plastic } from '../materials/world.js'
import { canvasTexture } from '../utils/textures.js'
import { LAWN_TOP, PORTAL } from './layout.js'
import { Label, Sack, Stump, useColliders } from './common.jsx'

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

export function Scatter() {
  useColliders(STUMPS.map(([x, z, s]) => ({ x0: x - 0.5 * s, x1: x + 0.5 * s, z0: z - 0.5 * s, z1: z + 0.5 * s, top: LAWN_TOP + 0.6 * s })))
  return (
    <group>
      {SACKS.map(([x, z, r, s], i) => <Sack key={i} position={[x, LAWN_TOP, z]} rotation={r} scale={s} />)}
      {STUMPS.map(([x, z, s], i) => <Stump key={i} position={[x, LAWN_TOP, z]} scale={s} />)}
    </group>
  )
}
