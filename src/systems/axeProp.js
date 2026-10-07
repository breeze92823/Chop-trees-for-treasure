// The lumberjack axe. Built in rig units (the avatar is RIG_HEIGHT = 6.4 tall;
// an arm is 2.4 long). Framework-free; avatarAnim.js owns the lifecycle.
//
// The axe is always gripped in the right fist (one-handed) and mounted on the
// torso (Spine2) so it can be posed in the character's frame:
//   idle  - the right arm is raised forward and in, fist at the chest, the
//           handle angled up and back so the head rests over the shoulder
//           (the left arm hangs free)
//   move  - arm held back, axe trailing in the fist
//   swing - handle straight out of the fist for the overhead chop
import { BoxGeometry, CylinderGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, Quaternion, SphereGeometry, Vector3 } from 'three'
import { MATERIAL_PBR } from '../data/materials.js'

const SWING_TILT = 0.12
const FREE_ARM_BOOST = 1.9 // the empty arm swings this much wider than the stock walk cycle
const HELD_ARM_SWING = 0.28 // rad; the loaded arm still swings a little, in time with the stride
const HELD_ARM_BOUNCE = 0.1 // rad; the axe's weight bounces the arm twice per stride
const HELD_ARM_SWAY = 0.08 // rad; outward/inward sway of the loaded arm
const TORSO_TWIST = 0.1 // rad; shoulders counter-rotate against the stride
const RUN_ARM_BACK = 1.1 // rad about X; positive swings the axe arm back while moving

// Idle pose (tuned by hand): arm raised forward, handle laid back over the shoulder.
const TUNE = {
  lift: -2.17, // rad about X; negative swings the arm forward
  yaw: -0.28, // rad about Y; turns the raised fist in/out
  reach: 2.6, // shoulder pivot -> fist, rig units
  dirX: 0.32, // handle direction from the fist (character frame; +X is its left)
  dirY: 0.48, // +Y up
  dirZ: -0.51, // -Z back
}

// Pose of the free (left) arm, tuned by hand. Idle uses all three; while
// moving only the sideways spread is kept, on top of the walk swing.
const TUNE_L = {
  lift: 0.35, // rad about X; negative swings the arm forward
  yaw: 0, // rad about Y; turns the arm in/out
  roll: 0.33, // rad about Z; positive spreads the arm out sideways
}

const X_AXIS = new Vector3(1, 0, 0)
const Y_AXIS = new Vector3(0, 1, 0)
const Z_AXIS = new Vector3(0, 0, 1)
const AXE_DOWN = new Vector3(0, -1, 0) // handle direction in the axe's own frame
// Spine2-space rest pose: pommel sits behind the right shoulder, handle runs
// across the back of the neck toward the left.
const REST_DIR = new Vector3()
const REST_QUAT = new Quaternion()

const _hand = new Vector3()
const _dir = new Vector3()
const _q = new Quaternion()
const _back = new Quaternion()
const _delta = new Quaternion()
const _yaw = new Quaternion()
const _lift = new Quaternion()
const _tilt = new Quaternion().setFromAxisAngle(Z_AXIS, SWING_TILT)
const _roll = new Quaternion()
const _mountQ = new Quaternion()
const _parentQ = new Quaternion()
const _frame = new Quaternion() // arm's parent frame expressed in the Spine2 frame
const _frameInv = new Quaternion()
const _bindS = new Quaternion() // arm bind orientation in the Spine2 frame
const _curS = new Quaternion()
const _rot = new Quaternion()
const _frameL = new Quaternion()
const _rollL = new Quaternion()
const _mountInv = new Matrix4()
const _shoulder = new Vector3()

let shared = null
function assets() {
  return (shared ||= {
    geo: {
      handle: new CylinderGeometry(0.13, 0.13, 3.5, 10),
      grip: new CylinderGeometry(0.17, 0.17, 1.1, 10),
      pommel: new SphereGeometry(0.24, 10, 8),
      socket: new BoxGeometry(0.42, 0.7, 0.42),
      blade: new BoxGeometry(0.2, 1.25, 0.95),
    },
    mat: {
      wood: new MeshStandardMaterial({ ...MATERIAL_PBR.PLAYER, color: '#e8742a' }),
      grip: new MeshStandardMaterial({ ...MATERIAL_PBR.PLAYER, color: '#d6303a' }),
      steel: new MeshStandardMaterial({ ...MATERIAL_PBR.PLAYER, color: '#4f7fc4', metalness: 0.4 }),
      dark: new MeshStandardMaterial({ ...MATERIAL_PBR.PLAYER, color: '#2c3e5c' }),
    },
  })
}

function mesh(geo, material, x, y, z) {
  const m = new Mesh(geo, material)
  m.position.set(x, y, z)
  m.castShadow = true
  return m
}

// Returns { pivot, arm, offset } or null when the rig lacks the bones.
export function attachAxe(nodes) {
  const arm = nodes && nodes.ArmR1
  const offset = nodes && nodes.ArmR_Offset
  const mount = nodes && nodes.Spine2
  if (!arm || !offset || !mount) return null
  const { geo, mat } = assets()

  const axe = new Group()
  axe.name = 'axe'
  axe.add(mesh(geo.handle, mat.wood, 0, -1.25, 0))
  axe.add(mesh(geo.grip, mat.grip, 0, -0.05, 0))
  axe.add(mesh(geo.pommel, mat.wood, 0, 0.55, 0))
  axe.add(mesh(geo.socket, mat.dark, 0, -2.85, 0))
  axe.add(mesh(geo.blade, mat.steel, 0, -2.9, 0.62))

  const pivot = new Group()
  pivot.name = 'axe_pivot'
  pivot.add(axe)
  mount.add(pivot)
  const armL = nodes.ArmL1 || null
  return { pivot, arm, offset, mount, armL, bindL: armL ? armL.quaternion.clone() : null, bind: arm.quaternion.clone() }
}

export function detachAxe(prop) {
  if (prop) prop.pivot.removeFromParent()
}

// Sets the arm's local quaternion so it is rotated by `rot` (a Spine2-frame
// rotation) away from its bind pose, whatever frame the bone itself is in.
function poseArm(prop, rot, weight) {
  const { arm, bind } = prop
  _back.copy(_frameInv).multiply(rot).multiply(_frame).multiply(bind)
  arm.quaternion.slerp(_back, weight)
}

// Same for the free arm, whose parent frame may differ from the axe arm's.
function poseFreeArm(prop, rot, weight) {
  const { armL, bindL } = prop
  _back.copy(_frameL).invert().multiply(rot).multiply(_frameL).multiply(bindL)
  armL.quaternion.slerp(_back, weight)
}

// Call after the walk cycle and poses have written the arm this frame.
// `swingW` is the eased 0..1 weight of the 'swing' pose, `moveW` the eased
// 0..1 locomotion weight.
export function updateAxe(prop, swingW, moveW = 0, phase = 0, side = 1) {
  if (!prop) return
  const { pivot, arm, mount } = prop
  const back = moveW * (1 - swingW)
  const idle = (1 - moveW) * (1 - swingW)

  // Frames, all relative to the Spine2 mount the axe hangs from.
  mount.updateWorldMatrix(true, false)
  arm.parent.updateWorldMatrix(true, false)
  mount.getWorldQuaternion(_mountQ)
  arm.parent.getWorldQuaternion(_parentQ)
  _frame.copy(_mountQ).invert().multiply(_parentQ)
  _frameInv.copy(_frame).invert()
  if (back > 0.001) poseArm(prop, _rot.setFromAxisAngle(X_AXIS, RUN_ARM_BACK), back)
  _yaw.setFromAxisAngle(Y_AXIS, TUNE.yaw)
  _lift.setFromAxisAngle(X_AXIS, TUNE.lift)
  REST_DIR.set(TUNE.dirX, TUNE.dirY, TUNE.dirZ).normalize()
  REST_QUAT.setFromUnitVectors(AXE_DOWN, REST_DIR)
  if (idle > 0.001) poseArm(prop, _rot.copy(_yaw).multiply(_lift), idle)

  if (prop.armL) {
    prop.armL.parent.updateWorldMatrix(true, false)
    prop.armL.parent.getWorldQuaternion(_parentQ)
    _frameL.copy(_mountQ).invert().multiply(_parentQ)
  }
  if (prop.armL && idle > 0.001) {
    _rollL.setFromAxisAngle(Z_AXIS, TUNE_L.roll)
    _rot.setFromAxisAngle(Y_AXIS, TUNE_L.yaw).multiply(_lift.setFromAxisAngle(X_AXIS, TUNE_L.lift)).multiply(_rollL)
    poseFreeArm(prop, _rot, idle)
    _lift.setFromAxisAngle(X_AXIS, TUNE.lift)
  }
  if (prop.armL && back > 0.001) {
    // Keep the spread while running: roll the walking arm outward in its parent frame.
    _rot.setFromAxisAngle(Z_AXIS, TUNE_L.roll)
    _back.copy(_frameL).invert().multiply(_rot).multiply(_frameL).multiply(prop.armL.quaternion)
    prop.armL.quaternion.slerp(_back, back)
  }

  // Where the fist is: shoulder pivot + the arm's current direction.
  arm.updateWorldMatrix(true, false)
  _mountInv.copy(mount.matrixWorld).invert()
  _shoulder.setFromMatrixPosition(arm.matrixWorld).applyMatrix4(_mountInv)
  _bindS.copy(_frame).multiply(prop.bind)
  _curS.copy(_frame).multiply(arm.quaternion)
  _rot.copy(_curS).multiply(_bindS.invert()) // current rotation away from bind
  _dir.set(0, -1, 0).applyQuaternion(_rot)
  _hand.copy(_shoulder).addScaledVector(_dir, TUNE.reach * arm.scale.y)
  // Handle direction: straight out of the fist, or laid back over the shoulder.
  // Side chop: roll the head a quarter turn about the handle so the edge
  // leads the horizontal swing (sideways) instead of pointing up.
  _roll.setFromAxisAngle(Y_AXIS, side * (Math.PI / 2) * swingW)
  _q.copy(_rot).multiply(_tilt).multiply(_roll)
  pivot.position.copy(_hand)
  pivot.quaternion.copy(_q).slerp(REST_QUAT, idle)
}
