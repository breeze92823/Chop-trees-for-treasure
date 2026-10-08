import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MAT, glow, plastic } from '../materials/world.js'
import { CRAFT, EGGS, FOUNTAIN, LAWN_TOP, PHOENIX_DISPLAY } from './layout.js'
import Forge from './Forge.jsx'
import { Figure, Label, footprint, useColliders } from './common.jsx'
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
function Phoenix() {
  const ref = useRef()
  const wingL = useRef()
  const wingR = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ref.current) {
      ref.current.rotation.y = t * 0.5
      ref.current.position.y = 1.7 + Math.sin(t * 2) * 0.12
    }
    const flap = Math.sin(t * 6) * 0.35
    if (wingL.current) wingL.current.rotation.z = 0.3 + flap
    if (wingR.current) wingR.current.rotation.z = -0.3 - flap
  })
  const body = glow('#ff7a1a', 0.5)
  const fire = glow('#ffb21f', 0.9)
  const red = glow('#e8241c', 0.5)
  return (
    <group ref={ref}>
      <mesh scale={[0.5, 0.5, 0.75]} material={body} castShadow>
        <icosahedronGeometry args={[1, 1]} />
      </mesh>
      <mesh position={[0, 0.45, 0.55]} material={body} castShadow>
        <icosahedronGeometry args={[0.32, 1]} />
      </mesh>
      <mesh position={[0, 0.42, 0.9]} rotation={[Math.PI / 2, 0, 0]} material={fire}>
        <coneGeometry args={[0.1, 0.3, 6]} />
      </mesh>
      <mesh position={[0, 0.8, 0.45]} rotation={[-0.4, 0, 0]} material={fire}>
        <coneGeometry args={[0.12, 0.45, 6]} />
      </mesh>
      <group ref={wingL} position={[0.35, 0.15, 0]}>
        <mesh position={[0.65, 0, 0]} scale={[1.3, 0.08, 0.55]} material={red} castShadow>
          <octahedronGeometry args={[0.6, 0]} />
        </mesh>
      </group>
      <group ref={wingR} position={[-0.35, 0.15, 0]}>
        <mesh position={[-0.65, 0, 0]} scale={[1.3, 0.08, 0.55]} material={red} castShadow>
          <octahedronGeometry args={[0.6, 0]} />
        </mesh>
      </group>
      {[-0.25, 0, 0.25].map((a) => (
        <mesh key={a} position={[a * 0.8, -0.05, -0.95]} rotation={[-Math.PI / 2 + 0.3, 0, a]} material={a === 0 ? fire : red}>
          <coneGeometry args={[0.14, 0.9, 5]} />
        </mesh>
      ))}
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
      lines={[
        { text: '250% Stronger than Best Pet!', size: 54, colors: ['#d8ffb0', '#3fe05a'], stroke: '#0c3a10' },
        { text: 'Blazing Phoenix', size: 84, colors: ['#ffe08a', '#ff7a1a'], stroke: '#4a1404' },
      ]}
    >
      <Phoenix />
    </FeaturedPad>
  )
}

// --- Featured chopper: a crystal sword -----------------------------------------------
function CrystalSword() {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!ref.current) return
    ref.current.rotation.y = t * 0.9
    ref.current.position.y = 2.1 + Math.sin(t * 1.8) * 0.12
  })
  const crystal = glow('#c86bff', 0.9, 0.92)
  return (
    <group ref={ref} rotation={[0, 0, 0]}>
      <mesh position={[0, 0.55, 0]} scale={[0.32, 1.7, 0.1]} material={crystal} castShadow>
        <octahedronGeometry args={[1, 0]} />
      </mesh>
      <mesh position={[0, -0.95, 0]} material={plastic('#5a2fd0')} castShadow>
        <boxGeometry args={[0.9, 0.16, 0.22]} />
      </mesh>
      <mesh position={[0, -1.35, 0]} material={plastic('#2a1a3a')} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.7, 8]} />
      </mesh>
      <mesh position={[0, -1.75, 0]} material={glow('#3ff3ff', 1.2)}>
        <icosahedronGeometry args={[0.13, 0]} />
      </mesh>
    </group>
  )
}

export function SwordDisplay({ x, z }) {
  return (
    <FeaturedPad
      x={x}
      z={z}
      labelY={5.2}
      lines={[
        { text: '750% Stronger than Best Chopper!', size: 54, colors: ['#d8ffb0', '#3fe05a'], stroke: '#0c3a10' },
        { text: '+17 Strength', size: 84, colors: '#ffffff', stroke: '#1b1b1f' },
        { text: '839', icon: 'coin', size: 72, colors: '#ffffff', stroke: '#1b1b1f' },
      ]}
    >
      <CrystalSword />
    </FeaturedPad>
  )
}

// --- Craft Artifacts -----------------------------------------------------------
function CraftArtifacts() {
  const { x, z, face } = CRAFT
  useColliders([footprint(x, z, 4.4, 2.0, face, 1.2)])
  const top = plastic('#7a3a1c', { flatShading: true })
  const legs = plastic('#4e2410')
  return (
    <group position={[x, Y, z]} rotation={[0, face, 0]}>
      <mesh position={[0, 1.08, 0]} material={top} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.24, 1.8]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={legs} castShadow>
        <boxGeometry args={[3.6, 0.12, 1.3]} />
      </mesh>
      {[[-1.9, -0.7], [1.9, -0.7], [-1.9, 0.7], [1.9, 0.7]].map(([lx, lz]) => (
        <mesh key={`${lx}${lz}`} position={[lx, 0.5, lz]} material={legs} castShadow>
          <boxGeometry args={[0.22, 1, 0.22]} />
        </mesh>
      ))}
      {/* tools: a saw, a hammer, a plank, a glowing artifact */}
      <group position={[-1.1, 1.22, 0.2]} rotation={[0, 0.3, 0]}>
        <mesh material={MAT.metal} castShadow>
          <boxGeometry args={[1.3, 0.04, 0.42]} />
        </mesh>
        <mesh position={[0.78, 0.05, 0]} material={plastic('#c0392b')}>
          <boxGeometry args={[0.32, 0.12, 0.3]} />
        </mesh>
      </group>
      <group position={[0.4, 1.25, -0.35]} rotation={[0, -0.6, 0]}>
        <mesh material={plastic('#8a5a2a')} castShadow>
          <boxGeometry args={[0.8, 0.08, 0.08]} />
        </mesh>
        <mesh position={[0.4, 0.04, 0]} material={MAT.metal} castShadow>
          <boxGeometry args={[0.16, 0.16, 0.36]} />
        </mesh>
      </group>
      <mesh position={[1.3, 1.26, 0.25]} rotation={[0, 0.2, 0]} material={MAT.woodLight} castShadow>
        <boxGeometry args={[1.1, 0.12, 0.38]} />
      </mesh>
      <mesh position={[0.6, 1.45, 0.35]} material={glow('#ff4fc8', 1.1)}>
        <octahedronGeometry args={[0.2, 0]} />
      </mesh>
      {/* the craftsman, behind the bench */}
      <Figure position={[0.3, 0, -1.6]} shirt="#f4f6f8" pants="#3a2a22" hair="#2a1608" />
      <mesh position={[0.3, 1.25, -1.33]} material={plastic('#6a3a1c')}>
        <boxGeometry args={[0.9, 1.3, 0.04]} />
      </mesh>
      <Label lines={[{ text: 'Craft Artifacts', size: 110, colors: ['#ffd27a', '#f07a12'], stroke: '#4a1c02' }]} position={[0, 5.4, 0]} height={1.5} />
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
