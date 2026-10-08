// Rewards tab of the Quests window (components/RewardsTab.jsx): everything
// quest Gold (usePlayerData `questGold`) buys. Logic in systems/rewards.js.
//   gear   — one-time permanent bonuses (usePlayerData `rewards`); `stats` use
//            the artifact stat kinds, folded in by systems/artifacts.js artifactBonus
//   pet    — an EGG_SHOP kind in data/eggs.js with one pet, hatched via systems/hatch.js
//   potion — a stock count in `potions`, drunk for POTION_MS (`boostUntil`, or `luckUntil`)
export const POTION_MS = 5 * 60_000

export const REWARDS = [
  {
    id: 'wings', type: 'gear', name: 'Pathfinder Wings', price: 5000, bg: '#cfd9f0', art: 'wings',
    stats: [['strength', 44], ['cash', 50], ['move', 25], ['backpack', 6]],
    lines: [
      ['25% Better!', '#c6ff9a', '#3fcf3a'],
      ['Strength +44%', '#ffd27a', '#ff8a1f'],
      ['Cash +50%', '#c6ff9a', '#3fcf3a'],
      ['Movement Speed +25%', '#9ad8ff', '#3a6ef0'],
      ['+6 Backpack Slots', '#e6b0ff', '#a24ff0'],
    ],
  },
  { id: 'galaxy_dragon', type: 'pet', name: 'Galaxy Dragon', egg: 'galaxy_dragon', price: 2500, bg: '#a24ff0', emoji: '🐲', tag: ['50% Stronger!', '#9ad8ff', '#3fb8ff'] },
  { id: 'void_unicorn', type: 'pet', name: 'Void Robot Unicorn', egg: 'void_unicorn', price: 1000, bg: '#b060f0', emoji: '🦄', tag: ['x140 Strength!', '#ffffff', '#e8e8f0'] },
  {
    id: 'master', type: 'potion', name: 'Master Potion', price: 80, bg: '#f5a83a', liquid: '#5a4bd8',
    desc: '2x Strength, 2x Cash, and 2x Wood for 5 minutes', boosts: ['strength', 'cash', 'wood'],
  },
  { id: 'luck', type: 'potion', name: 'Luck Potion', price: 40, bg: '#4fd870', liquid: '#e8243a', desc: 'Bonus hatch odds for 5 minutes', boosts: ['luck'] },
  { id: 'cash', type: 'potion', name: 'Cash Potion', price: 25, bg: '#4fd870', liquid: '#2fa83a', desc: '2x Cash from selling treasure for 5 minutes', boosts: ['cash'] },
  { id: 'strength', type: 'potion', name: 'Strength Potion', price: 30, bg: '#f5983a', liquid: '#ffc21a', desc: '2x Strength for 5 minutes', boosts: ['strength'] },
]

export const rewardInfo = (id) => REWARDS.find((r) => r.id === id)
