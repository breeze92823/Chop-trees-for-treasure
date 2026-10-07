import { showMenu } from './bloxity.js'

// inputState: WASD/arrow move (camera-relative, consumed by playerMovement),
// a right-drag look delta + wheel zoom (consumed by cameraOrbit), and an
// edge-triggered jump flag cleared by playerMovement. `interact` is a one-shot
// edge flag for themes (E key); clear it in your own system once handled.
export const inputState = {
  move: { x: 0, z: 0 }, // x = strafe (+ right), z = forward (+ forward)
  look: { dx: 0, dy: 0 }, // pixels dragged this frame; consumed by cameraOrbit
  zoom: 0, // wheel delta this frame; consumed by cameraOrbit
  jump: false,
  interact: false,
}

export const INTERACT_KEY = 'KeyE'

// Touch sessions have no keyboard or mouse: an on-screen stick/button
// component (not part of the base) drives `inputState` through the setters
// below. `active` flips once — on the first real touch, or at install when the
// primary pointer is coarse — and never flips back for the session.
export const touchState = { active: false }
const touchModeSubs = new Set()

export function subscribeTouchMode(cb) {
  touchModeSubs.add(cb)
  return () => touchModeSubs.delete(cb)
}

function enableTouchMode() {
  if (touchState.active) return
  touchState.active = true
  document.documentElement.classList.add('touch-mode')
  touchModeSubs.forEach((cb) => cb(true))
}

// Analog stick, magnitude 0..1 (playerMovement scales speed by it).
export function setTouchMove(x, z) {
  inputState.move.x = x
  inputState.move.z = z
}
export function addTouchLook(dx, dy) {
  inputState.look.dx += dx
  inputState.look.dy += dy
}
export function addTouchZoom(dz) {
  inputState.zoom += dz
}
export function pressTouchJump() {
  inputState.jump = true // consumed + cleared next frame by playerMovement
}

// Modal UI (a shop window, a text field) takes over the keyboard/mouse while
// this is true. Themes flip it with setInputLocked(); locking drops held keys
// so the player stops dead.
let inputLocked = false
export function setInputLocked(value) {
  if (inputLocked === value) return
  inputLocked = value
  if (value) onBlur()
}
export const isInputLocked = () => inputLocked

const held = new Set()
let orbiting = false
let installed = false

function recomputeMove() {
  let x = 0
  let z = 0
  if (held.has('KeyW') || held.has('ArrowUp')) z += 1
  if (held.has('KeyS') || held.has('ArrowDown')) z -= 1
  if (held.has('KeyD') || held.has('ArrowRight')) x += 1
  if (held.has('KeyA') || held.has('ArrowLeft')) x -= 1
  inputState.move.x = x
  inputState.move.z = z
}

function onKeyDown(e) {
  if (e.repeat) return
  if (e.code === 'Escape') showMenu()
  if (inputLocked) return
  held.add(e.code)
  if (e.code === 'Space') inputState.jump = true
  if (e.code === INTERACT_KEY) inputState.interact = true
  recomputeMove()
}

function onKeyUp(e) {
  held.delete(e.code)
  recomputeMove()
}

// Right-drag orbits the camera.
function onPointerDown(e) {
  if (e.pointerType === 'touch' || inputLocked) return
  if (e.button === 2) orbiting = true
}

function onPointerUp(e) {
  if (e.pointerType === 'touch') return
  if (e.button === 2) orbiting = false
}

function onPointerMove(e) {
  if (!orbiting || inputLocked) return
  inputState.look.dx += e.movementX || 0
  inputState.look.dy += e.movementY || 0
}

function onWheel(e) {
  if (inputLocked) return
  inputState.zoom += e.deltaY
}

function onContextMenu(e) {
  e.preventDefault() // right-drag is the orbit gesture
}

function onBlur() {
  held.clear()
  orbiting = false
  inputState.jump = false
  inputState.interact = false
  recomputeMove()
}

export function isKeyDown(code) {
  return held.has(code)
}

export function install() {
  if (installed) return
  installed = true
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('contextmenu', onContextMenu)
  window.addEventListener('blur', onBlur)
  window.addEventListener('touchstart', enableTouchMode, { passive: true })

  // A coarse primary pointer means no mouse is coming.
  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches &&
    (navigator.maxTouchPoints || 0) > 0
  ) {
    enableTouchMode()
  }
}

export function uninstall() {
  if (!installed) return
  installed = false
  onBlur()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('wheel', onWheel)
  window.removeEventListener('contextmenu', onContextMenu)
  window.removeEventListener('blur', onBlur)
  window.removeEventListener('touchstart', enableTouchMode)
}
