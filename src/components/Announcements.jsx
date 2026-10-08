import { useEffect, useState } from 'react'
import { RARITY_TEXT } from '../data/eggs.js'
import { announcements, dismissAnnouncement, subscribeAnnouncements } from '../systems/announce.js'
import { grad, T, Emoji } from './hudParts.jsx'

// Server-wide rare-hatch feed (systems/announce.js): one line per hatch,
// newest at the bottom, each fading out on its own.
const pct = (n) => `${n}%`

export default function Announcements() {
  const [list, setList] = useState(announcements)
  useEffect(() => subscribeAnnouncements(setList), [])

  return (
    <div className="announce">
      {list.map(({ id, username, pet }) => (
        <div key={id} className="announce-line" onAnimationEnd={() => dismissAnnouncement(id)}>
          <T size={26} w={3}>{`${username} hatched`}</T>
          <Emoji size={30}>{pet.emoji}</Emoji>
          <T size={26} w={3} fill={grad(...RARITY_TEXT[pet.rarity])}>{pet.name}</T>
          <T size={22} w={3} fill={grad('#d8dcf0', '#aab0cc')}>{`(${pct(pet.chance)})`}</T>
        </div>
      ))}
    </div>
  )
}
