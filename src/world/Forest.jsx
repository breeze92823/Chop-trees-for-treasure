import { useMemo } from 'react'
import { BoxGeometry } from 'three'
import { MAT, surface } from '../materials/world.js'
import { seededRandom } from '../utils/random.js'
import { BASIN, FOREST } from './layout.js'
import { Slab } from './Ground.jsx'
import { Instances, Label, useColliders } from './common.jsx'

// The choppable forest north of the plaza: rows of blocky trees (square
// trunk with root blocks, stacked studded cube canopy) in three luck zones,
// split by a river and a low step. Every part is instanced.
const unitBox = new BoxGeometry(1, 1, 1)
const waterTile = surface('#3aa6ee', { top2: '#3196e2', checker: 2, studAmt: 0.5, roughness: 0.25 })

function buildForest() {
  const rand = seededRandom(11)
  const trees = []
  for (const zone of FOREST.zones) {
    for (let z = zone.z0 - 2.2; z > zone.z1 + 1.5; z -= FOREST.spacing) {
      for (let x = FOREST.x0 + 2; x < FOREST.x1 - 1.5; x += FOREST.spacing) {
        trees.push({ x, z, y: zone.y, s: 0.92 + rand() * 0.16 })
      }
    }
  }
  return trees
}

export default function Forest() {
  const trees = useMemo(buildForest, [])
  useColliders(trees.map((t) => ({ x0: t.x - 0.5, x1: t.x + 0.5, z0: t.z - 0.5, z1: t.z + 0.5, top: 30 })).concat(
    FOREST.zones.filter((z) => z.y > 0).map((z) => ({ x0: BASIN.minX, x1: BASIN.maxX, z0: z.z1, z1: z.z0, top: z.y })),
  ))

  const { trunks, roots, canopy } = useMemo(() => {
    const trunks = []
    const roots = []
    const canopy = []
    for (const { x, y, z, s } of trees) {
      trunks.push({ p: [x, y + 1.4 * s, z], s: [0.85 * s, 2.8 * s, 0.85 * s] })
      for (const [dx, dz] of [[0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55]]) {
        roots.push({ p: [x + dx * s, y + 0.3 * s, z + dz * s], s: [0.45 * s, 0.6 * s, 0.45 * s] })
      }
      canopy.push({ p: [x, y + 3.2 * s, z], s: [3.1 * s, 1.5 * s, 3.1 * s] })
      canopy.push({ p: [x, y + 4.4 * s, z], s: [2.3 * s, 1.1 * s, 2.3 * s] })
      canopy.push({ p: [x, y + 5.3 * s, z], s: [1.3 * s, 0.8 * s, 1.3 * s] })
    }
    return { trunks, roots, canopy }
  }, [trees])

  return (
    <group>
      {FOREST.zones.map((zone) => (
        <group key={zone.label}>
          <Slab x0={BASIN.minX} x1={BASIN.maxX} z0={zone.z1} z1={zone.z0} top={zone.y + 0.04} y0={-0.2} material={MAT.forestFloor} />
          <Label lines={[{ text: zone.label, icon: 'clover', size: 100, colors: '#ffffff', stroke: '#1b1b1f' }]} position={[(FOREST.x0 + FOREST.x1) / 2 - 8, zone.y + 8, zone.z0 - 1]} height={1.6} />
        </group>
      ))}
      <Slab x0={BASIN.minX} x1={BASIN.maxX} z0={FOREST.river.z1} z1={FOREST.river.z0} top={0.06} y0={-0.2} material={waterTile} />
      <Instances geometry={unitBox} material={MAT.trunk} items={trunks} />
      <Instances geometry={unitBox} material={MAT.trunk} items={roots} />
      <Instances geometry={unitBox} material={MAT.leaves} items={canopy} />
    </group>
  )
}
