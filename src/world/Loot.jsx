import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending } from 'three'
import { RARITY } from '../data/loot.js'
import { useGameStore } from '../store/useGameStore.js'
import { formatNumber } from '../utils/format.js'
import { canvasTexture } from '../utils/textures.js'
import { billboardTexture } from '../utils/labels.js'
import { GenericItem, MODELS } from './lootModels.jsx'

// Loot lying where a loot tree fell (systems/loot.js): the model floats and
// spins over a glowing starburst, with its name and rarity above. Collected with E.

// White starburst: soft core plus long thin rays, tinted per rarity via the material colour.
function starburstTexture() {
  return canvasTexture('loot-starburst', 256, 256, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2)
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2)
    core.addColorStop(0, 'rgba(255,255,255,0.95)')
    core.addColorStop(0.25, 'rgba(255,255,255,0.45)')
    core.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = core
    ctx.fillRect(-w / 2, -h / 2, w, h)
    const rays = 14
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + (i % 2) * 0.1
      const len = w / 2 - (i % 2 ? 22 : 4)
      const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len)
      g.addColorStop(0, 'rgba(255,255,255,0.85)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.save()
      ctx.rotate(a)
      ctx.beginPath()
      ctx.moveTo(0, -3)
      ctx.lineTo(len, 0)
      ctx.lineTo(0, 3)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
  })
}

const FLOAT_Y = 0.55

function Text({ text, color, y, height }) {
  const { map, aspect } = billboardTexture(text, { color, size: 64 })
  return (
    <sprite position={[0, y, 0]} scale={[height * aspect, height, 1]} renderOrder={2}>
      <spriteMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

function LootDrop({ drop }) {
  const { id, name, rarity, value, x, y, z } = drop
  const Model = MODELS[name] || GenericItem
  const { fill, glow } = RARITY[rarity]
  const root = useRef()
  const float = useRef()
  const halo = useRef()
  const born = useRef(null)
  const burst = useMemo(starburstTexture, [])
  const uncommon = rarity !== 'Common'
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    born.current ??= t
    if (root.current) root.current.scale.setScalar(Math.min(1, (t - born.current) * 4)) // pop in
    if (float.current) {
      float.current.position.y = FLOAT_Y + Math.sin(t * 1.8 + id) * 0.15
      float.current.rotation.y = t * 0.8 + id * 1.3
    }
    if (halo.current) halo.current.material.opacity = (uncommon ? 0.75 : 0.5) + Math.sin(t * 2.4 + id) * 0.12
  })
  return (
    <group ref={root} position={[x, y + 0.04, z]} scale={0.001}>
      <group ref={float} position={[0, FLOAT_Y, 0]}>
        <Model />
      </group>
      <sprite ref={halo} position={[0, FLOAT_Y + 0.5, 0]} scale={[2.2, 2.2, 1]} renderOrder={2}>
        <spriteMaterial map={burst} color={glow} transparent opacity={0.6} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <Text text={`$${formatNumber(value)}`} color="#7dff8a" y={FLOAT_Y + 2.75} height={0.6} />
      <Text text={name} color="#ffffff" y={FLOAT_Y + 2.1} height={0.6} />
      <Text text={rarity} color={fill} y={FLOAT_Y + 1.6} height={0.45} />
    </group>
  )
}

export default function Loot() {
  const worldLoot = useGameStore((s) => s.worldLoot)
  return (
    <group name="Tree Loot">
      {worldLoot.map((d) => <LootDrop key={d.id} drop={d} />)}
    </group>
  )
}
