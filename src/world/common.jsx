import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Color, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { addCollider } from '../systems/terrainHeight.js'
import { labelTexture } from './signs.js'
import { plastic } from '../materials/world.js'

// Floating billboard label (Roblox BillboardGui look). `lines` as in
// signs.js labelTexture; `height` is the sprite height in metres.
export function Label({ lines, position, height = 1.6 }) {
  const { map, aspect } = useMemo(() => labelTexture(lines), [JSON.stringify(lines)]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <sprite position={position} scale={[height * aspect, height, 1]} renderOrder={3}>
      <spriteMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

// Registers static colliders ({ x0, x1, z0, z1, top, bottom? }) for the
// component's lifetime. The list is read once, on mount.
export function useColliders(boxes) {
  useEffect(() => {
    const removers = boxes.map(addCollider)
    return () => removers.forEach((remove) => remove())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

// Axis-aligned footprint of a w x d box at (x, z) rotated by a multiple of
// 90 degrees, as a collider.
export function footprint(x, z, w, d, yaw, top, y0 = 0) {
  const quarter = Math.round(yaw / (Math.PI / 2)) % 2 !== 0
  const hw = (quarter ? d : w) / 2
  const hd = (quarter ? w : d) / 2
  return { x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, top: y0 + top }
}

// One draw call for many copies of a mesh. items: [{ p: [x,y,z], s: [sx,sy,sz]
// | number, r: yaw | [rx,ry,rz], c?: colour }].
const _m = new Matrix4()
const _q = new Quaternion()
const _e = new Euler()
const _p = new Vector3()
const _s = new Vector3()
const _c = new Color()
// `meshRef` (optional) exposes the InstancedMesh, e.g. to hide single instances.
export function Instances({ geometry, material, items, castShadow = true, receiveShadow = true, meshRef }) {
  const own = useRef()
  const ref = meshRef ?? own
  useLayoutEffect(() => {
    const mesh = ref.current
    items.forEach((it, i) => {
      _p.set(...it.p)
      if (Array.isArray(it.r)) _e.set(...it.r)
      else _e.set(0, it.r ?? 0, 0)
      _q.setFromEuler(_e)
      if (Array.isArray(it.s)) _s.set(...it.s)
      else _s.setScalar(it.s ?? 1)
      _m.compose(_p, _q, _s)
      mesh.setMatrixAt(i, _m)
      if (it.c) mesh.setColorAt(i, _c.set(it.c))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])
  if (!items.length) return null
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} />
}

// Classic blocky Roblox figure, feet at the origin, facing +Z. Used for the
// leaderboard statues and the Craft Artifacts NPC.
export function Figure({ shirt = '#f4f6f8', pants = '#26262c', skin = '#f2c79a', hair = '#3b2312', pose = 'stand', ...props }) {
  const mShirt = plastic(shirt)
  const mPants = plastic(pants)
  const mSkin = plastic(skin)
  const mHair = plastic(hair)
  const armTilt = pose === 'cheer' ? -2.6 : 0
  return (
    <group {...props}>
      <mesh position={[-0.25, 0.5, 0]} material={mPants} castShadow>
        <boxGeometry args={[0.48, 1, 0.48]} />
      </mesh>
      <mesh position={[0.25, 0.5, 0]} material={mPants} castShadow>
        <boxGeometry args={[0.48, 1, 0.48]} />
      </mesh>
      <mesh position={[0, 1.5, 0]} material={mShirt} castShadow>
        <boxGeometry args={[1, 1, 0.5]} />
      </mesh>
      <group position={[-0.75, 1.95, 0]} rotation={[0, 0, -armTilt * 0.15]}>
        <mesh position={[0, -0.45, 0]} rotation={[armTilt, 0, 0]} material={mSkin} castShadow>
          <boxGeometry args={[0.48, 1, 0.48]} />
        </mesh>
      </group>
      <group position={[0.75, 1.95, 0]}>
        <mesh position={[0, -0.45, 0]} material={mSkin} castShadow>
          <boxGeometry args={[0.48, 1, 0.48]} />
        </mesh>
      </group>
      <mesh position={[0, 2.3, 0]} material={mSkin} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
      </mesh>
      <mesh position={[0, 2.58, -0.04]} material={mHair} castShadow>
        <boxGeometry args={[0.66, 0.2, 0.7]} />
      </mesh>
      {/* face */}
      <mesh position={[-0.12, 2.36, 0.305]} material={plastic('#141416')}>
        <boxGeometry args={[0.07, 0.1, 0.01]} />
      </mesh>
      <mesh position={[0.12, 2.36, 0.305]} material={plastic('#141416')}>
        <boxGeometry args={[0.07, 0.1, 0.01]} />
      </mesh>
    </group>
  )
}

// Treasure sack: a squashed lumpy ball with a cinched neck.
export function Sack({ position, rotation = 0, scale = 1 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 0.42, 0]} scale={[1, 0.85, 1]} castShadow>
        <dodecahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#7b4a27" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.88, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 0.18, 7]} />
        <meshStandardMaterial color="#5e3519" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <coneGeometry args={[0.2, 0.18, 7]} />
        <meshStandardMaterial color="#7b4a27" roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

// Cut tree stump with a pale ringed top.
export function Stump({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.55, 0.6, 9]} />
        <meshStandardMaterial color="#6e3818" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.605, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.02, 9]} />
        <meshStandardMaterial color="#d7a061" roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

// Lamp post with a glowing lantern head.
export function LampPost({ position, height = 3.2 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.3, 8]} />
        <meshStandardMaterial color="#2b2b31" roughness={0.6} />
      </mesh>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, height, 8]} />
        <meshStandardMaterial color="#2b2b31" roughness={0.6} />
      </mesh>
      <mesh position={[0, height + 0.3, 0]}>
        <boxGeometry args={[0.42, 0.5, 0.42]} />
        <meshStandardMaterial color="#ffd65a" emissive="#ffbf2e" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh position={[0, height + 0.62, 0]} castShadow>
        <coneGeometry args={[0.38, 0.3, 4]} />
        <meshStandardMaterial color="#2b2b31" roughness={0.6} />
      </mesh>
    </group>
  )
}
