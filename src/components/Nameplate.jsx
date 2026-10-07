import { useMemo } from 'react'
import { billboardTexture } from '../utils/labels.js'

// Camera-facing text sprite (name tags, signs); `height` in metres.
export default function Nameplate({ text, position = [0, 2.5, 0], height = 0.5, color }) {
  const { map, aspect } = useMemo(() => billboardTexture(text, { color }), [text, color])
  return (
    <sprite position={position} scale={[height * aspect, height, 1]} renderOrder={2}>
      <spriteMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  )
}
