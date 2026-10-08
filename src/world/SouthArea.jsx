import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MAT, glow, plastic } from '../materials/world.js'
import { CRAFT, EGGS, FOUNTAIN, LAWN_TOP, PHOENIX_DISPLAY } from './layout.js'
import Forge from './Forge.jsx'
import PhoenixModel from '../components/PhoenixModel.jsx'
import DragonFangModel from '../components/DragonFangModel.jsx'
import { chopperStrength } from '../systems/choppers.js'
import { Figure, Label, footprint, useColliders } from './common.jsx'
import { PHOENIX_PRICE } from '../data/eggs.js'
import { DRAGONS_FANG_PRICE } from '../data/choppers.js'
import { formatNumber } from '../utils/format.js'
import { spottedEggTexture, voidEggTexture } from './signs.js'

// The south lawn, east to west: fountain, Craft Artifacts workbench + NPC,
// the featured-pet (Blazing Phoenix) pad, the egg platform, and the Forge.
const Y = LAWN_TOP

// --- Eggs -----------------------------------------------------------------------
function Egg({ x, z, kind, price, icon, colors, baseY }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.y = t * 0.6
    ref.current.position.y = 1.55 + Math.sin(t * 1.6 + x) * 0.08
  })
  const map = kind === 'spotted' ? spottedEggTexture() : voidEggTexture()
  return (
    <group position={[x, baseY, z]}>
      <mesh position={[0, 0.06, 0]} material={glow('#ffd21f', 1.4)}>
        <cylinderGeometry args={[1.25, 1.25, 0.12, 24]} />
      </mesh>
      <mesh position={[0, 0.13, 0]} material={MAT.black}>
        <cylinderGeometry args={[1.0, 1.0, 0.04, 24]} />
      </mesh>
      <mesh ref={ref} scale={[1, 1.3, 1]} castShadow>
        <sphereGeometry args={[1.05, 32, 24]} />
        {kind === 'spotted'
          ? <meshStandardMaterial map={map} roughness={0.35} />
          : <meshStandardMaterial map={map} emissiveMap={map} emissive="#3ff3ff" emissiveIntensity={0.9} roughness={0.3} />}
      </mesh>
      <Label lines={[{ text: price, icon, size: 110, colors, stroke: '#2a0c04' }]} position={[0, 4.3, 0]} height={1.3} />
    </group>
  )
}

function EggPlatform() {
  const { x, z, w, d } = EGGS.platform
  const top = Y + 0.35
  useColliders([{ x0: x - w / 2 - 0.3, x1: x + w / 2 + 0.3, z0: z - d / 2 - 0.3, z1: z + d / 2 + 0.3, top }])
  return (
    <group>
      <mesh position={[x, top / 2 - 0.02, z]} material={MAT.black} castShadow receiveShadow>
        <boxGeometry args={[w + 0.6, top - 0.04, d + 0.6]} />
      </mesh>
      <mesh position={[x, top / 2, z]} material={MAT.eggBase} receiveShadow>
        <boxGeometry args={[w, top, d]} />
      </mesh>
      {EGGS.list.map((e) => <Egg key={e.kind} {...e} baseY={top} />)}
    </group>
  )
}

// --- Featured pet: Blazing Phoenix ----------------------------------------------------
// components/PhoenixModel.jsx draws the bird; here it hovers over the pad, bobbing
// and turning to look about. Bought with cash via systems/phoenix.js.
function Phoenix() {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!ref.current) return
    ref.current.rotation.y = Math.PI + Math.sin(t * 0.4) * 0.6 // faces the plaza (north)
    ref.current.position.y = 0.45 + Math.sin(t * 1.6) * 0.1
  })
  return (
    <group ref={ref} scale={1.5}>
      <PhoenixModel display />
    </group>
  )
}

function FeaturedPad({ x, z, children, lines, labelY = 4.8 }) {
  useColliders([{ x0: x - 1.3, x1: x + 1.3, z0: z - 1.3, z1: z + 1.3, top: Y + 0.3 }])
  return (
    <group position={[x, Y, z]}>
      <mesh position={[0, 0.12, 0]} material={glow('#ff6fe0', 0.8)}>
        <boxGeometry args={[2.6, 0.24, 2.6]} />
      </mesh>
      <mesh position={[0, 0.16, 0]} material={plastic('#ff9cec', { roughness: 0.4 })} receiveShadow>
        <boxGeometry args={[2.2, 0.26, 2.2]} />
      </mesh>
      {children}
      <Label lines={lines} position={[0, labelY, 0]} height={1.5} />
    </group>
  )
}

export function PhoenixDisplay() {
  return (
    <FeaturedPad
      {...PHOENIX_DISPLAY}
      labelY={5.6}
      lines={[
        { text: '250% Stronger than Best Pet!', size: 54, colors: ['#d8ffb0', '#3fe05a'], stroke: '#0c3a10' },
        { text: 'Blazing Phoenix', size: 84, colors: ['#ffe08a', '#ff7a1a'], stroke: '#4a1404' },
        { text: formatNumber(PHOENIX_PRICE), icon: 'cash', size: 72, colors: '#ffffff', stroke: '#1b1b1f' },
      ]}
    >
      <Phoenix />
    </FeaturedPad>
  )
}

// --- Featured chopper: Dragon's Fang -------------------------------------------------
// components/DragonFangModel.jsx draws the animated sword; bought with cash via
// systems/swordPad.js (hold E).
export function SwordDisplay({ x, z }) {
  const strength = chopperStrength({ chopper: 'dragonsfang' })
  return (
    <FeaturedPad
      x={x}
      z={z}
      labelY={6.4}
      lines={[
        { text: '750% Stronger than Best Chopper!', size: 54, colors: ['#d8ffb0', '#3fe05a'], stroke: '#0c3a10' },
        { text: `+${formatNumber(strength)} Strength`, size: 84, colors: '#ffffff', stroke: '#1b1b1f' },
        { text: formatNumber(DRAGONS_FANG_PRICE), icon: 'cash', size: 72, colors: '#ffffff', stroke: '#1b1b1f' },
      ]}
    >
      <DragonFangModel />
    </FeaturedPad>
  )
}

// --- Craft Artifacts -----------------------------------------------------------
// Chunky red-brown workbench with black iron corner brackets, two front drawers and a
// lower shelf of planks and silver ingots; the craftsman (vest over a patterned shirt)
// stands behind it, with a hammer, a saw and the pink artifact gem on top.
const BENCH = { w: 4.4, d: 1.9, top: 1.3 }
const CRAFT_PROPS = { barrels: [[-2.6, -1.5], [-3.2, -0.6]], egg: [-2.5, -2.6] } // local x, z

function Barrel({ x, z }) {
  const wood = plastic('#8a5a2e')
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]} material={wood} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.45, 1, 14]} />
      </mesh>
      {[0.2, 0.8].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={MAT.black}>
          <cylinderGeometry args={[0.52, 0.52, 0.07, 14]} />
        </mesh>
      ))}
    </group>
  )
}

function CraftArtifacts() {
  const { x, z, face } = CRAFT
  // props sit in the bench's local frame (rotated by `face`, a half-turn)
  const toWorld = ([lx, lz], r) => ({ x0: x - lx - r, x1: x - lx + r, z0: z - lz - r, z1: z - lz + r, top: Y + 1 })
  useColliders([
    footprint(x, z, BENCH.w + 0.2, BENCH.d + 0.2, face, BENCH.top),
    ...CRAFT_PROPS.barrels.map((p) => toWorld(p, 0.5)),
  ])
  const wood = plastic('#8c3a1c', { flatShading: true })
  const woodDark = plastic('#5e2210')
  const woodTop = plastic('#a04a22', { flatShading: true })
  const iron = plastic('#1a1a1e', { metalness: 0.4, roughness: 0.5 })
  const { w, d, top } = BENCH
  const hw = w / 2
  const hd = d / 2
  return (
    <group position={[x, Y, z]} rotation={[0, face, 0]}>
      {/* top slab + front apron */}
      <mesh position={[0, top, 0]} material={woodTop} castShadow receiveShadow>
        <boxGeometry args={[w, 0.22, d]} />
      </mesh>
      <mesh position={[0, top - 0.55, hd - 0.1]} material={wood} castShadow receiveShadow>
        <boxGeometry args={[w - 0.5, 0.9, 0.18]} />
      </mesh>
      <mesh position={[0, top - 0.55, -hd + 0.1]} material={wood} castShadow>
        <boxGeometry args={[w - 0.5, 0.9, 0.18]} />
      </mesh>
      {/* two drawers with handle slots */}
      {[-0.95, 0.95].map((dx) => (
        <group key={dx} position={[dx, top - 0.55, hd + 0.01]}>
          <mesh material={woodDark}>
            <boxGeometry args={[1.7, 0.66, 0.05]} />
          </mesh>
          <mesh position={[0, 0.02, 0.04]} material={wood}>
            <boxGeometry args={[1.56, 0.52, 0.05]} />
          </mesh>
          <mesh position={[0, 0.08, 0.08]} material={iron}>
            <boxGeometry args={[0.62, 0.09, 0.04]} />
          </mesh>
        </group>
      ))}
      {/* legs with black iron brackets at the top corners and iron feet */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
        <group key={`${sx}${sz}`} position={[sx * (hw - 0.2), 0, sz * (hd - 0.2)]}>
          <mesh position={[0, top / 2, 0]} material={wood} castShadow>
            <boxGeometry args={[0.4, top, 0.4]} />
          </mesh>
          <mesh position={[0, top - 0.02, 0]} material={iron} castShadow>
            <boxGeometry args={[0.5, 0.36, 0.5]} />
          </mesh>
          <mesh position={[0, 0.1, 0]} material={iron}>
            <boxGeometry args={[0.46, 0.2, 0.46]} />
          </mesh>
        </group>
      ))}
      {/* lower shelf: planks and silver ingots */}
      <mesh position={[0, 0.42, 0]} material={woodDark} castShadow receiveShadow>
        <boxGeometry args={[w - 0.6, 0.1, d - 0.5]} />
      </mesh>
      {[[-1.1, 0.5, 0.15, 0.1], [-1.0, 0.6, -0.15, -0.08]].map(([px, py, pz, r], i) => (
        <mesh key={i} position={[px, py, pz]} rotation={[0, r, 0]} material={MAT.woodLight} castShadow>
          <boxGeometry args={[1.5, 0.1, 0.32]} />
        </mesh>
      ))}
      {[[0.9, 0.52, 0.1, 0.3], [1.15, 0.52, -0.2, -0.2], [1.1, 0.62, -0.05, 0.1]].map(([ix, iy, iz, r], i) => (
        <mesh key={i} position={[ix, iy, iz]} rotation={[0, r, 0]} material={MAT.metal} castShadow>
          <boxGeometry args={[0.55, 0.14, 0.28]} />
        </mesh>
      ))}
      {/* on the bench: hammer, saw, the glowing artifact */}
      <group position={[-1.3, top + 0.16, 0.2]} rotation={[0, 0.5, 0]}>
        <mesh material={plastic('#6b3f1d')} castShadow>
          <boxGeometry args={[0.8, 0.09, 0.09]} />
        </mesh>
        <mesh position={[0.4, 0.05, 0]} material={MAT.metal} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.4]} />
        </mesh>
      </group>
      <group position={[1.2, top + 0.13, 0.3]} rotation={[0, -0.3, 0]}>
        <mesh material={MAT.metal} castShadow>
          <boxGeometry args={[1.2, 0.03, 0.34]} />
        </mesh>
        <mesh position={[0.72, 0.04, 0]} material={plastic('#c0392b')}>
          <boxGeometry args={[0.3, 0.1, 0.26]} />
        </mesh>
      </group>
      <mesh position={[0.2, top + 0.4, 0.25]} material={glow('#ff4fc8', 1.1)}>
        <octahedronGeometry args={[0.2, 0]} />
      </mesh>
      {/* the craftsman, behind the bench: white patterned shirt, dark vest and straps */}
      <group position={[0.3, 0, -1.55]}>
        <Figure shirt="#f1efe9" pants="#2a2a30" hair="#241208" />
        <mesh position={[0, 1.5, 0.26]} material={plastic('#17171b')}>
          <boxGeometry args={[0.72, 0.98, 0.04]} />
        </mesh>
        {[-0.3, 0.3].map((sx) => (
          <mesh key={sx} position={[sx, 1.82, 0.27]} material={plastic('#2a1a10')}>
            <boxGeometry args={[0.1, 0.5, 0.04]} />
          </mesh>
        ))}
        <mesh position={[0, 1.2, 0.28]} material={plastic('#4a2c14')}>
          <boxGeometry args={[0.9, 0.1, 0.04]} />
        </mesh>
        <mesh position={[0.78, 1.9, 0]} material={plastic('#e9e6df')} castShadow>
          <boxGeometry args={[0.52, 0.5, 0.52]} />
        </mesh>
      </group>
      {/* barrels and a pale green egg behind */}
      {CRAFT_PROPS.barrels.map(([bx, bz]) => <Barrel key={`${bx}${bz}`} x={bx} z={bz} />)}
      <mesh position={[CRAFT_PROPS.egg[0], 0.55, CRAFT_PROPS.egg[1]]} scale={[1, 1.25, 1]} material={plastic('#b7d89a')} castShadow>
        <sphereGeometry args={[0.55, 16, 12]} />
      </mesh>
      <Label lines={[{ text: 'Craft Artifacts', size: 130, colors: ['#ffd27a', '#f07a12'], stroke: '#4a1c02' }]} position={[0, 5.4, 0]} height={1.8} />
    </group>
  )
}

// --- Fountain ----------------------------------------------------------------------
function Fountain() {
  const { x, z } = FOUNTAIN
  useColliders([{ x0: x - 2.6, x1: x + 2.6, z0: z - 2.6, z1: z + 2.6, top: Y + 0.9 }])
  return (
    <group position={[x, Y, z]}>
      <mesh position={[0, 0.4, 0]} material={MAT.stoneLight} castShadow receiveShadow>
        <cylinderGeometry args={[2.8, 3, 0.8, 16]} />
      </mesh>
      <mesh position={[0, 0.79, 0]} material={MAT.water}>
        <cylinderGeometry args={[2.45, 2.45, 0.04, 24]} />
      </mesh>
      <mesh position={[0, 1.4, 0]} material={MAT.stone} castShadow>
        <cylinderGeometry args={[0.35, 0.5, 1.6, 10]} />
      </mesh>
      <mesh position={[0, 2.25, 0]} material={MAT.stoneLight} castShadow>
        <cylinderGeometry args={[1.5, 1.0, 0.4, 14]} />
      </mesh>
      <mesh position={[0, 2.44, 0]} material={MAT.water}>
        <cylinderGeometry args={[1.32, 1.32, 0.04, 20]} />
      </mesh>
      <mesh position={[0, 2.9, 0]} material={MAT.stone} castShadow>
        <cylinderGeometry args={[0.2, 0.28, 0.9, 8]} />
      </mesh>
      <mesh position={[0, 3.4, 0]} material={MAT.stoneLight} castShadow>
        <cylinderGeometry args={[0.75, 0.5, 0.28, 12]} />
      </mesh>
      <mesh position={[0, 3.62, 0]} material={MAT.water}>
        <sphereGeometry args={[0.3, 12, 8]} />
      </mesh>
    </group>
  )
}

export default function SouthArea() {
  return (
    <group>
      <EggPlatform />
      <PhoenixDisplay />
      <CraftArtifacts />
      <Fountain />
      <Forge />
    </group>
  )
}
