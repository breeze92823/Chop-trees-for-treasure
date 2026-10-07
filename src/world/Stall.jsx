import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { plastic } from '../materials/world.js'
import { plateTexture } from './signs.js'
import { Label, footprint, useColliders } from './common.jsx'

// Market stall: a rounded counter with a puffy striped awning, one bulging
// rib per stripe, running front to back. Local front is +Z; `face` turns it.
const W = 6 // along the counter
const D = 4.4 // front to back
const BASE_H = 2.1
const STRIPES = 9

const baseGeo = new RoundedBoxGeometry(W - 0.6, BASE_H, D - 0.6, 3, 0.22)
const ribGeos = Array.from({ length: STRIPES }, (_, i) => {
  const c = (STRIPES - 1) / 2
  const h = 1.45 + 0.6 * Math.cos(((i - c) / c) * (Math.PI / 2)) // domed: tallest in the middle
  const g = new RoundedBoxGeometry(W / STRIPES + 0.06, h, D + 1.1, 4, 0.34)
  g.translate(0, h / 2, 0)
  return g
})

export default function Stall({ label, x, z, face, base, base2, stripe, labelColors, stroke, glowy }) {
  useColliders([footprint(x, z, W - 0.4, D - 0.4, face, BASE_H)])
  const mats = useMemo(() => {
    const white = glowy
      ? new MeshStandardMaterial({ color: '#fff6e0', emissive: '#ffcf6a', emissiveIntensity: 0.35, roughness: 0.6 })
      : plastic('#f7f7f7', { roughness: 0.6 })
    return { base: plastic(base, { roughness: 0.6 }), base2: plastic(base2), stripe: plastic(stripe, { roughness: 0.6 }), white }
  }, [base, base2, stripe, glowy])
  const plate = plateTexture(label, base2)

  return (
    <group position={[x, 0.2, z]} rotation={[0, face, 0]}>
      <mesh geometry={baseGeo} position={[0, BASE_H / 2, 0]} material={mats.base} castShadow receiveShadow />
      <mesh position={[0, 0.18, 0]} material={mats.base2} castShadow receiveShadow>
        <boxGeometry args={[W - 0.3, 0.36, D - 0.3]} />
      </mesh>
      {/* counter top + plate */}
      <mesh position={[0, BASE_H + 0.02, D / 2 - 0.75]} material={mats.base2} castShadow>
        <boxGeometry args={[W - 0.2, 0.16, 1.1]} />
      </mesh>
      <mesh position={[0, 1.6, (D - 0.6) / 2 + 0.02]}>
        <planeGeometry args={[2.6, 0.65]} />
        <meshStandardMaterial map={plate} roughness={0.7} />
      </mesh>
      {/* the little yellow / blue shop badge on the front */}
      <mesh position={[-0.2, 0.75, (D - 0.6) / 2 + 0.2]} material={plastic('#ffd21f')} castShadow>
        <boxGeometry args={[0.55, 0.55, 0.4]} />
      </mesh>
      <mesh position={[0.25, 0.65, (D - 0.6) / 2 + 0.25]} material={plastic('#2f6df0')} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.3]} />
      </mesh>
      {/* awning */}
      <group position={[0, BASE_H - 0.05, 0.4]}>
        {ribGeos.map((g, i) => (
          <mesh key={i} geometry={g} position={[(i - (STRIPES - 1) / 2) * (W / STRIPES), 0, 0]} material={i % 2 ? mats.white : mats.stripe} castShadow receiveShadow />
        ))}
      </group>
      {/* hanging lanterns at the front corners */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (W / 2 - 0.35), BASE_H - 0.45, D / 2 + 0.6]}>
          <mesh position={[0, 0.25, 0]} material={plastic('#2b2b31')}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.2, 12, 10]} />
            <meshStandardMaterial color="#ffd65a" emissive="#ffbf2e" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <Label lines={[{ text: label, size: 110, colors: labelColors, stroke }]} position={[0, 6.8, 0]} height={1.6} />
    </group>
  )
}
