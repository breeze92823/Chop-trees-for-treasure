import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { bagMax } from '../systems/upgrades.js'
import { formatNumber } from '../utils/format.js'
import { T, grad } from './hudParts.jsx'
import {
  TUTORIAL_CASH, TUTORIAL_COMPLETE_MS, TUTORIAL_DONE, TUTORIAL_LOOT_VALUE, TUTORIAL_STRENGTH,
} from '../data/tutorial.js'

const setStep = (tutorialStep) => usePlayerData.setState({ tutorialStep })

// Moves the saved step forward (or back one to re-collect when the bag was emptied early).
// The step is saved with the account (systems/net.js), so finished players never see it again.
function useTutorialProgress() {
  const loaded = useGameStore((s) => s.progressLoaded)
  const step = usePlayerData((s) => s.tutorialStep)
  const strength = usePlayerData((s) => s.strength)
  const cash = usePlayerData((s) => s.cash)
  const bagValue = usePlayerData((s) => s.bag.reduce((n, it) => n + it.value, 0))
  const bagFull = usePlayerData((s) => s.bag.length >= bagMax(s))
  const bagEmpty = usePlayerData((s) => s.bag.length === 0)
  const ownsMore = usePlayerData((s) => s.choppers.length > 1)
  const hasLoot = useGameStore((s) => s.worldLoot.length > 0)

  useEffect(() => {
    if (!loaded || step >= TUTORIAL_DONE) return
    if (step === 0 && strength >= TUTORIAL_STRENGTH) setStep(1)
    else if (step === 1 && (hasLoot || bagValue > 0)) setStep(2)
    else if (step === 2 && (bagValue >= TUTORIAL_LOOT_VALUE || bagFull || cash >= TUTORIAL_CASH)) setStep(3)
    else if (step === 3 && cash >= TUTORIAL_CASH) setStep(4)
    else if (step === 3 && bagEmpty) setStep(2) // sold too little: collect more
    else if (step === 4 && ownsMore) setStep(TUTORIAL_DONE)
  }, [loaded, step, strength, cash, bagValue, bagFull, bagEmpty, ownsMore, hasLoot])
}

// Yellow quest banner under the Strength readout. After the last step it says COMPLETE
// briefly, then unmounts. Never shows for finished accounts.
export default function Tutorial() {
  useTutorialProgress()
  const loaded = useGameStore((s) => s.progressLoaded)
  const step = usePlayerData((s) => s.tutorialStep)
  const strength = usePlayerData((s) => s.strength)
  const prev = useRef(step)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    const finishedNow = prev.current < TUTORIAL_DONE && step >= TUTORIAL_DONE
    prev.current = step
    if (!finishedNow) return
    setComplete(true)
    const id = setTimeout(() => setComplete(false), TUTORIAL_COMPLETE_MS)
    return () => clearTimeout(id)
  }, [step])

  const text = complete ? 'Tutorial Complete!'
    : !loaded || step >= TUTORIAL_DONE ? null
    : [
      `Tap to gain Strength (${formatNumber(Math.min(strength, TUTORIAL_STRENGTH))}/${TUTORIAL_STRENGTH})`,
      'Chop Trees!',
      'Collect Treasure!',
      'Sell Treasure!',
      'Buy a stronger Chopper!',
    ][step]
  if (!text) return null
  return (
    <div className="tutorial" key={complete ? 'done' : step}>
      <T size={20} w={3} fill={grad('#fff3a0', '#ffb21f')} stroke="#4a2a00" className="tutorial-tag">{complete ? 'DONE' : 'TUTORIAL'}</T>
      <T size={34} w={4} fill={complete ? grad('#c8ff9a', '#2fcf3a') : undefined}>{text}</T>
    </div>
  )
}
