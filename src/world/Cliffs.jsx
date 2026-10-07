import { useMemo } from 'react'
import { CylinderGeometry, DodecahedronGeometry, IcosahedronGeometry, MeshStandardMaterial } from 'three'
import { MAT } from '../materials/world.js'
import { seededRandom } from '../utils/random.js'
import { BASIN, CLIFF, CORRIDOR, HUB } from './layout.js'
import { Instances, useColliders } from './common.jsx'

// Terraced cliffs ringing the hub: each tier is a band of boxes a step higher
// and further out than the last. Faces are cut into segments pushed back by
// a random amount so the rim reads hand-built rather than ruled. Low-poly
// trees and boulders line every tier top.
const OUT = 70 // how far each band runs away from the basin
const SEG = [8, 14] // segment length range along a band, m

function buildTerraces() {
  const rand = seededRandom(3)
  const boxes = []
  const trees = []
  const rocks = []
  for (let t = 0; t < CLIFF.tiers; t++) {
    const e = t * CLIFF.tierDepth
    const top = (t + 1) * CLIFF.tierHeight
    const H = { minX: HUB.minX - e, maxX: HUB.maxX + e, minZ: HUB.minZ - e, maxZ: HUB.maxZ + e }
    const cx0 = CORRIDOR.x0 - e
    const cx1 = CORRIDOR.x1 + e
    const endZ = BASIN.minZ - e
    // Each side: the run axis, its extent, the face position and outward sign.
    // The hub's north wall is split by the corridor opening, which gets its own
    // two side walls and an end cap.
    const sides = [
      { axis: 'x', a0: H.minX - OUT, a1: cx0 - 2, face: H.minZ, out: -1 }, // hub north, west of corridor
      { axis: 'x', a0: cx1 + 2, a1: H.maxX + OUT, face: H.minZ, out: -1 }, // hub north, east of corridor
      { axis: 'x', a0: H.minX - OUT, a1: H.maxX + OUT, face: H.maxZ, out: 1 }, // hub south
      { axis: 'z', a0: H.minZ, a1: H.maxZ, face: H.minX, out: -1 }, // hub west
      { axis: 'z', a0: H.minZ, a1: H.maxZ, face: H.maxX, out: 1 }, // hub east
      { axis: 'z', a0: endZ, a1: H.minZ, face: cx0, out: -1 }, // corridor west wall
      { axis: 'z', a0: endZ, a1: H.minZ, face: cx1, out: 1 }, // corridor east wall
      { axis: 'x', a0: cx0 - OUT, a1: cx1 + OUT, face: endZ, out: -1 }, // corridor end cap
    ]
    for (const s of sides) {
      let a = s.a0
      while (a < s.a1) {
        const len = Math.min(SEG[0] + rand() * (SEG[1] - SEG[0]), s.a1 - a)
        const push = t === 0 ? rand() * 1.4 : rand() * 1.8
        const f0 = s.face + s.out * push // inner face, pushed away from the basin
        const f1 = s.face + s.out * OUT
        const [n0, n1] = f0 < f1 ? [f0, f1] : [f1, f0]
        const box = s.axis === 'x'
          ? { x0: a, x1: a + len, z0: n0, z1: n1, top }
          : { x0: n0, x1: n1, z0: a, z1: a + len, top }
        boxes.push(box)
        // Decorate the strip along the rim, between this tier's face and the next.
        const strip = t === CLIFF.tiers - 1 ? 14 : CLIFF.tierDepth - 1.2
        for (let k = a + 1.5; k < a + len - 1; k += 3.5 + rand() * 4) {
          const depth = push + 1.6 + rand() * (strip - 1.6)
          const along = k
          const across = s.face + s.out * depth
          const [x, z] = s.axis === 'x' ? [along, across] : [across, along]
          if (inside(x, z)) continue
          if (rand() < 0.72) trees.push({ x, z, y: top, s: 0.8 + rand() * 0.6, r: rand() * 6.28, tone: rand() })
          else rocks.push({ x, z, y: top, s: 0.6 + rand() * 0.9, r: rand() * 6.28 })
        }
        a += len
      }
    }
  }
  return { boxes, trees, rocks }
}

// Skip decorations that would land inside the walkable basin.
const inside = (x, z) =>
  (x > HUB.minX && x < HUB.maxX && z > HUB.minZ && z < HUB.maxZ) ||
  (x > CORRIDOR.x0 && x < CORRIDOR.x1 && z > BASIN.minZ && z < HUB.minZ)

const trunkGeo = new CylinderGeometry(0.22, 0.34, 2.6, 6)
trunkGeo.translate(0, 1.3, 0)
const canopyGeo = new IcosahedronGeometry(1.5, 1)
const rockGeo = new DodecahedronGeometry(1, 0)
const canopyMat = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, flatShading: true })
const LEAF_TONES = ['#3fb52a', '#4cc232', '#35a524', '#5bcc3a']

export default function Cliffs() {
  const { boxes, trees, rocks } = useMemo(buildTerraces, [])
  useColliders(boxes)

  const { trunks, canopies, rockItems } = useMemo(() => {
    const trunks = trees.map((t) => ({ p: [t.x, t.y, t.z], s: t.s, r: t.r }))
    const canopies = []
    for (const t of trees) {
      const c = LEAF_TONES[Math.floor(t.tone * LEAF_TONES.length)]
      canopies.push({ p: [t.x, t.y + 3.1 * t.s, t.z], s: [1.25 * t.s, 1 * t.s, 1.25 * t.s], r: t.r, c })
      canopies.push({ p: [t.x + 0.4 * t.s, t.y + 4.3 * t.s, t.z - 0.2 * t.s], s: 0.8 * t.s, r: t.r + 1, c })
    }
    const rockItems = rocks.map((r) => ({ p: [r.x, r.y + 0.3 * r.s, r.z], s: [r.s * 1.3, r.s, r.s * 1.1], r: r.r }))
    return { trunks, canopies, rockItems }
  }, [trees, rocks])

  return (
    <group>
      {boxes.map((b, i) => (
        <mesh key={i} position={[(b.x0 + b.x1) / 2, (b.top - 1) / 2, (b.z0 + b.z1) / 2]} material={MAT.cliff} receiveShadow castShadow>
          <boxGeometry args={[b.x1 - b.x0, b.top + 1, b.z1 - b.z0]} />
        </mesh>
      ))}
      <Instances geometry={trunkGeo} material={MAT.woodDark} items={trunks} />
      <Instances geometry={canopyGeo} material={canopyMat} items={canopies} />
      <Instances geometry={rockGeo} material={MAT.rock} items={rockItems} />
    </group>
  )
}
