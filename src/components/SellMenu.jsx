import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { ITEM_CATALOG, RARITY, RARITY_ROW_BG } from '../data/loot.js'
import { bagValue, closeSellMenu, groupBag, payout, sellAll, sellItem } from '../systems/sell.js'
import { playButtonClick } from '../systems/sfx.js'
import { formatNumber } from '../utils/format.js'
import { grad, T, stop, Btn, Emoji } from './hudParts.jsx'
import { CashIcon } from './hudIcons.jsx'

// Sell Treasure window, opened by hold-E at the Sell Treasure stall
// (systems/sell.js): the bag's total, Sell All, then one row per
// item type with its own Sell button. Layout is in reference pixels (gameHud.css).

const GLYPH = Object.fromEntries(ITEM_CATALOG.map(([name, , glyph]) => [name, glyph]))
const CASH_FILL = grad('#b6ff8a', '#2fcf3a')
const CASH_STROKE = '#0c3a10'
const click = (fn) => () => {
  playButtonClick()
  fn()
}
const money = (n) => `+$${formatNumber(n)}`

function Row({ item }) {
  return (
    <div className="sell-row" style={{ '--bg': RARITY_ROW_BG[item.rarity] ?? RARITY_ROW_BG.Common }}>
      <span className="sell-row-icon"><Emoji size={74}>{GLYPH[item.name] ?? '💰'}</Emoji></span>
      <T size={44} w={5} className="sell-row-name" style={{ '--stroke': '#15151a' }} fill={item.rarity === 'Common' ? undefined : grad('#ffffff', RARITY[item.rarity].glow)}>
        {`${item.name}  x${item.count}`}
      </T>
      <T size={44} w={5} fill={CASH_FILL} stroke={CASH_STROKE} className="sell-row-value">{money(payout(item.value))}</T>
      <Btn className="sell-row-btn" style={{ '--bg': '#2fa83a' }} onClick={click(() => sellItem(item.name))}>
        <T size={46} w={5}>Sell</T>
      </Btn>
    </div>
  )
}

export default function SellMenu() {
  const open = useGameStore((s) => s.sellMenu)
  const hatching = useGameStore((s) => s.hatch !== null)
  const bag = usePlayerData((s) => s.bag)
  if (!open || hatching) return null

  const total = payout(bagValue(bag))
  return (
    <div className="sell-menu" onPointerDown={stop} onWheel={stop}>
      <div className="sell-title">
        <span className="sell-title-icon"><CashIcon size={124} /></span>
        <T size={62} w={6}>Sell Treasure</T>
      </div>
      <button type="button" className="egg-close" aria-label="Close" onPointerDown={stop} onClick={click(closeSellMenu)} />

      <div className="sell-total">
        <T size={74} w={6} fill={CASH_FILL} stroke={CASH_STROKE} className="sell-total-amount">{money(total)}</T>
        <Btn className="sell-all" style={{ '--bg': '#2fa83a' }} onClick={click(sellAll)}>
          <T size={44} w={5}>Sell All</T>
        </Btn>
      </div>

      <div className="sell-list">
        {bag.length === 0 && <T size={40} w={5} fill={grad('#d8dcf0', '#aab0cc')} className="sell-empty">Your bag is empty. Chop some trees!</T>}
        {groupBag(bag).map((item) => <Row key={item.name} item={item} />)}
      </div>
    </div>
  )
}
