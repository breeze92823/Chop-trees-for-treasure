import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color } from 'three'
import { STALLS } from './layout.js'
import { AURA } from '../data/economy.js'
import { useGameStore } from '../store/useGameStore.js'

// The Auras stall reacting to the player: a slow violet glow while the window is
// open, and a coloured flash + expanding ring (in the won aura's colour) after
// every spin (useGameStore auraBurst, set by systems/auras.js spin()).
const stall = STALLS.find((s) => s.id === 'auras')
const _c = new Color()

export default function AuraStallFx() {
  const light = useRef()
  const ring = useRef()
  const orb = useRef()

  useFrame(({ clock }) => {
    const g = useGameStore.getState()
    const t = clock.elapsedTime
    const k = g.auraBurst ? 1 - (performance.now() - g.auraBurst.at) / AURA.burstMs : 0
    const burst = Math.max(0, k)
    const idle = g.aurasMenu ? 0.5 + 0.2 * Math.sin(t * 2.5) : 0
    if (burst > 0) _c.set(g.auraBurst.color === 'rainbow' ? new Color().setHSL((t * 0.8) % 1, 1, 0.6) : g.auraBurst.color)
    else _c.set('#b07aff')
    if (light.current) {
      light.current.color.copy(_c)
      light.current.intensity = idle * 6 + burst * 40
    }
    if (orb.current) {
      orb.current.visible = idle > 0 || burst > 0
      orb.current.material.color.copy(_c)
      orb.current.material.opacity = Math.min(1, idle * 0.5 + burst)
      orb.current.scale.setScalar(0.7 + idle * 0.4 + burst * 0.9)
    }
    if (ring.current) {
      ring.current.visible = burst > 0
      ring.current.material.color.copy(_c)
      ring.current.material.opacity = burst
      ring.current.scale.setScalar(1 + (1 - burst) * 5)
    }
  })

  if (!stall) return null
  return (
    <group position={[stall.x + 2.4, 2.4, stall.z]}>
      <pointLight ref={light} intensity={0} distance={14} decay={2} />
      <mesh ref={orb} visible={false}>
        <sphereGeometry args={[0.45, 16, 12]} />
        <meshBasicMaterial transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={ring} visible={false} position={[0, -2.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.1, 48]} />
        <meshBasicMaterial transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
