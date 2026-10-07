import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { RARITY_ROW_BG } from '../data/loot.js'
import { CHOPPERS } from '../data/choppers.js'
import { buyChopper, closeChoppersMenu, equipChopper } from '../systems/choppers.js'
import { playButtonClick } from '../systems/sfx.js'
import { formatNumber } from '../utils/format.js'
import { RAINBOW, grad, T, Icon, stop, Btn, Emoji } from './hudParts.jsx'
import { showActionResult } from '../systems/actionResult.js'

// Choppers window, opened by hold-E at the Choppers stall (systems/choppers.js):
// one row per axe from data/choppers.js — name, rarity, Strength per swing — with
// Equip / Equipped for owned ones, otherwise a cash price (green when affordable,
// grey when not) and/or a Robux gem price. Layout in reference pixels (gameHud.css).

const click = (fn) => () => {
  playButtonClick()
  fn()
}

// Row backgrounds by rarity (Common..Legendary share the Sell window's tiers).
const ROW_BG = {
  ...RARITY_ROW_BG,
  Mythic: 'linear-gradient(90deg, #ff5a4a, #ff9a2a 18%, #ffe03a 34%, #4adf5a 50%, #3ab8ff 68%, #8a5cf0 84%, #ff5adf)',
  Secret: 'linear-gradient(90deg, #7a7a7a, #f0f0f0 30%, #2a2a2e 58%, #8a8a8e 85%, #3a3a3e)',
  Unique: 'linear-gradient(180deg, #ebe6d6, #8aaee0 55%, #2f7fe8)',
  Admin: 'linear-gradient(90deg, #3adf55, #1c8a32 55%, #0f4a1c)',
}

// Rarity label colours; Secret / Unique / Admin append "- N% Stronger!".
const RARITY_FILL = {
  Common: [grad('#f4f4fa', '#c9c9d6'), '#15151a'],
  Uncommon: [grad('#5dff4a', '#1fa82a'), '#0c3a10'],
  Rare: [grad('#6ac0ff', '#1f78e0'), '#0a2a5a'],
  Epic: [grad('#e07aff', '#a030e0'), '#3a0a5a'],
  Legendary: [grad('#ffc040', '#ff8a10'), '#4a2a00'],
  Mythic: [RAINBOW, '#15151a'],
  Secret: [grad('#6a6a72', '#2a2a30'), '#000000'],
  Unique: [grad('#fff2c0', '#c89a40'), '#15151a'],
  Admin: [grad('#1fdc3a', '#0f7a20'), '#021a08'],
}

const nameSize = (n) => (n.length >= 26 ? 34 : n.length >= 23 ? 38 : n.length >= 20 ? 42 : n.length >= 17 ? 48 : 52)

function Buttons({ c, owned, equipped, cash }) {
  if (owned) {
    return (
      <Btn className="chopper-btn big" style={{ '--bg': equipped ? '#7a8094' : '#2fa83a' }} onClick={click(() => equipChopper(c.id))}>
        <T size={50} w={5}>{equipped ? 'Equipped' : 'Equip'}</T>
      </Btn>
    )
  }
  if (c.how) {
    return (
      <Btn className="chopper-btn big static" style={{ '--bg': '#ffb21f' }} onClick={click(() => showActionResult(`${c.name} comes from ${c.how}`, false))}>
        <T size={52} w={5}>{c.how}</T>
      </Btn>
    )
  }
  return (
    <>
      {c.cost != null && (
        <Btn className={`chopper-btn${c.gems == null ? ' big' : ''}`} style={{ '--bg': cash >= c.cost ? '#2fa83a' : '#7a8094' }} onClick={click(() => buyChopper(c.id, 'cash'))}>
          <T size={34} w={4}>{`$${formatNumber(c.cost)}`}</T>
        </Btn>
      )}
      {c.gems != null && (
        <Btn className={`chopper-btn${c.cost == null ? ' big' : ''}`} style={{ '--bg': '#ffb21f' }} onClick={click(() => buyChopper(c.id, 'gems'))}>
          <span className="chopper-gem">
            <Icon name="robux" size={c.cost == null ? 64 : 34} />
            <T size={c.cost == null ? 56 : 34} w={4}>{c.gems}</T>
          </span>
        </Btn>
      )}
    </>
  )
}

function Row({ c, owned, equipped, cash }) {
  const [fill, stroke] = RARITY_FILL[c.rarity]
  return (
    <div className="chopper-row" style={{ '--bgfill': ROW_BG[c.rarity] }}>
      <img className="chopper-icon" src={`${import.meta.env.BASE_URL}ui/choppers/${c.id}.png`} alt="" draggable={false} />
      <T size={nameSize(c.name)} w={5} className="chopper-name">{c.name}</T>
      <T size={c.bonus ? 30 : 34} w={4} fill={fill} stroke={stroke} className="chopper-rarity">
        {c.bonus ? `${c.rarity} - ${c.bonus}% Stronger!` : c.rarity}
      </T>
      <span className="chopper-power">
        <Emoji size={50}>💪</Emoji>
        <T size={46} w={5}>{`+${formatNumber(c.strength)} Strength`}</T>
      </span>
      <div className="chopper-btns">
        <Buttons c={c} owned={owned} equipped={equipped} cash={cash} />
      </div>
    </div>
  )
}

export default function ChoppersMenu() {
  const open = useGameStore((s) => s.choppersMenu)
  const hatching = useGameStore((s) => s.hatch !== null)
  const owned = usePlayerData((s) => s.choppers)
  const equipped = usePlayerData((s) => s.chopper)
  const cash = usePlayerData((s) => s.cash)
  if (!open || hatching) return null

  return (
    <div className="sell-menu choppers-menu" onPointerDown={stop} onWheel={stop}>
      <div className="sell-title choppers-title">
        <span className="chopper-title-icon"><Emoji size={110}>🪓</Emoji></span>
        <T size={62} w={6}>Choppers</T>
      </div>
      <button type="button" className="egg-close" aria-label="Close" onPointerDown={stop} onClick={click(closeChoppersMenu)} />
      <div className="chopper-list">
        {CHOPPERS.map((c) => <Row key={c.id} c={c} owned={owned.includes(c.id)} equipped={equipped === c.id} cash={cash} />)}
      </div>
    </div>
  )
}
