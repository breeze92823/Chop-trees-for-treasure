import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Box3, Sphere, Vector3 } from 'three'

// Mobile only: small static props stop casting shadows (their shadows are a
// few pixels at the reduced shadow-map size but still cost a draw call each in
// the shadow pass). Skinned/instanced meshes and anything already not casting
// are left alone. Re-run after a delay to catch props that mount late.
const MIN_RADIUS = 0.7 // m, world-space bounding radius
const RERUN_MS = [0, 4000]

const _box = new Box3()
const _sphere = new Sphere()
const _size = new Vector3()

export default function MobileShadowCull() {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const run = () => {
      scene.updateMatrixWorld()
      scene.traverse((o) => {
        if (!o.isMesh || !o.castShadow || o.isSkinnedMesh || o.isInstancedMesh) return
        if (o.userData.keepShadow) return
        _box.setFromObject(o)
        if (_box.isEmpty()) return
        _box.getBoundingSphere(_sphere)
        _box.getSize(_size)
        if (_sphere.radius < MIN_RADIUS) o.castShadow = false
      })
    }
    const ids = RERUN_MS.map((ms) => setTimeout(run, ms))
    return () => ids.forEach(clearTimeout)
  }, [scene])
  return null
}
