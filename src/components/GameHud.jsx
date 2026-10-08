import { useEffect, useState } from 'react'
import { player } from '../systems/playerState.js'
import { respawn } from '../systems/playerMovement.js'
import { inForestCorridor } from '../world/forestTrees.js'
import { RAINBOW, grad, T, Icon, stop, Btn, Emoji } from './hudParts.jsx'
import EggMenu from './EggMenu.jsx'
import HatchOverlay from './HatchOverlay.jsx'
import PetsMenu from './PetsMenu.jsx'
import ForgeMenu from './ForgeMenu.jsx'
import IndexMenu from './IndexMenu.jsx'
import RebirthMenu from './RebirthMenu.jsx'
import SellMenu from './SellMenu.jsx'
import ChoppersMenu from './ChoppersMenu.jsx'
import AurasMenu from './AurasMenu.jsx'
import UpgradesMenu from './UpgradesMenu.jsx'
import ArtifactsMenu from './ArtifactsMenu.jsx'
import { BookIcon, CashIcon, RebirthIcon } from './hudIcons.jsx'
import ChopFx from './ChopFx.jsx'
import LevelUpPopup from './LevelUpPopup.jsx'
import Announcements from './Announcements.jsx'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { bagMax } from '../systems/upgrades.js'
import { rebirthProgress } from '../systems/rebirth.js'
import { playButtonClick } from '../systems/sfx.js'
import { formatNumber } from '../utils/format.js'
import '../styles/gameHud.css'

// The in-game HUD from the reference screenshots. Wood, the equipped-pet
// counter, rebirths and the Pets / Index / Rebirth tiles are live
// (store/usePlayerData.js), and the egg / pets / index / rebirth / hatch
// windows mount here too. The other values are
// placeholders whose buttons do nothing (they only swallow the pointer so a
// click doesn't orbit the camera). Everything is laid out in reference pixels
// (the screenshots are 1920x991) and scaled by --s in gameHud.css.

// --- Top centre: level bar, strength packs, strength total ------------------------
// True while the player is in the tree corridor (north of the first forest zone).
function useInForest() {
  const [inside, setInside] = useState(false)
  useEffect(() => {
    const check = () => {
      const { x, z } = player.position
      setInside(inForestCorridor(x, z))
    }
    check()
    const id = setInterval(check, 150)
    return () => clearInterval(id)
  }, [])
  return inside
}

function goHome() {
  playButtonClick()
  respawn()
}

function LevelBar() {
  const inForest = useInForest()
  const strength = usePlayerData((s) => s.strength)
  const level = usePlayerData((s) => s.level)
  const xp = usePlayerData((s) => s.xp)
  const need = usePlayerData((s) => s.xpNeeded)
  // In the forest the level bar, packs and strength give way to a Home button.
  if (inForest) {
    return (
      <div key="home" className="home-wrap" onPointerDown={stop}>
        <Btn className="autochop home" style={{ '--bg': '#5ec8ff' }} onClick={goHome}>
          <T size={64} w={8}>HOME</T>
        </Btn>
      </div>
    )
  }
  return (
    <div key="top" className="hud-top" onPointerDown={stop}>
      <div className="level">
        <div className="level-fill" style={{ width: `${(xp / need) * 100}%` }} />
        <T size={44} w={5} className="level-l">{`LEVEL ${level}`}</T>
        <T size={40} w={5} className="level-r">{`${formatNumber(xp)}/${need}`}</T>
      </div>
      <div className="packs">
        <Btn className="pack" style={{ '--bg': '#ff8a1f' }}><Icon name="coin" size={26} /><T size={28}>+8.5K</T></Btn>
        <Btn className="pack" style={{ '--bg': '#9a4ff0' }}><Icon name="coin" size={26} /><T size={28}>+800K</T></Btn>
        <Btn className="pack" style={{ '--bg': '#e8303a' }}><Icon name="coin" size={26} /><T size={28}>+80M</T></Btn>
      </div>
      <div className="strength">
        <Emoji size={50}>💪</Emoji>
        <T size={34} w={4} fill={grad('#fff6dc', '#ffd77a')} stroke="#3a2406">{`${formatNumber(strength)} Strength`}</T>
      </div>
    </div>
  )
}

// --- Top right: auto clicker, free gift, settings ------------------------------------
function TopRight() {
  return (
    <>
      <Btn className="autoclick" style={{ '--bg': '#ffd23a' }}>
        <T size={28} w={4} fill={RAINBOW}>OP Auto Clicker</T>
        <span className="autoclick-row">
          <Emoji size={28}>🖱️</Emoji>
          <T size={28} w={4} fill={grad('#ff8ad8', '#e8243a')}>OFF</T>
        </span>
      </Btn>
      <Btn className="bare gift">
        <Emoji size={62}>🎁</Emoji>
        <T size={20} w={3} fill={grad('#c6ff9a', '#3fcf3a')}>FREE!</T>
      </Btn>
      <Btn className="bare gear"><Emoji size={64}>⚙️</Emoji></Btn>
    </>
  )
}

// --- Right side: x2 offers and the OP pet deal ------------------------------------------
function Offer({ top, price, label, bg }) {
  return (
    <div className="offer" style={{ top: `calc(${top} * var(--s))` }}>
      <div className="offer-only">
        <T size={22} w={3}>ONLY</T>
        <Icon name="coin" size={22} />
        <T size={22} w={3}>{price}</T>
      </div>
      <Btn className="offer-btn" style={{ '--bg': bg }}>
        <T size={label.length > 8 ? 29 : 34} w={5}>{label}</T>
      </Btn>
    </div>
  )
}

function OpPet() {
  return (
    <div className="op" onPointerDown={stop}>
      <T size={30} w={4} fill={RAINBOW} className="op-title">OP</T>
      <div className="op-item">
        <div className="burst" />
        <Emoji size={64}>😺</Emoji>
        <span className="op-halo" />
      </div>
      <div className="op-price"><Icon name="coin" size={22} /><T size={22} w={3}>6</T></div>
      <T size={24} w={4} fill={RAINBOW} className="op-pct">1000%</T>
      <div className="op-item">
        <div className="burst slow" />
        <Emoji size={66}>🐉</Emoji>
      </div>
      <div className="op-price"><Icon name="coin" size={22} /><T size={22} w={3}>559</T></div>
    </div>
  )
}

// --- Left side: auto chop + menu grid ---------------------------------------------
const MENU = [
  { label: 'Shop', emoji: '🧺', bg: '#ffcf3a' },
  { label: 'Rebirth', icon: RebirthIcon, bg: '#ff8a5a', window: 'rebirthMenu', badge: true },
  { label: 'Index', icon: BookIcon, bg: '#a066f2', window: 'indexMenu' },
  { label: 'Invite', emoji: '🐥', bg: '#5fd14a' },
  { label: 'Pets', emoji: '🐾', bg: '#3a8ef0', window: 'petsMenu' },
  { label: 'Quests', emoji: '📜', bg: '#d9b48a' },
]

// Pets / Index / Rebirth: one window at a time; the egg window closes under them.
function toggleWindow(key) {
  playButtonClick()
  const open = !useGameStore.getState()[key]
  useGameStore.setState({ forgeMenu: false, petsMenu: false, indexMenu: false, rebirthMenu: false, sellMenu: false, choppersMenu: false, upgradesMenu: false, artifactsMenu: false, aurasMenu: false, autoSpin: false, ...(open && { eggMenu: null, autoHatch: false }), [key]: open })
}

function toggleAutoChop() {
  playButtonClick()
  useGameStore.setState((s) => ({ autoChop: !s.autoChop }))
}

function LeftMenu() {
  const autoChop = useGameStore((s) => s.autoChop)
  const rebirthPct = usePlayerData((s) => `${Math.floor(rebirthProgress(s) * 100)}%`)
  return (
    <div className="left" onPointerDown={stop}>
      <T size={30} w={4} fill={grad('#fff3a0', '#ffb21f')} stroke="#4a2a00" className="auto-title">Auto Collects</T>
      <Btn className="autochop" style={{ '--bg': autoChop ? '#46cf3a' : '#e8303a' }} onClick={toggleAutoChop}>
        <T size={32} w={5}>AUTO CHOP</T>
      </Btn>
      <div className="menu">
        {MENU.map((m) => (
          <Btn key={m.label} className="tile" style={{ '--bg': m.bg }} onClick={m.window && (() => toggleWindow(m.window))}>
            {m.icon ? <m.icon size={64} /> : <Emoji size={58}>{m.emoji}</Emoji>}
            <T size={24} w={4} className="tile-label">{m.label}</T>
            {m.badge && <T size={24} w={4} fill={grad('#fff3a0', '#ffc21a')} className="tile-badge">{rebirthPct}</T>}
          </Btn>
        ))}
      </div>
    </div>
  )
}

// --- Bottom left: wood, backpack, rebirths, cash -----------------------------------------
function Stats() {
  const wood = usePlayerData((s) => s.wood)
  const carried = usePlayerData((s) => s.bag.length)
  const rebirths = usePlayerData((s) => s.rebirths)
  const cash = usePlayerData((s) => s.cash)
  const capacity = usePlayerData(bagMax)
  return (
    <div className="stats">
      <div className="stat"><Icon name="log" size={52} /><T size={36} w={4} fill={grad('#ffe0b0', '#e8a868')} stroke="#3a1a08">{formatNumber(wood)}</T></div>
      <div className="stat"><Emoji size={40}>🎒</Emoji><T size={36} w={4}>{`${carried}/${capacity}`}</T></div>
      <div className="stat"><RebirthIcon size={44} /><T size={36} w={4}>{formatNumber(rebirths)}</T></div>
      <div className="stat cash"><CashIcon size={84} /><T size={56} w={5} fill={grad('#c8ff9a', '#2fcf3a')} stroke="#0c3a10">{`$${formatNumber(cash)}`}</T></div>
    </div>
  )
}

export default function GameHud() {
  return (
    <div className="game-hud">
      <LevelBar />
      <TopRight />
      <Offer top={300} price={59} label="x2 CASH" bg="#46cf3a" />
      <Offer top={431} price={3} label="x2 STRENGTH" bg="#ff9a1f" />
      <OpPet />
      <LeftMenu />
      <Stats />
      <EggMenu />
      <PetsMenu />
      <ForgeMenu />
      <IndexMenu />
      <RebirthMenu />
      <SellMenu />
      <ChoppersMenu />
      <AurasMenu />
      <UpgradesMenu />
      <ArtifactsMenu />
      <ChopFx />
      <LevelUpPopup />
      <Announcements />
      <HatchOverlay />
    </div>
  )
}
