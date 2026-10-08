import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { plastic, plastic as basePlastic } from '../materials/world.js'
import { plateTexture } from './signs.js'
import { Label, footprint, useColliders } from './common.jsx'

// Market stall: a rounded counter with a puffy striped awning, one bulging
// rib per stripe, running front to back. Local front is +Z; `face` turns it.
const W = 6 // along the counter
const D = 4.4 // front to back
const BASE_H = 2.1
const STRIPES = 9
const HS = 2 // height scale: the stall body + awning are stretched, details are counter-scaled

const baseGeo = new RoundedBoxGeometry(W - 0.6, BASE_H, D - 0.6, 3, 0.22)
// Barrel-vault awning: each stripe sits on an elliptical arc across the stall and
// is tilted to the arc's tangent, so the sides droop down over the counter ends.
const ARC_A = W / 2 + 0.15 // half width
const ARC_B = 1.7 // height of the dome
const ARC_SPAN = (80 * Math.PI) / 180
const ribs = Array.from({ length: STRIPES }, (_, i) => {
  const c = (STRIPES - 1) / 2
  const th = ((i - c) / c) * ARC_SPAN
  const px = (a) => [ARC_A * Math.sin(a), ARC_B * Math.cos(a)]
  const [x0, y0] = px(th - ARC_SPAN / STRIPES)
  const [x1, y1] = px(th + ARC_SPAN / STRIPES)
  const len = Math.hypot(x1 - x0, y1 - y0) / 2 + 0.08
  const [x, y] = px(th)
  const tilt = Math.atan2(-ARC_B * Math.sin(th), ARC_A * Math.cos(th))
  return { geo: new RoundedBoxGeometry(len * 2, 0.5, D + 1.3, 4, 0.22), x, y, tilt }
})

// The shopkeeper standing in the window: a blocky yellow-headed figure.
function Keeper({ glowy }) {
  // Glowing keepers (Auras) get a warm emissive so they read as lit from within.
  const plastic = useMemo(() => {
    const cache = {}
    return (c) =>
      (cache[c] ??= glowy
        ? new MeshStandardMaterial({ color: c, emissive: '#ffd21f', emissiveIntensity: 0.6, roughness: 0.6 })
        : basePlastic(c))
  }, [glowy])
  return (
    <group>
      <mesh position={[0, 0.45, 0]} material={plastic('#2f6df0')} castShadow>
        <boxGeometry args={[0.75, 0.8, 0.4]} />
      </mesh>
      <mesh position={[-0.52, 0.45, 0]} material={plastic('#ffd21f')} castShadow>
        <boxGeometry args={[0.28, 0.8, 0.3]} />
      </mesh>
      <mesh position={[0.52, 0.45, 0]} material={plastic('#ffd21f')} castShadow>
        <boxGeometry args={[0.28, 0.8, 0.3]} />
      </mesh>
      <mesh position={[0, 1.15, 0]} material={plastic('#ffd21f')} castShadow>
        <boxGeometry args={[0.6, 0.55, 0.55]} />
      </mesh>
      <mesh position={[-0.13, 1.18, 0.29]} material={plastic('#222')}>
        <boxGeometry args={[0.07, 0.1, 0.02]} />
      </mesh>
      <mesh position={[0.13, 1.18, 0.29]} material={plastic('#222')}>
        <boxGeometry args={[0.07, 0.1, 0.02]} />
      </mesh>
    </group>
  )
}

export default function Stall({ label, x, z, face, base, base2, stripe, labelColors, stroke, glowy, keeper, lantern, inner = '#0f3d4a' }) {
  // Solid from the floor to above the awning, covering its overhang, so nobody walks under it.
  useColliders([footprint(x, z, W, D + 1.3, face, 8)])
  const mats = useMemo(() => {
    const white = glowy
      ? new MeshStandardMaterial({ color: '#fff6e0', emissive: '#ffcf6a', emissiveIntensity: 0.35, roughness: 0.6 })
      : plastic('#f7f7f7', { roughness: 0.6 })
    return { base: plastic(base, { roughness: 0.6 }), base2: plastic(base2), stripe: plastic(stripe, { roughness: 0.6 }), white }
  }, [base, base2, stripe, glowy])
  const plate = plateTexture(label, base2)

  return (
    <group position={[x, 0.2, z]} rotation={[0, face, 0]}>
      <group scale={[1, HS, 1]}>
      <mesh geometry={baseGeo} position={[0, BASE_H / 2, 0]} material={mats.base} castShadow receiveShadow />
      <mesh position={[0, 0.18, 0]} material={mats.base2} castShadow receiveShadow>
        <boxGeometry args={[W - 0.3, 0.36, D - 0.3]} />
      </mesh>
      {/* counter top + plate */}
      <mesh position={[0, BASE_H + 0.02, D / 2 - 0.75]} material={mats.base2} castShadow>
        <boxGeometry args={[W - 0.2, 0.16, 1.1]} />
      </mesh>
      {/* service window: dark opening, name plate on top, ledge in front, shopkeeper inside */}
      <mesh position={[0, 1.05, (D - 0.6) / 2 + 0.02]} material={plastic(inner)}>
        <planeGeometry args={[4.4, 1.5]} />
      </mesh>
      <mesh position={[0, 1.75, (D - 0.6) / 2 + 0.05]} scale={[1, 1 / HS, 1]}>
        <planeGeometry args={[2.0, 0.5]} />
        <meshStandardMaterial map={plate} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, (D - 0.6) / 2 + 0.2]} material={mats.base2} castShadow>
        <boxGeometry args={[4.6, 0.25, 0.5]} />
      </mesh>
      {keeper && (
        <group position={[0, 0.45, (D - 0.6) / 2 + 0.05]} scale={[1.5, 1.5 / HS, 1.5]}>
          <Keeper glowy={glowy} />
          {glowy && <pointLight color="#ffc83a" intensity={2} distance={4} position={[0, 0.8, 0.6]} />}
        </group>
      )}
      {/* awning */}
      <group position={[0, BASE_H - 0.35, 0.4]}>
        {ribs.map((r, i) => (
          <mesh key={i} geometry={r.geo} position={[r.x, r.y, 0]} rotation={[0, 0, r.tilt]} material={i % 2 ? mats.white : mats.stripe} castShadow receiveShadow />
        ))}
      </group>
      {/* hanging lanterns at the front corners */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (W / 2 - 0.6), BASE_H - 0.25, D / 2 + 0.55]} scale={[1, 1 / HS, 1]}>
          <mesh position={[0, 0.25, 0]} material={plastic('#2b2b31')}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.2, 12, 10]} />
            <meshStandardMaterial color={lantern || (glowy ? '#ffa43a' : '#ffd65a')} emissive={lantern || (glowy ? '#ff7a00' : '#ffbf2e')} emissiveIntensity={2} toneMapped={false} />
          </mesh>
        </group>
      ))}
      </group>
      <Label lines={[{ text: label, size: 110, colors: labelColors, stroke }]} position={[0, 9.4, 0]} height={1.6} />
    </group>
  )
}
