import { GROUND_Y, WORLD_BOUNDS } from '../data/config.js'

// Static collision, kept deliberately simple: axis-aligned boxes described by
// their footprint and the height of their top face. The player stands on the
// highest box under their feet (or the bare ground). playerMovement and the
// camera boom clamp (cameraCollision.js) both query this.
//
// A theme registers its solid props once, next to the meshes that draw them:
//   const remove = addCollider({ x0, x1, z0, z1, top })
// and calls remove() when the prop goes away (a felled tree, an opened door).
const colliders = new Set()

export function addCollider(box) {
  colliders.add(box)
  return () => colliders.delete(box)
}

// Convenience: a box centred on (x, z) with width w, depth d, sitting on y0.
export function addBox({ x, z, w, d, h, y0 = GROUND_Y }) {
  return addCollider({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, top: y0 + h })
}

// Floor height for the camera boom: like terrainHeightAt, but colliders flagged
// `cameraPass` (trees) are ignored so the camera can go through them.
export function cameraFloorAt(x, z, y = Infinity) {
  let h = GROUND_Y
  for (const c of colliders) {
    if (c.cameraPass || c.top <= h || x < c.x0 || x > c.x1 || z < c.z0 || z > c.z1) continue
    if (c.bottom !== undefined && y < c.bottom) continue
    h = c.top
  }
  return h
}

// Floor height under (x, z). `y` (the querying body's height) lets a
// collider be ignored when the body is below its underside, if it sets
// `bottom` — e.g. a bridge you can walk under. Boxes without `bottom` are
// solid from the ground up.
export function terrainHeightAt(x, z, y = Infinity, skip = null) {
  let h = GROUND_Y
  for (const c of colliders) {
    if (c === skip || c.top <= h || x < c.x0 || x > c.x1 || z < c.z0 || z > c.z1) continue
    if (c.bottom !== undefined && y < c.bottom) continue
    h = c.top
  }
  return h
}

// The collider that sets the floor under (x, z), or null for bare ground.
export function colliderAt(x, z, y = Infinity) {
  let best = null
  let h = GROUND_Y
  for (const c of colliders) {
    if (c.top <= h || x < c.x0 || x > c.x1 || z < c.z0 || z > c.z1) continue
    if (c.bottom !== undefined && y < c.bottom) continue
    h = c.top
    best = c
  }
  return best
}

export function isOutsideBounds(x, z) {
  const b = WORLD_BOUNDS
  return x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ
}
