import { useGameStore } from '../state/gameStore'
import { TOTAL_LEVELS } from '../config/levels'

export default function TitleScreen() {
  const startGame = useGameStore((s) => s.startGame)
  const showLeaderboard = useGameStore((s) => s.showLeaderboard)

  return (
    <div className="screen">
      <div className="panel">
        <h1 className="panel__title">MOOSEN HUNTER</h1>
        <p className="panel__tag">
          {TOTAL_LEVELS} forests. Bag the moosen. Spare the rangers.
        </p>

        <div className="panel__how">
          <p>
            <b>Move</b> the mouse to aim &middot; <b>Click</b> to shoot
          </p>
          <p>
            <b>Right-click</b> or <b>R</b> to reload
          </p>
          <p>
            The herd grazes calmly — <b>your first shot spooks them</b>, then
            they scatter. Line up your shots, then bag them before they flee.
          </p>
          <p>
            <span className="pos">Head +100</span> &middot;{' '}
            <span className="neg">Heart +50</span> &middot; Body +20 &middot;
            kill bonus +100
          </p>
        </div>

        <div className="panel__buttons">
          <button className="btn btn--primary" onClick={startGame}>
            START HUNT
          </button>
          <button className="btn" onClick={showLeaderboard}>
            LEADERBOARD
          </button>
        </div>
      </div>
    </div>
  )
}
