import { inputState } from './input.js'
import { player, resetPlayer } from './playerState.js'
import { getYaw, syncYawToPlayer } from './cameraOrbit.js'
import { colliderAt, terrainHeightAt } from './terrainHeight.js'
import { PHYSICS, SPAWN, SPAWN_FACING, WORLD_BOUNDS } from '../data/config.js'

// Kinematic capsule, stepped once per frame: apply input -> gravity ->
// integrate -> keep inside the world -> push back from ledges too tall to step
// onto -> clamp to the floor height under the player's feet. No physics
// engine: the base only needs a walking, jumping character on boxes.
const { accel: ACCEL, gravity: GRAVITY, jumpSpeed: JUMP_SPEED, maxStep: MAX_STEP } = PHYSICS

// Clamps the (dx, dz) delta as one 2D vector so velocity curves straight
// toward the target instead of warping axis-by-axis.
function approach2D(v, targetX, targetZ, maxDelta) {
  const dx = targetX - v.x
  const dz = targetZ - v.z
  const dist = Math.hypot(dx, dz)
  if (dist <= maxDelta || dist === 0) {
    v.x = targetX
    v.z = targetZ
  } else {
    const scale = maxDelta / dist
    v.x += dx * scale
    v.z += dz * scale
  }
}

export function respawn() {
  resetPlayer(SPAWN, SPAWN_FACING)
  syncYawToPlayer()
}

export function step(dt) {
  if (dt <= 0) return

  // Camera-relative ground basis.
  const yaw = getYaw()
  const fwdX = -Math.sin(yaw)
  const fwdZ = -Math.cos(yaw)
  const rightX = Math.cos(yaw)
  const rightZ = -Math.sin(yaw)

  const mv = inputState.move
  // Keyboard is a unit vector; the touch stick is analog (magnitude 0..1).
  const len = Math.hypot(mv.x, mv.z)
  const scale = len > 1 ? 1 / len : 1
  const wishX = (fwdX * mv.z + rightX * mv.x) * scale
  const wishZ = (fwdZ * mv.z + rightZ * mv.x) * scale

  approach2D(player.velocity, wishX * player.moveSpeed, wishZ * player.moveSpeed, ACCEL * dt)

  // Jump reads last frame's grounded flag, then we clear it for this frame.
  if (inputState.jump) {
    if (player.grounded) player.velocity.y = JUMP_SPEED
    inputState.jump = false
  }
  player.grounded = false

  const p = player.position
  player.velocity.y += GRAVITY * dt
  const prevX = p.x
  const prevZ = p.z
  p.x += player.velocity.x * dt
  p.y += player.velocity.y * dt
  p.z += player.velocity.z * dt

  // Invisible wall at the edge of the world.
  const r = player.dims.radius
  p.x = Math.max(WORLD_BOUNDS.minX + r, Math.min(WORLD_BOUNDS.maxX - r, p.x))
  p.z = Math.max(WORLD_BOUNDS.minZ + r, Math.min(WORLD_BOUNDS.maxZ - r, p.z))

  // Too tall a ledge to step onto: stay put unless the player jumps high
  // enough. Try each axis on its own first so the player slides along walls.
  // A player already inside a solid (chopping stands inside a tree's cell) may
  // move within that same solid, so they can walk back out but not into the next.
  const inside = colliderAt(prevX, prevZ, p.y)
  const stuckIn = inside && inside.top > p.y + MAX_STEP && inside === colliderAt(p.x, p.z, p.y)
  if (!stuckIn && terrainHeightAt(p.x, p.z, p.y) > p.y + MAX_STEP) {
    if (terrainHeightAt(p.x, prevZ, p.y) <= p.y + MAX_STEP) {
      p.z = prevZ
      player.velocity.z = 0
    } else if (terrainHeightAt(prevX, p.z, p.y) <= p.y + MAX_STEP) {
      p.x = prevX
      player.velocity.x = 0
    } else {
      p.x = prevX
      p.z = prevZ
    }
  }

  // Standing inside a solid (chopping): its top is not a floor, or the player
  // would be lifted onto the tree.
  let groundY = terrainHeightAt(p.x, p.z, p.y, stuckIn ? inside : null)
  // Never stand on a tree: if the feet would land on one, undo the move.
  const support = groundY > p.y - 0.01 ? colliderAt(p.x, p.z, p.y) : null
  if (support?.tree && !stuckIn) {
    p.x = prevX
    p.z = prevZ
    player.velocity.x = 0
    player.velocity.z = 0
    const back = colliderAt(p.x, p.z, p.y)
    groundY = terrainHeightAt(p.x, p.z, p.y, back?.tree ? back : null)
  }
  if (p.y <= groundY) {
    p.y = groundY
    if (player.velocity.y < 0) player.velocity.y = 0
    player.grounded = true
  }

  if (p.y < PHYSICS.killY) {
    respawn()
    return
  }

  // Face the direction of travel.
  if (Math.hypot(wishX, wishZ) > 0.01 && (mv.x !== 0 || mv.z !== 0)) {
    player.facing = Math.atan2(wishX, wishZ)
  }
}
