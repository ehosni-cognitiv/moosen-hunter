import { useEffect, useRef } from 'react'
import { useGameStore } from '../state/gameStore'

/**
 * Custom crosshair that follows the mouse (the camera never moves, so this is
 * purely a screen-space aiming reticle). Also wires up reload shortcuts:
 * right-click or the `R` key.
 */
export default function Crosshair() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') useGameStore.getState().reload()
    }
    const onContext = (e: MouseEvent) => {
      e.preventDefault()
      useGameStore.getState().reload()
    }
    const onDown = () => {
      const el = ref.current
      if (!el) return
      el.classList.remove('crosshair--fire')
      // force reflow so the animation can retrigger
      void el.offsetWidth
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
        <span className="crosshair__ring" />
        <span className="crosshair__dot" />
      </div>
    </div>
  )
}
