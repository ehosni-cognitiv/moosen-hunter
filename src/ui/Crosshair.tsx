import { useEffect, useRef } from 'react'
import { useGameStore } from '../state/gameStore'

/**
 * Centered aiming reticle. While reloading it's replaced by a "RELOADING…"
 * label (and doesn't pulse on click, since you can't fire). Also wires up
 * reload shortcuts: right-click or the `R` key.
 */
export default function Crosshair() {
  const ref = useRef<HTMLDivElement>(null)
  const reloading = useGameStore((s) => s.reloading)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') useGameStore.getState().reload()
    }
    const onContext = (e: MouseEvent) => {
      e.preventDefault()
      useGameStore.getState().reload()
    }
    const onDown = (e: MouseEvent) => {
      if (e.button === 2) {
        // right mouse button also reloads (works under pointer lock)
        useGameStore.getState().reload()
        return
      }
      const el = ref.current
      // don't pulse the reticle while reloading — the shot won't fire
      if (!el || useGameStore.getState().reloading) return
      el.classList.remove('crosshair--fire')
      void el.offsetWidth // force reflow so the animation can retrigger
      el.classList.add('crosshair--fire')
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('contextmenu', onContext)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('contextmenu', onContext)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return (
    <div className="crosshair-layer">
      <div ref={ref} className="crosshair">
        {reloading ? (
          <span className="crosshair__reloading">RELOADING…</span>
        ) : (
          <>
            <span className="crosshair__ring" />
            <span className="crosshair__dot" />
          </>
        )}
      </div>
    </div>
  )
}
