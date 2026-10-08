import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { ARTIFACT_MODELS } from './artifactModels.js'

// Slowly spinning 3D artifact (models in artifactModels.js). All previews share one
// offscreen renderer + scene and copy each frame into their own 2D canvas, so the
// window costs one extra WebGL context instead of one per row.
const SIZE = 320
let shared = null
const models = new Map()

function getShared() {
  if (shared) return shared
  try {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(1)
    renderer.setSize(SIZE, SIZE)
    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight('#ffffff', '#6a5a4a', 1.6))
    const key = new THREE.DirectionalLight('#fff4e0', 2.6)
    key.position.set(3, 4, 5)
    scene.add(key)
    const rim = new THREE.DirectionalLight('#9ac8ff', 1.4)
    rim.position.set(-4, 2, -3)
    scene.add(rim)
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
    camera.position.set(0, 0.5, 6)
    camera.lookAt(0, 0, 0)
    shared = { renderer, scene, camera }
  } catch {
    shared = { failed: true }
  }
  return shared
}

// Built once per artifact, centred and scaled to ~2.8 units.
function getModel(id) {
  let m = models.get(id)
  if (!m) {
    const inner = ARTIFACT_MODELS[id]()
    const box = new THREE.Box3().setFromObject(inner)
    const size = box.getSize(new THREE.Vector3())
    const centre = box.getCenter(new THREE.Vector3())
    inner.position.sub(centre)
    inner.scale.setScalar(2.8 / Math.max(size.x, size.y, size.z))
    inner.position.multiplyScalar(inner.scale.x)
    m = new THREE.Group()
    m.add(inner)
    models.set(id, m)
  }
  return m
}

export default function ArtifactPreview({ id, offset = 0 }) {
  const ref = useRef()
  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    const s = getShared()
    if (s.failed) return undefined
    const model = getModel(id)
    let raf = 0
    const draw = (now) => {
      raf = requestAnimationFrame(draw)
      model.rotation.y = now * 0.0011 + offset
      s.scene.add(model)
      s.renderer.render(s.scene, s.camera)
      s.scene.remove(model)
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.drawImage(s.renderer.domElement, 0, 0)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [id, offset])
  return <canvas ref={ref} className="artifact-model" width={SIZE} height={SIZE} />
}
