import { useAppStore } from "../../core/store"
import type { SnakeState } from "./SnakeGame"

interface SnakeHUDProps {
  state: SnakeState
  highScore: number
  onStart: () => void
  onBack: () => void
}

function chainClass(m: number): string {
  if (m >= 5) return "is-active is-mega"
  if (m >= 3) return "is-active is-strong"
  if (m >= 2) return "is-active"
  return ""
}

export default function SnakeHUD({ state, highScore, onStart, onBack }: SnakeHUDProps) {
  const { snakeWraparound, setSnakeWraparound } = useAppStore()

  return (
    <div className="snake-hud">
      <button type="button" className="snake-hud__back" onClick={onBack}>
        ← HUB
      </button>

      <div className="snake-hud__score">
        <div className="snake-hud__score-block">
          <div className="snake-hud__score-label">SCORE</div>
          <div className="snake-hud__score-value">{state.score}</div>
        </div>
        <div className={`snake-hud__combo ${chainClass(state.multiplier)}`} key={`chain-${state.multiplier}`}>
          <div className="snake-hud__score-label">CHAIN</div>
          <div className="snake-hud__combo-value">x{state.multiplier}</div>
        </div>
        <div className="snake-hud__score-block">
          <div className="snake-hud__score-label">HIGH</div>
          <div className="snake-hud__score-value snake-hud__score-value--muted">{highScore}</div>
        </div>
      </div>

      {state.status === "menu" && (
        <div className="snake-hud__menu">
          <div className="snake-hud__title">OBSIDIAN SNAKE</div>

          <div className="snake-hud__group">
            <div className="snake-hud__group-label">WALLS</div>
            <div className="snake-hud__row">
              <button
                type="button"
                className={`snake-hud__opt ${snakeWraparound ? "is-active" : ""}`}
                onClick={() => setSnakeWraparound(true)}
              >WRAPAROUND</button>
              <button
                type="button"
                className={`snake-hud__opt ${!snakeWraparound ? "is-active" : ""}`}
                onClick={() => setSnakeWraparound(false)}
              >CLASSIC</button>
            </div>
          </div>

          <div className="snake-hud__controls">
            <div>MOVE: <b>W A S D</b>  or  <b>↑ ← ↓ →</b></div>
            <div>CHAIN: eat fruit within 3 seconds for combo</div>
            <div className="snake-hud__hint">SPACE to start - ESC to hub</div>
          </div>

          <button type="button" className="snake-hud__start" onClick={onStart}>
            START - PRESS SPACE
          </button>
        </div>
      )}

      {state.status === "gameover" && (
        <div className="snake-hud__menu">
          <div className="snake-hud__title">GAME OVER</div>
          <div className="snake-hud__final">
            <div className="snake-hud__final-row">SCORE <b>{state.score}</b></div>
            <div className="snake-hud__final-row">FRUITS <b>{state.fruitsEaten}</b></div>
            <div className="snake-hud__final-row snake-hud__final-row--chain">BEST CHAIN <b>x{state.maxChainThisRun}</b></div>
            <div className="snake-hud__final-row">BEST <b>{Math.max(highScore, state.score)}</b></div>
          </div>
          <button type="button" className="snake-hud__start" onClick={onStart}>
            REMATCH
          </button>
        </div>
      )}
    </div>
  )
}
