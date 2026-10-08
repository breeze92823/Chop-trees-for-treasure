import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, DoubleSide } from 'three'
import { AURAS } from '../data/auras.js'

// The equipped aura drawn around a character (Player.jsx / RemotePlayers.jsx):
// a spinning ground ring, a soft glow disc and sparks rising round the body, in
// the aura's colour (Prismatic cycles the rainbow). Rarer auras burn brighter and
// throw more sparks. Mount it inside the character's group; origin = feet.
const MAX_SPARKS = 36
const HEIGHT = 2.4

const spark = (() => {
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 32, 32)
  return new CanvasTexture(c)
})()

const _c = new Color()

export default function AuraFx({ id }) {
  const idx = AURAS.findIndex((a) => a.id === id)
  if (idx < 0) return null
  return <AuraBody info={AURAS[idx]} tier={idx / (AURAS.length - 1)} />
}

function AuraBody({ info, tier }) {
  const ring = useRef()
  const disc = useRef()
  const points = useRef()
  const count = Math.round(14 + tier * (MAX_SPARKS - 14))
  const rainbow = info.color === 'rainbow'
  const base = useMemo(() => new Color(rainbow ? '#ffffff' : info.color), [info.color, rainbow])

  const { geo, seeds } = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3))
    const s = Array.from({ length: count }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.45 + Math.random() * 0.45,
      p: Math.random(),
      v: 0.25 + Math.random() * 0.35,
      w: (Math.random() - 0.5) * 1.6,
    }))
    return { geo: g, seeds: s }
  }, [count])

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    if (rainbow) base.setHSL((t * 0.25) % 1, 1, 0.6)
    _c.copy(base)
    if (ring.current) {
      ring.current.rotation.z += delta * (0.8 + tier * 1.4)
      ring.current.material.color.copy(_c)
      ring.current.material.opacity = (0.5 + tier * 0.4) * (0.85 + 0.15 * Math.sin(t * 3))
    }
    if (disc.current) {
      disc.current.material.color.copy(_c)
      disc.current.scale.setScalar(1 + 0.08 * Math.sin(t * 2.4))
    }
    if (points.current) {
      points.current.material.color.copy(_c)
      const pos = geo.attributes.position
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i]
        s.p += delta * s.v
        if (s.p > 1) s.p -= 1
        const a = s.a + t * s.w
        const r = s.r * (1 - 0.35 * s.p)
        pos.setXYZ(i, Math.cos(a) * r, 0.1 + s.p * HEIGHT, Math.sin(a) * r)
      }
      pos.needsUpdate = true
    }
  })

  return (
    <group>
      <mesh ref={ring} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
        <ringGeometry args={[0.8, 1.0, 48, 1, 0, Math.PI * 1.7]} />
        <meshBasicMaterial color={info.color === 'rainbow' ? '#ffffff' : info.color} transparent opacity={0.7} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={disc} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
        <circleGeometry args={[0.95, 32]} />
        <meshBasicMaterial color={info.color === 'rainbow' ? '#ffffff' : info.color} transparent opacity={0.16 + tier * 0.14} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <points ref={points} geometry={geo} frustumCulled={false} renderOrder={6}>
        <pointsMaterial map={spark} size={0.2 + tier * 0.08} transparent opacity={0.9} blending={AdditiveBlending} depthWrite={false} sizeAttenuation toneMapped={false} />
      </points>
    </group>
  )
}
