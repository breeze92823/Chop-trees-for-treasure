import { Suspense, useCallback, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PCFSoftShadowMap, SRGBColorSpace } from 'three'
import { notifyFirstFrame } from './systems/bloxity.js'
import { settings } from './systems/settingsState.js'
import { useSettings } from './systems/bloxityHooks.js'
import { CAMERA, COLORS, FOG } from './data/config.js'
import { graphicsPreset, IS_MOBILE } from './utils/graphics.js'
import GameLoop from './components/GameLoop.jsx'
import World from './components/World.jsx'
import Sky from './components/Sky.jsx'
import Lighting from './components/Lighting.jsx'
import Player from './components/Player.jsx'
import GuideArrows from './components/GuideArrows.jsx'
import LevelUpBeam from './components/LevelUpBeam.jsx'
import RemotePlayers from './components/RemotePlayers.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import Hud from './components/Hud.jsx'
import GameHud from './components/GameHud.jsx'
import InteractPrompt from './components/InteractPrompt.jsx'
import MobileShadowCull from './components/MobileShadowCull.jsx'
import TouchControls from './components/TouchControls.jsx'

// Rendered last inside the Suspense boundary, so it only mounts once every
// suspending resource in the scene has resolved — the right moment to tell the
// SDK loading is done and gameplay has started.
function LoadingGate({ onReady }) {
  useEffect(() => {
    notifyFirstFrame()
    onReady()
  }, [onReady])
  return null
}

export default function App() {
  useSettings()
  const [sceneReady, setSceneReady] = useState(false)
  const onSceneReady = useCallback(() => setSceneReady(true), [])
  const preset = graphicsPreset(settings.graphics_quality)

  return (
    <>
      <Canvas
        shadows={preset.shadows && { type: PCFSoftShadowMap }}
        dpr={preset.dpr}
        gl={{ antialias: preset.antialias, powerPreference: 'high-performance', outputColorSpace: SRGBColorSpace }}
        camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: [0, 12, 24] }}
      >
        <color attach="background" args={[COLORS.horizon]} />
        <fog attach="fog" args={[COLORS.horizon, FOG.near, FOG.far]} />
        <Sky />
        <Lighting shadowMapSize={preset.shadowMap} />

        <GameLoop />
        <Suspense fallback={null}>
          <World />
          {IS_MOBILE && preset.shadows && <MobileShadowCull />}
          <LoadingGate onReady={onSceneReady} />
        </Suspense>
        <Player />
        <GuideArrows />
        <LevelUpBeam />
        <RemotePlayers />
      </Canvas>
      <GameHud />
      <Hud />
      <InteractPrompt />
      <TouchControls />
      <LoadingScreen sceneReady={sceneReady} />
    </>
  )
}
