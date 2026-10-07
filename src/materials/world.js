import { MeshStandardMaterial } from 'three'
import { tileMaterial } from './tile.js'
import { COLORS } from '../data/config.js'

// The material catalogue. Two methods, both cached so a repeated call returns
// the same instance (cheap draw calls, one shader program per look):
//
//   surface(top, opts)  world-space procedural shader (materials/tile.js):
//                       checker, grout, studs, mottle, speckle. No UVs, so any
//                       box scaled any way lines up with its neighbours. Use
//                       for ground, walls, floors, platforms.
//   plastic(color, opts) plain flat-shaded MeshStandardMaterial. Use for props.
//
// Add a theme's look as one more entry in MAT below.
const STUD = { studs: 0.5, studShape: 1, studAmt: 1, speckle: 0.4, roughness: 0.9 }

export const surface = (top, extra = {}) => tileMaterial({ ...STUD, top, ...extra })

const cache = new Map()
export function plastic(color, extra = {}) {
  const key = color + JSON.stringify(extra)
  if (!cache.has(key)) cache.set(key, new MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...extra }))
  return cache.get(key)
}

export const MAT = {
  grass: surface(COLORS.grass, { top2: COLORS.grass2, checker: 4 }),
  // Terraced cliffs: brown checkered faces, grass-coloured rim on top.
  cliff: surface(COLORS.grass, { top2: COLORS.grass2, side: COLORS.dirt, side2: COLORS.dirt2, checker: 4 }),
  path: surface(COLORS.path, { top2: COLORS.path2, checker: 2 }),
  curb: surface(COLORS.curb),
  train: surface(COLORS.train, { top2: COLORS.train2, side: COLORS.train2, side2: COLORS.train, checker: 2 }),
  trainWall: surface('#e9963a', { top2: '#de8a2f', side: '#e9963a', side2: '#d98330', checker: 4 }),
  board: surface(COLORS.board, { top2: COLORS.board2, checker: 2 }),
  boardStep: surface('#5162dc', { top2: '#4757cf', checker: 2 }),
  forestFloor: surface('#4cc928', { top2: '#43bb22', checker: 4 }),
  leaves: surface('#41b62a', { top2: '#38a623', side: '#3aab25', side2: '#33a020', checker: 1, studAmt: 0.7 }),
  trunk: surface('#7a3f1f', { side: '#7a3f1f', side2: '#6d371a', checker: 1, studAmt: 0.5 }),
  eggBase: surface('#1f6b2c', { top2: '#1b6127', checker: 1 }),
  wood: plastic('#8a4a22'),
  woodDark: plastic('#5e2f14'),
  woodLight: plastic('#b9773f'),
  leaf: plastic('#2f9e2a'),
  stone: plastic('#7d7f86', { flatShading: true }),
  stoneLight: plastic('#a3a6ad', { flatShading: true }),
  rock: plastic('#6b6d74', { flatShading: true }),
  sack: plastic('#7b4a27', { flatShading: true }),
  white: plastic('#f4f6f8'),
  black: plastic('#141416'),
  metal: plastic('#8d929c', { metalness: 0.6, roughness: 0.35 }),
  gold: plastic('#ffc21a', { metalness: 0.4, roughness: 0.35 }),
  water: new MeshStandardMaterial({ color: '#2fb4f2', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 }),
  lamp: new MeshStandardMaterial({ color: '#ffd65a', emissive: '#ffbf2e', emissiveIntensity: 2, toneMapped: false }),
  ember: new MeshStandardMaterial({ color: '#ff7a1a', emissive: '#ff5a00', emissiveIntensity: 2.2, toneMapped: false }),
  glow: new MeshStandardMaterial({ color: '#2de7ff', emissive: '#2de7ff', emissiveIntensity: 1.6, transparent: true, opacity: 0.85, toneMapped: false }),
}

// Emissive accent in any colour (portals, pad glows, crystals); cached.
const glowCache = new Map()
export function glow(color, intensity = 1.6, opacity = 1) {
  const key = `${color}|${intensity}|${opacity}`
  if (!glowCache.has(key)) {
    glowCache.set(key, new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, transparent: opacity < 1, opacity, toneMapped: false }))
  }
  return glowCache.get(key)
}
