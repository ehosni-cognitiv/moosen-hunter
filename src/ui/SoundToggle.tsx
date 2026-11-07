import { useEffect } from 'react'
import { useGameStore } from '../state/gameStore'
import { playSfx } from '../audio/sfx'

/**
 * Sound controls, in one place:
 *  - the mute button, shown on the between-round screens only — mid-hunt
 *    it would sit over the scene with the pointer locked to the canvas, so it
 *    couldn't be clicked anyway;
 *  - the `M` shortcut, which works everywhere, including mid-hunt;
 *  - the arcade blip every other UI button makes, wired once by delegation
 *    rather than threaded through each screen's handlers. This button is
 *    exempt: muting shouldn't make a noise, and toggleMute() already blips
 *    when it turns the sound back on.
 */
export default function SoundToggle() {
  const muted = useGameStore((s) => s.muted)
  const playing = useGameStore((s) => s.phase === 'playing')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') useGameStore.getState().toggleMute()
    }
    const onDown = (e: PointerEvent) => {
      const btn = (e.target as HTMLElement | null)?.closest?.('.btn')
      if (btn && !btn.classList.contains('btn--sound')) playSfx('uiClick')
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [])

  if (playing) return null

  return (
    <div className="sound-toggle">
      <button
        className="btn btn--sound"
        title={muted ? 'Unmute (M)' : 'Mute (M)'}
        aria-label={muted ? 'Unmute (M)' : 'Mute (M)'}
        onClick={() => useGameStore.getState().toggleMute()}
      >
        {muted ? 'Unmute' : 'Mute'} (M)
      </button>
    </div>
  )
}
