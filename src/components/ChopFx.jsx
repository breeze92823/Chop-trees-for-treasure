import { useEffect, useState } from 'react'
import { onChop } from '../systems/chop.js'
import { playerScreen } from '../systems/playerState.js'
import { formatNumber } from '../utils/format.js'
import { grad, T, Icon } from './hudParts.jsx'

// "+wood" pops that float up from the player's chest on every landed swing
// (systems/chop.js), jittered sideways so rapid chops don't stack exactly.
let nextId = 1

export default function ChopFx() {
  const [pops, setPops] = useState([])

  useEffect(
    () =>
      onChop((gain) => {
        const pop = {
          id: nextId++,
          gain,
          x: playerScreen.x * 100 + (Math.random() - 0.5) * 8,
          y: playerScreen.y * 100 - 6,
        }
        setPops((list) => [...list.slice(-11), pop])
      }),
    [],
  )

  const done = (id) => setPops((list) => list.filter((p) => p.id !== id))

  return pops.map((p) => (
    <div key={p.id} className="chop-pop" style={{ left: `${p.x}%`, top: `${p.y}%` }} onAnimationEnd={() => done(p.id)}>
      <Icon name="log" size={40} />
      <T size={38} w={4} fill={grad('#ffe0b0', '#e8a868')} stroke="#3a1a08">{`+${formatNumber(p.gain)}`}</T>
    </div>
  ))
}
