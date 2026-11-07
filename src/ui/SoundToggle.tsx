import { useEffect } from 'react'
import { useGameStore } from '../state/gameStore'
import { playSfx } from '../audio/sfx'

/**
 * Sound controls, in one place:
 *  - the mute indicator, clickable between rounds;
 *  - the `M` shortcut, which still works mid-hunt (the pointer is locked to
 *    the canvas then, so the button itself can't be clicked);
 *  - the arcade blip every UI button makes, wired once by delegation rather
 *    than threaded through each screen's handlers.
 */
export default function SoundToggle() {
  const muted = useGameStore((s) => s.muted)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') useGameStore.getState().toggleMute()
    }
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('.btn')) playSfx('uiClick')
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return (
    <div className="sound-toggle">
      <button
        className="btn btn--sound"
        onClick={() => useGameStore.getState().toggleMute()}
      >
        {muted ? 'SOUND OFF' : 'SOUND ON'} (M)
      </button>
    </div>
  )
}
