// THE file to edit when reskinning this base for a new game. Everything a
// theme usually changes (identity, ground, colours, lighting, camera, physics
// feel) is a constant here; systems/ and components/ read it and hold no
// theme values of their own. Bloxity SDK constants live in data/bloxity.js.

import { FOREST_END_Z } from '../world/layout.js'

// --- Identity -------------------------------------------------------------
export const GAME_SLUG = 'chop-trees-for-treasure' // slug registered on bloxity.io
export const GAME_TITLE = 'Chop Trees for Treasure'

// --- World (metres: +X east, +Z south, +Y up) -------------------------------
export const GROUND_Y = 0
export const GROUT = 0.05 // tile material grout width (materials/tile.js)
// Walkable rectangle; playerMovement clamps to it (the "invisible wall").
// The hub basin (see world/layout.js); the terraced cliffs sit just outside it.
export const WORLD_BOUNDS = { minX: -34.5, maxX: 54, minZ: FOREST_END_Z, maxZ: 28 }
export const SPAWN = { x: 0, y: 0.3, z: 6 }
export const SPAWN_FACING = Math.PI // yaw the character faces on spawn (PI = toward -Z)

// --- Physics feel (systems/playerMovement.js) ---------------------------------
export const PHYSICS = {
  moveSpeed: 10, // m/s on flat ground
  accel: 45, // m/s^2 toward the target velocity
  gravity: -22, // m/s^2
  jumpSpeed: 7.5, // m/s
  maxStep: 0.65, // m a ledge can be and still be walked onto without jumping
  killY: -30, // fell this far below the ground: respawn
}
export const PLAYER_DIMS = { radius: 0.4, height: 1.8 }

// --- Palette ---------------------------------------------------------------
export const COLORS = {
  grass: '#4fd12a',
  grass2: '#46c424',
  dirt: '#b8693d', // terraced cliff faces: two-tone brown checker
  dirt2: '#a85c34',
  path: '#b3b4ba', // plaza: two-tone grey checker
  path2: '#a7a8af',
  curb: '#74757d',
  train: '#f6a83a', // Train Strength terraces
  train2: '#eb9a2c',
  board: '#7d45e6', // Leaderboards purple
  board2: '#6c37d4',
  horizon: '#f7d6a8', // fog + clear colour; matches the bottom of the sky dome (5 PM)
}

// Default (signed-out / fallback) character look.
export const CHARACTER_COLORS = { skin: '#f2c79a', suit: '#2f9e8f', hair: '#5a3a22' }

// --- Lighting (components/Lighting.jsx) ----------------------------------------
export const LIGHT = {
  sun: { color: '#ffc27a', intensity: 2.5, offset: [-65, 42, 30] }, // golden late-afternoon sun
  hemisphere: { sky: '#cfe3ff', ground: '#8a7048', intensity: 1.0 },
  ambient: 0.3,
  shadowMapSize: 4096,
}
export const FOG = { near: 120, far: 340 }
// Street lamps (world/Lamps.jsx): only the `pool` nearest to the player cast real light.
export const LAMP = { color: '#ffc46b', intensity: 12, distance: 20, pool: 8, height: 4.2 }

// --- Camera (systems/cameraOrbit.js) ---------------------------------------------
export const CAMERA = {
  fov: 70,
  near: 0.1,
  far: 500,
  startPitch: 0.32, // radians above the horizon
  minPitch: -0.1,
  maxPitch: 1.2,
  distance: 13, // starting boom length, m
  minDistance: 3,
  maxDistance: 15,
  positionSmoothing: 12, // 1/s, higher = stiffer follow
  lookSmoothing: 20,
  targetHeight: 0.6, // look-at point as a fraction of player height
}

// --- Multiplayer (systems/net.js) -------------------------------------------------
export const NET = {
  room: 'world', // room name the server registers (server/src/app.config.ts)
  sendHz: 15, // pose updates per second
  remoteSmoothing: 12, // 1/s exponential smoothing of remote positions
}
