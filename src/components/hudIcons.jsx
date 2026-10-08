// Chunky cartoon HUD icons (Rebirth / Index / Cash), copied from Lift-rock-for-treasure.
// Sized like <Icon>: the `--is` var is scaled by the HUD scale in gameHud.css (.hud-icon).
const OUT = '#1d1d22'

export function RebirthIcon({ size }) {
  return <img className="hud-icon" src={`${import.meta.env.BASE_URL}ui/rebirth.png`} alt="" draggable={false} style={{ '--is': size }} />
}

export function BookIcon({ size }) {
  return (
    <svg className="hud-icon" viewBox="0 0 100 100" style={{ '--is': size }}>
      <path d="M10 46 L54 24 L92 46 L48 70 Z" fill="#4aa3ff" stroke={OUT} strokeWidth="4" strokeLinejoin="round" />
      <path d="M10 46 L48 70 L48 86 L10 62 Z" fill="#1f5fc8" stroke={OUT} strokeWidth="4" strokeLinejoin="round" />
      <path d="M48 70 L92 46 L92 62 L48 86 Z" fill="#f2f2f2" stroke={OUT} strokeWidth="4" strokeLinejoin="round" />
      <path d="M54 76 L88 57 M54 81 L88 62" stroke="#b8c2d6" strokeWidth="2.5" />
      <path d="M26 46 L56 31" stroke="#9fd0ff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function CashIcon({ size }) {
  return (
    <svg className="hud-icon" viewBox="0 0 100 100" style={{ '--is': size }}>
      <g transform="rotate(-18 50 50)">
        <rect x="8" y="46" width="78" height="34" rx="4" fill="#1f8a2a" stroke={OUT} strokeWidth="4" />
        <rect x="12" y="34" width="78" height="34" rx="4" fill="#2fb83a" stroke={OUT} strokeWidth="4" />
        <rect x="16" y="22" width="78" height="34" rx="4" fill="#5fe04a" stroke={OUT} strokeWidth="4" />
        <circle cx="55" cy="39" r="9" fill="#2a9a2a" stroke={OUT} strokeWidth="3" />
        <rect x="28" y="22" width="10" height="34" fill="#ffd23a" stroke={OUT} strokeWidth="3" />
      </g>
    </svg>
  )
}
