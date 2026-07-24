import { Canvas } from '@react-three/fiber'
import { useGameStore } from '../state/gameStore'
import Scene from './Scene'
import ViewController from './ViewController'

/** Chunkiness of the pixelation: render at 1/PIXELATION res, upscale nearest. */
const PIXELATION = 4

/** A shot that hit no animal — spends a round and spooks the herd. */
function handleMiss() {
  useGameStore.getState().shoot()
}

export default function Game() {
  return (
    <Canvas
      dpr={1 / PIXELATION}
      gl={{ antialias: false }}
      shadows
      camera={{ position: [0, 6, 18], fov: 30 }}
      onPointerMissed={handleMiss}
    >
      <ViewController />
      <Scene />
    </Canvas>
  )
}
