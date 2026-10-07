// Per-frame systems registry. components/GameLoop.jsx runs the core
// simulation (player movement, camera) and then every registered system, in
// registration order. A theme adds its own tick without touching the base:
//   const remove = addSystem((dt, { camera }) => { ... })
const systems = new Set()

export function addSystem(fn) {
  systems.add(fn)
  return () => systems.delete(fn)
}

export function runSystems(dt, ctx) {
  for (const fn of systems) fn(dt, ctx)
}
