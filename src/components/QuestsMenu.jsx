import { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { QUESTS, QUEST_GROUPS, QUEST_TABS } from '../data/quests.js'
import { playButtonClick } from '../systems/sfx.js'
import { formatNumber } from '../utils/format.js'
import { RAINBOW, T, stop, Btn, Emoji } from './hudParts.jsx'
import RewardsTab, { GoldBar } from './RewardsTab.jsx'

// Quests window (the HUD's Quests tile): Quests / Rewards tabs, gold + gem
// counters, a scrolling list of quests with progress bars, and the Rewards
// Gold shop (RewardsTab.jsx).
// Quest definitions in data/quests.js; progress is usePlayerData `quests` (systems/quests.js).

const close = () => {
  playButtonClick()
  useGameStore.setState({ questsMenu: false })
}

// Time left until the next reset of a group that resets every `hours` hours.
function useCountdown(hours) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const span = hours * 3600000
  const left = Math.ceil((span - (now % span)) / 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${Math.floor(left / 3600)}:${p(Math.floor(left / 60) % 60)}:${p(left % 60)}`
}

function Reset({ group }) {
  const left = useCountdown(group.resetHours)
  return <T size={34} w={4} className="quest-reset">{`${group.label} reset in ${left}`}</T>
}

// "Collect *Mythic* Treasures" -> plain pieces plus rainbow words.
function Title({ text }) {
  return (
    <span className="quest-title">
      {text.split('*').map((part, i) => part && (
        <T key={i} size={text.includes('*') ? 30 : 34} w={4} fill={i % 2 ? RAINBOW : undefined}>{part}</T>
      ))}
    </span>
  )
}

const fmt = (q, n) => (q.unit === 'time' ? `${Math.floor(n / 60)}m` : formatNumber(n))

function Quest({ q, value }) {
  const done = Math.min(value, q.goal)
  return (
    <div className="quest-row">
      <Title text={q.title} />
      <div className="quest-bar">
        <div className="quest-bar-fill" style={{ width: `${(done / q.goal) * 100}%`, '--bar': q.bar }} />
        <T size={36} w={4}>{`${fmt(q, done)} / ${fmt(q, q.goal)}`}</T>
      </div>
      <div className="quest-reward">
        <GoldBar size={46} />
        <T size={56} w={5}>{q.reward}</T>
      </div>
    </div>
  )
}

export default function QuestsMenu() {
  const open = useGameStore((s) => s.questsMenu)
  const hatching = useGameStore((s) => s.hatch !== null)
  const progress = usePlayerData((s) => s.quests.progress)
  const gold = usePlayerData((s) => s.questGold)
  const [tab, setTab] = useState('quests')
  if (!open || hatching) return null

  const quests = QUESTS.filter((q) => q.tab === tab)
  return (
    <div className="quests-menu" onPointerDown={stop}>
      <div className="quests-title">
        <span className="quests-title-icon"><Emoji size={96}>📜</Emoji></span>
        <T size={54} w={5}>Quests</T>
      </div>
      <button type="button" className="egg-close quests-close" aria-label="Close" onPointerDown={stop} onClick={close} />

      <div className="quests-wallet">
        <span className="quests-coin"><GoldBar size={36} /><T size={40} w={4}>{formatNumber(gold)}</T></span>
        <span className="quests-coin"><Emoji size={38}>💎</Emoji><T size={40} w={4}>5</T></span>
      </div>

      <div className="quests-tabs">
        {QUEST_TABS.map((t) => (
          <Btn
            key={t.id}
            className={`quests-tab${t.id === tab ? ' on' : ''}`}
            style={{ '--bg': t.bg }}
            onClick={() => { playButtonClick(); setTab(t.id) }}
          >
            <T size={40} w={5}>{t.label}</T>
          </Btn>
        ))}
      </div>

      {tab === 'rewards' ? <RewardsTab /> : (
      <div className="quests-list">
        {QUEST_GROUPS.map((g) => {
          const list = quests.filter((q) => q.group === g.id)
          return list.length > 0 && (
            <div key={g.id} className="quests-group">
              <Reset group={g} />
              {list.map((q) => <Quest key={q.id} q={q} value={progress[q.id] ?? 0} />)}
            </div>
          )
        })}
        {quests.length === 0 && <T size={40} w={4} className="quests-empty">Nothing here yet</T>}
      </div>
      )}
    </div>
  )
}
