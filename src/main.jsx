import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { install as installInput } from './systems/input.js'
import { install as installAudio } from './systems/audio.js'
import { install as installInteract } from './systems/interact.js'
import { install as installEggs } from './systems/eggs.js'
import { install as installChop } from './systems/chop.js'
import { install as installSell } from './systems/sell.js'
import { install as installChoppers } from './systems/choppers.js'
import { install as installAuras } from './systems/auras.js'
import { install as installUpgrades } from './systems/upgrades.js'
import { install as installArtifacts } from './systems/artifacts.js'
import { install as installLoot } from './systems/loot.js'
import { install as installForge } from './systems/forge.js'
import { usePlayerData, resetSave } from './store/usePlayerData.js'
import { player, resetPlayer } from './systems/playerState.js'
import { setView, syncYawToPlayer } from './systems/cameraOrbit.js'
import { SPAWN, SPAWN_FACING } from './data/config.js'
import { startNet } from './systems/net.js'
import { remotes } from './systems/remotePlayers.js'
import { useGameStore } from './store/useGameStore.js'
import { FONT_FAMILY } from './utils/labels.js'
import { init as initBloxity } from './systems/bloxity.js'

initBloxity()
resetPlayer(SPAWN, SPAWN_FACING)
syncYawToPlayer()
installInput()
installAudio() // unlocks the AudioContext on the first gesture
installInteract() // hold-E gate, stepped each frame
installEggs() // egg platform E prompt -> hatch window
installChop() // click next to a tree for wood
installAuras() // Auras stall E prompt -> aura window
installSell() // Sell Treasure stall E prompt -> sell window
installChoppers() // Choppers stall E prompt -> choppers window
installUpgrades() // Upgrades stall E prompt -> upgrades window
installArtifacts() // Craft Artifacts bench E prompt -> artifacts window
installForge() // Forge lava pool E prompt -> fuse window
installLoot() // x1 Luck loot trees -> E to collect into the Bag
startNet() // Colyseus: remote players

// Dev-only console hook, e.g. __game.teleport(0, 0, -5)
if (import.meta.env.DEV) {
  window.__game = {
    player,
    remotes,
    store: useGameStore,
    setView,
    teleport: (x, y, z, facing = player.facing) => resetPlayer({ x, y, z }, facing),
    // __game.give('wood', 25000) / __game.give('robux', 200)
    give: (currency, n) => usePlayerData.setState((s) => ({ [currency]: (s[currency] ?? 0) + n })),
    playerData: usePlayerData,
    resetSave,
  }
}

// World signs and nameplates are painted to canvases once, so the UI font must
// be loaded first or they bake in the fallback. Don't hold the game hostage to it.
const fontReady = Promise.race([
  document.fonts?.load(`700 64px ${FONT_FAMILY}`),
  new Promise((resolve) => setTimeout(resolve, 2500)),
]).catch(() => {})

fontReady.then(() => {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
