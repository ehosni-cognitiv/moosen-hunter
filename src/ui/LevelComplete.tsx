import { useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore } from '../state/gameStore'
import { TOTAL_LEVELS } from '../config/levels'
import { ANIMALS, hitBoxesFor } from '../config/animals'
import { makeAnimalFrames } from '../sprites/placeholders'

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

const REGION_LABEL = { head: 'Head', heart: 'Heart', body: 'Body' } as const

const subtotalOf = (r: { shots: { points: number }[]; bonus: number }) =>
  r.shots.reduce((s, x) => s + x.points, 0) + r.bonus

/** Animates a number toward `target`, starting from `initial` (on mount). */
function useCountUp(target: number, initial: number) {
  const [value, setValue] = useState(initial)
  const valueRef = useRef(initial)
  useEffect(() => {
    const from = valueRef.current
    if (from === target) return
    const start = performance.now()
    const dur = 450
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = Math.round(from + (target - from) * eased)
      valueRef.current = v
      setValue(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return value
}

export default function LevelComplete() {
  const level = useGameStore((s) => s.level)
  const totalScore = useGameStore((s) => s.totalScore)
  const levelScore = useGameStore((s) => s.levelScore)
  const results = useGameStore((s) => s.levelResults)
  const shotsFired = useGameStore((s) => s.levelShots)
  const hits = useGameStore((s) => s.levelHits)
  const accuracyBonus = useGameStore((s) => s.levelAccuracyBonus)
  const nextLevel = useGameStore((s) => s.nextLevel)

  const scoreBefore = totalScore - levelScore
  const tallied = useMemo(() => results.filter((r) => r.shots.length > 0), [results])
  const [i, setI] = useState(0)

  const isLastLevel = level >= TOTAL_LEVELS
  const isAccuracyStep = i >= tallied.length

  // Cumulative points revealed through the current step — the counter targets it.
  const revealed = useMemo(() => {
    let sum = 0
    for (let k = 0; k <= i && k < tallied.length; k++) sum += subtotalOf(tallied[k])
    if (i >= tallied.length) sum += accuracyBonus
    return sum
  }, [i, tallied, accuracyBonus])

  const displayedScore = useCountUp(scoreBefore + revealed, scoreBefore)

  const pct = shotsFired > 0 ? Math.round((hits / shotsFired) * 100) : 0

  // Bonus multiplies accuracy by (kills + headshots); rangers count for neither.
  const scored = results.filter((r) => ANIMALS[r.typeId].penalty == null)
  const kills = scored.filter((r) => r.killed).length
  const headshots = scored.reduce(
    (sum, r) => sum + r.shots.filter((s) => s.region === 'head').length,
    0,
  )

  return (
    <div className="screen">
      <div className="panel panel--wide">
        <div className="tally__score">
          <span className="tally__score-label">SCORE</span>
          <span className="tally__score-value">{displayedScore}</span>
        </div>

        {isAccuracyStep ? (
          <>
            <h2 className="panel__title panel__title--sm">ACCURACY</h2>
            <div className="results">
              <div className="results__row">
                <span>Shots fired</span>
                <b>{shotsFired}</b>
              </div>
              <div className="results__row">
                <span>Shots on target</span>
                <b>{hits}</b>
              </div>
              <div className="results__row">
                <span>Accuracy</span>
                <b className={pct >= 75 ? 'pos' : ''}>{pct}%</b>
              </div>
              <div className="results__row">
                <span>Kills</span>
                <b>{kills}</b>
              </div>
              <div className="results__row">
                <span>Headshots</span>
                <b>{headshots}</b>
              </div>
              <div className="results__row results__row--total">
                <span>Accuracy bonus</span>
                {accuracyBonus > 0 ? (
                  <b className="pos">
                    +{accuracyBonus}{' '}
                    <span className="tally__hint">
                      ({pct}% × ({kills} + {headshots}))
                    </span>
                  </b>
                ) : (
                  <b className="tally__hint">— need 75%+</b>
                )}
              </div>
            </div>
            <button className="btn btn--primary" onClick={nextLevel}>
              {isLastLevel ? 'SEE RESULTS' : 'NEXT LEVEL'}
            </button>
          </>
        ) : (
          <AnimalStep
            result={tallied[i]}
            index={i}
            count={tallied.length}
            onNext={() => setI(i + 1)}
          />
        )}
      </div>
    </div>
  )
}

function AnimalStep({
  result: r,
  index,
  count,
  onNext,
}: {
  result: ReturnType<typeof useGameStore.getState>['levelResults'][number]
  index: number
  count: number
  onNext: () => void
}) {
  const isRanger = ANIMALS[r.typeId].penalty != null
  return (
    <>
      <p className="tally__counter">
        Animal {index + 1} of {count}
      </p>
      <div className="tally">
        <HitDiagram result={r} />
        <div className="tally__detail">
          <div className="tally__name">
            {r.name}{' '}
            {isRanger ? (
              <span className="neg">✗ RANGER SHOT!</span>
            ) : r.killed ? (
              <span className="pos">✓ BAGGED</span>
            ) : (
              <span className="neg">wounded — escaped</span>
            )}
          </div>
          <ul className="tally__shots">
            {r.shots.map((s, k) => (
              <li key={k}>
                <span className={`dot dot--${s.region}`} />
                {REGION_LABEL[s.region]}
                <b className={s.points >= 0 ? 'pos' : 'neg'}>
                  {s.points >= 0 ? `+${s.points}` : s.points}
                </b>
              </li>
            ))}
            {r.killed && r.bonus > 0 && (
              <li>
                <span className="dot dot--bonus" />
                {r.typeId === 'moosen'
                  ? 'Moosen bonus'
                  : r.typeId === 'golden'
                    ? 'Golden headshot bonus'
                    : 'Kill bonus'}
                <b className="pos">+{r.bonus}</b>
              </li>
            )}
          </ul>
          <div className="tally__subtotal">
            <span>Subtotal</span>
            <b className={subtotalOf(r) >= 0 ? '' : 'neg'}>{subtotalOf(r)}</b>
          </div>
        </div>
      </div>
      <button className="btn btn--primary" onClick={onNext}>
        {index >= count - 1 ? 'ACCURACY BONUS' : 'NEXT ANIMAL'}
      </button>
    </>
  )
}

/** The animal silhouette with a marker at each recorded hit location. */
function HitDiagram({
  result,
}: {
  result: ReturnType<typeof useGameStore.getState>['levelResults'][number]
}) {
  const type = ANIMALS[result.typeId]
  const src = useMemo(() => {
    const canvas = makeAnimalFrames(type.spec, 'alert')[0]
    return canvas.toDataURL()
  }, [type])

  // The diagram shows the alert (heads-up) pose. Each shot's marker is remapped
  // from the pose it was taken in into the alert pose's matching region box, so
  // e.g. a grazing headshot still lands on the raised head.
  const markerPos = (s: (typeof result.shots)[number]) => {
    const from = hitBoxesFor(type, s.state)[s.region]
    const to = hitBoxesFor(type, 'alert')[s.region]
    const ru = from[2] === from[0] ? 0.5 : (s.u - from[0]) / (from[2] - from[0])
    const rv = from[3] === from[1] ? 0.5 : (s.v - from[1]) / (from[3] - from[1])
    const u = to[0] + clamp01(ru) * (to[2] - to[0])
    const v = to[1] + clamp01(rv) * (to[3] - to[1])
    return { left: `${u * 100}%`, top: `${(1 - v) * 100}%` }
  }

  return (
    <div className="tally__diagram">
      <img className="tally__img" src={src} alt={result.name} />
      {result.shots.map((s, k) => (
        <span key={k} className={`marker marker--${s.region}`} style={markerPos(s)} />
      ))}
    </div>
  )
}
