import Ground from '../world/Ground.jsx'
import Cliffs from '../world/Cliffs.jsx'
import Stall from '../world/Stall.jsx'
import TrainingArea from '../world/TrainingArea.jsx'
import Forest from '../world/Forest.jsx'
import Loot from '../world/Loot.jsx'
import Leaderboards from '../world/Leaderboards.jsx'
import SouthArea, { SwordDisplay } from '../world/SouthArea.jsx'
import { Portal, Scatter } from '../world/Landmarks.jsx'
import { STALLS, SWORD_DISPLAY } from '../world/layout.js'

// The Game Hub, rebuilt from the reference screenshots. Every position lives
// in world/layout.js; each area is its own component and registers its own
// colliders next to the meshes that draw them.
export default function World() {
  return (
    <group>
      <Ground />
      <Cliffs />
      <Forest />
      <Loot />
      <TrainingArea />
      <Leaderboards />
      <SouthArea />
      {STALLS.map((s) => <Stall key={s.id} {...s} />)}
      <SwordDisplay {...SWORD_DISPLAY} />
      <Portal />
      <Scatter />
    </group>
  )
}
