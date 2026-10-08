import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Box3, Vector3 } from 'three'
import { usePlayerData } from '../store/usePlayerData.js'
import { ITEM_INFO, RARITY_ROW_BG } from '../data/loot.js'
import { canCraftWithIngredients, closeCraftPage, craftWithIngredients, ingredientStatus } from '../systems/artifacts.js'
import { playButtonClick } from '../systems/sfx.js'
import { formatNumber } from '../utils/format.js'
import { GenericItem, MODELS } from '../world/lootModels.jsx'
import { grad, T, Icon, stop, Btn } from './hudParts.jsx'

// Craft page of the Artifacts window: the recipe's ingredients (loot items from the Bag,
// data/artifacts.js `recipe`), the wood cost, the 3x3 recipe grid and CRAFT. The item
// icons are the real loot models (world/lootModels.jsx), spinning, drawn by ONE
// orthographic canvas laid over the page whose units are the page's reference pixels.

const W = 972 // window padding box in reference px (980 - 2 x 4 border)
const H = 629
const click = (fn) => () => {
  playButtonClick()
  fn()
}

// Layout, reference px (matches .acraft-* in gameHud.css).
const GRID = { x: 548, y: 160, cell: 102, gap: 12, pad: 12 }
// Ingredient rows (plus the wood row) share the 160..620 band; they shrink as the recipe grows.
const rowLayout = (count) => {
  const gap = 10
  const h = Math.min(92, Math.floor((460 - (count - 1) * gap) / count))
  return { h, k: h / 92, tops: Array.from({ length: count }, (_, i) => 160 + i * (h + gap)) }
}
const cellCentre = (i) => ({
  x: GRID.x + GRID.pad + (i % 3) * (GRID.cell + GRID.gap) + GRID.cell / 2,
  y: GRID.y + GRID.pad + Math.floor(i / 3) * (GRID.cell + GRID.gap) + GRID.cell / 2,
})

// One spinning loot model, centred on its own bounds and scaled to `size` px.
function Spinner({ x, y, size: refSize, name, phase }) {
  const sc = useThree((st) => st.size.width) / W // reference px -> on-screen px
  const size = refSize * sc
  const spin = useRef()
  const fit = useRef()
  const Model = MODELS[name] || GenericItem
  useLayoutEffect(() => {
    // Measure with the parents' placement and spin cleared, so the box is in the model's own units.
    const g = fit.current
    const outer = spin.current.parent
    const saved = [outer.position.clone(), spin.current.rotation.clone()]
    outer.position.set(0, 0, 0)
    spin.current.rotation.set(0, 0, 0)
    g.scale.setScalar(1)
    g.position.set(0, 0, 0)
    g.updateWorldMatrix(true, true)
    const box = new Box3().setFromObject(g)
    const dim = box.getSize(new Vector3())
    const k = size / Math.max(dim.x, dim.y, dim.z, 0.001)
    g.scale.setScalar(k)
    g.position.copy(box.getCenter(new Vector3())).multiplyScalar(-k)
    outer.position.copy(saved[0])
    spin.current.rotation.copy(saved[1])
  }, [size, name])
  useFrame(({ clock }) => {
    spin.current.rotation.y = clock.elapsedTime * 0.9 + phase
  })
  return (
    <group position={[(x - W / 2) * sc, (H / 2 - y) * sc, 0]}>
      <group ref={spin} rotation={[0.25, 0, 0]}>
        <group ref={fit}>
          <Model />
        </group>
      </group>
    </group>
  )
}

function Icons({ a }) {
  const ingredients = useMemo(() => ingredientStatus(a), [a])
  const L = rowLayout(ingredients.length + 1)
  return (
    <Canvas className="acraft-canvas" resize={{ offsetSize: true }} orthographic dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 600], near: 0.1, far: 1500, zoom: 1 }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[120, 300, 400]} intensity={2.6} />
      <directionalLight position={[-200, -50, 300]} intensity={0.9} color="#a8c8ff" />
      <Suspense fallback={null}>
        {ingredients.map((ing, i) => (
          <Spinner key={ing.name} name={ing.name} x={28 + 56 * L.k} y={L.tops[i] + L.h / 2} size={Math.min(78, L.h - 14)} phase={i * 1.1} />
        ))}
        {a.recipe.cells.map((name, i) => name && (
          <Spinner key={i} name={name} x={cellCentre(i).x} y={cellCentre(i).y} size={74} phase={i * 0.7} />
        ))}
      </Suspense>
    </Canvas>
  )
}

export default function ArtifactCraft({ a, fill, stroke }) {
  usePlayerData((s) => s.bag) // re-render when the Bag or wood changes
  const wood = usePlayerData((s) => s.wood)
  const ingredients = ingredientStatus(a)
  const can = canCraftWithIngredients(a)
  const need = a.recipe.wood
  const L = rowLayout(ingredients.length + 1)
  const fs = (n) => Math.round(n * L.k)
  const pos = (top, left = 112) => ({ top: `calc(${top * L.k} * var(--s))`, left: `calc(${left * L.k} * var(--s))` })
  return (
    <div className="acraft" onPointerDown={stop}>
      <Btn className="acraft-back" style={{ '--bg': '#e8ecf4' }} onClick={click(closeCraftPage)}>
        <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M16 4 L6 12 L16 20 Z" fill="#2a2d3a" /></svg>
      </Btn>
      <T size={50} w={5} fill={fill} stroke={stroke} className="acraft-title">{a.name}</T>
      <T size={36} w={4} className="acraft-label">Ingredients</T>

      {ingredients.map((ing, i) => {
        const done = ing.have >= ing.need
        return (
          <div key={ing.name} className="acraft-row" style={{ '--bgfill': RARITY_ROW_BG[ITEM_INFO[ing.name]?.rarity ?? 'Common'], top: `calc(${L.tops[i]} * var(--s))`, height: `calc(${L.h} * var(--s))` }}>
            <T size={fs(36)} w={5} className="acraft-name" style={pos(8)}>{ing.name}</T>
            <T size={fs(30)} w={4} style={pos(46)} fill={done ? grad('#d8ffb0', '#6aff5a') : grad('#ffd0c0', '#ff6a50')} stroke="#15151a" className="acraft-have">{`${ing.have}/${ing.need} in Bag`}</T>
          </div>
        )
      })}
      <div className="acraft-row wood" style={{ top: `calc(${L.tops[ingredients.length]} * var(--s))`, height: `calc(${L.h} * var(--s))` }}>
        <span className="acraft-wood-icon" style={pos(8, 26)}><Icon name="log" size={Math.min(64, L.h - 14)} /></span>
        <T size={fs(44)} w={5} style={pos(20)} fill={wood >= need ? grad('#d8ffb0', '#6aff5a') : grad('#ffd0c0', '#ff6a50')} className="acraft-wood-text">{`${formatNumber(Math.min(wood, need))}/${formatNumber(need)} Wood`}</T>
      </div>

      <div className="acraft-grid">
        {a.recipe.cells.map((_, i) => <div key={i} className="acraft-cell" />)}
      </div>
      <Btn className="acraft-craft" style={{ '--bg': can ? '#2fa83a' : '#7a8094' }} onClick={click(() => craftWithIngredients(a.id))}>
        <T size={48} w={5}>CRAFT</T>
      </Btn>

      <Icons a={a} />
    </div>
  )
}
