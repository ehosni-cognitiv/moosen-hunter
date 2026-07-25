import { useEffect, useState, type PointerEvent } from 'react'

/**
 * Locks the mouse pointer to the window while hunting (so the cursor can't slip
 * off-screen and aiming is continuous). Browsers require a user gesture to
 * lock, so when unlocked we show a "Click to aim" overlay that captures the
 * click and requests the lock. Releasing the lock (Esc) brings the overlay back.
 *
 * Rendered only during play; on unmount it exits the lock so the between-level
 * menus are clickable again.
 */
export default function PointerLock() {
  const [locked, setLocked] = useState(() => !!document.pointerLockElement)
  // if the browser refuses pointer lock, fall back to absolute-mouse aiming so
  // the game stays playable (clicks then reach the canvas normally)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const onChange = () => setLocked(!!document.pointerLockElement)
    document.addEventListener('pointerlockchange', onChange)
    return () => {
      document.removeEventListener('pointerlockchange', onChange)
      if (document.pointerLockElement) document.exitPointerLock()
    }
  }, [])

  if (locked || fallback) return null

  const requestLock = (e: PointerEvent) => {
    e.preventDefault()
    // Lock the CANVAS (not <body>): while locked, mouse events target the lock
    // element, and R3F's shot handlers live on the canvas — locking an ancestor
    // would route clicks away from them.
    const canvas = document.querySelector('canvas')
    const req = canvas?.requestPointerLock?.()
    if (req && typeof (req as Promise<void>).catch === 'function') {
      ;(req as Promise<void>).catch(() => setFallback(true))
    }
  }

  return (
    <div className="lock-prompt" onPointerDown={requestLock}>
      <div className="lock-prompt__panel">
        <div className="lock-prompt__title">CLICK TO AIM</div>
        <div className="lock-prompt__hint">move mouse to scan &middot; click to shoot</div>
      </div>
    </div>
  )
}
