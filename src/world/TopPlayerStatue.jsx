import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { buildDefaultCharacter, loadBaseCharacter } from '../systems/defaultCharacter.js'
import { applyProportions, attachEquippedAccessories } from '../systems/avatarLoader.js'
import { makeGait, updateGait, disposeGait } from '../systems/avatarAnim.js'
import { parseAvatar } from '../systems/net.js'
import { useLeaderboardStore } from '../store/useLeaderboardStore.js'
import { Label } from './common.jsx'

// A leaderboard's #1 player as a standing 3D character: the board's top row from the
// server carries that player's Bloxity avatar JSON (equipped cosmetics + proportions), dressed
// onto the game's base rig exactly like components/RemotePlayers.jsx. With no #1 row, no avatar
// (guest/offline/solo) or a failed load it stays the default Bloxity character.
export default function TopPlayerStatue({ stat, title, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const top = useLeaderboardStore((s) => s[stat]?.[0])
  const avatarJson = top?.avatar || ''
  const name = top?.name
  const [avatar, setAvatar] = useState(() => buildDefaultCharacter())
  const gaitRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { equipped, proportions } = parseAvatar(avatarJson)
      const group = await loadBaseCharacter()
      if (equipped) await attachEquippedAccessories(group, equipped).catch(() => {})
      applyProportions(group, proportions)
      if (!cancelled) setAvatar(group)
    })()
    return () => {
      cancelled = true
    }
  }, [avatarJson])

  useEffect(() => {
    gaitRef.current = makeGait({ root: avatar, nodes: avatar.nodes || {}, clips: avatar.animations || [] })
    return () => {
      disposeGait(gaitRef.current)
      gaitRef.current = null
    }
  }, [avatar])

  // Looping 'dance' pose (systems/avatarAnim.js), standing in place.
  useFrame((_s, delta) => {
    const gait = gaitRef.current
    if (gait) updateGait(gait, Math.min(delta, 0.1), 0, true, 'dance')
  })

  const lines = [{ text: title, size: 70, colors: ['#fff3a0', '#ffc21a'], stroke: '#4a3000', icon: 'trophy' }]
  if (name) lines.push({ text: name, size: 60, colors: ['#ffffff', '#e8e8e8'], stroke: '#1b1b1f' })
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={avatar} />
      {/* "#1 CASH" with the player's name under it, floating clear above the head/ears/raised arms */}
      <Label lines={lines} position={[0, name ? 5.5 : 5.2, 0]} height={name ? 1.6 : 0.85} />
    </group>
  )
}
