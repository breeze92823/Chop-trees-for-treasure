// Generic camera shake: call addTrauma(0..1) from anything (an impact, a
// felled tree, an explosion) and optionally addKick(dx, dz, strength) for a
// directional shove. cameraOrbit.js adds shakeOffset on top of the follow pose
// each frame and strips it again before smoothing.
//
// Trauma drives a noisy rumble (amplitude = trauma^2) that decays in about a
// second; the kick is a damped spring back to rest.
const MAX_POS = 1.0 // metres of rumble at full trauma
const MAX_ROT = 0.13 // radians of rumble at full trauma
const FREQ = 18 // rumble speed
const DECAY = 1.0 // trauma lost per second
const KICK_STIFF = 160
const KICK_DAMP = 14

let trauma = 0
let time = 0
const kick = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }
// Last offset applied to the camera, removed again before the next update.
export const shakeOffset = { x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0 }

export function addTrauma(amount) {
  trauma = Math.min(1, trauma + amount)
}

// Shoves the camera along (dx, dz) (normalised here) and slightly down.
export function addKick(dx, dz, strength = 1) {
  const len = Math.hypot(dx, dz) || 1
  const imp = 16 * strength
  kick.vx += (dx / len) * imp
  kick.vz += (dz / len) * imp
  kick.vy -= imp * 0.6
}

// Smooth 1D noise in -1..1 (sum of incommensurate sines, per-axis seed).
const wobble = (t, s) => Math.sin(t * 1.0 + s) * 0.5 + Math.sin(t * 2.31 + s * 1.7) * 0.3 + Math.sin(t * 4.13 + s * 2.9) * 0.2

export function step(dt) {
  time += dt
  for (const a of ['x', 'y', 'z']) {
    const v = 'v' + a
    kick[v] += (-kick[a] * KICK_STIFF - kick[v] * KICK_DAMP) * dt
    kick[a] += kick[v] * dt
  }
  trauma = Math.max(0, trauma - DECAY * dt)
  const amp = trauma * trauma
  const t = time * FREQ
  shakeOffset.x = kick.x + wobble(t, 1.3) * MAX_POS * amp
  shakeOffset.y = kick.y + wobble(t, 7.1) * MAX_POS * amp
  shakeOffset.z = kick.z + wobble(t, 3.7) * MAX_POS * amp
  shakeOffset.pitch = wobble(t, 11.2) * MAX_ROT * amp
  shakeOffset.yaw = wobble(t, 5.9) * MAX_ROT * amp
  shakeOffset.roll = wobble(t, 9.4) * MAX_ROT * amp * 1.3
}
