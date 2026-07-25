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

  useEffect(() => {
    const onChange = () => setLocked(!!document.pointerLockElement)
    document.addEventListener('pointerlockchange', onChange)
    return () => {
      document.removeEventListener('pointerlockchange', onChange)
      if (document.pointerLockElement) document.exitPointerLock()
    }
  }, [])

  if (locked) return null

  const requestLock = (e: PointerEvent) => {
    e.preventDefault()
    document.body.requestPointerLock?.()
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
