import { PHYSICS, PLAYER_DIMS } from '../data/config.js'

// The local player singleton. Mutated in place, never reallocated, so the
// frame loop can read it without a React subscription. systems/net.js streams
// exactly these fields to the server; components/RemotePlayers.jsx renders
// other players from the same shape.
export const player = {
  // Capsule base (feet) in world space, +Y up.
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  grounded: true,
  facing: Math.PI, // yaw the character model faces, radians
  moveSpeed: PHYSICS.moveSpeed,
  dims: { ...PLAYER_DIMS },
  // Theme hook: name of an extra body pose ('chop', 'wave', ...) registered
  // with systems/avatarAnim.js registerPose(). null = plain walk/idle. Synced
  // to other players, so a pose set here is visible on everyone's screen.
  pose: null,
}

export function resetPlayer(spawn = { x: 0, y: 0, z: 0 }, facing = Math.PI) {
  player.position.x = spawn.x
  player.position.y = spawn.y
  player.position.z = spawn.z
  player.velocity.x = 0
  player.velocity.y = 0
  player.velocity.z = 0
  player.grounded = true
  player.pose = null
  player.facing = facing
}

// Where the player's chest is on screen, 0..1 from the top-left; written each
// frame by components/GameLoop.jsx for HUD effects that appear around the player.
export const playerScreen = { x: 0.5, y: 0.5 }
