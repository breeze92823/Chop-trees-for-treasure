import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, InstancedBufferAttribute, Matrix4, PlaneGeometry, ShaderMaterial, Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
import { MAT } from '../materials/world.js'
import { TREE } from '../data/economy.js'
import { FOREST_TREES } from './forestTrees.js'
import { ALIVE, MAX_FALLING, felling, treeHp, treePhase, treeVersion } from '../systems/treeHealth.js'

// Tree health bars + the falling/fading copies of felled trees. Both are
// built for cheapness: all bars are ONE instanced billboard drawn by a tiny
// shader (fill + colour come from a per-instance attribute, rewritten only
// when a tree's hp changes), and a felled tree is a pooled group of 8 boxes
// with two reused transparent materials — nothing is created per fell.

// --- Health bars ------------------------------------------------------------------

const BAR_W = 2.4
const BAR_H = 0.3

const BAR_VERT = /* glsl */ `
attribute float aFill;
varying vec2 vUv;
varying float vFill;
void main() {
  vUv = uv;
  vFill = aFill;
  // Billboard: place the instance centre in view space, then offset in screen axes.
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mv.xy += position.xy * vec2(${BAR_W.toFixed(2)}, ${BAR_H.toFixed(2)});
  gl_Position = projectionMatrix * mv;
  if (aFill < 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // felled: clipped away
}
`

// Green -> yellow -> red as the fill drops.
const BAR_FRAG = /* glsl */ `
varying vec2 vUv;
varying float vFill;
void main() {
  const float bx = 0.018;
  const float by = 0.17;
  vec2 inner = (vUv - vec2(bx, by)) / vec2(1.0 - 2.0 * bx, 1.0 - 2.0 * by);
  if (inner.x < 0.0 || inner.x > 1.0 || inner.y < 0.0 || inner.y > 1.0) {
    gl_FragColor = vec4(0.05, 0.05, 0.07, 1.0); // border
    return;
  }
  if (inner.x > vFill) {
    gl_FragColor = vec4(0.17, 0.17, 0.2, 1.0); // empty
    return;
  }
  vec3 red = vec3(0.9, 0.16, 0.12);
  vec3 yellow = vec3(0.98, 0.8, 0.1);
  vec3 green = vec3(0.2, 0.8, 0.25);
  vec3 col = vFill > 0.5 ? mix(yellow, green, (vFill - 0.5) * 2.0) : mix(red, yellow, vFill * 2.0);
  col *= 0.85 + 0.3 * inner.y; // soft top highlight
  gl_FragColor = vec4(col, 1.0);
}
`

export function TreeBars() {
  const trees = FOREST_TREES
  const meshRef = useRef()
  const lastVersion = useRef(-1)
  const { geometry, material, fill } = useMemo(() => {
    const fill = new InstancedBufferAttribute(new Float32Array(trees.length).fill(-1), 1)
    const geometry = new PlaneGeometry(1, 1)
    geometry.setAttribute('aFill', fill)
    const material = new ShaderMaterial({ vertexShader: BAR_VERT, fragmentShader: BAR_FRAG, toneMapped: false })
    return { geometry, material, fill }
  }, [trees])
  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useLayoutEffect(() => {
    const m = new Matrix4()
    trees.forEach((t, i) => meshRef.current.setMatrixAt(i, m.makeTranslation(t.x, t.y + 6.5 * t.s, t.z)))
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [trees])

  useFrame(() => {
    if (lastVersion.current === treeVersion.v) return
    lastVersion.current = treeVersion.v
    const a = fill.array
    // Only damaged, still-standing trees show a bar (-1 = hidden in the shader).
    for (let i = 0; i < a.length; i++) a[i] = treePhase[i] === ALIVE && treeHp[i] < TREE.hp ? treeHp[i] / TREE.hp : -1
    fill.needsUpdate = true
  })

  return <instancedMesh name="Tree Health Bars" ref={meshRef} args={[geometry, material, trees.length]} frustumCulled={false} renderOrder={2} />
}

// --- Falling trees ----------------------------------------------------------------

const unitBox = new BoxGeometry(1, 1, 1)
// Same boxes as Forest.jsx, in the tree's local space (base at the origin, scale 1).
const PARTS = [
  { mat: 'trunk', p: [0, 1.4, 0], s: [0.85, 2.8, 0.85] },
  ...[[0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55]].map(([x, z]) => ({ mat: 'trunk', p: [x, 0.3, z], s: [0.45, 0.6, 0.45] })),
  { mat: 'leaves', p: [0, 3.2, 0], s: [3.1, 1.5, 3.1] },
  { mat: 'leaves', p: [0, 4.4, 0], s: [2.3, 1.1, 2.3] },
  { mat: 'leaves', p: [0, 5.3, 0], s: [1.3, 0.8, 1.3] },
]
const FALL_S = TREE.fallMs / 1000
const FADE_S = TREE.fadeMs / 1000
const FALL_ANGLE = 1.45 // rad, just shy of flat so the canopy leans on the ground
const _axis = new Vector3()

// The tile materials are cached singletons, so each pool slot gets a clone it
// can fade without touching the standing trees.
function ghost(base) {
  const m = base.clone()
  m.onBeforeCompile = base.onBeforeCompile
  m.customProgramCacheKey = base.customProgramCacheKey
  m.transparent = true
  return m
}

export function FallingTrees() {
  const groups = useRef([])
  const slots = useMemo(() => Array.from({ length: MAX_FALLING }, () => ({ trunk: ghost(MAT.trunk), leaves: ghost(MAT.leaves) })), [])
  useEffect(() => () => slots.forEach((s) => {
    s.trunk.dispose()
    s.leaves.dispose()
  }), [slots])

  useFrame(() => {
    for (let i = 0; i < MAX_FALLING; i++) {
      const g = groups.current[i]
      const f = felling[i]
      if (!g) continue
      if (!f) {
        g.visible = false
        continue
      }
      const { tree, t } = f
      const u = Math.min(1, t / FALL_S)
      g.visible = true
      g.position.set(tree.x, tree.y + 0.5 * tree.s * u * u, tree.z)
      g.scale.setScalar(tree.s)
      g.quaternion.setFromAxisAngle(_axis.set(f.dz, 0, -f.dx), FALL_ANGLE * u * u)
      const opacity = Math.max(0, 1 - t / FADE_S)
      slots[i].trunk.opacity = opacity
      slots[i].leaves.opacity = opacity
      // A fading tree shouldn't keep casting a solid shadow.
      const shadow = t < FALL_S
      if (g.userData.shadow !== shadow) {
        g.userData.shadow = shadow
        for (const c of g.children) c.castShadow = shadow
      }
    }
  })

  return (
    <group name="Falling Trees">
      {slots.map((slot, i) => (
        <group key={i} ref={(g) => (groups.current[i] = g)} visible={false}>
          {PARTS.map((part, j) => (
            <mesh key={j} geometry={unitBox} material={slot[part.mat]} position={part.p} scale={part.s} castShadow receiveShadow />
          ))}
        </group>
      ))}
    </group>
  )
}
