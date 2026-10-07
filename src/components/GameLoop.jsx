import { useFrame, useThree } from '@react-three/fiber'
import { step as stepPlayer } from '../systems/playerMovement.js'
import { update as updateCamera } from '../systems/cameraOrbit.js'
import { runSystems } from '../systems/loop.js'

// The single simulation tick. Rendered before the view components so its
// useFrame subscribes first and runs first each frame.
export default function GameLoop() {
  const camera = useThree((s) => s.camera)

  useFrame((_state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1) // clamp huge frames (tab switch, breakpoint)
    stepPlayer(dt)
    runSystems(dt, { camera }) // theme systems see this frame's player position...
    updateCamera(camera, dt) // ...and the camera follows the final position
  })

  return null
}
