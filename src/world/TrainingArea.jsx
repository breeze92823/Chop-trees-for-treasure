import { useMemo } from 'react'
import { Color, CylinderGeometry, IcosahedronGeometry, MeshStandardMaterial } from 'three'
import { MAT, plastic } from '../materials/world.js'
import { seededRandom } from '../utils/random.js'
import { STRENGTH_TREES, TRAIN } from './layout.js'
import { Slab } from './Ground.jsx'
import { Label, LampPost, useColliders } from './common.jsx'
import { bannerTexture } from './signs.js'

// Train Strength: two orange terraces stepping up toward the west wall, a
// grey stair aisle down the middle, ten priced bonsai-style trees on coloured
// pads, and the "Train Strength!" arch across the back.

// Leaf palettes per tree kind: trunk, leaf tones, emissive glow (or null).
const KINDS = {
  green: { trunk: '#6e3a1c', leaves: ['#46d23a', '#2fa82c'], glow: null },
  blue: { trunk: '#3a2a4a', leaves: ['#2f6df0', '#4f9bff', '#1f4fd0'], glow: null },
  autumn: { trunk: '#5a2a14', leaves: ['#ff5a1f', '#ffb21f', '#e8241c'], glow: null },
  lilac: { trunk: '#5a3a6a', leaves: ['#c58bff', '#ff8fe0', '#9a6af0'], glow: null },
  palm: { trunk: '#5a3a1c', leaves: ['#1e7a2a', '#2f9e2f'], glow: null, flat: true },
  lava: { trunk: '#2a1a14', leaves: ['#ff3a1a', '#ff8a1a', '#c8160c'], glow: '#ff4a10' },
  ghost: { trunk: '#2a2a30', leaves: ['#f4f4f8', '#c9cbd3', '#9a9ca6'], glow: null },
  ice: { trunk: '#5aa6d8', leaves: ['#c8f6ff', '#6fe3ff', '#9fdcff'], glow: '#7fe8ff' },
  violet: { trunk: '#3a1a5a', leaves: ['#8a3ff0', '#c03ff0', '#5a2fd0'], glow: null },
  jungle: { trunk: '#4a2a14', leaves: ['#2f8a2a', '#4fb83a', '#1f6a24'], glow: null },
}

const branchGeo = new CylinderGeometry(0.11, 0.17, 1, 6)
branchGeo.translate(0, 0.5, 0)
const blobGeo = new IcosahedronGeometry(1, 0)

const leafMats = new Map()
function leafMat(color, glow) {
  const key = color + glow
  if (!leafMats.has(key)) {
    leafMats.set(key, new MeshStandardMaterial({
      color,
      roughness: 0.75,
      flatShading: true,
      emissive: glow ? new Color(glow) : new Color('#000000'),
      emissiveIntensity: glow ? 0.45 : 0,
    }))
  }
  return leafMats.get(key)
}

// Stylised tree: a leaning trunk, three branches, a crown of faceted blobs.
function StrengthTree({ kind, seed }) {
  const k = KINDS[kind]
  const parts = useMemo(() => {
    const rand = seededRandom(seed)
    const trunkH = 1.7
    const lean = (rand() - 0.5) * 0.25
    const top = [Math.sin(lean) * trunkH, trunkH * Math.cos(lean), 0]
    const branches = []
    const blobs = [{ p: [top[0], top[1] + 0.9, top[2]], r: k.flat ? 0.75 : 0.95, s: k.flat ? [1.5, 0.45, 1.5] : [1, 0.85, 1] }]
    for (let i = 0; i < 3; i++) {
      const yaw = (i / 3) * Math.PI * 2 + rand() * 0.8
      const tilt = 0.7 + rand() * 0.35
      const len = 0.9 + rand() * 0.4
      const tip = [
        top[0] + Math.sin(tilt) * Math.cos(yaw) * len,
        top[1] + Math.cos(tilt) * len,
        top[2] - Math.sin(tilt) * Math.sin(yaw) * len,
      ]
      branches.push({ base: top, yaw, tilt, len })
      blobs.push({ p: tip, r: 0.75 + rand() * 0.2, s: k.flat ? [1.6, 0.35, 1.6] : [1, 0.8, 1] })
      // lower filler blob between trunk and tip
      blobs.push({ p: [(tip[0] + top[0]) / 2, tip[1] - 0.25, (tip[2] + top[2]) / 2], r: 0.5 + rand() * 0.15, s: k.flat ? [1.4, 0.4, 1.4] : [1, 0.8, 1] })
    }
    return { trunkH, lean, branches, blobs }
  }, [k, seed])
  const trunk = plastic(k.trunk, { flatShading: true })
  return (
    <group>
      <mesh geometry={branchGeo} scale={[1.6, parts.trunkH, 1.6]} rotation={[0, 0, -parts.lean]} material={trunk} castShadow />
      {/* root flare */}
      <mesh position={[0, 0.12, 0]} material={trunk} castShadow>
        <cylinderGeometry args={[0.3, 0.5, 0.25, 6]} />
      </mesh>
      {parts.branches.map((b, i) => (
        <group key={i} position={b.base} rotation={[0, b.yaw, 0]}>
          <mesh geometry={branchGeo} scale={[0.8, b.len, 0.8]} rotation={[0, 0, -b.tilt]} material={trunk} castShadow />
        </group>
      ))}
      {parts.blobs.map((b, i) => (
        <mesh
          key={i}
          geometry={blobGeo}
          position={b.p}
          scale={b.s.map((v) => v * b.r)}
          rotation={[i, i * 1.7, 0]}
          material={leafMat(k.leaves[i % k.leaves.length], k.glow)}
          castShadow
        />
      ))}
    </group>
  )
}

function darken(hex, f) {
  return '#' + new Color(hex).multiplyScalar(f).getHexString()
}

function TreePad({ x, z, tier, cost, cur, mult, pad, kind }, i) {
  const y = tier === 1 ? TRAIN.tier1.h : TRAIN.tier2.h
  const price = cost === 'free' ? 'FREE' : String(cost)
  return (
    <group key={i} position={[x, y, z]}>
      <mesh position={[0, 0.09, 0]} material={plastic(darken(pad, 0.6))} receiveShadow castShadow>
        <boxGeometry args={[3.4, 0.18, 3.4]} />
      </mesh>
      <mesh position={[0, 0.11, 0]} material={plastic(pad, { roughness: 0.5 })} receiveShadow>
        <boxGeometry args={[2.9, 0.22, 2.9]} />
      </mesh>
      <group position={[0, 0.22, 0]} scale={1.15}>
        <StrengthTree kind={kind} seed={i * 7 + 3} />
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
    ...STRENGTH_TREES.map((t) => ({ x0: t.x - 1.7, x1: t.x + 1.7, z0: t.z - 1.7, z1: t.z + 1.7, top: (t.tier === 1 ? tier1.h : tier2.h) + 0.22 })),
    { x0: tier2.x0 - 0.6, x1: tier2.x0, z0, z1, top: 30 },
  ])

  return (
    <group>
      <Slab x0={tier1.x0} x1={tier1.x1} z0={z0} z1={z1} top={tier1.h} y0={-0.2} material={MAT.train} cast />
      <Slab x0={tier2.x0} x1={tier2.x1} z0={z0} z1={z1} top={tier2.h} y0={-0.2} material={MAT.train} cast />
      {/* grey stair aisle */}
      <Slab x0={tier1.x0} x1={tier1.x1} z0={-aisle} z1={aisle} top={tier1.h + 0.02} y0={tier1.h - 0.3} material={MAT.path} />
      <Slab x0={tier2.x0} x1={tier2.x1} z0={-aisle} z1={aisle} top={tier2.h + 0.02} y0={tier2.h - 0.3} material={MAT.path} />
      {/* step lips */}
      <Slab x0={tier1.x1 - 0.25} x1={tier1.x1} z0={z0} z1={z1} top={tier1.h + 0.03} y0={0} material={MAT.curb} />
      <Slab x0={tier2.x1 - 0.25} x1={tier2.x1} z0={z0} z1={z1} top={tier2.h + 0.03} y0={tier1.h} material={MAT.curb} />
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
