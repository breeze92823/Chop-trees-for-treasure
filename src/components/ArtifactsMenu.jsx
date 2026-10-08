import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { RARITY_ROW_BG } from '../data/loot.js'
import ArtifactPreview from './ArtifactPreview.jsx'
import { ARTIFACTS, STAT } from '../data/artifacts.js'
import ArtifactCraft from './ArtifactCraft.jsx'
import { artifactInfo } from '../data/artifacts.js'
import { closeArtifactsMenu, craftArtifact, equipArtifact, openCraftPage } from '../systems/artifacts.js'
import { playButtonClick } from '../systems/sfx.js'
import { RAINBOW, grad, T, Icon, stop, Btn } from './hudParts.jsx'

// Artifacts window, opened by hold-E at the Craft Artifacts bench (systems/artifacts.js):
// one row per artifact from data/artifacts.js — name, rarity, coloured stat lines — with
// Equipped / Equip for owned ones, otherwise Craft above its Robux price. Same frame as
// the Choppers / Upgrades windows; layout in reference pixels (gameHud.css).

const click = (fn) => () => {
  playButtonClick()
  fn()
}

const RARITY_FILL = {
  Common: [grad('#f4f4fa', '#c9c9d6'), '#15151a'],
  Uncommon: [grad('#5dff4a', '#1fa82a'), '#0c3a10'],
  Rare: [grad('#6ac0ff', '#1f78e0'), '#0a2a5a'],
  Epic: [grad('#e07aff', '#a030e0'), '#3a0a5a'],
  Legendary: [grad('#ffc040', '#ff8a10'), '#4a2a00'],
  Mythic: [RAINBOW, '#15151a'],
  Secret: [grad('#3a3a42', '#000000'), '#d8d8e0'],
}

const ROW_BG = {
  ...RARITY_ROW_BG,
  Mythic: 'linear-gradient(90deg, #ff3a5a, #ff9a2a 16%, #ffe03a 32%, #4adf5a 48%, #3ab8ff 66%, #8a5cf0 82%, #ff3adf)',
  Secret: 'linear-gradient(90deg, #1e1e22, #7a7a80 22%, #f4f4f6 46%, #2a2a2e 68%, #d8d8dc 88%, #3a3a3e)',
}

// Blue feathered wings beside the window title.
function Wings() {
  const wing = (flip) => (
    <g transform={flip ? 'translate(120 0) scale(-1 1)' : undefined}>
      <path d="M58 52 C44 20 14 12 2 18 C14 24 18 34 14 42 C24 40 30 46 28 54 C38 52 44 58 42 66 C50 64 56 62 58 52 Z" fill="#4ab8ff" stroke="#15151a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M52 50 C42 30 24 24 12 26" fill="none" stroke="#bfe8ff" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
  return (
    <svg viewBox="0 0 120 80" width="124" height="83">
      {wing(false)}
      {wing(true)}
    </svg>
  )
}

function Buttons({ a, owned, equipped, robux }) {
  if (owned) {
    return (
      <Btn className="artifact-btn big" style={{ '--bg': equipped ? '#7a8094' : '#2fa83a' }} onClick={click(() => equipArtifact(a.id))}>
        <T size={44} w={5}>{equipped ? 'Equipped' : 'Equip'}</T>
      </Btn>
    )
  }
  return (
    <>
      <Btn className="artifact-btn" style={{ '--bg': '#2fa83a' }} onClick={click(() => openCraftPage(a.id))}>
        <T size={36} w={5}>Craft</T>
      </Btn>
      <Btn className="artifact-btn" style={{ '--bg': robux >= a.gems ? '#ffb21f' : '#a08a5a' }} onClick={click(() => craftArtifact(a.id))}>
        <span className="artifact-gem">
          <Icon name="robux" size={34} />
          <T size={34} w={4}>{a.gems}</T>
        </span>
      </Btn>
    </>
  )
}

function Row({ a, index, owned, equipped, robux }) {
  const [fill, stroke] = RARITY_FILL[a.rarity]
  return (
    <div className="artifact-row" style={{ '--bgfill': ROW_BG[a.rarity] }}>
      <span className="artifact-icon"><ArtifactPreview id={a.id} offset={index * 0.9} /></span>
      <T size={a.name.length > 15 ? 46 : 52} w={5} className="artifact-name">{a.name}</T>
      <T size={30} w={4} fill={fill} stroke={stroke} className="artifact-rarity">{a.rarity}</T>
      <div className="artifact-stats" style={{ gridTemplateRows: `repeat(${a.stats.length > 4 ? 3 : 2}, auto)` }}>
        {a.stats.map(([kind, n]) => {
          const st = STAT[kind]
          const text = st.text(n)
          const size = a.stats.length > 4 ? 20 : 22
          return <T key={kind} size={size} w={4} fill={grad(...st.fill)} stroke={st.stroke} className="artifact-stat">{text}</T>
        })}
      </div>
      <div className="artifact-btns">
        <Buttons a={a} owned={owned} equipped={equipped} robux={robux} />
      </div>
    </div>
  )
}

export default function ArtifactsMenu() {
  const open = useGameStore((s) => s.artifactsMenu)
  const hatching = useGameStore((s) => s.hatch !== null)
  const owned = usePlayerData((s) => s.artifacts)
  const equipped = usePlayerData((s) => s.artifact)
  const robux = usePlayerData((s) => s.robux)
  const craftId = useGameStore((s) => s.artifactCraft)
  if (!open || hatching) return null
  const craftArt = craftId && artifactInfo(craftId)

  return (
    <div className="sell-menu artifacts-menu" onPointerDown={stop} onWheel={stop}>
      <div className="sell-title artifacts-title">
        <span className="artifact-title-icon"><Wings /></span>
        <T size={62} w={6}>Artifacts</T>
      </div>
      <button type="button" className="egg-close" aria-label="Close" onPointerDown={stop} onClick={click(closeArtifactsMenu)} />
      {craftArt ? (
        <ArtifactCraft a={craftArt} fill={RARITY_FILL[craftArt.rarity][0]} stroke={RARITY_FILL[craftArt.rarity][1]} />
      ) : (
      <div className="chopper-list">
        {ARTIFACTS.map((a, i) => <Row key={a.id} a={a} index={i} owned={owned.includes(a.id)} equipped={equipped === a.id} robux={robux} />)}
      </div>
      )}
    </div>
  )
}
