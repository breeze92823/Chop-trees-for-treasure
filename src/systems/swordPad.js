// Dragon's Fang pad (world/SouthArea.jsx SwordDisplay): hold E next to it to buy the
// featured chopper for cash (data/choppers.js DRAGONS_FANG_PRICE). Goes through
// systems/choppers.js buyChopper, so payment, equip and the not-enough-cash popup match
// the Choppers window. Once owned the prompt goes away.
import { SWORD_DISPLAY } from '../world/layout.js'
import { DRAGONS_FANG_PRICE } from '../data/choppers.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from './playerState.js'
import { addSystem } from './loop.js'
import { clearInteractTarget, setInteractTarget } from './interact.js'
import { buyChopper } from './choppers.js'
import { formatNumber } from '../utils/format.js'

const KEY = 'sword:pad'
const RANGE = 3.5
const ID = 'dragonsfang'

const buy = () => buyChopper(ID, 'cash')

function step() {
  const d = Math.hypot(player.position.x - SWORD_DISPLAY.x, player.position.z - SWORD_DISPLAY.z)
  if (d < RANGE && !usePlayerData.getState().choppers.includes(ID)) {
    setInteractTarget(KEY, `Buy Dragon's Fang ($${formatNumber(DRAGONS_FANG_PRICE)})`, buy)
  } else clearInteractTarget(KEY)
}

export function install() {
  return addSystem(step)
}
