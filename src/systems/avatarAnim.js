// The avatar walk cycle. Framework-free: components/Player.jsx builds one of
// these alongside the built avatar and ticks it each frame.
//
// Two paths, preferring an animation the rig itself ships:
//   1. player.glb ships a clip matching GAIT.runClip -> drive it with an
//      AnimationMixer, cross-faded under an idle clip when present. This
//      rigs to the skeleton exactly because it was authored for it.
//   2. no such clip -> a generated four-bone swing on ArmL1/ArmR1/LegL1/
//      LegR1 plus a Spine1 lean and a body bob. Rotation-only, so it never
//      fights avatarLoader.js's applyProportions(), which owns those nodes'
//      position and scale.
//
// Theme poses: registerPose(name, fn) adds an extra body pose (chop, wave,
// carry...). Set player.pose = name and every client — including remote ones,
// since net.js syncs it — eases the pose in over the walk/idle cycle and calls
// fn(gait, dt, weight) each frame. See the built-ins below.
//
// Everything here is null-safe: a missing bone or a total failure just
// leaves the avatar static.
import * as THREE from 'three'
import { GAIT } from '../data/bloxity.js'
import { CHOP_TIMING } from '../data/economy.js'
import { attachAxe, detachAxe, updateAxe } from './axeProp.js'

// phase offset per limb: legs are half a cycle apart; each arm is
// anti-phase to the leg on its own side (contralateral swing).
const LIMBS = [
  { name: 'LegL1', kind: 'leg', offset: 0 },
  { name: 'LegR1', kind: 'leg', offset: Math.PI },
  { name: 'ArmL1', kind: 'arm', offset: Math.PI },
  { name: 'ArmR1', kind: 'arm', offset: 0 },
]

const AXES = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
}

// Build the gait driver for one freshly loaded avatar. `built` is
// `{ root, nodes, clips }` — see components/Player.jsx. Returns null when
// there is nothing to animate.
export function makeGait(built) {
  if (!built || !built.root) return null

  const gait = {
    built,
    axis: AXES[GAIT.swingAxis] || AXES.x,
    swayAxis: AXES[GAIT.swayAxis] || AXES.z,
    amp: 0, // eased 0..1 locomotion weight
    phase: 0, // radians along the stride
    idleTime: 0, // seconds, only advances while idle (drives the breathing sway)
    q: new THREE.Quaternion(), // scratch
    mixer: null,
    run: null,
    idle: null,
    limbs: [],
    spine: null,
    spineBind: null,
  }

  // Arm bones + bind poses, for poses that drive the arms on either path.
  const nodes0 = built.nodes || {}
  gait.poseW = {} // pose name -> eased 0..1 weight
  gait.arms = ['ArmL1', 'ArmR1']
    .filter((n) => nodes0[n])
    .map((n) => ({ bone: nodes0[n], bind: nodes0[n].quaternion.clone() }))
  gait.axe = attachAxe(nodes0, built.axeModel)

  // --- Path 1: an embedded clip ------------------------------------------
  const run = (built.clips || []).find((c) => GAIT.runClip.test(c.name))
  if (run) {
    gait.mixer = new THREE.AnimationMixer(built.root)
    gait.run = gait.mixer.clipAction(run)
    gait.run.play()
    gait.run.setEffectiveWeight(0)

    const idle = built.clips.find((c) => GAIT.idleClip.test(c.name))
    if (idle) {
      gait.idle = gait.mixer.clipAction(idle)
      gait.idle.play()
    }
    return gait
  }

  // --- Path 2: the generated fallback ------------------------------------
  const nodes = built.nodes || {}
  for (const limb of LIMBS) {
    const bone = nodes[limb.name]
    if (bone) gait.limbs.push({ ...limb, bone, bind: bone.quaternion.clone() })
  }
  const spine = nodes.Spine1
  if (spine) {
    gait.spine = spine
    gait.spineBind = spine.quaternion.clone()
  }
  return gait
}

// --- Poses ----------------------------------------------------------------
const poses = new Map()
const POSE_EASE_HZ = 8

// fn(gait, dt, weight): rotate gait.arms / gait.spine (use gait.q and AXES as
// scratch, always from the bind quaternion: bone.quaternion.copy(a.bind)
// .premultiply(q)) and blend by `weight` (0..1). Rotation-only keeps it
// compatible with applyProportions().
export function registerPose(name, fn) {
  poses.set(name, fn)
}

export { AXES }

const ease01 = (t) => t * t * (3 - 2 * t)

function applyPoses(gait, dt, active) {
  // Every fresh chop starts at the top of the cycle so the impact frame lines
  // up with systems/chop.js.
  if (active === 'swing' && gait.activePrev !== 'swing') {
    // Carry the left/right alternation over between separate chop sessions.
    gait.sideBase = (gait.sideBase || 0) + Math.round((gait.sessionTime || 0) / CHOP_TIMING.cycle)
    gait.sessionTime = 0
    gait.swingT = 0
    gait.swingCount = 0
  }
  gait.swingActive = active === 'swing'
  gait.activePrev = active
  for (const [name, fn] of poses) {
    const prev = gait.poseW[name] || 0
    const w = prev + ((name === active ? 1 : 0) - prev) * (1 - Math.exp(-POSE_EASE_HZ * dt))
    gait.poseW[name] = w
    if (w > 0.001) fn(gait, dt, w)
  }
}

// Built-in examples; copy the shape for your own.
// Both arms thrown overhead.
registerPose('cheer', (gait, _dt, w) => {
  gait.q.setFromAxisAngle(gait.axis, -3.0 * ease01(w))
  for (const a of gait.arms) a.bone.quaternion.copy(a.bind).premultiply(gait.q)
})
// Looping victory dance for the leaderboard statues: a bouncing beat, hips/torso
// swaying side to side, knees pumping alternately, and the arms flung up in a V that
// swaps every two beats between "both high" and "one up, one pointing forward".
const DANCE_HZ = 1.6 // beats per second
registerPose('dance', (gait, dt, w) => {
  gait.danceT = (gait.danceT || 0) + dt
  const beat = gait.danceT * DANCE_HZ * Math.PI * 2
  const e = ease01(Math.min(w, 1))
  // 0..1, flips every two beats; smoothed so the point/raise change is not a snap.
  const swap = ease01(0.5 + 0.5 * Math.sin(beat / 4))
  const pump = Math.sin(beat * 2) * 0.18 // arms punch up on every beat
  for (const a of gait.arms) {
    const left = a.bone.name === 'ArmL1'
    const sign = left ? -1 : 1
    const point = left ? swap : 1 - swap // 1 = this arm points forward
    const raise = -(2.7 - point * 1.4) + pump * (1 - point * 0.5)
    gait.q.setFromAxisAngle(gait.axis, raise * e)
    a.bone.quaternion.copy(a.bind).premultiply(gait.q)
    gait.q.setFromAxisAngle(gait.swayAxis, sign * (0.45 - point * 0.3) * e)
    a.bone.quaternion.premultiply(gait.q)
  }
  for (const limb of gait.limbs) {
    if (limb.kind !== 'leg') continue
    const side = limb.name === 'LegL1' ? 1 : -1
    // alternate knee lifts: each leg kicks up on its own half of the two-beat cycle
    const lift = Math.max(0, Math.sin(beat + (side > 0 ? 0 : Math.PI))) * 0.5
    gait.q.setFromAxisAngle(gait.axis, -lift * e)
    limb.bone.quaternion.copy(limb.bind).premultiply(gait.q)
  }
  if (gait.spine) {
    gait.q.setFromAxisAngle(AXES.z, Math.sin(beat) * 0.14 * e) // hip/torso sway
    gait.spine.quaternion.copy(gait.spineBind).premultiply(gait.q)
    gait.q.setFromAxisAngle(AXES.y, Math.sin(beat / 2) * 0.22 * e) // twist
    gait.spine.quaternion.premultiply(gait.q)
  }
  gait.built.root.position.y = Math.abs(Math.sin(beat)) * 0.1 * e // bounce
})
// Repeated two-handed overhead swing, e.g. an axe or pickaxe.
// Looping side chop, timed by CHOP_TIMING (seconds, shared with systems/chop.js so
// wood lands on the impact frame):
//   wind-up  slow ease up: axe back over the shoulder, torso leaning back
//   pause    a beat at the top
//   swing    fast accelerating arc, torso rotating/leaning into it
//   impact   arms stop dead, small recoil in the body
//   recover  pull the axe out and ease back toward the wind-up pose
const lerp = (a, b, t) => a + (b - a) * t
const easeInOut = (t) => t * t * (3 - 2 * t)
const easeIn = (t) => t * t * t
const easeOut = (t) => 1 - (1 - t) * (1 - t)
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)
const seg = (t, a, b) => clamp01((t - a) / (b - a))

// Horizontal side chop at chest height. The tree is on the character's left
// (chop.js turns the body ~sideways to it): the torso winds away to the right,
// then whips left while both arms extend level, the handle staying horizontal
// with the head (edge facing the swing) leading into the trunk.
export const CHOP_HIT_TWIST = 0.5 // rad; torso twist toward the tree at impact (arms point at tree - CHOP_AIM)
export const CHOP_AIM = 0.29 // rad; arms point this far right of the trunk centre at impact
// Which side of the trunk this chop hits: alternates every cycle (first strike
// on the right face -> tree on the left, then the left face, ...). Eased to the
// other side during recovery so the body swings over smoothly. Shared with chop.js.
export function chopSide(count, t) {
  const s = count % 2 === 0 ? 1 : -1
  if (t < CHOP_TIMING.hold) return s
  const k = (t - CHOP_TIMING.hold) / (CHOP_TIMING.cycle - CHOP_TIMING.hold)
  return s * (1 - 2 * (k * k * (3 - 2 * k)))
}
const TWIST_BACK = -1.0 // wound away from the tree
const PITCH_BACK = -1.15 // arms bent in, axe at chest height
const PITCH_HIT = -1.5 // arms extended and locked, level
const YAW_BACK = -0.5 // arms pulled across to the right
const YAW_HIT = -0.02
const LEAN_BACK = 0.04
const LEAN_HIT = 0.22 // leaning into the hit
const FREE_YAW = -0.5 // left hand reaches in to the handle

registerPose('swing', (gait, dt, w) => {
  const T = CHOP_TIMING
  if (gait.swingActive) gait.sessionTime = (gait.sessionTime || 0) + dt
  const prevT = gait.swingT || 0
  gait.swingT = (prevT + dt) % T.cycle
  if (gait.swingT < prevT) gait.swingCount = (gait.swingCount || 0) + 1
  const t = gait.swingT
  const sg = chopSide((gait.sideBase || 0) + (gait.swingCount || 0), t) // +1 tree on the left, -1 on the right
  gait.chopSide = sg
  let twist, pitch, yaw, lean, dip, shake = 0
  if (t < T.windup) {
    const k = easeInOut(seg(t, 0, T.windup))
    twist = lerp(CHOP_HIT_TWIST * 0.55, TWIST_BACK, k)
    pitch = lerp(PITCH_HIT * 0.9, PITCH_BACK, k)
    yaw = lerp(YAW_HIT * 0.5, YAW_BACK, k)
    lean = lerp(LEAN_HIT * 0.6, LEAN_BACK, k)
    dip = lerp(0.03, 0.07, k)
  } else if (t < T.top) {
    twist = TWIST_BACK; pitch = PITCH_BACK; yaw = YAW_BACK; lean = LEAN_BACK; dip = 0.07
  } else if (t < T.impact) {
    const k = easeIn(seg(t, T.top, T.impact))
    twist = lerp(TWIST_BACK, CHOP_HIT_TWIST, k)
    pitch = lerp(PITCH_BACK, PITCH_HIT, easeOut(seg(t, T.top, T.impact))) // arms straighten early
    yaw = lerp(YAW_BACK, YAW_HIT, k)
    lean = lerp(LEAN_BACK, LEAN_HIT, k)
    dip = lerp(0.07, 0.1, k)
  } else if (t < T.hold) {
    // Locked arms absorb the hit: a small decaying shake in arms and shoulders.
    twist = CHOP_HIT_TWIST; pitch = PITCH_HIT; yaw = YAW_HIT; lean = LEAN_HIT; dip = 0.1
    const k = seg(t, T.impact, T.hold)
    shake = Math.sin(k * 40) * (1 - k) * 0.05
  } else {
    const k = easeInOut(seg(t, T.hold, T.cycle))
    twist = lerp(CHOP_HIT_TWIST, CHOP_HIT_TWIST * 0.55, k)
    pitch = lerp(PITCH_HIT, PITCH_HIT * 0.9, k)
    yaw = lerp(YAW_HIT, YAW_HIT * 0.5, k)
    lean = lerp(LEAN_HIT, LEAN_HIT * 0.6, k)
    dip = lerp(0.1, 0.03, k)
  }
  const e = ease01(w)
  gait.arms.forEach((a, i) => {
    const free = a.bone.name === 'ArmL1'
    gait.q.setFromAxisAngle(gait.axis, (pitch + shake) * e)
    a.bone.quaternion.copy(a.bind).premultiply(gait.q)
    gait.q.setFromAxisAngle(AXES.y, (yaw * sg + (free ? FREE_YAW * (0.4 + 0.6 * seg(t, 0, T.impact)) : 0)) * e)
    a.bone.quaternion.premultiply(gait.q)
  })
  if (gait.spine) {
    gait.q.setFromAxisAngle(AXES.x, (lean + shake) * e)
    gait.spine.quaternion.copy(gait.spineBind).premultiply(gait.q)
    gait.q.setFromAxisAngle(AXES.y, (twist * sg + shake * 0.5) * e)
    gait.spine.quaternion.premultiply(gait.q)
  }
  gait.built.root.position.y -= dip * e
})

// speed01: horizontal speed / max move speed (clamped to 0..1). grounded gates
// the airborne pose. pose: name registered with registerPose, or null.
export function updateGait(gait, dt, speed01, grounded = true, pose = null) {
  if (!gait || dt <= 0) return
  tickGait(gait, dt, speed01, grounded)
  applyPoses(gait, dt, pose)
  updateAxe(gait.axe, gait.poseW.swing || 0, gait.amp, gait.phase, gait.chopSide || 1)
}

function tickGait(gait, dt, speed01, grounded) {

  const target = speed01 < 0 ? 0 : speed01 > 1 ? 1 : speed01
  // Exponential ease so a start or stop does not snap mid-stride.
  gait.amp += (target - gait.amp) * (1 - Math.exp(-GAIT.blendHz * dt))
  // Advance the cycle; keep a little residual cadence so the legs finish the
  // step they are on rather than freezing.
  gait.phase += GAIT.strideHz * 2 * Math.PI * dt * (0.35 + 0.65 * gait.amp)
  if (gait.phase > Math.PI * 2) gait.phase -= Math.PI * 2

  if (gait.mixer) {
    if (gait.run) {
      gait.run.setEffectiveWeight(gait.amp)
      gait.run.timeScale = 0.4 + 0.9 * gait.amp
    }
    if (gait.idle) gait.idle.setEffectiveWeight(1 - gait.amp)
    gait.mixer.update(dt)
    return
  }

  // Airborne (jumping or falling): tuck the legs, throw the arms up. Takes
  // priority over the walk cycle and the idle sway below.
  if (!grounded) {
    for (const limb of gait.limbs) {
      let angle = 0
      if (limb.name === 'LegL1') angle = GAIT.airborneLegL
      else if (limb.name === 'LegR1') angle = GAIT.airborneLegR
      else if (limb.kind === 'arm') angle = GAIT.airborneArm
      gait.q.setFromAxisAngle(gait.axis, angle)
      limb.bone.quaternion.copy(limb.bind).premultiply(gait.q)
    }
    if (gait.spine) {
      gait.q.setFromAxisAngle(AXES.x, GAIT.airborneLean)
      gait.spine.quaternion.copy(gait.spineBind).premultiply(gait.q)
    }
    gait.built.root.position.y = 0
    return
  }

  // Below the ease-out floor: a slow breathing sway instead of a rigid hold.
  if (gait.amp < 0.01) {
    gait.idleTime += dt
    const idle = Math.sin(gait.idleTime * GAIT.idleSwayHz)
    for (const limb of gait.limbs) {
      if (limb.kind !== 'arm') {
        limb.bone.quaternion.copy(limb.bind)
        continue
      }
      const sign = limb.name === 'ArmL1' ? -1 : 1
      gait.q.setFromAxisAngle(gait.swayAxis, sign * (GAIT.idleArmSway + idle * GAIT.idleArmSwayAmp))
      limb.bone.quaternion.copy(limb.bind).premultiply(gait.q)
    }
    if (gait.spine) {
      gait.q.setFromAxisAngle(AXES.x, idle * GAIT.idleSpineSway)
      gait.spine.quaternion.copy(gait.spineBind).premultiply(gait.q)
    }
    gait.built.root.position.y = idle * GAIT.idleBob
    return
  }

  for (const limb of gait.limbs) {
    const swing = (limb.kind === 'arm' ? GAIT.armSwing : GAIT.legSwing) * gait.amp
    gait.q.setFromAxisAngle(gait.axis, Math.sin(gait.phase + limb.offset) * swing)
    // Parent-space swing (premultiply): the *_Offset parents carry position
    // only (identity rotation), so parent space is the character's own
    // frame and X is the forward/back flexion axis regardless of how each
    // mirrored limb bone's local frame is twisted.
    limb.bone.quaternion.copy(limb.bind).premultiply(gait.q)
  }
  if (gait.spine) {
    gait.q.setFromAxisAngle(AXES.x, GAIT.lean * gait.amp)
    gait.spine.quaternion.copy(gait.spineBind).premultiply(gait.q)
  }
  // Body bob: two beats per stride. Only local Y is ours to touch — X/Z/Y
  // world placement belongs to Player's group.
  gait.built.root.position.y = Math.abs(Math.sin(gait.phase)) * GAIT.bob * gait.amp
}

// Return the rig to its bind pose. Call before the avatar itself is torn
// down, while the nodes are still live.
export function disposeGait(gait) {
  if (!gait) return
  detachAxe(gait.axe)
  if (gait.mixer) {
    gait.mixer.stopAllAction()
    gait.mixer.uncacheRoot(gait.built.root)
  }
  for (const limb of gait.limbs) limb.bone.quaternion.copy(limb.bind)
  if (gait.spine) gait.spine.quaternion.copy(gait.spineBind)
  if (gait.built && gait.built.root) gait.built.root.position.y = 0
}
