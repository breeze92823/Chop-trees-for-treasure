import { GROUND_Y } from '../data/config.js'
import { MAT } from '../materials/world.js'
import { BASIN, CURB, LAWNS, LAWN_TOP, PLAZA } from './layout.js'
import { useColliders } from './common.jsx'

const FAR = 600

// A box from y0 up to `top` over an x/z rectangle.
export function Slab({ x0, x1, z0, z1, top, y0 = 0, material, cast = false }) {
  const h = top - y0
  return (
    <mesh position={[(x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2]} material={material} receiveShadow castShadow={cast}>
      <boxGeometry args={[x1 - x0, h, z1 - z0]} />
    </mesh>
  )
}

// Grass everywhere, the grey plaza slab, and the raised lawns (dark curb +
// green top) sitting on its corners so the grey reads as a plus.
export default function Ground() {
  useColliders([
    { ...PLAZA },
    ...LAWNS.map((l) => ({ ...l, top: LAWN_TOP })),
  ])
  const cx = (BASIN.minX + BASIN.maxX) / 2
  const cz = (BASIN.minZ + BASIN.maxZ) / 2
  return (
    <group>
      <mesh position={[cx, GROUND_Y - 1, cz]} material={MAT.grass} receiveShadow>
        <boxGeometry args={[FAR, 2, FAR]} />
      </mesh>
      <Slab {...PLAZA} y0={-0.2} material={MAT.path} />
      {LAWNS.map((l, i) => (
        <group key={i}>
          <Slab {...l} top={LAWN_TOP - 0.03} y0={-0.2} material={MAT.curb} />
          <Slab x0={l.x0 + CURB} x1={l.x1 - CURB} z0={l.z0 + CURB} z1={l.z1 - CURB} top={LAWN_TOP} y0={-0.2} material={MAT.grass} />
        </group>
      ))}
    </group>
  )
}
