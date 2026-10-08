import { Color, MeshBasicMaterial } from 'three'
import { MAT, plastic } from '../materials/world.js'
import { STRENGTH_TREES, TRAIN } from './layout.js'
import { Slab } from './Ground.jsx'
import { Label, LampPost, useColliders } from './common.jsx'
import { bannerTexture } from './signs.js'
import StrengthTree, { KINDS } from './StrengthTree.jsx'

// Train Strength: two orange terraces stepping up toward the west wall, a
// grey stair aisle down the middle, ten priced bonsai-style trees on coloured
// pads, and the "Train Strength!" arch across the back.

function darken(hex, f) {
  return '#' + new Color(hex).multiplyScalar(f).getHexString()
}

// Pads sit just above the aisle surface so they never share a plane with it.
const PAD_LIFT = 0.08

const ringMats = new Map()
function ringMat(c) {
  if (!ringMats.has(c)) ringMats.set(c, new MeshBasicMaterial({ color: c, toneMapped: false }))
  return ringMats.get(c)
}

function TreePad({ x, z, tier, cost, cur, mult, pad, rim, kind }, i) {
  const y = (tier === 1 ? TRAIN.tier1.h : TRAIN.tier2.h) + PAD_LIFT
  const price = cost === 'free' ? 'FREE' : String(cost)
  const ring = KINDS[kind].ring
  return (
    <group key={i} position={[x, y, z]}>
      <mesh position={[0, 0.09, 0]} material={plastic(rim)} receiveShadow castShadow>
        <boxGeometry args={[3.4, 0.18, 3.4]} />
      </mesh>
      <mesh position={[0, 0.11, 0]} material={plastic(pad, { roughness: 0.5 })} receiveShadow>
        <boxGeometry args={[2.9, 0.22, 2.9]} />
      </mesh>
      {/* glowing inner frame for the magical trees */}
      {ring && [[0, -1.38, 2.9, 0.14], [0, 1.38, 2.9, 0.14], [-1.38, 0, 0.14, 2.62], [1.38, 0, 0.14, 2.62]].map(([px, pz, w, d], j) => (
        <mesh key={j} position={[px, 0.225, pz]} material={ringMat(ring)}>
          <boxGeometry args={[w, 0.02, d]} />
        </mesh>
      ))}
      <group position={[0, 0.22, 0]} scale={1.15}>
        <StrengthTree kind={kind} seed={i * 7 + 3} x={x} z={z} />
      </group>
      <Label
        position={[0, 5.6, 0]}
        height={1.5}
        lines={[
          { text: price, icon: cur, size: 92, colors: cost === 'free' ? ['#c6ff9a', '#3fcf3a'] : ['#ffffff', '#ededed'], stroke: '#1b1b1f' },
          { text: `${mult} Strength`, size: 62, colors: '#ffffff', stroke: '#1b1b1f' },
        ]}
      />
    </group>
  )
}

export default function TrainingArea() {
  const { tier1, tier2, aisle, arch } = TRAIN
  const z0 = -20
  const z1 = 20
  const postZ = [-arch.halfSpan, arch.halfSpan]
  const archBase = tier2.h
  const banner = bannerTexture('train', { text: 'Train Strength!', icon: 'arm', a: '#f6b23a', b: '#eea12c', w: 2560, colors: ['#ffffff', '#fff3d8'], stroke: '#6a3206' })

  useColliders([
    { x0: tier1.x0, x1: tier1.x1, z0, z1, top: tier1.h },
    { x0: tier2.x0, x1: tier2.x1, z0, z1, top: tier2.h },
    ...postZ.map((pz) => ({ x0: arch.x - 0.8, x1: arch.x + 0.8, z0: pz - 0.8, z1: pz + 0.8, top: 30 })),
    // tree trunks block, pads are walkable
    ...STRENGTH_TREES.map((t) => ({ x0: t.x - 0.35, x1: t.x + 0.35, z0: t.z - 0.35, z1: t.z + 0.35, top: 30 })),
    ...STRENGTH_TREES.map((t) => ({ x0: t.x - 1.7, x1: t.x + 1.7, z0: t.z - 1.7, z1: t.z + 1.7, top: (t.tier === 1 ? tier1.h : tier2.h) + PAD_LIFT + 0.22 })),
    { x0: tier2.x0 - 0.6, x1: tier2.x0, z0, z1, top: 30 },
  ])

  return (
    <group>
      <Slab x0={tier1.x0} x1={tier1.x1} z0={z0} z1={z1} top={tier1.h} y0={-0.2} material={MAT.train} cast />
      <Slab x0={tier2.x0} x1={tier2.x1} z0={z0} z1={z1} top={tier2.h} y0={-0.2} material={MAT.train} cast />
      {/* grey stair aisle: sits clear above the tier and the step lips, and
          pokes 2cm past the tier edge so no faces are coplanar */}
      <Slab x0={tier1.x0} x1={tier1.x1 + 0.02} z0={-aisle} z1={aisle} top={tier1.h + 0.06} y0={tier1.h - 0.3} material={MAT.path} />
      <Slab x0={tier2.x0} x1={tier2.x1 + 0.02} z0={-aisle} z1={aisle} top={tier2.h + 0.06} y0={tier2.h - 0.3} material={MAT.path} />
      {/* step lips (slightly proud of the tier edge to avoid coplanar sides) */}
      <Slab x0={tier1.x1 - 0.25} x1={tier1.x1 + 0.01} z0={z0 - 0.01} z1={z1 + 0.01} top={tier1.h + 0.03} y0={0} material={MAT.curb} />
      <Slab x0={tier2.x1 - 0.25} x1={tier2.x1 + 0.01} z0={z0 - 0.01} z1={z1 + 0.01} top={tier2.h + 0.03} y0={tier1.h} material={MAT.curb} />
      {/* orange back wall */}
      <Slab x0={tier2.x0 - 0.6} x1={tier2.x0} z0={z0} z1={z1} top={7} y0={0} material={MAT.trainWall} cast />

      {STRENGTH_TREES.map(TreePad)}

      {/* arch */}
      {postZ.map((pz) => (
        <mesh key={pz} position={[arch.x, archBase + arch.height / 2, pz]} material={MAT.train} castShadow receiveShadow>
          <boxGeometry args={[1.6, arch.height, 1.6]} />
        </mesh>
      ))}
      <group position={[arch.x, archBase + arch.height + 1.1, 0]} rotation={[0, 0, 0.08]}>
        <mesh material={MAT.train} castShadow>
          <boxGeometry args={[1.2, 2.6, arch.halfSpan * 2 + 2.4]} />
        </mesh>
        <mesh position={[0.61, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[arch.halfSpan * 2 + 2.2, 2.4]} />
          <meshStandardMaterial map={banner} roughness={0.7} />
        </mesh>
      </group>

      <LampPost position={[tier1.x1 - 0.6, tier1.h, -aisle - 0.6]} />
      <LampPost position={[tier1.x1 - 0.6, tier1.h, aisle + 0.6]} />
    </group>
  )
}
