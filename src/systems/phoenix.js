// Blazing Phoenix pad (world/SouthArea.jsx PhoenixDisplay): hold E next to it to
// buy the pet for cash (data/eggs.js EGG_SHOP.phoenix, 1 Trillion). It goes
// through systems/hatch.js tryHatch, so payment, the reveal animation, equip,
// the Index entry and the server-wide announcement all work like an egg hatch.
// One per player: once owned the prompt goes away.
import { PHOENIX_DISPLAY } from '../world/layout.js'
import { EGG_SHOP } from '../data/eggs.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from './playerState.js'
import { addSystem } from './loop.js'
import { clearInteractTarget, setInteractTarget } from './interact.js'
import { tryHatch } from './hatch.js'
import { formatNumber } from '../utils/format.js'

const KEY = 'phoenix:pad'
const RANGE = 3.5
const KIND = 'phoenix'

const owned = (s) => s.pets.some((p) => p.egg === KIND)

function buy() {
  // false = blocked (tryHatch already showed why), so no success pop.
  return tryHatch(KIND, 1)
}

function step() {
  const d = Math.hypot(player.position.x - PHOENIX_DISPLAY.x, player.position.z - PHOENIX_DISPLAY.z)
  if (d < RANGE && !owned(usePlayerData.getState())) {
    setInteractTarget(KEY, `Buy ${EGG_SHOP[KIND].name} ($${formatNumber(EGG_SHOP[KIND].cost)})`, buy)
  } else clearInteractTarget(KEY)
}

export function install() {
  return addSystem(step)
}
