import { Object3D } from 'three'
import { LIGHT, WORLD_BOUNDS } from '../data/config.js'

// Sun offset from the world centre. The whole world fits in one shadow
// frustum, so the rig is fixed rather than following the player. For a world
// too big for one frustum, make the target/position follow player.position.
const CX = (WORLD_BOUNDS.minX + WORLD_BOUNDS.maxX) / 2
const CZ = (WORLD_BOUNDS.minZ + WORLD_BOUNDS.maxZ) / 2
const [OX, OY, OZ] = LIGHT.sun.offset
const SUN = [CX + OX, OY, CZ + OZ]
// The light aims at this; it must be in the scene for its matrix to update.
const TARGET = new Object3D()
TARGET.position.set(CX, 0, CZ)
const SHADOW_EXTENT = Math.max(WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX, WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ) * 0.62

// Bright, flat-ish daylight: strong sky/ground bounce so colours stay
// saturated, and one shadow-casting sun. Tune everything in data/config.js LIGHT.
export default function Lighting() {
  return (
    <>
      <hemisphereLight args={[LIGHT.hemisphere.sky, LIGHT.hemisphere.ground, LIGHT.hemisphere.intensity]} />
      <ambientLight intensity={LIGHT.ambient} />
      <primitive object={TARGET} />
      <directionalLight
        position={SUN}
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
