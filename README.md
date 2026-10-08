# Three.js game base (Bloxity + synced characters)

A theme-neutral starting point: ground, lighting, physics, materials, camera, Bloxity (Legion) integration and live character sync. It is extracted from Lift-rock-for-treasure with every game rule removed. Reskin it by editing [src/data/config.js](src/data/config.js) and drawing your world in [src/components/World.jsx](src/components/World.jsx), which is bare ground.

```
npm install
npm run dev          # http://localhost:5173  (single-player if no server is running)
# in ../Chop-trees-for-treasure-backend:  npm install && npm start   -> ws://localhost:2567
```

Open two tabs with the server running and you will see each other.

## What each piece is

| Concern | Where | Theme knobs |
|---|---|---|
| Game Hub map | [components/World.jsx](src/components/World.jsx) composes [src/world/](src/world/); every position is in [world/layout.js](src/world/layout.js) | `BASIN`, `PLAZA`, `STALLS`, `STRENGTH_TREES`, `FOREST`, `LEADER`, `COLORS` |
| Lighting + sky + fog | [components/Lighting.jsx](src/components/Lighting.jsx), [Sky.jsx](src/components/Sky.jsx), [App.jsx](src/App.jsx) | `LIGHT`, `FOG`, `COLORS.horizon`, `skyTexture()` in [utils/textures.js](src/utils/textures.js) |
| Physics | [systems/playerMovement.js](src/systems/playerMovement.js), [systems/terrainHeight.js](src/systems/terrainHeight.js) | `PHYSICS`, `PLAYER_DIMS` |
| Materials / textures | [materials/world.js](src/materials/world.js) (`MAT`, `surface()`, `plastic()`), [materials/tile.js](src/materials/tile.js) world-space shader | add entries to `MAT` |
| Camera | [systems/cameraOrbit.js](src/systems/cameraOrbit.js) (+ `cameraCollision`, `cameraShake`) | `CAMERA`; `addTrauma()` / `addKick()` for shake |
| Bloxity SDK | [systems/bloxity.js](src/systems/bloxity.js), [data/bloxity.js](src/data/bloxity.js) | `GAME_SLUG` in config |
| Character + sync | [Player.jsx](src/components/Player.jsx), [RemotePlayers.jsx](src/components/RemotePlayers.jsx), [systems/net.js](src/systems/net.js), [avatarAnim.js](src/systems/avatarAnim.js) | `registerPose()` |

## Physics

A kinematic capsule against axis-aligned boxes (no physics engine). Register solids next to the meshes that draw them:

```js
import { addBox } from './systems/terrainHeight.js'
const remove = addBox({ x: 5, z: -3, w: 2, d: 2, h: 1.4 })   // call remove() when the prop goes away
```

Ledges up to `PHYSICS.maxStep` are walked onto, taller ones need a jump (a normal jump clears about 1.9 m), and anything taller blocks. Plug per-frame game logic in with `addSystem((dt, { camera }) => ...)` from [systems/loop.js](src/systems/loop.js).

## Bloxity integration

All SDK access goes through [systems/bloxity.js](src/systems/bloxity.js), which never throws: if `sdk.bloxity.io` is blocked, or `VITE_DEV_MODE=true`, the game runs on the bundled rig as a guest.

- **Auth**: signed-in user or Bloxity's generated guest identity; the nameplate and server identity use it.
- **Avatar**: the bundled `public/avatars/player.glb` rig is dressed with the player's skin, body parts, hat and back item from the Bloxity CDN, and the customizer's body proportions are applied live ([systems/avatarLoader.js](src/systems/avatarLoader.js)). Changes in the customizer re-dress the character without a reload.
- **Portal settings**: master/music volume, graphics quality, camera sensitivity, FPS, fullscreen are wired ([data/bloxity.js](src/data/bloxity.js) `SETTINGS`).
- **Lifecycle**: loading steps, `loadingEnd` / `gameplayStart` after the first frame, `respawn_request`, `Esc` opens the portal menu, room/party ids for invites ([systems/session.js](src/systems/session.js)).

## Character syncing

1. The local `player` singleton is streamed at `NET.sendHz` (x, y, z, yaw, speed01, grounded, `pose`). Unchanged poses cost nothing.
2. The Bloxity avatar (`{ equipped, proportions }` JSON) is sent on join and whenever the customizer changes it.
3. The server relays both untouched (and bounds-checks / length-caps them).
4. Each remote player is the same character + gait code as the local one, with exponential position smoothing, so they walk, jump, wear the same cosmetics and body shape, and show the same extra pose.

Extra animations: `registerPose('chop', (gait, dt, weight) => { ... })` in [systems/avatarAnim.js](src/systems/avatarAnim.js), then set `player.pose = 'chop'`. It is blended in locally and on every other client. `cheer` and `swing` are built in.

To sync another field (a held item, a team): add it to `PlayerState` in the server's `WorldState.ts`, accept it in `WorldRoom.ts`, send it from `sendPose()` in [net.js](src/systems/net.js), read it in `RemotePlayers.jsx`.

## Progress and leaderboards

For a signed-in Bloxity account, [net.js](src/systems/net.js) loads the saved `usePlayerData` from the server on join (`progress`; a new account answers `noProgress` and its fresh starting state is pushed instead), then saves it back debounced (`saveProgress`). With a server URL configured, progress is never read from or written to localStorage (it starts fresh until the server answers); only a build with no server URL keeps using localStorage. The server's `leaderboard` message fills [useLeaderboardStore.js](src/store/useLeaderboardStore.js), which the boards in [Leaderboards.jsx](src/world/Leaderboards.jsx) draw. On join the server may also offer offline earnings for time spent away; [OfflineWindow.jsx](src/components/OfflineWindow.jsx) shows them and Claim pays them out. The backend repo (`../Chop-trees-for-treasure-backend`) deploys through its own GitHub workflow.

## Not included on purpose

On-screen touch controls. The input layer already exposes `setTouchMove`, `addTouchLook`, `pressTouchJump` for a touch UI.

## Dev notes

- `window.__game` (dev only) exposes `player`, `remotes`, `teleport()` and `setView()`.
- Colyseus drops any client message over 4 KB, so the server caps the avatar JSON at 3000 chars.
