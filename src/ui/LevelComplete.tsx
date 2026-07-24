import { useMemo, useState } from 'react'
import { useGameStore } from '../state/gameStore'
import { TOTAL_LEVELS } from '../config/levels'
import { ANIMALS, hitBoxesFor } from '../config/animals'
import { makeAnimalFrames } from '../sprites/placeholders'

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

const REGION_LABEL = { head: 'Head', heart: 'Heart', body: 'Body' } as const

const subtotalOf = (r: { shots: { points: number }[]; bonus: number }) =>
  r.shots.reduce((s, x) => s + x.points, 0) + r.bonus

export default function LevelComplete() {
  const level = useGameStore((s) => s.level)
  const results = useGameStore((s) => s.levelResults)
  const shotsFired = useGameStore((s) => s.levelShots)
  const hits = useGameStore((s) => s.levelHits)
  const accuracyBonus = useGameStore((s) => s.levelAccuracyBonus)
  const nextLevel = useGameStore((s) => s.nextLevel)

  const tallied = useMemo(() => results.filter((r) => r.shots.length > 0), [results])
  const [i, setI] = useState(0)
  const isLastLevel = level >= TOTAL_LEVELS
  const advanceLabel = isLastLevel ? 'SEE RESULTS' : 'NEXT LEVEL'

  const animalsTotal = tallied.reduce((sum, r) => sum + subtotalOf(r), 0)
  const isAccuracyStep = i >= tallied.length

  // ---- final step: accuracy bonus ----
  if (isAccuracyStep) {
    const pct = shotsFired > 0 ? Math.round((hits / shotsFired) * 100) : 0
    return (
      <div className="screen">
        <div className="panel panel--wide">
          <h2 className="panel__title panel__title--sm">LEVEL {level} — ACCURACY</h2>
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
              <b>{pct}%</b>
            </div>
            <div className="results__row results__row--total">
              <span>Accuracy bonus</span>
              <b className="pos">+{accuracyBonus}</b>
            </div>
          </div>
          <div className="tally__running">
            Level total <b>{animalsTotal + accuracyBonus}</b>
          </div>
          <button className="btn btn--primary" onClick={nextLevel}>
            {advanceLabel}
          </button>
        </div>
      </div>
    )
  }

  // ---- per-animal tally ----
  const r = tallied[i]
  const runningTotal = tallied.slice(0, i + 1).reduce((s, a) => s + subtotalOf(a), 0)

  return (
    <div className="screen">
      <div className="panel panel--wide">
        <h2 className="panel__title panel__title--sm">LEVEL {level} — TALLY</h2>
        <p className="tally__counter">
          Animal {i + 1} of {tallied.length}
        </p>

        <div className="tally">
          <HitDiagram result={r} />

          <div className="tally__detail">
            <div className="tally__name">
              {r.name}{' '}
              {ANIMALS[r.typeId].penalty != null ? (
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
                  {r.typeId === 'moosen' ? 'Moosen bonus' : 'Kill bonus'}
                  <b className="pos">+{r.bonus}</b>
                </li>
              )}
            </ul>
            <div className="tally__subtotal">
              <span>Subtotal</span>
              <b>{subtotalOf(r)}</b>
            </div>
          </div>
        </div>

        <div className="tally__running">
          Running total <b>{runningTotal}</b>
        </div>

        <button className="btn btn--primary" onClick={() => setI(i + 1)}>
          {i >= tallied.length - 1 ? 'ACCURACY BONUS' : 'NEXT ANIMAL'}
        </button>
      </div>
    </div>
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
