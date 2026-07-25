import { Canvas } from '@react-three/fiber'
import Scene from './Scene'
import ViewController from './ViewController'

/** Chunkiness of the pixelation: render at 1/PIXELATION res, upscale nearest. */
const PIXELATION = 4

export default function Game() {
  return (
    <Canvas
      dpr={1 / PIXELATION}
      gl={{ antialias: false }}
      shadows
      camera={{ position: [0, 6, 18], fov: 30 }}
    >
      <ViewController />
      <Scene />
    </Canvas>
  )
}
