import { useGameStore } from '../store/useGameStore.js'
import { claimOffline } from '../systems/net.js'
import { playButtonClick } from '../systems/sfx.js'
import { formatNumber } from '../utils/format.js'
import { grad, T, stop, Btn, Icon } from './hudParts.jsx'
import { CashIcon } from './hudIcons.jsx'

// Offline earnings window: shown on join when the server reports unclaimed time away
// (systems/net.js `offlineEarnings`); Claim asks the server to pay out (`claimOffline`)
// and the reward lands on `offlineClaimed`. Layout is in reference pixels (gameHud.css).

// Away time as "3h 20m" / "45m".
function away(seconds) {
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  return h ? `${h}h ${m % 60}m` : `${m}m`
}

export default function OfflineWindow() {
  const offer = useGameStore((s) => s.offlineEarnings)
  const claiming = useGameStore((s) => s.offlineClaiming)
  const hatching = useGameStore((s) => s.hatch !== null)
  if (!offer || hatching) return null

  return (
    <div className="offline-menu" onPointerDown={stop} onWheel={stop}>
      <div className="offline-title">
        <span className="offline-clock">⏰</span>
        <T size={56} w={6}>Offline Earnings</T>
      </div>
      <div className="offline-away">
        <T size={40} w={5} fill={grad('#d8ecff', '#9ad7ff')}>{`Away for ${away(offer.seconds)}`}</T>
      </div>
      <div className="offline-row is-cash">
        <CashIcon size={84} />
        <T size={64} w={6} fill={grad('#c8ff9a', '#2fcf3a')} stroke="#0c3a10">{`+$${formatNumber(offer.cash)}`}</T>
      </div>
      <div className="offline-row is-strength">
        <Icon name="arm" size={84} />
        <T size={64} w={6} fill={grad('#fff6dc', '#ffa13a')} stroke="#3a2406">{`+${formatNumber(offer.strength)}`}</T>
      </div>
      <Btn
        className="offline-claim"
        style={{ '--bg': '#2fa83a' }}
        onClick={() => {
          if (claiming) return
          playButtonClick()
          claimOffline()
        }}
      >
        <T size={54} w={6}>Claim</T>
      </Btn>
    </div>
  )
}
