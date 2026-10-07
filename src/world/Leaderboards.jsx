import { MAT, surface } from '../materials/world.js'
import { COLORS } from '../data/config.js'
import { LEADER } from './layout.js'
import { Slab } from './Ground.jsx'
import { Figure, Label, LampPost, Sack, useColliders } from './common.jsx'
import { bannerTexture, leaderboardTexture } from './signs.js'

// The Leaderboards hall at the east end of the plaza: a purple platform up
// two steps, purple checkered walls, a tilted "Leaderboards" banner on two
// pillars, four boards fanned toward the plaza, and #1-player statues.
const wallMat = surface(COLORS.board, { top2: COLORS.board2, side: COLORS.board, side2: COLORS.board2, checker: 2 })
const ARCH_X = LEADER.x0 + 1.4
const PILLAR_Z = 15.6
const PILLAR_H = 9
const BOARD_X = 45

export default function Leaderboards() {
  const { x0, x1, z0, z1, h, steps, boards, statues } = LEADER
  const top = h
  const banner = bannerTexture('leader', { text: 'Leaderboards', icon: 'trophy', a: '#7d45e6', b: '#6c37d4', w: 2560, colors: ['#ffffff', '#f3ecff'], stroke: '#2a1660' })

  useColliders([
    ...steps.map((s) => ({ x0: s.x0, x1: x0, z0, z1, top: s.h })),
    { x0, x1, z0, z1, top },
    { x0: x1 - 1.5, x1, z0, z1, top: 20 },
    { x0, x1, z0: z0 - 0.6, z1: z0, top: 20 },
    { x0, x1, z0: z1, z1: z1 + 0.6, top: 20 },
    ...[-PILLAR_Z, PILLAR_Z].map((pz) => ({ x0: ARCH_X - 0.7, x1: ARCH_X + 0.7, z0: pz - 0.7, z1: pz + 0.7, top: 20 })),
    ...statues.map((s) => ({ x0: BOARD_X, x1: BOARD_X + 1.6, z0: s.z - 0.8, z1: s.z + 0.8, top: top + 1.2 })),
  ])

  return (
    <group>
      {steps.map((s, i) => (
        <Slab key={i} x0={s.x0} x1={x0} z0={z0} z1={z1} top={s.h} y0={-0.2} material={MAT.boardStep} cast />
      ))}
      <Slab x0={x0} x1={x1} z0={z0} z1={z1} top={top} y0={-0.2} material={MAT.board} cast />
      {/* walls */}
      <Slab x0={x1 - 1.5} x1={x1} z0={z0 - 0.6} z1={z1 + 0.6} top={top + 8} y0={0} material={wallMat} cast />
      <Slab x0={x0} x1={x1} z0={z0 - 0.6} z1={z0} top={top + 5} y0={0} material={wallMat} cast />
      <Slab x0={x0} x1={x1} z0={z1} z1={z1 + 0.6} top={top + 5} y0={0} material={wallMat} cast />

      {/* arch */}
      {[-PILLAR_Z, PILLAR_Z].map((pz) => (
        <mesh key={pz} position={[ARCH_X, top + PILLAR_H / 2, pz]} material={wallMat} castShadow receiveShadow>
          <boxGeometry args={[1.4, PILLAR_H, 1.4]} />
        </mesh>
      ))}
      <group position={[ARCH_X + 0.3, top + PILLAR_H + 1.2, 0]} rotation={[0, 0, -0.14]}>
        <mesh material={wallMat} castShadow>
          <boxGeometry args={[1.2, 3, PILLAR_Z * 2 + 2.4]} />
        </mesh>
        <mesh position={[-0.61, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[PILLAR_Z * 2 + 2.2, 2.8]} />
          <meshStandardMaterial map={banner} roughness={0.7} />
        </mesh>
      </group>

      {/* boards, fanned toward the plaza */}
      {boards.map((b) => (
        <group key={b.title} position={[BOARD_X + Math.abs(b.z) * 0.12, top, b.z]} rotation={[0, -Math.PI / 2 - b.z * 0.03, 0]}>
          {[-2, 2].map((lx) => (
            <mesh key={lx} position={[lx, 1, -0.1]} material={MAT.woodDark} castShadow>
              <boxGeometry args={[0.3, 2, 0.3]} />
            </mesh>
          ))}
          <mesh position={[0, 3.9, -0.2]} material={MAT.woodDark} castShadow>
            <boxGeometry args={[5.6, 4.4, 0.3]} />
          </mesh>
          <mesh position={[0, 3.9, -0.04]}>
            <planeGeometry args={[5.3, 4.2]} />
            <meshStandardMaterial map={leaderboardTexture(b.title, b.icon, b.color)} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* #1 statues between the boards */}
      {statues.map((s, i) => (
        <group key={i} position={[BOARD_X + 0.8, top, s.z]}>
          <mesh position={[0, 0.6, 0]} material={MAT.stoneLight} castShadow receiveShadow>
            <boxGeometry args={[1.6, 1.2, 1.6]} />
          </mesh>
          <Figure position={[0, 1.2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={0.95} shirt={s.color} pants={s.color} skin={s.color} hair={s.color} pose={i % 2 ? 'cheer' : 'stand'} />
          <Label lines={[{ text: '#1', size: 80, colors: ['#fff3a0', '#ffc21a'], stroke: '#4a3000' }]} position={[0, 4.4, 0]} height={0.6} />
        </group>
      ))}

      <LampPost position={[x0 + 0.8, top, -8.8]} />
      <LampPost position={[x0 + 0.8, top, 8.8]} />
      <LampPost position={[x0 + 0.8, top, 0]} />

      {/* treasure sacks piled at the foot of the steps */}
      <Sack position={[30.2, 0.1, 11.5]} rotation={0.4} />
      <Sack position={[29.4, 0.1, 12.6]} rotation={1.3} scale={0.85} />
      <Sack position={[30.4, 0.1, 13.6]} rotation={2.2} scale={1.1} />
      <Sack position={[30.2, 0.1, -12]} rotation={0.8} />
      <Sack position={[29.3, 0.1, -13.1]} rotation={2.5} scale={0.9} />
    </group>
  )
}
