import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../state/gameStore'

// How far the view can swing from center.
const MAX_YAW = 1.15 // radians left/right (~66°)
const MAX_PITCH = 0.55 // radians up/down (~31°)
const BASE_PITCH = -0.18 // resting tilt: looking slightly down at the ground

// Mouse sensitivity when the pointer is locked (radians per pixel moved).
const SENSITIVITY = 0.0022

// Recoil shake on each shot (kept subtle).
const SHAKE_AMOUNT = 0.007 // peak jitter in radians
const SHAKE_KICK = 0.005 // upward kick in radians

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))

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
  const shake = useRef(0)

  // Kick the shake up whenever a shot is fired (recoilTick bumps).
  useEffect(() => {
    let prev = useGameStore.getState().recoilTick
    return useGameStore.subscribe((s) => {
      if (s.recoilTick !== prev) {
        prev = s.recoilTick
        shake.current = 1
      }
    })
  }, [])

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
      if (document.pointerLockElement) {
        // locked: accumulate relative movement (clamped to the swing limits)
        target.current.yaw = clamp(
          target.current.yaw - e.movementX * SENSITIVITY,
          -MAX_YAW,
          MAX_YAW,
        )
        target.current.pitch = clamp(
          target.current.pitch - e.movementY * SENSITIVITY,
          BASE_PITCH - MAX_PITCH,
          BASE_PITCH + MAX_PITCH,
        )
      } else {
        // fallback (before the pointer is locked): absolute position
        const nx = (e.clientX / window.innerWidth) * 2 - 1
        const ny = (e.clientY / window.innerHeight) * 2 - 1
        target.current.yaw = -nx * MAX_YAW
        target.current.pitch = BASE_PITCH - ny * MAX_PITCH
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [camera, setEvents])

  useFrame((_, dt) => {
    // critically-damped-ish smoothing toward the mouse target
    const k = 1 - Math.pow(0.0015, dt)
    camera.rotation.y += (target.current.yaw - camera.rotation.y) * k
    camera.rotation.x += (target.current.pitch - camera.rotation.x) * k

    // recoil shake: a brief upward kick + random jitter that decays fast
    if (shake.current > 0.002) {
      const s = shake.current
      camera.rotation.y += (Math.random() - 0.5) * SHAKE_AMOUNT * s
      camera.rotation.x += (Math.random() - 0.5) * SHAKE_AMOUNT * s + SHAKE_KICK * s
      shake.current *= Math.pow(0.0008, dt) // ~decays over ~0.25s
    }
  })

  return null
}
