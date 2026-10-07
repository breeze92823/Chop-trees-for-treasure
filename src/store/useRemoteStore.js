import { create } from 'zustand'

// Other connected players, mirrored from the Colyseus room by systems/net.js.
// `ids` = their session ids (drives <RemotePlayers/>); `plots` = home plot index ->
// { slots } for plots owned by someone else (drives pedestals + placed items in Plots.jsx).
export const useRemoteStore = create(() => ({
  ids: [],
  plots: {},
}))
