import { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { EGG_SHOP, HATCH_MS, RARITY_BG, RARITY_TEXT, RARITY_ORDER } from '../data/eggs.js'
import { finishHatch } from '../systems/hatch.js'
import { petInfo } from '../systems/pets.js'
import { playButtonClick, playPowerGainPop } from '../systems/sfx.js'
import { RAINBOW, grad, T, stop, Btn, Emoji } from './hudParts.jsx'

// The hatch animation for systems/hatch.js's useGameStore `hatch`: the egg
// (x1 or x3) wobbles harder and harder, cracks in a white flash, and the pet
// card pops out — rays behind rare-and-up. Click to skip ahead a phase.
// Auto plays it faster and shows a Stop Auto button.

const pct = (n) => `${n}%`
const RAYS_FROM = RARITY_ORDER.indexOf('rare')

function Reveal({ pet, delay }) {
  const info = petInfo(pet)
  if (!info) return null
  const rays = RARITY_ORDER.indexOf(info.rarity) >= RAYS_FROM
  const legendary = info.rarity === 'legendary'
  return (
    <div className="hatch-slot reveal" style={{ '--rarity': RARITY_BG[info.rarity], animationDelay: `${delay}ms` }}>
      {rays && <div className={`hatch-rays${legendary ? ' gold' : ''}`} />}
      {pet.isNew && <T size={34} w={4} fill={grad('#fff3a0', '#ffc21a')} className="hatch-new">NEW!</T>}
      <Emoji size={150}>{info.emoji}</Emoji>
      <T size={46} w={5}>{info.name}</T>
      <T size={32} w={4} fill={legendary ? RAINBOW : grad(...RARITY_TEXT[info.rarity])}>
        {info.rarity[0].toUpperCase() + info.rarity.slice(1)}
      </T>
      <T size={26} w={3} fill={grad('#d8dcf0', '#aab0cc')}>{pct(info.chance)}</T>
    </div>
  )
}

// Keyed by hatch id so every hatch (Auto's back-to-back ones included) starts
// from a fresh 'shake' phase.
export default function HatchOverlay() {
  const hatch = useGameStore((s) => s.hatch)
  return hatch ? <HatchRun key={hatch.id} hatch={hatch} /> : null
}

function HatchRun({ hatch }) {
  const auto = useGameStore((s) => s.autoHatch)
  const [phase, setPhase] = useState('shake')
  const [k] = useState(() => (useGameStore.getState().autoHatch ? HATCH_MS.autoSpeed : 1))

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), HATCH_MS.shake * k)
    const t2 = setTimeout(finishHatch, (HATCH_MS.shake + HATCH_MS.reveal) * k)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    if (phase === 'reveal') playPowerGainPop()
  }, [phase])

  const colors = EGG_SHOP[hatch.egg]?.colors ?? ['#ffffff', '#cccccc']

  // Skip: shaking -> reveal now; revealed -> done (finishHatch clears `hatch`,
  // which also cancels the pending timers above).
  const skip = (e) => {
    stop(e)
    if (phase === 'shake') setPhase('reveal')
    else finishHatch()
  }

  return (
    <div className="hatch" onPointerDown={skip}>
      {phase === 'reveal' && <div className="hatch-flash" />}
      <div className="hatch-row">
        {hatch.pets.map((pet, i) =>
          phase === 'shake' ? (
            <div key={`${hatch.id}-${i}`} className="hatch-slot">
              <span className="hatch-egg" style={{ '--egg-a': colors[0], '--egg-b': colors[1], animationDuration: `${HATCH_MS.shake * k}ms, 300ms`, animationDelay: `${i * -90}ms, 0ms` }} />
            </div>
          ) : (
            <Reveal key={`${hatch.id}-${i}`} pet={pet} delay={i * 120} />
          ),
        )}
      </div>
      <T size={26} w={3} fill={grad('#d8dcf0', '#aab0cc')} className="hatch-skip">Click to skip</T>
      {auto && (
        <Btn
          className="hatch-stop"
          style={{ '--bg': '#e8303a' }}
          onClick={() => {
            playButtonClick()
            useGameStore.setState({ autoHatch: false })
          }}
        >
          <T size={34} w={4}>Stop Auto</T>
        </Btn>
      )}
    </div>
  )
}
