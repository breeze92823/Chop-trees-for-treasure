import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ExtrudeGeometry, Object3D, Shape } from 'three'
import { GUIDE_TARGETS, TUTORIAL_DONE } from '../data/tutorial.js'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from '../systems/playerState.js'
import { terrainHeightAt } from '../systems/terrainHeight.js'

const SPACING = 0.95 // m between trail arrows
const SPEED = 1.6 // m/s the trail crawls toward the target
const MAX_ARROWS = 120
const HIDE_WITHIN = 2.5 // m from the target where the trail disappears
const BEACON_HEIGHT = 4.5 // m above the ground the big bobbing arrow floats

// The tutorial's 3D guide: a line of white arrowheads on the ground from the player to the
// current step's target, crawling toward it, plus a big yellow arrow bobbing over the target.
export default function GuideArrows() {
  const trail = useRef()
  const beacon = useRef()
  const dummy = useMemo(() => new Object3D(), [])

  const geometry = useMemo(() => {
    const s = new Shape()
    s.moveTo(0, 0.42)
    s.lineTo(0.34, -0.2)
    s.lineTo(0, -0.05)
    s.lineTo(-0.34, -0.2)
    s.closePath()
    const g = new ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 })
    g.center()
    return g
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }) => {
    const mesh = trail.current
    const top = beacon.current
    if (!mesh || !top) return
    const step = usePlayerData.getState().tutorialStep
    const active = useGameStore.getState().progressLoaded && step < TUTORIAL_DONE
    const t = active ? GUIDE_TARGETS[step] : null
    const target = typeof t === 'function' ? t(player.position) : t
    mesh.count = 0
    top.visible = false
    if (!target) return

    const dx = target.x - player.position.x
    const dz = target.z - player.position.z
    const dist = Math.hypot(dx, dz)
    const ux = dx / (dist || 1)
    const uz = dz / (dist || 1)
    const heading = Math.atan2(ux, uz)
    const phase = (clock.elapsedTime * SPEED) % SPACING

    let n = 0
    if (dist > HIDE_WITHIN) {
      for (let d = 1.2 + phase; d < dist - 0.6 && n < MAX_ARROWS; d += SPACING) {
        const x = player.position.x + ux * d
        const z = player.position.z + uz * d
        const g = terrainHeightAt(x, z)
        dummy.position.set(x, (Number.isFinite(g) ? g : 0) + 0.22, z)
        // Lay the arrowhead down, tip toward the target, slightly tilted up.
        dummy.rotation.set(Math.PI / 2 - 0.35, heading, 0, 'YXZ')
        dummy.updateMatrix()
        mesh.setMatrixAt(n++, dummy.matrix)
      }
    }
    mesh.count = n
    mesh.instanceMatrix.needsUpdate = true

    const g = terrainHeightAt(target.x, target.z)
    top.visible = true
    top.position.set(target.x, (Number.isFinite(g) ? g : 0) + BEACON_HEIGHT + Math.sin(clock.elapsedTime * 4) * 0.35, target.z)
    top.rotation.set(0, clock.elapsedTime * 2, Math.PI, 'YXZ') // point down, spin about the vertical
  })

  return (
    <>
      <instancedMesh ref={trail} args={[geometry, undefined, MAX_ARROWS]} frustumCulled={false}>
        <meshStandardMaterial color="#eef1f6" roughness={0.5} />
      </instancedMesh>
      <mesh ref={beacon} geometry={geometry} scale={3.2} visible={false} frustumCulled={false}>
        <meshStandardMaterial color="#ffd23a" emissive="#ff9a1f" emissiveIntensity={0.6} roughness={0.4} fog={false} />
      </mesh>
    </>
  )
}
