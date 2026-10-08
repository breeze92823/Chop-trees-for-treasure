import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D } from 'three'
import { LIGHT } from '../data/config.js'
import { player } from '../systems/playerState.js'

// The forest corridor is far longer than one shadow frustum can cover sharply,
// so the sun rig follows the player: it keeps the same offset and aims at a
// point that tracks them (snapped to SNAP metres so shadows don't shimmer).
const [OX, OY, OZ] = LIGHT.sun.offset
const SHADOW_EXTENT = 75 // half-size of the shadow frustum, m
const SNAP = 2
// The light aims at this; it must be in the scene for its matrix to update.
const TARGET = new Object3D()

// Bright, flat-ish daylight: strong sky/ground bounce so colours stay
// saturated, and one shadow-casting sun. Tune everything in data/config.js LIGHT.
export default function Lighting() {
  const sun = useRef()
  useFrame(() => {
    const x = Math.round(player.position.x / SNAP) * SNAP
    const z = Math.round(player.position.z / SNAP) * SNAP
    TARGET.position.set(x, 0, z)
    sun.current?.position.set(x + OX, OY, z + OZ)
  })
  return (
    <>
      <hemisphereLight args={[LIGHT.hemisphere.sky, LIGHT.hemisphere.ground, LIGHT.hemisphere.intensity]} />
      <ambientLight intensity={LIGHT.ambient} />
      <primitive object={TARGET} />
      <directionalLight
        ref={sun}
        position={[OX, OY, OZ]}
        target={TARGET}
        color={LIGHT.sun.color}
        intensity={LIGHT.sun.intensity}
        castShadow
        shadow-mapSize={[LIGHT.shadowMapSize, LIGHT.shadowMapSize]}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
    </>
  )
}
