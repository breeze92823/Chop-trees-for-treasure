// Compact HUD numbers: 950, 12.5, 2.03K, 25K, 1.5M, 80B.
const UNITS = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]

export function formatNumber(n) {
  for (const [v, s] of UNITS) {
    if (Math.abs(n) >= v) return `${+(n / v).toFixed(n / v < 10 ? 2 : n / v < 100 ? 1 : 0)}${s}`
  }
  // Rebirth multipliers make Strength fractional (x1.5 per click): keep one decimal.
  return String(Number.isInteger(n) ? n : Math.floor(n * 10) / 10)
}
