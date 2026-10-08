import { useEffect } from 'react'
import { Group } from 'three'
import { ARTIFACT_MODELS } from './artifactModels.js'

// Equipped artifacts worn on the avatar's back: id -> [scale, y, z] in rig units (the avatar
// is RIG_HEIGHT = 6.4 tall; torso spans y 2.4..4.8, its back face is at z = -0.34, +Z is forward).
// The model is turned half way round so its straps face the torso.
const BACK_ITEMS = { treasurepack: [1.2, 3.7, -0.8] }

// Mounts the artifact's model on the avatar root while it is equipped; nothing for artifacts
// without a BACK_ITEMS entry.
export function useBackItem(avatar, id) {
  useEffect(() => {
    const spec = BACK_ITEMS[id]
    if (!avatar || !spec) return undefined
    const holder = new Group()
    holder.name = 'artifact_back'
    holder.add(ARTIFACT_MODELS[id]())
    holder.scale.setScalar(spec[0])
    holder.position.set(0, spec[1], spec[2])
    holder.rotation.y = Math.PI
    avatar.add(holder)
    return () => avatar.remove(holder)
  }, [avatar, id])
}
