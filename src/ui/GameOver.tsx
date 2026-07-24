import { useState, type FormEvent } from 'react'
import { useGameStore } from '../state/gameStore'

export default function GameOver() {
  const totalScore = useGameStore((s) => s.totalScore)
  const submitScore = useGameStore((s) => s.submitScore)
  const [name, setName] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    submitScore(name)
  }

  return (
    <div className="screen">
      <div className="panel">
        <h2 className="panel__title panel__title--sm">HUNT COMPLETE</h2>
        <p className="panel__tag">Final score</p>
        <div className="finalscore">{totalScore}</div>

        <form className="entry" onSubmit={submit}>
          <label className="entry__label" htmlFor="initials">
            Enter your name for the leaderboard
          </label>
          <input
            id="initials"
            className="entry__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            placeholder="AAA"
            autoFocus
          />
          <button className="btn btn--primary" type="submit">
            SUBMIT SCORE
          </button>
        </form>
      </div>
    </div>
  )
}
