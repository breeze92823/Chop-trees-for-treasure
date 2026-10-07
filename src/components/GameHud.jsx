import { RAINBOW, grad, T, Icon, stop, Btn, Emoji } from './hudParts.jsx'
import EggMenu from './EggMenu.jsx'
import HatchOverlay from './HatchOverlay.jsx'
import PetsMenu from './PetsMenu.jsx'
import IndexMenu from './IndexMenu.jsx'
import ChopFx from './ChopFx.jsx'
import Announcements from './Announcements.jsx'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { petSlots } from '../systems/pets.js'
import { playButtonClick } from '../systems/sfx.js'
import { formatNumber } from '../utils/format.js'
import '../styles/gameHud.css'

// The in-game HUD from the reference screenshots. Wood, the equipped-pet
// counter and the Pets / Index tiles are live (store/usePlayerData.js), and
// the egg / pets / index / hatch windows mount here too. The other values are
// placeholders whose buttons do nothing (they only swallow the pointer so a
// click doesn't orbit the camera). Everything is laid out in reference pixels
// (the screenshots are 1920x991) and scaled by --s in gameHud.css.

// --- Top centre: level bar, strength packs, strength total ------------------------
function LevelBar() {
  const xp = 31.94
  const need = 80
  return (
    <div className="hud-top" onPointerDown={stop}>
      <div className="level">
        <div className="level-fill" style={{ width: `${(xp / need) * 100}%` }} />
        <T size={44} w={5} className="level-l">LEVEL 3</T>
        <T size={40} w={5} className="level-r">{`${xp}/${need}`}</T>
      </div>
      <div className="packs">
        <Btn className="pack" style={{ '--bg': '#ff8a1f' }}><Icon name="coin" size={26} /><T size={28}>+8.5K</T></Btn>
        <Btn className="pack" style={{ '--bg': '#9a4ff0' }}><Icon name="coin" size={26} /><T size={28}>+800K</T></Btn>
        <Btn className="pack" style={{ '--bg': '#e8303a' }}><Icon name="coin" size={26} /><T size={28}>+80M</T></Btn>
      </div>
      <div className="strength">
        <Emoji size={50}>💪</Emoji>
        <T size={34} w={4} fill={grad('#fff6dc', '#ffd77a')} stroke="#3a2406">116.94 Strength</T>
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
  { label: 'Rebirth', emoji: '☂️', bg: '#ff8a5a', badge: '0%' },
  { label: 'Index', emoji: '📗', bg: '#a066f2', window: 'indexMenu' },
  { label: 'Invite', emoji: '🐥', bg: '#5fd14a' },
  { label: 'Pets', emoji: '🐾', bg: '#3a8ef0', window: 'petsMenu' },
  { label: 'Quests', emoji: '📜', bg: '#d9b48a' },
]

// Pets / Index: one window at a time; the egg window closes under them.
function toggleWindow(key) {
  playButtonClick()
  const open = !useGameStore.getState()[key]
  useGameStore.setState({ petsMenu: false, indexMenu: false, ...(open && { eggMenu: null, autoHatch: false }), [key]: open })
}

function LeftMenu() {
  return (
    <div className="left" onPointerDown={stop}>
      <T size={30} w={4} fill={grad('#fff3a0', '#ffb21f')} stroke="#4a2a00" className="auto-title">Auto Collects</T>
      <Btn className="autochop" style={{ '--bg': '#46cf3a' }}>
        <T size={32} w={5}>AUTO CHOP</T>
      </Btn>
      <div className="menu">
        {MENU.map((m) => (
          <Btn key={m.label} className="tile" style={{ '--bg': m.bg }} onClick={m.window && (() => toggleWindow(m.window))}>
            <Emoji size={58}>{m.emoji}</Emoji>
            <T size={24} w={4} className="tile-label">{m.label}</T>
            {m.badge && <T size={24} w={4} fill={grad('#fff3a0', '#ffc21a')} className="tile-badge">{m.badge}</T>}
          </Btn>
        ))}
      </div>
    </div>
  )
}

// --- Bottom left: wood, backpack, rebirths, cash -----------------------------------------
function Stats() {
  const wood = usePlayerData((s) => s.wood)
  const equipped = usePlayerData((s) => s.equipped.length)
  const slots = usePlayerData(petSlots)
  return (
    <div className="stats">
      <div className="stat"><Icon name="log" size={52} /><T size={36} w={4} fill={grad('#ffe0b0', '#e8a868')} stroke="#3a1a08">{formatNumber(wood)}</T></div>
      <div className="stat"><Emoji size={40}>🎒</Emoji><T size={36} w={4}>{`${equipped}/${slots}`}</T></div>
      <div className="stat"><Icon name="rebirth" size={44} /><T size={36} w={4}>0</T></div>
      <div className="stat cash"><Icon name="cash" size={84} /><T size={56} w={5} fill={grad('#c8ff9a', '#2fcf3a')} stroke="#0c3a10">$232</T></div>
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
      <IndexMenu />
      <ChopFx />
      <Announcements />
      <HatchOverlay />
    </div>
  )
}
