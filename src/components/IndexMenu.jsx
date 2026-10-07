import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { INDEX } from '../data/economy.js'
import { ITEM_CATALOG } from '../data/loot.js'
import { indexBonus } from '../systems/treasureIndex.js'
import { playButtonClick } from '../systems/sfx.js'
import { GenericItem, MODELS } from '../world/lootModels.jsx'
import { grad, T, stop } from './hudParts.jsx'
import { BookIcon } from './hudIcons.jsx'

// Treasure Index (the HUD's Index tile): every collectable by rarity, four to
// a row. Collected ones show their 3D model turning on the spot and their
// name; the rest only a red "?" under the rarity. Each discovered treasure raises the Strength multiplier
// (systems/treasureIndex.js).
//
// The models are drawn by one small canvas laid over the scrolling grid with a
// pixel-unit orthographic camera; every model follows its tile's on-screen
// rectangle each frame, so scrolling just works and the canvas (and its WebGL
// context) only exists while the window is open.

const close = () => {
  playButtonClick()
  useGameStore.setState({ indexMenu: false })
}

const RARITY_TEXT = {
  Common: '#8f97dc',
  Uncommon: '#3dcc3d',
  Rare: '#3a82f2',
  Epic: '#c552ff',
  Legendary: '#ffb020',
  Mythic: '#ff4a6a',
  Secret: '#9fe8ff',
  Celestial: '#9a6cff',
  Divine: '#ffe98a',
}

function Model({ name, tiles, phase }) {
  const group = useRef()
  const Item = MODELS[name] || GenericItem
  useFrame(({ gl, clock }) => {
    const tile = tiles.current.get(name)
    const g = group.current
    if (!tile || !g) return
    const c = gl.domElement.getBoundingClientRect()
    const r = tile.getBoundingClientRect()
    const cy = r.top + r.height * 0.5
    // Tiles scrolled out of the grid are hidden (the canvas clips the rest).
    g.visible = r.bottom > c.top && r.top < c.bottom
    const size = r.width * 0.38 // models are ~1 m across
    g.scale.setScalar(size)
    g.position.set(r.left + r.width / 2 - (c.left + c.width / 2), -(cy - (c.top + c.height / 2)) - size * 0.5, 0)
    g.rotation.y = clock.elapsedTime * 1.1 + phase
  })
  return (
    <group ref={group} rotation={[0.18, 0, 0]}>
      <Item />
    </group>
  )
}

function Tile({ name, rarity, found, tiles }) {
  return (
    <div className={`index-tile${found ? '' : ' unknown'}`} ref={(el) => (el ? tiles.current.set(name, el) : tiles.current.delete(name))}>
      <T size={29} w={3} fill={RARITY_TEXT[rarity]} stroke="#0a0a12" className="index-tile-rarity">{rarity}</T>
      {found ? (
        <T size={name.length > 14 ? 22 : name.length > 11 ? 25 : 28} w={3} className="index-tile-name">{name}</T>
      ) : (
        <T size={138} w={5} fill={grad('#ff5a72', '#d4143a')} stroke="#2a0510" className="index-tile-unknown">?</T>
      )}
    </div>
  )
}

export default function IndexMenu() {
  const open = useGameStore((s) => s.indexMenu)
  const hatching = useGameStore((s) => s.hatch !== null)
  const discovered = usePlayerData((s) => s.discoveredItems)
  const bonus = usePlayerData(indexBonus)
  const tiles = useRef(new Map())
  if (!open || hatching) return null

  const found = new Set(discovered)
  return (
    <div className="index-menu" onPointerDown={stop} onWheel={stop}>
      <div className="index-title">
        <span className="index-title-icon"><BookIcon size={118} /></span>
        <T size={62} w={6}>Index</T>
      </div>
      <button type="button" className="egg-close" aria-label="Close" onPointerDown={stop} onClick={close} />

      <div className="index-grid">
        {ITEM_CATALOG.map(([name, rarity]) => (
          <Tile key={name} name={name} rarity={rarity} found={found.has(name)} tiles={tiles} />
        ))}
      </div>
      <div className="index-gl">
        <Canvas orthographic dpr={[1, 2]} style={{ pointerEvents: 'none' }} camera={{ position: [0, 0, 600], near: 0.1, far: 1500, zoom: 1 }} gl={{ alpha: true }}>
          <ambientLight intensity={1.1} />
          <directionalLight position={[120, 300, 400]} intensity={2.4} />
          <directionalLight position={[-200, -50, 300]} intensity={0.8} />
          <Suspense fallback={null}>
            {ITEM_CATALOG.map(([name], i) => found.has(name) && <Model key={name} name={name} tiles={tiles} phase={i * 0.7} />)}
          </Suspense>
        </Canvas>
      </div>

      <div className="index-foot">
        <T size={32} w={3}>{`Each discovered treasure grants x${+(1 + INDEX.perItem).toFixed(3)} strength`}</T>
        <span>
          <T size={32} w={3}>Current Bonus: </T>
          <T size={32} w={3} fill={grad('#c6ff9a', '#3fcf3a')}>{`x${bonus.toFixed(3)}`}</T>
        </span>
      </div>
    </div>
  )
}
