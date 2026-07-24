import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

// How far the view can swing from center. Mouse at a screen edge = full swing.
const MAX_YAW = 0.62 // radians left/right (~35°)
const MAX_PITCH = 0.24 // radians up/down (~14°)
const BASE_PITCH = -0.18 // resting tilt: looking slightly down at the ground

/**
 * Turns the camera into a mouse-scanned scope:
 *  - the crosshair stays centered, so every shot is raycast through screen
 *    center (we override R3F's pointer compute to always use (0,0));
 *  - moving the mouse pans the camera (yaw/pitch), so the player sweeps the
 *    zoomed-in view hunting for animals.
 */
export default function ViewController() {
  const camera = useThree((s) => s.camera)
  const setEvents = useThree((s) => s.setEvents)
  const target = useRef({ yaw: 0, pitch: BASE_PITCH })

  useEffect(() => {
    camera.position.set(0, 6, 18)
    camera.rotation.order = 'YXZ'
    camera.rotation.set(BASE_PITCH, 0, 0)

    // Every pointer event raycasts through the center, not the mouse position.
    setEvents({
      compute: (_event, state) => {
        state.pointer.set(0, 0)
        state.raycaster.setFromCamera(state.pointer, state.camera)
      },
    })

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1 // -1 (left) .. 1 (right)
      const ny = (e.clientY / window.innerHeight) * 2 - 1 // -1 (top) .. 1 (bottom)
      target.current.yaw = -nx * MAX_YAW
      target.current.pitch = BASE_PITCH - ny * MAX_PITCH
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [camera, setEvents])

  useFrame((_, dt) => {
    // critically-damped-ish smoothing toward the mouse target
    const k = 1 - Math.pow(0.0015, dt)
    camera.rotation.y += (target.current.yaw - camera.rotation.y) * k
    camera.rotation.x += (target.current.pitch - camera.rotation.x) * k
  })

  return null
}
