import { useGameStore } from './state/gameStore'
import Game from './game/Game'
import Crosshair from './ui/Crosshair'
import HUD from './ui/HUD'
import TitleScreen from './ui/TitleScreen'
import LevelComplete from './ui/LevelComplete'
import GameOver from './ui/GameOver'
import Leaderboard from './ui/Leaderboard'
import './App.css'
import './ui/ui.css'

function App() {
  const phase = useGameStore((s) => s.phase)
  const playing = phase === 'playing'

  return (
    <div className={`app ${playing ? 'app--playing' : ''}`}>
      {playing && (
        <>
          <Game />
          <HUD />
          <Crosshair />
        </>
      )}
      {phase === 'title' && <TitleScreen />}
      {phase === 'levelComplete' && <LevelComplete />}
      {phase === 'gameover' && <GameOver />}
      {phase === 'leaderboard' && <Leaderboard />}
    </div>
  )
}

export default App
