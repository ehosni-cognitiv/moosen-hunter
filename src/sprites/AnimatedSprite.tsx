import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { DoubleSide, type MeshBasicMaterial, type Texture } from 'three'

/**
 * A camera-facing 2D sprite (billboard) living in the 3D world, animated by
 * cycling frame textures. This is how all trees, grass, and animals are drawn
 * now — flat sprites, real 3D positions/terrain.
 */
export default function AnimatedSprite({
  frames,
  fps = 6,
  size,
  playing = true,
  opacity = 1,
  onPointerDown,
  /** starting frame offset so many copies don't animate in lockstep */
  offset = 0,
  /** mirror horizontally (for sprites travelling left) */
  flipX = false,
}: {
  frames: Texture[] | null
  fps?: number
  size: [number, number]
  playing?: boolean
  opacity?: number
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void
  offset?: number
  flipX?: boolean
}) {
  const mat = useRef<MeshBasicMaterial>(null)
  const idx = useRef(Math.floor(offset))
  const acc = useRef(0)

  useFrame((_, delta) => {
    if (!mat.current || !frames || frames.length === 0 || !playing) return
    acc.current += delta
    const step = 1 / fps
    while (acc.current >= step) {
      acc.current -= step
      idx.current += 1
    }
    // Always index within range — `offset` (and a just-swapped, shorter frame
    // set) can leave idx past the end, which would null the map → white box.
    mat.current.map = frames[idx.current % frames.length]
  })

  if (!frames) return null

  return (
    <Billboard>
      {/* scale.x = -1 mirrors both the texture and its UVs, so hit regions
          stay consistent with the visible (flipped) sprite */}
      <mesh onPointerDown={onPointerDown} scale={[flipX ? -1 : 1, 1, 1]}>
        <planeGeometry args={size} />
        <meshBasicMaterial
          ref={mat}
          map={frames[idx.current % frames.length]}
          transparent
          alphaTest={0.5}
          opacity={opacity}
          toneMapped={false}
          side={DoubleSide}
        />
      </mesh>
    </Billboard>
  )
}
