// Server-wide hatch announcements ("Ashan hatched a Lion (0.5%)!"), fed by
// systems/net.js for other players and systems/hatch.js (via net.js) for
// our own. components/Announcements.jsx subscribes and shows the newest few.
import { PETS_BY_ID } from '../data/eggs.js'

const MAX = 4
const listeners = new Set()
let nextId = 1
export let announcements = []

export function subscribeAnnouncements(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function pushAnnouncement(username, petId) {
  const pet = PETS_BY_ID[petId]
  if (!pet) return
  announcements = [...announcements, { id: nextId++, username: username || 'Someone', pet }].slice(-MAX)
  for (const fn of listeners) fn(announcements)
}

export function dismissAnnouncement(id) {
  announcements = announcements.filter((a) => a.id !== id)
  for (const fn of listeners) fn(announcements)
}
