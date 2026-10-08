// Egg platform: standing next to an egg with a shop entry (data/eggs.js)
// offers "Open <name>" on the hold-E prompt; confirming opens its hatch
// window (components/EggMenu.jsx) via useGameStore's eggMenu. The prompt is
// withheld while a window is open, and walking out of range closes it.
import { EGGS } from '../world/layout.js'
import { EGG_RANGE, EGG_SHOP } from '../data/eggs.js'
import { useGameStore } from '../store/useGameStore.js'
import { player } from './playerState.js'
import { addSystem } from './loop.js'
import { clearInteractTarget, setInteractTarget } from './interact.js'

const eggs = EGGS.list.filter((e) => EGG_SHOP[e.kind])
let promptKey = null

export function openEggMenu(kind) {
  useGameStore.setState({ eggMenu: kind, petsMenu: false, forgeMenu: false })
}

export function closeEggMenu() {
  useGameStore.setState({ eggMenu: null, autoHatch: false })
}

function distanceTo(egg) {
  return Math.hypot(player.position.x - egg.x, player.position.z - egg.z)
}

function setPrompt(egg) {
  const key = egg ? `egg:${egg.kind}` : null
  if (promptKey && promptKey !== key) clearInteractTarget(promptKey)
  promptKey = key
  if (egg) setInteractTarget(key, `Open ${EGG_SHOP[egg.kind].name}`, () => openEggMenu(egg.kind))
}

function step() {
  const open = useGameStore.getState().eggMenu
  if (open) {
    setPrompt(null)
    const egg = eggs.find((e) => e.kind === open)
    if (!egg || distanceTo(egg) > EGG_RANGE.close) closeEggMenu()
    return
  }
  let nearest = null
  let best = EGG_RANGE.open
  for (const egg of eggs) {
    const d = distanceTo(egg)
    if (d < best) {
      best = d
      nearest = egg
    }
  }
  setPrompt(nearest)
}

export function install() {
  return addSystem(step)
}
