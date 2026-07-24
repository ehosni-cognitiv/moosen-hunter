import { useGameStore } from '../state/gameStore'
import { LEVELS, TOTAL_LEVELS } from '../config/levels'
import { ANIMALS, SCORING } from '../config/animals'

const HERD_LABEL: Record<string, string> = {
  calm: 'GRAZING — take your time',
  alert: 'ALERT!',
  flee: 'FLEEING — shoot fast!',
}

export default function HUD() {
  const level = useGameStore((s) => s.level)
  const totalScore = useGameStore((s) => s.totalScore)
  const ammo = useGameStore((s) => s.ammo)
  const maxAmmo = useGameStore((s) => s.maxAmmo)
  const reloading = useGameStore((s) => s.reloading)
  const herdPhase = useGameStore((s) => s.herdPhase)
  const resolved = useGameStore((s) => s.levelResults.length)

  const cfg = LEVELS[level - 1]
  const remaining = Math.max(cfg.animalCount - resolved, 0)

  return (
    <div className="hud">
      <div className="hud__top">
        <div className="hud__stat">
          <span className="hud__label">Level</span>
          <span className="hud__value">
            {level}/{TOTAL_LEVELS}
          </span>
          <span className="hud__sub">{cfg.name}</span>
        </div>

        <div className="hud__stat hud__stat--center">
          <span className="hud__label">Score</span>
          <span className="hud__value hud__value--big">{totalScore}</span>
          <span className={`hud__herd hud__herd--${herdPhase}`}>
            {HERD_LABEL[herdPhase]}
          </span>
        </div>

        <div className="hud__stat hud__stat--right">
          <span className="hud__label">Animals left</span>
          <span className="hud__value">{remaining}</span>
        </div>
      </div>

      <div className="hud__ammo">
        {Array.from({ length: maxAmmo }).map((_, i) => (
          <span
            key={i}
            className={`shell ${i < ammo ? 'shell--full' : 'shell--empty'}`}
          />
        ))}
        <span className={`hud__reload ${reloading ? 'is-on' : ''}`}>
          {reloading
            ? 'RELOADING…'
            : ammo === 0
              ? 'RIGHT-CLICK / R TO RELOAD'
              : ''}
        </span>
      </div>

      <div className="legend">
        <span className="legend__item">
          <span className="legend__swatch legend__swatch--head" /> Head
          <span className="legend__pts pos">+{SCORING.head}</span>
        </span>
        <span className="legend__item">
          <span className="legend__swatch legend__swatch--heart" /> Heart
          <span className="legend__pts pos">+{SCORING.heart}</span>
        </span>
        <span className="legend__item">
          <span className="legend__swatch legend__swatch--body" /> Body
          <span className="legend__pts pos">+{SCORING.body}</span>
        </span>
        <span className="legend__item">
          Kill bonus
          <span className="legend__pts pos">+{ANIMALS.moose.killBonus}</span>
        </span>
        <span className="legend__item">
          🧔 Moosen bonus
          <span className="legend__pts pos">+{ANIMALS.moosen.killBonus}</span>
        </span>
        <span className="legend__item">
          🧢 Ranger — don't shoot!
          <span className="legend__pts neg">−{ANIMALS.ranger.penalty}</span>
        </span>
      </div>
    </div>
  )
}
