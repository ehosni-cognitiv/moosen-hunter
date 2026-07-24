import { useGameStore } from '../state/gameStore'

export default function Leaderboard() {
  const leaderboard = useGameStore((s) => s.leaderboard)
  const startGame = useGameStore((s) => s.startGame)
  const backToTitle = useGameStore((s) => s.backToTitle)

  return (
    <div className="screen">
      <div className="panel">
        <h2 className="panel__title panel__title--sm">LEADERBOARD</h2>

        {leaderboard.length === 0 ? (
          <p className="panel__tag">No scores yet — be the first!</p>
        ) : (
          <ol className="board">
            {leaderboard.map((e, i) => (
              <li key={i} className="board__row">
                <span className="board__rank">{i + 1}</span>
                <span className="board__name">{e.name}</span>
                <span className="board__score">{e.score}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="panel__buttons">
          <button className="btn btn--primary" onClick={startGame}>
            PLAY AGAIN
          </button>
          <button className="btn" onClick={backToTitle}>
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  )
}
