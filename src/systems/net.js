// Multiplayer client for the Colyseus server (../Chop-trees-for-treasure-backend).
//
// Character sync, end to end:
//   local  : systems/playerMovement.js moves `player`; sendPose() streams its
//            pose (x/y/z/yaw/speed01/grounded/pose) at NET.sendHz, and the
//            Bloxity avatar (equipped items + proportions) whenever it changes.
//   server : relays them untouched through room.state.players.
//   remote : syncRoster() mirrors the other players into `remotes` and
//            useRemoteStore; components/RemotePlayers.jsx draws each one with
//            the same avatar + gait code as the local player.
// Offline (server unreachable) the game simply runs single-player and keeps
// retrying in the background; nothing here may throw outward.
import { Client } from '@colyseus/sdk'
import { useGameStore } from '../store/useGameStore.js'
import { useRemoteStore } from '../store/useRemoteStore.js'
import { remotes } from './remotePlayers.js'
import { player } from './playerState.js'
import {
  authState,
  getDisplayName,
  getEquippedAvatar,
  getProportions,
  getStableUserId,
  onAvatarChanged,
  onProportionsChanged,
  subscribeAuth,
} from './bloxity.js'
import { DEV_MODE } from '../data/bloxity.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { equippedPetIds } from './pets.js'
import { pushAnnouncement } from './announce.js'
import { GAME_SLUG, NET } from '../data/config.js'

// Two Legion channels (`dev` branch -> dev, `main` -> prod), each with its own
// hostname; Vite's MODE picks one at build time. Empty = no server configured.
const SERVER_URL_DEV = import.meta.env.VITE_SERVER_URL_DEV || 'ws://localhost:2567'
const SERVER_URL_MAIN = import.meta.env.VITE_SERVER_URL_MAIN || ''
const SERVER_URL = import.meta.env.MODE === 'production' ? SERVER_URL_MAIN : SERVER_URL_DEV

const AVATAR_MAX_LEN = 3000 // keep in step with the server's constants.ts
const ROSTER_MS = 200
const JOIN_TIMEOUT_MS = 8000 // first attempt; after this the game plays offline while retrying
const RETRY_MS = [2000, 4000, 8000, 15000]

let room = null
let started = false
let connecting = false
let attempt = 0
let lastPose = ''
let lastSig = ''
let joinedAs = ''
let lastPets = null

// Dev builds and guests have no Bloxity id; a per-browser id keeps one stable.
function localGuestId() {
  try {
    const key = `${GAME_SLUG}-guest-id`
    let id = localStorage.getItem(key)
    if (!id) {
      id = `guest-${crypto.randomUUID()}`
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return ''
  }
}
const currentUserId = () => getStableUserId() || localGuestId()

// What other clients need to dress this player: the equipped cosmetics and the
// customizer's body proportions, as one opaque JSON string the server relays.
function avatarJson() {
  if (!authState.user || DEV_MODE) return ''
  try {
    const equipped = getEquippedAvatar()
    if (!equipped) return ''
    const json = JSON.stringify({ equipped, proportions: getProportions() })
    // The server drops anything over its cap (which sits under Colyseus's 4 KB message limit).
    return json.length <= AVATAR_MAX_LEN ? json : JSON.stringify({ equipped, proportions: null })
  } catch {
    return ''
  }
}

// Inverse of avatarJson(), for components/RemotePlayers.jsx.
export function parseAvatar(json) {
  if (!json) return { equipped: null, proportions: null }
  try {
    const a = JSON.parse(json)
    return { equipped: a?.equipped ?? null, proportions: a?.proportions ?? null }
  } catch {
    return { equipped: null, proportions: null }
  }
}

function setStatus(netStatus) {
  if (useGameStore.getState().netStatus !== netStatus) useGameStore.setState({ netStatus })
}

function sendPose() {
  if (!room) return
  const speed = player.moveSpeed || 1
  const msg = {
    x: +player.position.x.toFixed(2),
    y: +player.position.y.toFixed(2),
    z: +player.position.z.toFixed(2),
    yaw: +player.facing.toFixed(2),
    speed01: +Math.min(1, Math.hypot(player.velocity.x, player.velocity.z) / speed).toFixed(2),
    grounded: player.grounded,
    pose: player.pose ?? null,
  }
  const json = JSON.stringify(msg)
  if (json === lastPose) return // standing still costs nothing
  lastPose = json
  room.send('pose', msg)
}

// Equipped pets as comma-joined data/eggs.js ids, so every client can draw
// them following this player (components/PetFollowers.jsx).
function sendPets() {
  if (!room) return
  const pets = equippedPetIds().join(',')
  if (pets === lastPets) return
  lastPets = pets
  room.send('setPets', { pets })
}

// Our own epic+ hatch: shown here at once, and relayed to everyone else.
export function announceHatch(petIds) {
  for (const id of petIds) pushAnnouncement(getDisplayName(), id)
  room?.send('hatch', { pets: petIds })
}

// True while one of our Bloxity friends is in this server (the egg window's
// "Boosted Odds for Playing with Friends!").
export function friendInServer() {
  if (!authState.friends.length || !remotes.size) return false
  const names = new Set()
  for (const f of authState.friends) {
    if (f?.username) names.add(f.username)
    if (f?.displayName) names.add(f.displayName)
  }
  for (const p of remotes.values()) if (p.username && names.has(p.username)) return true
  return false
}

// Mirrors room.state.players into remotes / useRemoteStore. Polled (a few Hz)
// rather than callback-driven so it needs nothing beyond the plain state
// objects the SDK keeps live.
function syncRoster() {
  if (!room?.state?.players) return
  const ids = []
  room.state.players.forEach((p, sid) => {
    if (sid === room.sessionId) return
    ids.push(sid)
    remotes.set(sid, p)
  })
  for (const sid of [...remotes.keys()]) if (!ids.includes(sid)) remotes.delete(sid)
  const sig = ids.join('|')
  if (sig !== lastSig) {
    lastSig = sig
    useRemoteStore.setState({ ids })
  }
}

async function connect() {
  connecting = true
  try {
    const client = new Client(SERVER_URL)
    let timer
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Server did not respond in time.')), JOIN_TIMEOUT_MS)
    })
    const r = await Promise.race([
      client.joinOrCreate(NET.room, { userId: currentUserId(), username: getDisplayName(), avatar: avatarJson() }),
      timeout,
    ]).finally(() => clearTimeout(timer))
    attempt = 0
    room = r
    joinedAs = currentUserId()
    lastPose = ''
    lastPets = null
    setStatus('online')
    sendPose()
    sendPets()
    r.onMessage('hatched', (msg) => {
      if (!Array.isArray(msg?.pets)) return
      for (const id of msg.pets) pushAnnouncement(msg.username, id)
    })
    r.onLeave(() => {
      if (room === r) room = null
      remotes.clear()
      lastSig = ''
      useRemoteStore.setState({ ids: [] })
      setStatus('offline')
      setTimeout(connect, RETRY_MS[0])
    })
  } catch (err) {
    console.warn('[net] could not join the server, playing offline:', err?.message || err)
    setStatus('offline') // releases the loading screen; keep trying quietly
    setTimeout(connect, RETRY_MS[Math.min(attempt++, RETRY_MS.length - 1)])
  } finally {
    connecting = false
  }
}

export function startNet() {
  if (started) return
  if (!SERVER_URL) {
    setStatus('offline')
    return console.warn('[net] no server URL configured, playing offline')
  }
  started = true
  setInterval(sendPose, 1000 / NET.sendHz)
  setInterval(syncRoster, ROSTER_MS)
  usePlayerData.subscribe(sendPets)

  // Wait for Bloxity auth to settle so the real account id (not a guest id) is used.
  let begun = false
  const begin = () => {
    if (begun || connecting) return
    begun = true
    connect()
  }
  if (DEV_MODE || authState.ready) begin()
  else {
    subscribeAuth((s) => s.ready && begin())
    setTimeout(begin, 4000)
  }

  // Sign-in/out after joining: re-state identity and look.
  subscribeAuth(() => {
    const id = currentUserId()
    if (!room || !begun || id === joinedAs) return
    joinedAs = id
    room.send('identify', { userId: id, username: getDisplayName() })
    room.send('setAvatar', { avatar: avatarJson() })
  })
  const pushAvatar = () => room?.send('setAvatar', { avatar: avatarJson() })
  onAvatarChanged(pushAvatar)
  onProportionsChanged(pushAvatar)
}

export const isOnline = () => !!room
