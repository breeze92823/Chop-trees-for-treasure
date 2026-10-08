import { GROUND_Y, WORLD_BOUNDS } from '../data/config.js'

// Static collision, kept deliberately simple: axis-aligned boxes described by
// their footprint and the height of their top face. The player stands on the
// highest box under their feet (or the bare ground). playerMovement and the
// camera boom clamp (cameraCollision.js) both query this.
//
// A theme registers its solid props once, next to the meshes that draw them:
//   const remove = addCollider({ x0, x1, z0, z1, top })
// and calls remove() when the prop goes away (a felled tree, an opened door).
//
// Lookups go through a coarse spatial hash (BUCKET metres per cell) so a query
// only tests the boxes near (x, z), not every tree in the forest. Boxes that
// span many cells (zone slabs, cliffs) live in one shared `wide` list instead.
const BUCKET = 8
const WIDE_CELLS = 6
const buckets = new Map()
const wide = new Set()

const cellKey = (ix, iz) => (ix + 512) * 1024 + (iz + 512)

export function addCollider(box) {
  const ix0 = Math.floor(box.x0 / BUCKET)
  const ix1 = Math.floor(box.x1 / BUCKET)
  const iz0 = Math.floor(box.z0 / BUCKET)
  const iz1 = Math.floor(box.z1 / BUCKET)
  if (ix1 - ix0 >= WIDE_CELLS || iz1 - iz0 >= WIDE_CELLS) {
    wide.add(box)
    return () => wide.delete(box)
  }
  const keys = []
  for (let ix = ix0; ix <= ix1; ix++) {
    for (let iz = iz0; iz <= iz1; iz++) {
      const k = cellKey(ix, iz)
      let list = buckets.get(k)
      if (!list) buckets.set(k, (list = []))
      list.push(box)
      keys.push(k)
    }
  }
  return () => {
    for (const k of keys) {
      const list = buckets.get(k)
      const i = list ? list.indexOf(box) : -1
      if (i >= 0) list.splice(i, 1)
    }
  }
}

// Convenience: a box centred on (x, z) with width w, depth d, sitting on y0.
export function addBox({ x, z, w, d, h, y0 = GROUND_Y }) {
  return addCollider({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, top: y0 + h })
}

const NONE = []
const nearby = (x, z) => buckets.get(cellKey(Math.floor(x / BUCKET), Math.floor(z / BUCKET))) ?? NONE

// Highest box top under (x, z) that passes `ok`; `want` returns the box instead.
function scan(x, z, y, skip, ignoreCamera, wantBox) {
  let h = GROUND_Y
  let best = null
  const test = (c) => {
    if (c === skip || c.top <= h || x < c.x0 || x > c.x1 || z < c.z0 || z > c.z1) return
    if (ignoreCamera && c.cameraPass) return
    if (c.bottom !== undefined && y < c.bottom) return
    h = c.top
    best = c
  }
  for (const c of wide) test(c)
  for (const c of nearby(x, z)) test(c)
  return wantBox ? best : h
}

// Floor height for the camera boom: like terrainHeightAt, but colliders flagged
// `cameraPass` (trees) are ignored so the camera can go through them.
export function cameraFloorAt(x, z, y = Infinity) {
  return scan(x, z, y, null, true, false)
}

// Floor height under (x, z). `y` (the querying body's height) lets a
// collider be ignored when the body is below its underside, if it sets
// `bottom` — e.g. a bridge you can walk under. Boxes without `bottom` are
// solid from the ground up.
export function terrainHeightAt(x, z, y = Infinity, skip = null) {
  return scan(x, z, y, skip, false, false)
}

// The collider that sets the floor under (x, z), or null for bare ground.
export function colliderAt(x, z, y = Infinity) {
  return scan(x, z, y, null, false, true)
}

export function isOutsideBounds(x, z) {
  const b = WORLD_BOUNDS
  return x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ
}
