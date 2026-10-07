import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PETS_BY_ID } from '../data/eggs.js'
import { canvasTexture } from '../utils/textures.js'

// A player's equipped pets, floating in an arc behind them and easing after
// them as they move. `ids` are data/eggs.js pet ids; `anchor()` returns the
// owner's { x, y, z, yaw } each frame. Rendered in world space (not parented
// to the player) so the pets lag and swing round naturally.
const RADIUS = 2.1
const SPREAD = 0.62 // radians between neighbours
const HEIGHT = 1.3
const FOLLOW_HZ = 5

function emojiTexture(emoji) {
  return canvasTexture(`pet|${emoji}`, 128, 128, (ctx, w, h) => {
    ctx.font = '104px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowOffsetY = 4
    ctx.fillText(emoji, w / 2, h / 2 + 6)
  })
}

function Pet({ pet, slot, count, anchor }) {
  const ref = useRef()
  useFrame((state, delta) => {
    const g = ref.current
    const a = anchor()
    if (!g || !a) return
    const angle = a.yaw + Math.PI + (slot - (count - 1) / 2) * SPREAD
    const tx = a.x + Math.sin(angle) * RADIUS
    const tz = a.z + Math.cos(angle) * RADIUS
    const ty = a.y + HEIGHT + Math.sin(state.clock.elapsedTime * 3 + slot * 1.7) * 0.15
    if (!g.userData.placed) {
      g.position.set(tx, ty, tz)
      g.userData.placed = true
      return
    }
    const k = 1 - Math.exp(-FOLLOW_HZ * Math.min(delta, 0.1))
    g.position.x += (tx - g.position.x) * k
    g.position.y += (ty - g.position.y) * k
    g.position.z += (tz - g.position.z) * k
  })
  return (
    <sprite ref={ref} scale={[1.2, 1.2, 1.2]}>
      <spriteMaterial map={emojiTexture(pet.emoji)} transparent depthWrite={false} />
    </sprite>
  )
}

export default function PetFollowers({ ids, anchor }) {
  const pets = ids.map((id) => PETS_BY_ID[id]).filter(Boolean)
  return pets.map((pet, i) => <Pet key={`${pet.id}-${i}`} pet={pet} slot={i} count={pets.length} anchor={anchor} />)
}
