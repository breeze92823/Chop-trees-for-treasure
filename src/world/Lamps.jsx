import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, CanvasTexture } from 'three'
import { LAMP } from '../data/config.js'
import { player } from '../systems/playerState.js'
import { useColliders } from './common.jsx'

// Evening street lamps. Posts, heads and glow halos are cheap meshes for every
// lamp; only the LAMP.pool nearest to the player get a real point light (a fixed
// count, so shaders never recompile). Positions are metres, y = ground there.
export const LAMPS = [
  // Both sides of the 7 m central path, north-south.
  ...[-20, -12, -4, 4, 12].flatMap((z) => [
    { x: -3, z, y: 0.1 },
    { x: 3, z, y: 0.1 },
  ]),
  // Beside the stalls and the egg area.
  { x: -10, z: -9.5, y: 0.2 },
  { x: 10, z: -9.5, y: 0.2 },
  { x: -10, z: 9.5, y: 0.2 },
  { x: 10, z: 9.5, y: 0.2 },
  { x: -10, z: 21, y: 0.2 },
  { x: 10, z: 21, y: 0.2 },
  // Plaza edges east and west.
  { x: -18, z: 0, y: 0.1 },
  { x: 28, z: 0, y: 0.1 },
]

const POST_H = LAMP.height
const glowMap = (() => {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,214,140,1)')
  g.addColorStop(0.3, 'rgba(255,184,100,0.45)')
  g.addColorStop(1, 'rgba(255,160,80,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new CanvasTexture(c)
})()

export default function Lamps() {
  useColliders(LAMPS.map((l) => ({ x0: l.x - 0.15, x1: l.x + 0.15, z0: l.z - 0.15, z1: l.z + 0.15, top: l.y + POST_H })))

  const lights = useRef([])
  const order = useMemo(() => LAMPS.map((_, i) => i), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const px = player.position.x
    const pz = player.position.z
    const d = (i) => (LAMPS[i].x - px) ** 2 + (LAMPS[i].z - pz) ** 2
    order.sort((a, b) => d(a) - d(b))
    for (let k = 0; k < LAMP.pool; k++) {
      const l = LAMPS[order[k]]
      const light = lights.current[k]
      if (!light) continue
      light.position.set(l.x, l.y + POST_H - 0.3, l.z)
      // gentle flicker so the flames feel alive
      light.intensity = LAMP.intensity * (1 + 0.06 * Math.sin(t * 7 + order[k] * 1.7) + 0.03 * Math.sin(t * 13 + order[k]))
    }
  })

  return (
    <group>
      {LAMPS.map((l, i) => (
        <group key={i} position={[l.x, l.y, l.z]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.45, 0.4, 0.45]} />
            <meshStandardMaterial color="#2c2a33" roughness={0.8} />
          </mesh>
          <mesh position={[0, POST_H / 2, 0]} castShadow>
            <boxGeometry args={[0.18, POST_H, 0.18]} />
            <meshStandardMaterial color="#2c2a33" roughness={0.8} />
          </mesh>
          <mesh position={[0, POST_H - 0.1, 0]}>
            <boxGeometry args={[0.6, 0.1, 0.6]} />
            <meshStandardMaterial color="#2c2a33" roughness={0.8} />
          </mesh>
          <mesh position={[0, POST_H - 0.45, 0]}>
            <boxGeometry args={[0.42, 0.55, 0.42]} />
            <meshStandardMaterial color="#ffd89a" emissive="#ffb347" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
          <sprite position={[0, POST_H - 0.45, 0]} scale={[4, 4, 1]}>
            <spriteMaterial map={glowMap} blending={AdditiveBlending} depthWrite={false} transparent opacity={0.75} fog={false} />
          </sprite>
        </group>
      ))}
      {Array.from({ length: LAMP.pool }, (_, k) => (
        <pointLight
          key={k}
          ref={(el) => (lights.current[k] = el)}
          color={LAMP.color}
          intensity={LAMP.intensity}
          distance={LAMP.distance}
          decay={1.6}
        />
      ))}
    </group>
  )
}
