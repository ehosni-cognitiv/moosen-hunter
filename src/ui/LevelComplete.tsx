import { useMemo, useState } from 'react'
import { useGameStore } from '../state/gameStore'
import { TOTAL_LEVELS } from '../config/levels'
import { ANIMALS } from '../config/animals'
import { makeAnimalFrames } from '../sprites/placeholders'

const REGION_LABEL = { head: 'Head', heart: 'Heart', body: 'Body' } as const

export default function LevelComplete() {
  const level = useGameStore((s) => s.level)
  const results = useGameStore((s) => s.levelResults)
  const nextLevel = useGameStore((s) => s.nextLevel)

  // Only tally animals the hunter actually hit.
  const tallied = useMemo(
    () => results.filter((r) => r.shots.length > 0),
    [results],
  )
  const [i, setI] = useState(0)
  const isLastLevel = level >= TOTAL_LEVELS

  // No animals hit → skip straight to the summary.
  if (tallied.length === 0) {
    return (
      <div className="screen">
        <div className="panel">
          <h2 className="panel__title panel__title--sm">LEVEL {level} DONE</h2>
          <p className="panel__tag">The herd got away clean — nothing bagged.</p>
          <button className="btn btn--primary" onClick={nextLevel}>
            {isLastLevel ? 'SEE RESULTS' : 'NEXT LEVEL'}
          </button>
        </div>
      </div>
    )
  }

  const r = tallied[i]
  const subtotal =
    r.shots.reduce((s, x) => s + x.points, 0) + r.bonus
  const runningTotal = tallied
    .slice(0, i + 1)
    .reduce((sum, a) => sum + a.shots.reduce((s, x) => s + x.points, 0) + a.bonus, 0)

  const isLastAnimal = i >= tallied.length - 1

  return (
    <div className="screen">
      <div className="panel panel--wide">
        <h2 className="panel__title panel__title--sm">
          LEVEL {level} — TALLY
        </h2>
        <p className="tally__counter">
          Animal {i + 1} of {tallied.length}
        </p>

        <div className="tally">
          <HitDiagram result={r} />

          <div className="tally__detail">
            <div className="tally__name">
              {r.name}{' '}
              {r.killed ? (
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
                  <b className="pos">+{s.points}</b>
                </li>
              ))}
              {r.killed && (
                <li>
                  <span className="dot dot--bonus" />
                  Kill bonus
                  <b className="pos">+{r.bonus}</b>
                </li>
              )}
            </ul>
            <div className="tally__subtotal">
              <span>Subtotal</span>
              <b>{subtotal}</b>
            </div>
          </div>
        </div>

        <div className="tally__running">
          Running total <b>{runningTotal}</b>
        </div>

        <button
          className="btn btn--primary"
          onClick={() => (isLastAnimal ? nextLevel() : setI(i + 1))}
        >
          {isLastAnimal
            ? isLastLevel
              ? 'SEE RESULTS'
              : 'NEXT LEVEL'
            : 'NEXT ANIMAL'}
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
  const src = useMemo(() => {
    const type = ANIMALS[result.typeId]
    const canvas = makeAnimalFrames(type.spec, 'alert')[0]
    return canvas.toDataURL()
  }, [result.typeId])

  return (
    <div className="tally__diagram">
      <img className="tally__img" src={src} alt={result.name} />
      {result.shots.map((s, k) => (
        <span
          key={k}
          className={`marker marker--${s.region}`}
          style={{ left: `${s.u * 100}%`, top: `${(1 - s.v) * 100}%` }}
        />
      ))}
    </div>
  )
}
