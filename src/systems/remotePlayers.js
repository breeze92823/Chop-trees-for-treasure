// Live schema objects of the other players (sessionId -> PlayerState), written
// by systems/net.js and read every frame by components/RemotePlayers.jsx. Kept
// out of React/zustand because it changes ~15 times a second.
export const remotes = new Map()
