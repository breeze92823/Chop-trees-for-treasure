// Craft Artifacts bench: hold E next to it to open the window (components/ArtifactsMenu.jsx,
// useGameStore artifactsMenu); walking away closes it. Craft an artifact with Robux
// (data/artifacts.js), then equip it — one at a time. The equipped artifact's bonuses
// feed Strength (strengthGain.js), cash (sell.js), Bag slots, swing and run speed (upgrades.js).
import { CRAFT } from '../world/layout.js'
import { ARTIFACT } from '../data/economy.js'
import { artifactInfo, recipeNeeds } from '../data/artifacts.js'
import { rewardInfo } from '../data/rewards.js'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from './playerState.js'
import { addSystem } from './loop.js'
import { clearInteractTarget, setInteractTarget } from './interact.js'
import { showActionResult } from './actionResult.js'

const KEY = 'artifacts:bench'

// Equipped artifact's bonus for a stat kind: percent kinds as a fraction (0.15), backpack as slots.
// Also adds the Pathfinder Wings (Quests window Rewards, data/rewards.js) once owned.
export function artifactBonus(kind, state = usePlayerData.getState()) {
  const unit = (stat) => (stat ? (kind === 'backpack' ? stat[1] : stat[1] / 100) : 0)
  const own = unit(artifactInfo(state.artifact)?.stats.find(([k]) => k === kind))
  const wings = state.rewards?.includes('wings') ? unit(rewardInfo('wings').stats.find(([k]) => k === kind)) : 0
  return own + wings
}

export function openArtifactsMenu() {
  useGameStore.setState({ artifactsMenu: true, artifactCraft: null, upgradesMenu: false, choppersMenu: false, sellMenu: false, aurasMenu: false, autoSpin: false, petsMenu: false, indexMenu: false, rebirthMenu: false, questsMenu: false, eggMenu: null, autoHatch: false, forgeMenu: false })
}

export function closeArtifactsMenu() {
  useGameStore.setState({ artifactsMenu: false, artifactCraft: null })
}

export function craftArtifact(id) {
  const s = usePlayerData.getState()
  const a = artifactInfo(id)
  if (!a || s.artifacts.includes(id)) return
  if (s.robux < a.gems) {
    showActionResult(`Not enough Robux! Need ${a.gems}`, false)
    return
  }
  usePlayerData.setState({ robux: s.robux - a.gems, artifacts: [...s.artifacts, id], artifact: id })
  showActionResult(`Crafted ${a.name}!`, true)
}

export const openCraftPage = (id) => useGameStore.setState({ artifactCraft: id })
export const closeCraftPage = () => useGameStore.setState({ artifactCraft: null })

// How many of each ingredient the Bag holds: [{ name, need, have }].
export const ingredientStatus = (a, state = usePlayerData.getState()) =>
  recipeNeeds(a).map(({ name, need }) => ({ name, need, have: state.bag.filter((it) => it.name === name).length }))

export const canCraftWithIngredients = (a, state = usePlayerData.getState()) =>
  !state.artifacts.includes(a.id) && state.wood >= a.recipe.wood && ingredientStatus(a, state).every((i) => i.have >= i.need)

// Craft from the Bag: consumes the ingredients and the wood, then equips it.
export function craftWithIngredients(id) {
  const s = usePlayerData.getState()
  const a = artifactInfo(id)
  if (!a?.recipe || s.artifacts.includes(id)) return
  if (!canCraftWithIngredients(a, s)) {
    showActionResult(s.wood < a.recipe.wood ? 'Not enough wood!' : 'Missing ingredients in your Bag!', false)
    return
  }
  const left = new Map(recipeNeeds(a).map((i) => [i.name, i.need]))
  const bag = s.bag.filter((it) => {
    const n = left.get(it.name)
    if (!n) return true
    left.set(it.name, n - 1)
    return false
  })
  usePlayerData.setState({ wood: s.wood - a.recipe.wood, bag, artifacts: [...s.artifacts, id], artifact: id })
  closeCraftPage()
  showActionResult(`Crafted ${a.name}!`, true)
}

export function equipArtifact(id) {
  const s = usePlayerData.getState()
  if (!s.artifacts.includes(id) || s.artifact === id) return
  usePlayerData.setState({ artifact: id })
}

function step() {
  const d = Math.hypot(player.position.x - CRAFT.x, player.position.z - CRAFT.z)
  if (useGameStore.getState().artifactsMenu) {
    clearInteractTarget(KEY)
    if (d > ARTIFACT.close) closeArtifactsMenu()
    return
  }
  if (d < ARTIFACT.open) setInteractTarget(KEY, 'Craft Artifacts', openArtifactsMenu)
  else clearInteractTarget(KEY)
}

export function install() {
  return addSystem(step)
}
