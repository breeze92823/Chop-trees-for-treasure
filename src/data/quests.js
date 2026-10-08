// Quest list for the Quests window (components/QuestsMenu.jsx). Placeholder
// entries matching the reference shot; the real list replaces them.
// `title`: `*word*` renders rainbow. `unit: 'time'` shows goal/progress as
// minutes. `track` is the event systems/quests.js counts. `reward` is Gold. `tab` is the window page the entry lives on.
export const QUEST_TABS = [
  { id: 'quests', label: 'Quests', bg: '#c9a56c' },
  { id: 'rewards', label: 'Rewards', bg: '#4a5fe8' },
]

export const QUESTS = [
  { id: 'sell', track: 'sell', tab: 'quests', group: 'quick', title: 'Sell Treasure', goal: 142000, reward: 25, bar: '#46cf3a' },
  { id: 'time', track: 'time', tab: 'quests', group: 'quick', title: 'Time in Game', goal: 15 * 60, unit: 'time', reward: 25, bar: '#ff9a1f' },
  { id: 'strength', track: 'strength', tab: 'quests', group: 'quick', title: 'Gain Strength', goal: 238000000, reward: 25, bar: '#46cf3a' },
  { id: 'mythic', track: 'mythic', tab: 'quests', group: 'quick', title: 'Collect *Mythic* Treasures', goal: 3, reward: 25, bar: '#46cf3a' },
]

export const QUEST_GROUPS = [
  { id: 'quick', label: 'Quick Quests', resetHours: 4 },
  { id: 'daily', label: 'Daily Quests', resetHours: 24 },
]
