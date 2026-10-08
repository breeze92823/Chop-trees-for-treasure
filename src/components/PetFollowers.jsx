import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PETS_BY_ID } from '../data/eggs.js'
import { PetModel, PET_MODELS } from './petModels.jsx'

// A player's equipped pets, floating in an arc behind them and easing after
// them as they move. `ids` are data/eggs.js pet ids; `anchor()` returns the
// owner's { x, y, z, yaw } each frame. Rendered in world space (not parented
// to the player) so the pets lag and swing round naturally.
const RADIUS = 2.1
const SPREAD = 0.62 // radians between neighbours
const FLY_HEIGHT = 1.2 // flyers hover; the rest walk on the ground
const PET_SCALE = 1.1
const FOLLOW_HZ = 5

function Pet({ pet, slot, count, anchor }) {
  const ref = useRef()
  const fly = !!PET_MODELS[pet.id]?.fly
  useFrame((state, delta) => {
    const g = ref.current
    const a = anchor()
    if (!g || !a) return
    const t = state.clock.elapsedTime
    const angle = a.yaw + Math.PI + (slot - (count - 1) / 2) * SPREAD
    const tx = a.x + Math.sin(angle) * RADIUS
    const tz = a.z + Math.cos(angle) * RADIUS
    const bob = Math.sin(t * 3 + slot * 1.7)
    const ty = a.y + (fly ? FLY_HEIGHT + bob * 0.15 : Math.max(0, bob) * 0.08)
    if (!g.userData.placed) {
      g.position.set(tx, ty, tz)
      g.rotation.y = a.yaw
      g.userData.placed = true
      return
    }
    const k = 1 - Math.exp(-FOLLOW_HZ * Math.min(delta, 0.1))
    const dx = tx - g.position.x
    const dz = tz - g.position.z
    g.position.x += dx * k
    g.position.y += (ty - g.position.y) * k
    g.position.z += dz * k
    // Face the way it is travelling; otherwise settle to the owner's heading.
    const moving = dx * dx + dz * dz > 0.04
    const want = moving ? Math.atan2(dx, dz) : a.yaw
    let d = want - g.rotation.y
    d = Math.atan2(Math.sin(d), Math.cos(d))
    g.rotation.y += d * (1 - Math.exp(-8 * Math.min(delta, 0.1)))
  })
  return (
    <group ref={ref} scale={PET_SCALE}>
      <PetModel id={pet.id} />
    </group>
  )
}

export default function PetFollowers({ ids, anchor }) {
  const pets = ids.map((id) => PETS_BY_ID[id]).filter(Boolean)
  return pets.map((pet, i) => <Pet key={`${pet.id}-${i}`} pet={pet} slot={i} count={pets.length} anchor={anchor} />)
}
