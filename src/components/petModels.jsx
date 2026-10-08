// Procedural blocky ("box") pet models, no external assets, keyed by
// data/eggs.js pet id. Each is ~1 unit long, faces +Z and stands on y = 0
// (`fly` in PET_MODELS makes PetFollowers hover it instead).
// Shared chibi layout: big cube head, small body, four dark feet.
import { useMemo } from 'react'
import * as THREE from 'three'

const mats = new Map()
function mat(color) {
  let m = mats.get(color)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0 })
    mats.set(color, m)
  }
  return m
}

const boxGeo = new THREE.BoxGeometry(1, 1, 1)

// s is the full [x, y, z] size.
function Box({ p = [0, 0, 0], s = [1, 1, 1], c, r }) {
  return <mesh position={p} scale={s} rotation={r} geometry={boxGeo} material={mat(c)} castShadow />
}

// Big black eyes with a small white glint.
function Eyes({ y = 0.05, z, x = 0.19, size = 0.1, c = '#101010' }) {
  return [1, -1].map((sx) => (
    <group key={sx}>
      <Box p={[sx * x, y, z]} s={[size, size * 1.15, 0.03]} c={c} />
      <Box p={[sx * x + size * 0.18, y + size * 0.25, z + 0.02]} s={[size * 0.4, size * 0.4, 0.02]} c="#ffffff" />
    </group>
  ))
}

function Feet({ c, x = 0.17, z = 0.18, size = 0.16 }) {
  return [
    [x, z],
    [-x, z],
    [x, -z],
    [-x, -z],
  ].map(([fx, fz], i) => <Box key={i} p={[fx, size / 2, fz]} s={[size, size, size * 1.2]} c={c} />)
}

// children render in head space (origin = head centre, front face at z = h/2).
function Chibi({ body, belly, head, feet = '#222', hs = 0.7, scale = 1, tail, tailC, children }) {
  const hc = head || body
  return (
    <group scale={scale}>
      <Feet c={feet} />
      <Box p={[0, 0.34, -0.02]} s={[0.5, 0.36, 0.6]} c={body} />
      {belly && <Box p={[0, 0.3, 0.0]} s={[0.46, 0.28, 0.5]} c={belly} />}
      {tail && <Box p={[0, 0.42, -0.4]} s={[0.1, 0.1, 0.16]} c={tailC || body} />}
      <group position={[0, 0.34 + 0.18 + hs / 2 - 0.05, 0.12]}>
        <Box s={[hs, hs * 0.92, hs]} c={hc} />
        <Eyes z={hs / 2 + 0.01} y={0.04} x={hs * 0.27} size={hs * 0.15} />
        {children}
      </group>
    </group>
  )
}

const HF = 0.36 // head front face z

function Bear() {
  return (
    <Chibi body="#8a5a36" belly="#a8764b" feet="#4a2f1a" tail>
      <Box p={[0.3, 0.38, -0.02]} s={[0.2, 0.2, 0.12]} c="#8a5a36" />
      <Box p={[-0.3, 0.38, -0.02]} s={[0.2, 0.2, 0.12]} c="#8a5a36" />
      <Box p={[0, -0.12, HF + 0.04]} s={[0.3, 0.2, 0.12]} c="#d9b38a" />
      <Box p={[0, -0.06, HF + 0.11]} s={[0.1, 0.07, 0.04]} c="#1a1a1a" />
    </Chibi>
  )
}

function Panther() {
  return (
    <Chibi body="#2a2a33" belly="#3a3a46" feet="#15151a" tail>
      <Box p={[0.27, 0.4, 0]} s={[0.14, 0.2, 0.1]} c="#2a2a33" r={[0, 0, -0.2]} />
      <Box p={[-0.27, 0.4, 0]} s={[0.14, 0.2, 0.1]} c="#2a2a33" r={[0, 0, 0.2]} />
      <Box p={[0, -0.12, HF + 0.03]} s={[0.26, 0.15, 0.1]} c="#3a3a46" />
      <Box p={[0, -0.06, HF + 0.09]} s={[0.08, 0.06, 0.04]} c="#e08aa0" />
      <Box p={[0.19, 0.04, HF + 0.025]} s={[0.1, 0.12, 0.02]} c="#ffd84a" />
      <Box p={[-0.19, 0.04, HF + 0.025]} s={[0.1, 0.12, 0.02]} c="#ffd84a" />
      <Box p={[0.19, 0.04, HF + 0.04]} s={[0.04, 0.12, 0.02]} c="#101010" />
      <Box p={[-0.19, 0.04, HF + 0.04]} s={[0.04, 0.12, 0.02]} c="#101010" />
    </Chibi>
  )
}

function SnowCat() {
  return (
    <Chibi body="#eef4fb" belly="#ffffff" feet="#9fb4c8" tail scale={0.95}>
      <Box p={[0.27, 0.4, 0]} s={[0.14, 0.2, 0.1]} c="#eef4fb" r={[0, 0, -0.2]} />
      <Box p={[-0.27, 0.4, 0]} s={[0.14, 0.2, 0.1]} c="#eef4fb" r={[0, 0, 0.2]} />
      <Box p={[0.27, 0.38, 0.04]} s={[0.07, 0.12, 0.04]} c="#f7b6c8" />
      <Box p={[-0.27, 0.38, 0.04]} s={[0.07, 0.12, 0.04]} c="#f7b6c8" />
      <Box p={[0, -0.1, HF + 0.03]} s={[0.1, 0.07, 0.06]} c="#f08ca8" />
      <Box p={[0.19, 0.04, HF + 0.025]} s={[0.1, 0.12, 0.02]} c="#4aa3ff" />
      <Box p={[-0.19, 0.04, HF + 0.025]} s={[0.1, 0.12, 0.02]} c="#4aa3ff" />
    </Chibi>
  )
}

function Lion() {
  return (
    <Chibi body="#d9a441" belly="#ecc472" feet="#8a5a1a" tail scale={1.05}>
      {/* mane frames the face */}
      <Box p={[0, 0, -0.1]} s={[0.92, 0.92, 0.3]} c="#8a4f16" />
      <Box p={[0, 0.5, -0.05]} s={[0.7, 0.14, 0.4]} c="#a2601c" />
      <Box p={[0.3, 0.4, -0.2]} s={[0.16, 0.16, 0.1]} c="#8a4f16" />
      <Box p={[-0.3, 0.4, -0.2]} s={[0.16, 0.16, 0.1]} c="#8a4f16" />
      <Box p={[0, -0.12, HF + 0.04]} s={[0.3, 0.2, 0.1]} c="#ecc472" />
      <Box p={[0, -0.05, HF + 0.1]} s={[0.1, 0.07, 0.04]} c="#4a2a1a" />
    </Chibi>
  )
}

function Elephant() {
  const grey = '#9aa3b2'
  return (
    <Chibi body={grey} belly="#aab2c0" head="#a8b0bf" feet="#1a1a22" scale={1.05} tail>
      {/* flat ears */}
      <Box p={[0.43, 0.02, -0.02]} s={[0.07, 0.4, 0.34]} c="#b8c0cd" />
      <Box p={[-0.43, 0.02, -0.02]} s={[0.07, 0.4, 0.34]} c="#b8c0cd" />
      {/* trunk + tusks */}
      <Box p={[0, -0.1, HF + 0.06]} s={[0.14, 0.34, 0.14]} c={grey} />
      <Box p={[0, -0.3, HF + 0.12]} s={[0.14, 0.12, 0.2]} c={grey} />
      <Box p={[0.14, -0.2, HF + 0.04]} s={[0.05, 0.05, 0.24]} c="#f4efe2" r={[0.4, 0, 0]} />
      <Box p={[-0.14, -0.2, HF + 0.04]} s={[0.05, 0.05, 0.24]} c="#f4efe2" r={[0.4, 0, 0]} />
    </Chibi>
  )
}

function Eagle() {
  const brown = '#6b4423'
  return (
    <group>
      <Box p={[0, 0.25, -0.05]} s={[0.36, 0.34, 0.5]} c={brown} />
      <Box p={[0, 0.2, 0.0]} s={[0.3, 0.2, 0.4]} c="#a9764a" />
      <group position={[0, 0.58, 0.18]}>
        <Box s={[0.4, 0.38, 0.4]} c="#f5f1e8" />
        <Eyes z={0.21} y={0.04} x={0.12} size={0.08} />
        <Box p={[0, -0.06, 0.28]} s={[0.12, 0.1, 0.16]} c="#f2b21c" />
      </group>
      {/* blocky wings */}
      <Box p={[0.35, 0.3, -0.05]} s={[0.4, 0.06, 0.34]} c={brown} r={[0, 0, -0.25]} />
      <Box p={[0.64, 0.24, -0.08]} s={[0.24, 0.05, 0.26]} c="#2d1c0e" r={[0, 0, -0.25]} />
      <Box p={[-0.35, 0.3, -0.05]} s={[0.4, 0.06, 0.34]} c={brown} r={[0, 0, 0.25]} />
      <Box p={[-0.64, 0.24, -0.08]} s={[0.24, 0.05, 0.26]} c="#2d1c0e" r={[0, 0, 0.25]} />
      <Box p={[0, 0.25, -0.42]} s={[0.24, 0.05, 0.22]} c="#f5f1e8" />
      <Box p={[0.08, 0.05, 0.02]} s={[0.06, 0.1, 0.06]} c="#f2b21c" />
      <Box p={[-0.08, 0.05, 0.02]} s={[0.06, 0.1, 0.06]} c="#f2b21c" />
    </group>
  )
}

function Imp() {
  const red = '#c8323c'
  return (
    <group scale={0.95}>
      <Box p={[0.12, 0.08, 0]} s={[0.14, 0.16, 0.18]} c="#2a1418" />
      <Box p={[-0.12, 0.08, 0]} s={[0.14, 0.16, 0.18]} c="#2a1418" />
      <Box p={[0, 0.38, 0]} s={[0.4, 0.4, 0.3]} c={red} />
      <Box p={[0.28, 0.4, 0.04]} s={[0.1, 0.3, 0.1]} c={red} />
      <Box p={[-0.28, 0.4, 0.04]} s={[0.1, 0.3, 0.1]} c={red} />
      <group position={[0, 0.9, 0.02]}>
        <Box s={[0.6, 0.54, 0.54]} c={red} />
        <Eyes z={0.28} y={0.05} x={0.15} size={0.12} c="#ffe14a" />
        <Box p={[0, -0.14, 0.28]} s={[0.22, 0.05, 0.02]} c="#2a1418" />
        <Box p={[0.2, 0.38, 0]} s={[0.1, 0.24, 0.1]} c="#2a1418" r={[0, 0, -0.25]} />
        <Box p={[-0.2, 0.38, 0]} s={[0.1, 0.24, 0.1]} c="#2a1418" r={[0, 0, 0.25]} />
      </group>
      <Box p={[0.36, 0.6, -0.2]} s={[0.4, 0.3, 0.05]} c="#6a1f4a" r={[0, 0.5, -0.4]} />
      <Box p={[-0.36, 0.6, -0.2]} s={[0.4, 0.3, 0.05]} c="#6a1f4a" r={[0, -0.5, 0.4]} />
      <Box p={[0, 0.25, -0.34]} s={[0.07, 0.07, 0.3]} c={red} />
      <Box p={[0, 0.25, -0.54]} s={[0.14, 0.14, 0.1]} c="#2a1418" />
    </group>
  )
}

function FrostDragon() {
  const ice = '#7fd0ff'
  return (
    <Chibi body={ice} belly="#d8f2ff" head="#8fd8ff" feet="#4aa3dd" scale={1.1} tail tailC={ice}>
      <Box p={[0, -0.1, HF + 0.08]} s={[0.4, 0.26, 0.18]} c="#d8f2ff" />
      <Box p={[0.08, -0.04, HF + 0.18]} s={[0.05, 0.05, 0.02]} c="#1a3a7a" />
      <Box p={[-0.08, -0.04, HF + 0.18]} s={[0.05, 0.05, 0.02]} c="#1a3a7a" />
      <Box p={[0.2, 0.42, -0.1]} s={[0.1, 0.24, 0.1]} c="#f4faff" r={[-0.4, 0, -0.2]} />
      <Box p={[-0.2, 0.42, -0.1]} s={[0.1, 0.24, 0.1]} c="#f4faff" r={[-0.4, 0, 0.2]} />
      {/* wings + back spikes (head space is offset up/forward) */}
      <Box p={[0.5, -0.2, -0.45]} s={[0.4, 0.05, 0.4]} c="#a8e0ff" r={[0, 0.3, -0.5]} />
      <Box p={[-0.5, -0.2, -0.45]} s={[0.4, 0.05, 0.4]} c="#a8e0ff" r={[0, -0.3, 0.5]} />
      {[-0.55, -0.75].map((z, i) => (
        <Box key={i} p={[0, -0.2 - i * 0.06, z]} s={[0.08, 0.12, 0.1]} c="#f4faff" />
      ))}
    </Chibi>
  )
}

export const PET_MODELS = {
  bear: { Model: Bear },
  eagle: { Model: Eagle, fly: true },
  elephant: { Model: Elephant },
  panther: { Model: Panther },
  lion: { Model: Lion },
  snow_cat: { Model: SnowCat },
  imp: { Model: Imp, fly: true },
  frost_dragon: { Model: FrostDragon, fly: true },
}

// Fallback for a pet id with no model: a plain cube.
function Fallback() {
  return <Box p={[0, 0.3, 0]} s={[0.6, 0.6, 0.6]} c="#c9c9cf" />
}

export function PetModel({ id }) {
  const Model = useMemo(() => PET_MODELS[id]?.Model || Fallback, [id])
  return <Model />
}
