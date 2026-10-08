import { create } from 'zustand'

// Top players from the server (systems/net.js `leaderboard`): per board, rows
// { id, name, value } best first (id = a session id for players online now).
// Drawn on the boards in world/Leaderboards.jsx.
export const useLeaderboardStore = create(() => ({
  rebirths: [],
  cash: [],
  strength: [],
  playTime: [], // seconds
}))
