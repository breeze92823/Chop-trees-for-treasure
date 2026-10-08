import { usePlayerData } from '../store/usePlayerData.js'
import { REWARDS } from '../data/rewards.js'
import { buyReward, drinkPotion, isOwned } from '../systems/rewards.js'
import { playButtonClick } from '../systems/sfx.js'
import { formatNumber } from '../utils/format.js'
import { grad, T, Btn, Emoji } from './hudParts.jsx'

// Rewards tab of the Quests window: the Gold shop (data/rewards.js, systems/rewards.js).

const click = (fn) => () => {
  playButtonClick()
  fn()
}

export function GoldBar({ size }) {
  return (
    <svg className="quest-gold" viewBox="0 0 64 44" style={{ '--gs': size }}>
      <path d="M8 18 L20 4 H58 L46 18 Z" fill="#ffe27a" stroke="#6a3d08" strokeWidth="4" strokeLinejoin="round" />
      <path d="M8 18 H46 V38 H8 Z" fill="#f0a420" stroke="#6a3d08" strokeWidth="4" strokeLinejoin="round" />
      <path d="M46 18 L58 4 V24 L46 38 Z" fill="#c97812" stroke="#6a3d08" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  )
}

function Wings() {
  const wing = (flip) => (
    <g transform={flip ? 'translate(120 0) scale(-1 1)' : undefined}>
      <path d="M60 60 C40 20 14 22 4 8 C8 40 14 62 30 78 C20 82 14 90 12 104 C34 96 52 92 60 84 Z" fill="#d8c08a" stroke="#6a4a20" strokeWidth="3" strokeLinejoin="round" />
      <path d="M58 62 C44 36 26 34 14 22 C20 46 26 62 40 74" fill="none" stroke="#3a6ac8" strokeWidth="4" strokeLinecap="round" />
      <path d="M56 80 C44 84 30 90 20 98" fill="none" stroke="#3a6ac8" strokeWidth="4" strokeLinecap="round" />
    </g>
  )
  return (
    <svg className="rw-art-svg" viewBox="0 0 120 110" style={{ '--w': 230, '--h': 190 }}>
      {wing(false)}
      {wing(true)}
      <circle cx="60" cy="62" r="8" fill="#ffd23a" stroke="#6a4a20" strokeWidth="3" />
    </svg>
  )
}

function Potion({ liquid }) {
  return (
    <svg className="rw-art-svg" viewBox="0 0 64 80" style={{ '--w': 96, '--h': 120 }}>
      <rect x="24" y="2" width="16" height="12" rx="2" fill="#ff9a1f" stroke="#15151a" strokeWidth="3" />
      <rect x="22" y="12" width="20" height="10" fill="#bfe8ff" stroke="#15151a" strokeWidth="3" />
      <path d="M22 22 L6 58 Q4 76 20 76 H44 Q60 76 58 58 L42 22 Z" fill="#bfe8ff" stroke="#15151a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M13 46 H51 L56 58 Q58 72 44 72 H20 Q6 72 8 58 Z" fill={liquid} />
      <path d="M16 56 Q16 66 22 68" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Art({ r }) {
  if (r.art === 'wings') return <Wings />
  if (r.type === 'potion') return <Potion liquid={r.liquid} />
  return (
    <span className="rw-pet">
      <Emoji size={104}>{r.emoji}</Emoji>
    </span>
  )
}

function Price({ r, owned, className = '' }) {
  return (
    <Btn className={`rw-price ${className}`} style={{ '--bg': 'rgba(20, 14, 40, 0.35)' }} onClick={click(() => buyReward(r.id))}>
      {owned ? (
        <T size={30} w={4}>Owned</T>
      ) : (
        <>
          <GoldBar size={34} />
          <T size={r.price >= 1000 ? 40 : 38} w={4}>{formatNumber(r.price)}</T>
        </>
      )}
    </Btn>
  )
}

function Card({ r }) {
  const pets = usePlayerData((s) => s.pets)
  const rewards = usePlayerData((s) => s.rewards)
  const have = usePlayerData((s) => s.potions[r.id] ?? 0)
  const owned = isOwned(r, { pets, rewards })
  return (
    <div className={`rw-card ${r.type}`} style={{ '--bg': r.bg }}>
      {r.type !== 'gear' && <div className="rw-art"><Art r={r} /></div>}
      <T size={r.type === 'gear' ? 34 : 33} w={4} className="rw-name">{r.name}</T>
      {r.type === 'gear' && (
        <>
          <div className="rw-art"><Art r={r} /></div>
          <div className="rw-lines">
            {r.lines.map(([text, a, b]) => <T key={text} size={26} w={3} fill={grad(a, b)}>{text}</T>)}
          </div>
        </>
      )}
      {r.type === 'pet' && <T size={28} w={3} fill={grad(r.tag[1], r.tag[2])}>{r.tag[0]}</T>}
      {r.type === 'potion' && <T size={r.desc.length > 30 ? 17 : 20} w={3} className="rw-desc">{r.desc}</T>}
      <div className="rw-foot">
        <Price r={r} owned={owned} className={r.type === 'potion' ? 'small' : r.type === 'gear' ? 'wide' : ''} />
        {r.type === 'potion' && (
          <Btn className="rw-use" style={{ '--bg': have > 0 ? '#46cf3a' : '#5a5d68' }} onClick={click(() => drinkPotion(r.id))}>
            <T size={27} w={4}>{`Use (${have})`}</T>
          </Btn>
        )}
      </div>
    </div>
  )
}

export default function RewardsTab() {
  return (
    <div className="rw-grid">
      {REWARDS.map((r) => <Card key={r.id} r={r} />)}
    </div>
  )
}
