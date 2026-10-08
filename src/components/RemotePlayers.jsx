import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Quaternion, Vector3 } from 'three'
import { useRemoteStore } from '../store/useRemoteStore.js'
import { remotes } from '../systems/remotePlayers.js'
import { buildDefaultCharacter, loadBaseCharacter } from '../systems/defaultCharacter.js'
import { applyProportions, attachEquippedAccessories } from '../systems/avatarLoader.js'
import { makeGait, updateGait, disposeGait } from '../systems/avatarAnim.js'
import { parseAvatar } from '../systems/net.js'
import { NET } from '../data/config.js'
import Nameplate from './Nameplate.jsx'
import PetFollowers from './PetFollowers.jsx'
import AuraFx from './AuraFx.jsx'

const _up = new Vector3(0, 1, 0)
const _q = new Quaternion()
const TURN_RATE = 0.001 // same slerp base as Player.jsx

// One other player: the game's default character dressed with their Bloxity
// cosmetics and body proportions (relayed as JSON by the server), driven by the
// same gait code as the local player from the pose inputs the server relays.
function RemotePlayer({ id }) {
  const ref = useRef()
  const gaitRef = useRef(null)
  const [avatar, setAvatar] = useState(() => buildDefaultCharacter())
  const [name, setName] = useState('')
  const [pets, setPets] = useState('')
  const [aura, setAura] = useState('')
  const anchor = useRef({ x: 0, y: 0, z: 0, yaw: 0 })
  const loadedAvatarJson = useRef(null)
  const poll = useRef(0)
  const [rev, setRev] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const json = remotes.get(id)?.avatar || ''
      loadedAvatarJson.current = json
      const { equipped, proportions } = parseAvatar(json)
      const group = await loadBaseCharacter()
      await attachEquippedAccessories(group, equipped).catch(() => {})
      applyProportions(group, proportions)
      if (!cancelled) setAvatar(group)
    })()
    return () => {
      cancelled = true
    }
  }, [id, rev])

  useEffect(() => {
    gaitRef.current = makeGait({ root: avatar, nodes: avatar.nodes || {}, clips: avatar.animations || [] })
    return () => {
      disposeGait(gaitRef.current)
      gaitRef.current = null
    }
  }, [avatar])

  useFrame((_s, delta) => {
    const g = ref.current
    const p = remotes.get(id)
    if (!g || !p) return
    const dt = Math.min(delta, 0.1)
    const k = 1 - Math.exp(-NET.remoteSmoothing * dt)
    if (!g.userData.placed) {
      g.position.set(p.x, p.y, p.z) // first update: appear in place instead of gliding from the origin
      g.userData.placed = true
    } else {
      g.position.x += (p.x - g.position.x) * k
      g.position.y += (p.y - g.position.y) * k
      g.position.z += (p.z - g.position.z) * k
    }
    _q.setFromAxisAngle(_up, p.yaw)
    g.quaternion.slerp(_q, 1 - Math.pow(TURN_RATE, dt))

    const gait = gaitRef.current
    if (gait) updateGait(gait, dt, p.speed01, p.grounded, p.pose || null)
    const a = anchor.current
    a.x = g.position.x
    a.y = g.position.y
    a.z = g.position.z
    a.yaw = p.yaw

    // Name changes and avatar edits are rare; check twice a second.
    poll.current += dt
    if (poll.current > 0.5) {
      poll.current = 0
      const n = p.username || 'Player'
      if (n !== name) setName(n)
      if ((p.pets || '') !== pets) setPets(p.pets || '')
      if ((p.aura || '') !== aura) setAura(p.aura || '')
      if ((p.avatar || '') !== loadedAvatarJson.current) {
        loadedAvatarJson.current = p.avatar || ''
        setRev((r) => r + 1) // rebuild the character with the new look
      }
    }
  })

  return (
    <>
      <group ref={ref}>
        <primitive object={avatar} />
        <AuraFx id={aura} />
        {name && <Nameplate text={name} />}
      </group>
      <PetFollowers ids={pets ? pets.split(',') : []} anchor={() => (ref.current?.userData.placed ? anchor.current : null)} />
    </>
  )
}

export default function RemotePlayers() {
  const ids = useRemoteStore((s) => s.ids)
  return ids.map((id) => <RemotePlayer key={id} id={id} />)
}
