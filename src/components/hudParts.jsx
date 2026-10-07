import { useMemo } from 'react'
import { drawIcon } from '../world/signs.js'

// Building blocks shared by the game HUD (GameHud.jsx) and its windows
// (EggMenu.jsx). Sizes are reference pixels, scaled by --s in gameHud.css.

export const RAINBOW = 'linear-gradient(90deg, #ff3a3a, #ffb21f, #ffe83a, #3fe05a, #3fb8ff, #a24ff0)'
export const grad = (a, b) => `linear-gradient(${a}, ${b ?? a})`

// Outlined Roblox-style text: a stroked copy underneath, a gradient fill on top.
export function T({ children, fill = grad('#ffffff', '#ececec'), stroke = '#15151a', w = 4, size, className = '', style }) {
  return (
    <span className={`t ${className}`} data-t={children} style={{ '--fill': fill, '--stroke': stroke, '--sw': w, '--fs': size, ...style }}>
      {children}
    </span>
  )
}

// Canvas icons shared with the world signage (signs.js), as data URLs.
const iconCache = new Map()
function iconUrl(name) {
  if (!iconCache.has(name)) {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    drawIcon(c.getContext('2d'), name, 64, 64, 112)
    iconCache.set(name, c.toDataURL())
  }
  return iconCache.get(name)
}
export function Icon({ name, size }) {
  const src = useMemo(() => iconUrl(name), [name])
  return <img className="hud-icon" src={src} alt="" style={{ '--is': size }} draggable={false} />
}

export const stop = (e) => e.stopPropagation()
export function Btn({ className = '', style, onClick, children }) {
  return (
    <button type="button" className={`hud-btn ${className}`} style={style} onPointerDown={stop} onClick={onClick}>
      {children}
    </button>
  )
}

export function Emoji({ children, size }) {
  return <span className="hud-emoji" style={{ '--es': size }}>{children}</span>
}
