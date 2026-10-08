import { useEffect, useMemo, useRef, useState } from 'react'
import { BoxGeometry, Matrix4 } from 'three'
import { MAT } from '../materials/world.js'
import { FOREST } from './layout.js'
import { FOREST_TREES } from './forestTrees.js'
import { Slab } from './Ground.jsx'
import { Instances, Label, useColliders } from './common.jsx'
import { TreeBars, FallingTrees } from './TreeFx.jsx'
import { addCollider } from '../systems/terrainHeight.js'
import { ALIVE, bindTreeCollider, onTreeFelled, onTreesReset, treePhase } from '../systems/treeHealth.js'

// The choppable forest north of the plaza: rows of blocky trees (square
// trunk with root blocks, stacked studded cube canopy) in 20 luck zones,
// each with its own canopy colour. Every part is instanced. A felled tree
// (systems/treeHealth.js) has its instances zeroed here and is replaced by
// the pooled falling copy in TreeFx.jsx.
const unitBox = new BoxGeometry(1, 1, 1)
const HIDDEN = new Matrix4().makeScale(0, 0, 0)

// Instances per tree, in the order the lists below are built.
const ROOTS = 4
const CANOPY = 3
const TREE_TOP = 8 // collider height above the zone floor: unjumpable

export default function Forest() {
  const trees = FOREST_TREES
  useColliders(FOREST.zones.filter((z) => z.y > 0).map((z) => ({ x0: FOREST.x0, x1: FOREST.x1, z0: z.z1, z1: z.z0, top: z.y })))

  // Bumped when the forest regrows (systems/treeHealth.js): rebuilds colliders
  // and instance matrices.
  const [epoch, setEpoch] = useState(0)
  useEffect(() => onTreesReset(() => setEpoch((e) => e + 1)), [])

  const trunkRef = useRef()
  const rootRef = useRef()
  const canopyRef = useRef()

  // One collider per tree so a felled one can be walked through. Each box is
  // the tree's whole grid cell (see forestTrees.js), so the standing forest is a
  // solid wall however the trunks are scattered: the only way north is to chop
  // a tree and walk through its cell. Boxes are TREE_TOP tall, so they can't be jumped onto; `tree` lets playerMovement push anyone who still lands on top back off.
  useEffect(() => {
    const removers = trees.map((t) =>
      treePhase[t.id] === ALIVE
        ? addCollider({
            x0: t.bx0,
            x1: t.bx1,
            z0: t.bz0,
            z1: t.bz1,
            top: t.y + TREE_TOP,
            cameraPass: true, // the camera boom ignores trees
            tree: true, // never a standing surface (see playerMovement)
          })
        : null,
    )
    trees.forEach((t, i) => bindTreeCollider(t.id, removers[i]))
    return () => removers.forEach((remove) => remove?.())
  }, [trees, epoch])

  // Zero a tree's instances (on felling, and again if the forest remounts).
  useEffect(() => {
    const hide = (mesh, first, count) => {
      if (!mesh) return
      for (let i = 0; i < count; i++) mesh.setMatrixAt(first + i, HIDDEN)
      mesh.instanceMatrix.needsUpdate = true
    }
    const hideTree = ({ id }) => {
      hide(trunkRef.current, id, 1)
      hide(rootRef.current, id * ROOTS, ROOTS)
      hide(canopyRef.current, id * CANOPY, CANOPY)
    }
    trees.forEach((t) => treePhase[t.id] !== ALIVE && hideTree(t))
    return onTreeFelled(hideTree)
  }, [trees, epoch])

  const { trunks, roots, canopy } = useMemo(() => {
    const trunks = []
    const roots = []
    const canopy = []
    for (const { x, y, z, s, color } of trees) {
      trunks.push({ p: [x, y + 1.4 * s, z], s: [0.85 * s, 2.8 * s, 0.85 * s] })
      for (const [dx, dz] of [[0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55]]) {
        roots.push({ p: [x + dx * s, y + 0.3 * s, z + dz * s], s: [0.45 * s, 0.6 * s, 0.45 * s] })
      }
      canopy.push({ p: [x, y + 3.2 * s, z], s: [3.1 * s, 1.5 * s, 3.1 * s], c: color })
      canopy.push({ p: [x, y + 4.4 * s, z], s: [2.3 * s, 1.1 * s, 2.3 * s], c: color })
      canopy.push({ p: [x, y + 5.3 * s, z], s: [1.3 * s, 0.8 * s, 1.3 * s], c: color })
    }
    return { trunks, roots, canopy }
  }, [trees, epoch])

  return (
    <group>
      {FOREST.zones.map((zone) => (
        <group key={zone.label}>
          <Slab x0={FOREST.x0} x1={FOREST.x1} z0={zone.z1} z1={zone.z0} top={zone.y + 0.04} y0={-0.2} material={MAT.forestFloor} />
          <Label lines={[{ text: zone.label, icon: 'clover', size: 100, colors: '#ffffff', stroke: '#1b1b1f' }]} position={[(FOREST.x0 + FOREST.x1) / 2,zone.y + 8, zone.z0 - 1]} height={1.6} />
        </group>
      ))}
      <Instances geometry={unitBox} material={MAT.trunk} items={trunks} meshRef={trunkRef} />
      <Instances geometry={unitBox} material={MAT.trunk} items={roots} meshRef={rootRef} />
      <Instances geometry={unitBox} material={MAT.leavesTint} items={canopy} meshRef={canopyRef} />
      <TreeBars />
      <FallingTrees />
    </group>
  )
}
