// Quest tracking over usePlayerData `quests` (data/quests.js is the list):
//   progress { id: n } toward each goal, done [ids] already paid, epoch { group: n }
// A group's quests reset when the wall clock crosses its `resetHours` boundary
// (the same boundary the window's countdown shows). Finishing a quest pays its
// Gold (`questGold`, spent in the Rewards tab) right away. Hooks: sell.js ('sell'),
// strengthGain.js ('strength'), loot.js ('mythic'); 'time' is ticked here.
import { QUESTS, QUEST_GROUPS } from '../data/quests.js'
import { usePlayerData } from '../store/usePlayerData.js'
import { showActionResult } from './actionResult.js'
import { addSystem } from './loop.js'

const epochOf = (g, now) => Math.floor(now / (g.resetHours * 3600000))

// `quests` with any group whose epoch moved on cleared; the same object if none did.
function rolled(quests, now) {
  let next = quests
  for (const g of QUEST_GROUPS) {
    const epoch = epochOf(g, now)
    if (quests.epoch[g.id] === epoch) continue
    const ids = QUESTS.filter((q) => q.group === g.id).map((q) => q.id)
    if (next === quests) next = { progress: { ...quests.progress }, done: [...quests.done], epoch: { ...quests.epoch } }
    for (const id of ids) delete next.progress[id]
    next.done = next.done.filter((id) => !ids.includes(id))
    next.epoch[g.id] = epoch
  }
  return next
}

// Add `n` to every quest tracking `track`; pays and announces the ones it finishes.
export function addQuestProgress(track, n) {
  const s = usePlayerData.getState()
  const quests = rolled(s.quests, Date.now())
  const finished = []
  let progress = quests.progress
  let done = quests.done
  if (n > 0) {
    for (const q of QUESTS) {
      if (q.track !== track || done.includes(q.id)) continue
      if (progress === quests.progress) progress = { ...progress }
      const value = Math.min(q.goal, (progress[q.id] ?? 0) + n)
      progress[q.id] = value
      if (value >= q.goal) {
        if (done === quests.done) done = [...done]
        done.push(q.id)
        finished.push(q)
      }
    }
  }
  if (quests === s.quests && progress === quests.progress) return
  const gold = finished.reduce((a, q) => a + q.reward, 0)
  usePlayerData.setState({ quests: { ...quests, progress, done }, ...(gold && { questGold: s.questGold + gold }) })
  for (const q of finished) showActionResult(`Quest complete: ${q.title.replaceAll('*', '')}! +${q.reward} Gold`, true)
}

let idle = 0

function step(dt) {
  idle += dt
  if (idle < 1) return
  addQuestProgress('time', idle) // also rolls expired groups
  idle = 0
}

export function install() {
  return addSystem(step)
}
