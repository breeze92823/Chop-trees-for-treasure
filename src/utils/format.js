// Compact HUD numbers: 950, 2.03K, 25K, 1.5M, 80B.
const UNITS = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]

export function formatNumber(n) {
  for (const [v, s] of UNITS) {
    if (Math.abs(n) >= v) return `${+(n / v).toFixed(n / v < 10 ? 2 : n / v < 100 ? 1 : 0)}${s}`
  }
  return String(Math.floor(n))
}
