# Landmarks

Every named place, prop and HUD element in the Game Hub, so a change can be asked for by name ("move **Fountain** 3 m east", "recolour **Upgrades Stall**", "add a row to **Stats Panel**").

- Positions, sizes, prices and colours: [src/world/layout.js](src/world/layout.js) (the **Layout key** column). Change a number there and the mesh and its collider move together.
- Shapes and details: the **Component** column.
- Coordinates are in metres. +X is east, −Z is north (toward the forest), +Y is up. The plaza centre is (0, 0). Spawn is (0, 6), facing north.

## Map

```
                              N (−Z)
        ┌──────────────────────────────────────────────────────────┐
        │  x2 … x66 Luck Zones   (z −66.6 … −819, 20 zones in all)     │
        │  x1 Luck Zone          (z −27 … −66.6)                    │
        │                                                           │
        │  Sword Display              WORLDS Portal                 │
  Train │  Choppers Stall ▣     Plaza      ▣ Sell Treasure Stall    │ Leaderboards
  Str.  │═════════════════════  (spawn)  ═══════════════════════════│ Hall
  Area  │  Auras Stall ▣                   ▣ Upgrades Stall         │
        │  Forge   Egg Platform  Phoenix Display  Craft Bench  Fountain
        └──────────────────────────────────────────────────────────┘
   W (−X)                     S (+Z)                          E (+X)
        all of it ringed by the Cliff Terraces
```

## Ground and surroundings

| Name | Where | Layout key | Component | Notes |
|---|---|---|---|---|
| **Plaza** | x −20 … 33, z −22 … 15 | `PLAZA` | [Ground.jsx](src/world/Ground.jsx) | Grey two-tone checker with studs, top 0.1 m. Reads as a plus because of the lawns on its corners. |
| **NW Lawn** | x −20 … −9, z −22 … −4.5 | `LAWNS[0]` | Ground.jsx | Holds the Choppers Stall and Sword Display. |
| **NE Lawn** | x 9 … 31, z −22 … −4.5 | `LAWNS[1]` | Ground.jsx | Holds the Sell Treasure Stall and WORLDS Portal. |
| **SW Lawn** | x −20 … −9, z 4.5 … 27.5 | `LAWNS[2]` | Ground.jsx | Holds the Auras Stall and Forge. |
| **SE Lawn** | x 9 … 31, z 4.5 … 27.5 | `LAWNS[3]` | Ground.jsx | Holds the Upgrades Stall, Craft Bench and Fountain. |
| **South Lawn** | x −20 … 31, z 15 … 27.5 | `LAWNS[4]` | Ground.jsx | Holds the Egg Platform and Phoenix Display. It overlaps the SW/SE lawns so there's no seam. |
| **Lawn Curbs** | rim of every lawn | `CURB` (0.7 m) | Ground.jsx | The dark grey border around each lawn. |
| **N–S Path** | x −9 … 9 | gap between lawns | Ground.jsx | The wide grey arm from spawn to the forest. |
| **E–W Path** | z −4.5 … 4.5 | gap between lawns | Ground.jsx | The narrow grey arm from Train Strength to the Leaderboards. |
| **Cliff Terraces** | just outside `BASIN` | `BASIN`, `CLIFF` | [Cliffs.jsx](src/world/Cliffs.jsx) | Three tiers, 3.5 m high and 6 m deep, with brown checker faces and grass tops. |
| **Cliff Trees** / **Cliff Rocks** | on each terrace top | (seeded random) | Cliffs.jsx | Low-poly round trees and grey boulders, instanced. |

## Market stalls

All four share [Stall.jsx](src/world/Stall.jsx). Each stall is 6 m along its counter and 4.4 m deep, with a 9-stripe puffy awning, a name plate, a yellow/blue badge, two lanterns and a floating name label. Each one is configured by its entry in `STALLS`.

| Name | `id` | Position | Faces | Colours |
|---|---|---|---|---|
| **Choppers Stall** | `choppers` | (−14.5, −9.5) | east | Blue base, blue/white awning |
| **Sell Treasure Stall** | `sell` | (14.5, −9.5) | west | Brown base, green/white awning |
| **Auras Stall** | `auras` | (−14.5, 9.5) | east | Dark brown base, brown/cream awning with a soft glow (`glowy`) |
| **Upgrades Stall** | `upgrades` | (14.5, 9.5) | west | Pink base, pink/white awning |

## Train Strength Area (west)

Component: [TrainingArea.jsx](src/world/TrainingArea.jsx). Layout keys: `TRAIN`, `STRENGTH_TREES`.

| Name | Where | Notes |
|---|---|---|
| **Train Tier 1** | x −28.5 … −20, top 0.6 m | Front orange terrace. |
| **Train Tier 2** | x −34.5 … −26.5, top 1.2 m | Back orange terrace. |
| **Train Aisle** | z −3.2 … 3.2 | Grey stair strip up the middle (`TRAIN.aisle`). |
| **Train Back Wall** | x −35.1 … −34.5 | Orange checker wall, 7 m tall. |
| **Train Strength Arch** | x −33.1, posts at z ±11 | Two posts and the "💪 Train Strength!" banner (`TRAIN.arch`). |
| **Train Lamps** | at the aisle edges on Tier 1 | Two lamp posts. |

### Strength Trees

Each one sits on a coloured **pad** and has a floating price + multiplier label. `kind` picks the leaf palette (`KINDS` in TrainingArea.jsx).

| Name | Row | Position | Price | Gives | Pad | `kind` |
|---|---|---|---|---|---|---|
| **Free Tree** | front | (−24, −12.5) | FREE (rebirth) | x1.5 | green | `green` |
| **Blue Tree** | front | (−24, −6.5) | 2 rebirths | x2 | blue | `blue` |
| **Autumn Tree** | front, centre | (−24, 0) | 11 rebirths | x8 | red | `autumn` |
| **Lilac Tree** | front | (−24, 6.5) | 5 rebirths | x4 | lilac | `lilac` |
| **Palm Tree** | front | (−24, 12.5) | 8 rebirths | x6 | green | `palm` |
| **Lava Tree** | back | (−30, −12.5) | 1399 coins | x1000 | red-orange | `lava` |
| **Ghost Tree** | back | (−30, −6.5) | 185 coins | x100 | black | `ghost` |
| **Ice Tree** | back, centre | (−30, 0) | 19 coins | x10 | cyan | `ice` |
| **Violet Tree** | back | (−30, 6.5) | 45 coins | x25 | purple | `violet` |
| **Jungle Tree** | back | (−30, 12.5) | 559 coins | x300 | green | `jungle` |

## Forest (north)

Component: [Forest.jsx](src/world/Forest.jsx). Layout key: `FOREST`.

| Name | Where | Notes |
|---|---|---|
| **x1 Luck Zone** | z −27 … −66.6 | Floating "🍀 x1 Luck" label at its front edge. |
| **x2 … x66 Luck Zones** | z −66.6 … −819, 39.6 m each | 20 zones in all, mult 1, 2, 3, 5, 7, 9, 12, 15, 18, 21, 25, 29, 33, 37, 41, 46, 51, 56, 61, 66 (step grows by 1 each time its run gets one longer; `luckMultipliers` in [layout.js](src/world/layout.js)). Each zone has its own canopy colour (`ZONE_COLORS`: green, lime, teal, cyan, blue, indigo, purple, magenta, pink, red, orange, yellow, gold, bronze, mint, ice, silver, slate, lavender, night) and floating label.
| **Forest Corridor** | x −15 … 15, z −24 … −148 | The forest is a narrow corridor leading north out of the hub (`CORRIDOR`), walled in by the Cliff Terraces. |
| **Forest Trees** | grid, x −15 … 15, 4.4 m spacing | Blocky trees: square trunk, 4 root blocks, 3 stacked studded leaf cubes. All instanced; each trunk is a collider (removed when the tree is felled). |
| **Tree Health Bars** | above a tree, y + 6.5·s, only while it is damaged and standing | One instanced billboard (`TreeBars` in [TreeFx.jsx](src/world/TreeFx.jsx)); fill + green→yellow→red colour per tree from `systems/treeHealth.js`. Hp is `TREE.hp` (10); each hit removes the player's Strength. |
| **Falling Trees** | at a felled tree | `FallingTrees` in TreeFx.jsx: pooled copy topples away from the player (`TREE.fallMs`) and fades out over `TREE.fadeMs` (3 s), then is gone. Collider is removed the moment it starts falling. |
| **Loot Trees (x1 Luck)** | 22 of the zone's 63 trees, one per even slice of the zone | `LOOT_PLAN` in [systems/loot.js](src/systems/loot.js): 3 Uncommon, 19 Common. Felling one drops a floating item ([world/Loot.jsx](src/world/Loot.jsx), models in [lootModels.jsx](src/world/lootModels.jsx), items in [data/loot.js](src/data/loot.js), ported from Lift-rock-for-treasure). Press E next to it (instant) to put it in the Bag (`BAG_MAX` 4, HUD 🎒 "0/4"). Regrown with the forest. Zones x2+ scale with luck (`LUCK_LOOT` in data/loot.js): more trees drop, up to 4 items per tree, higher rarity; x66 drops 4 Divine items from every tree. |

## Leaderboards Hall (east)

Component: [Leaderboards.jsx](src/world/Leaderboards.jsx). Layout key: `LEADER`.

| Name | Where | Notes |
|---|---|---|
| **Leaderboard Steps** | x 31 … 34 | Two blue-purple steps (0.4 m, 0.8 m). |
| **Leaderboard Platform** | x 34 … 52, z −18 … 18, top 1.2 m | Purple checker floor. |
| **Leaderboard Walls** | back at x ≈ 51, sides at z ±18 | Purple checker. |
| **Leaderboards Arch** | pillars at x ≈ 35.4, z ±15.6 | Tilted "🏆 Leaderboards" banner. |
| **Top Rebirths Board** | z −13 | `LEADER.boards[0]` |
| **Top Cash Board** | z −4.6 | `LEADER.boards[1]` |
| **Top Strength Board** | z 4.6 | `LEADER.boards[2]` |
| **Top Time Played Board** | z 13 | `LEADER.boards[3]` |
| **Leaderboard Statues** | z −8.8 (black), 0 (white), 8.8 (black) | #1-player figures on stone pedestals (`LEADER.statues`). |
| **Leaderboard Lamps** | front edge at z −8.8, 0, 8.8 | Three lamp posts. |
| **Leaderboard Sacks** | foot of the steps, z ≈ ±12 | Treasure sack piles. |

Board contents (rows, names, values, "Refreshes in") are painted by `leaderboardTexture` in [signs.js](src/world/signs.js).

## South side

Component: [SouthArea.jsx](src/world/SouthArea.jsx).

| Name | Position | Layout key | Notes |
|---|---|---|---|
| **Egg Platform** | centre (−1.5, 21), 9 × 5 m | `EGGS.platform` | Dark green slab with a black rim. |
| **Spotted Egg** | (0.8, 21) | `EGGS.list[0]` | White with rainbow spots; label "25K" with the log icon. |
| **Void Egg** | (−3.8, 21) | `EGGS.list[1]` | Black with glowing cyan cracks; label "11" with the Robux icon. |
| **Phoenix Display** | (5.5, 19) | `PHOENIX_DISPLAY` | Pink pad, flapping Blazing Phoenix, label "250% Stronger than Best Pet!". |
| **Craft Bench** | (11.5, 20), faces north | `CRAFT` | Workbench with saw, hammer, plank and pink artifact gem; **Craftsman** NPC behind it; "Craft Artifacts" label. |
| **Fountain** | (21, 18) | `FOUNTAIN` | Three-tier stone fountain with water. |
| **Forge** | (−16, 21.5) | `FORGE` | Stone furnace with glowing mouth, chimney, anvil, 3 barrels, tall lamp post; "Forge" label. |

## Other landmarks

Component: [Landmarks.jsx](src/world/Landmarks.jsx) unless noted.

| Name | Position | Layout key | Notes |
|---|---|---|---|
| **WORLDS Portal** | (27, −19.5) | `PORTAL` | Pink stepped base, glowing oval ring, spinning swirl, "WORLDS" label. It always turns to face the plaza centre (`PORTAL.face` is not used). |
| **Sword Display** | (−14.5, −16) | `SWORD_DISPLAY` | Pink pad with a floating crystal sword; label "750% Stronger than Best Chopper! / +17 Strength / 839". Built in SouthArea.jsx (`SwordDisplay`). |
| **Treasure Sacks** | mostly behind the Sell Treasure Stall | `SACKS` in Landmarks.jsx | `[x, z, rotation, scale]` |
| **Stumps** | around the stalls and training steps | `STUMPS` in Landmarks.jsx | `[x, z, scale]`; each is a small collider. |
| **Lamp posts** | plaza, north approach (x ±7.5, z −7/−15/−21) and spawn square (z 8/14) | `LAMPS` in Landmarks.jsx | Fill the bare plaza; colliders. |
| **Street lamps (evening)** | central path x ±3, stalls, egg area, plaza edges | `LAMPS` in world/Lamps.jsx, `LAMP` in data/config.js | Glowing lamps; nearest 6 cast real point light. Evening sky/fog/sun in `LIGHT`, `FOG`, `skyTexture`. |
| **Benches** | plaza, x ±5 at z −11/−18 and 11.5 | `BENCHES` in Landmarks.jsx | `[x, z, yaw]`; colliders. |
| **Bushes** | lawn edges and the empty NE/SE lawn space | `BUSHES` in Landmarks.jsx | `[x, z, scale]`; colliders. |
| **Flower beds** | scattered on the lawns | `FLOWERS` in Landmarks.jsx | `[x, z, count]`; decorative, no collider. |

## Shared building blocks

In [common.jsx](src/world/common.jsx): **Label** (floating sign), **Figure** (blocky character used for statues and the Craftsman), **Sack**, **Stump**, **LampPost**, **Instances** (instanced props), `useColliders`, `footprint`.

In [signs.js](src/world/signs.js): label text style, icons (`coin`, `rebirth`, `log`, `robux`, `clover`, `cash`, `trophy`, `arm`, `clock`), banners, stall plates, leaderboard panels, egg skins.

## HUD

Component: [GameHud.jsx](src/components/GameHud.jsx). Styles: [gameHud.css](src/styles/gameHud.css). Static, nothing is wired up. Sizes are in pixels of the 1920 × 991 screenshots and scale with the window.

| Name | Screen position | Function / class | Shows |
|---|---|---|---|
| **Level Bar** | top centre | `LevelBar` / `.level` | "LEVEL 3", 31.94/80, cyan fill |
| **Strength Packs** | under the Level Bar | `.pack` | +8.5K (orange), +800K (purple), +80M (red) |
| **Strength Counter** | under the packs | `.strength` | 💪 116.94 Strength |
| **Auto Clicker Button** | top right | `.autoclick` | "OP Auto Clicker" / OFF |
| **Free Gift** | top right | `.gift` | 🎁 FREE! |
| **Settings Gear** | top-right corner | `.gear` | Spinning blue gear |
| **x2 Cash Offer** | right side | `Offer` (top 300) | ONLY 59 / x2 CASH |
| **x2 Strength Offer** | right side | `Offer` (top 431) | ONLY 3 / x2 STRENGTH |
| **OP Pet Offer** | lower right | `OpPet` / `.op` | Haloed pet (6), 1000% dragon (559) |
| **Auto Chop Button** | left | `.autochop` | "Auto Collects" / AUTO CHOP |
| **Menu Grid** | left, under Auto Chop | `MENU` array / `.tile` | Shop, Rebirth (% to next rebirth badge; opens the Rebirth Window), Index, Invite, Pets, Quests |
| **Rebirth Window** | centre | [RebirthMenu.jsx](src/components/RebirthMenu.jsx) / `.rebirth-menu` | Strength / cash multiplier and level now → after, level progress bar, Rebirth + Skip (Robux), "resets Strength" warning. Logic in [rebirth.js](src/systems/rebirth.js), tunables `REBIRTH` in [economy.js](src/data/economy.js) |
| **Index Window** | centre | [IndexMenu.jsx](src/components/IndexMenu.jsx) / `.index-menu` | Treasure Index: every loot item by rarity, 4 per row; every item has a tile with its rarity; collected ones show a spinning 3D model (a small orthographic canvas over the grid) and name, the rest a red "?" only. The grid scrolls. "Each discovered treasure grants x1.025 strength" + Current Bonus ([treasureIndex.js](src/systems/treasureIndex.js), `INDEX` in [economy.js](src/data/economy.js)) |
| **Sell Treasure Window** | centre | [SellMenu.jsx](src/components/SellMenu.jsx) / `.sell-menu` | Opened by hold-E at the Sell Treasure stall ([sell.js](src/systems/sell.js)): bag total, Sell All, one row per item with Sell. Tunables `SELL` in [economy.js](src/data/economy.js) |
| **Choppers Window** | centre | [ChoppersMenu.jsx](src/components/ChoppersMenu.jsx) / `.choppers-menu` | Opened by hold-E at the Choppers stall ([choppers.js](src/systems/choppers.js)): 28 axes from [choppers.js](src/data/choppers.js) (icons in public/ui/choppers/) with name, rarity, +Strength per swing, Equip / Equipped / cash and gem prices. The equipped axe sets base Strength per swing and its 3D model ([axeModels.js](src/systems/axeModels.js)) replaces the held axe |
| **Auras Window** | centre | [AurasMenu.jsx](src/components/AurasMenu.jsx) / `.auras-menu` | Opened by hold-E at the Auras stall ([auras.js](src/systems/auras.js)): equipped aura, Auto Spin / Spin ($100K) / Lucky Roll, Mythic and Secret pity. Aura odds in [auras.js](src/data/auras.js), tunables `AURA` in [economy.js](src/data/economy.js) |
| **Stats Panel** | bottom left | `Stats` / `.stat` | Wood 460, Backpack 0/3, Rebirths (live), Cash (live) |
| **Status Line** | bottom-right corner | [Hud.jsx](src/components/Hud.jsx) / `.hud` | Player name and online/offline status (from the base project) |
