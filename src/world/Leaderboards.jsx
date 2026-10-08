import { useEffect, useMemo } from 'react'
import { MAT, surface } from '../materials/world.js'
import { COLORS } from '../data/config.js'
import { LEADER } from './layout.js'
import { Slab } from './Ground.jsx'
import { LampPost, Sack, useColliders } from './common.jsx'
import TopPlayerStatue from './TopPlayerStatue.jsx'
import { bannerTexture, leaderboardTexture } from './signs.js'
import { releaseTexture } from '../utils/textures.js'
import { useLeaderboardStore } from '../store/useLeaderboardStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { myPlayTime, mySessionId } from '../systems/net.js'

// The Leaderboards hall at the east end of the plaza: a purple platform up
// two steps, purple checkered walls, a tilted "Leaderboards" banner on two
// pillars, four boards fanned toward the plaza, and #1-player statues.
const wallMat = surface(COLORS.board, { top2: COLORS.board2, side: COLORS.board, side2: COLORS.board2, checker: 2 })
const ARCH_X = LEADER.x0 + 1.4
const PILLAR_Z = 15.6
const PILLAR_H = 9
const BOARD_X = 45

// Board icon -> the server's leaderboard stat, and the local player's own value for it.
const BOARD_STAT = {
  rebirth: { stat: 'rebirths', own: () => usePlayerData.getState().rebirths },
  cash: { stat: 'cash', own: () => usePlayerData.getState().cash },
  arm: { stat: 'strength', own: () => usePlayerData.getState().strength },
  trophy: { stat: 'playTime', own: myPlayTime },
}

// A board's face: the server's top players for its stat, plus a highlighted row for you. Redrawn
// whenever the rows change (the server refreshes them every few seconds).
function BoardFace({ title, icon, color }) {
  const { stat, own } = BOARD_STAT[icon]
  const rows = useLeaderboardStore((s) => s[stat])
  const map = useMemo(() => {
    const index = rows.findIndex((r) => r.id === mySessionId())
    return leaderboardTexture(title, icon, color, rows, { rank: index >= 0 ? index + 1 : null, value: own() })
  }, [rows, title, icon, color, own])
  useEffect(() => () => releaseTexture(map), [map])
  return <meshStandardMaterial map={map} roughness={0.8} />
}

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
    ...boards.map((b) => {
      const bx = BOARD_X + Math.abs(b.z) * 0.12
      return { x0: bx - 0.6, x1: bx + 0.8, z0: b.z - 2.9, z1: b.z + 2.9, top: top + 7 }
    }),
    ...statues.map((s) => ({ x0: (s.x ?? BOARD_X + 0.8) - 0.8, x1: (s.x ?? BOARD_X + 0.8) + 0.8, z0: s.z - 0.8, z1: s.z + 0.8, top: top + 1.2 })),
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
          <group position={[0, 1.4, 0]} rotation={[-0.15, 0, 0]}>
            <mesh position={[0, 2.5, -0.2]} material={MAT.woodDark} castShadow>
              <boxGeometry args={[5.7, 4.8, 0.3]} />
            </mesh>
            <mesh position={[0, 2.5, -0.03]}>
              <planeGeometry args={[5.5, 4.58]} />
              <BoardFace title={b.title} icon={b.icon} color={b.color} />
            </mesh>
          </group>
        </group>
      ))}

      {/* #1 statues between the boards */}
      {statues.map((s, i) => (
        <group key={i} position={[s.x ?? BOARD_X + 0.8, top, s.z]}>
          {/* round wooden plinth with a green rim */}
          <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.25, 1.35, 0.2, 32]} />
            <meshStandardMaterial color="#3fb34a" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.05, 1.2, 0.4, 32]} />
            <meshStandardMaterial color="#e8a03a" roughness={0.8} />
          </mesh>
          <TopPlayerStatue stat={s.stat} title={s.title} position={[0, 0.6, 0]} rotation={[0, -Math.PI / 2, 0]} />
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
