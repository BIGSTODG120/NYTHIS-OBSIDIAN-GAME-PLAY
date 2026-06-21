import { useAppStore } from "../../core/store"
import type { PongState } from "./PongGame"
import { WIN_SCORE } from "./PongGame"

interface PongHUDProps {
  state: PongState
  highScore: number
  onStart: () => void
  onBack: () => void
}

export default function PongHUD({ state, highScore, onStart, onBack }: PongHUDProps) {
  const { pongMode, setPongMode, pongAITier, setPongAITier } = useAppStore()

  return (
    <div className="pong-hud">
      <button type="button" className="pong-hud__back" onClick={onBack}>
        ← HUB
      </button>

      <div className="pong-hud__score">
        <div className="pong-hud__score-side pong-hud__score-side--p1">
          <div className="pong-hud__score-label">
            {pongMode === "ai" ? "YOU" : "P1"}
          </div>
          <div className="pong-hud__score-value">{state.p1.score}</div>
        </div>
        <div className="pong-hud__score-divider">/</div>
        <div className="pong-hud__score-side pong-hud__score-side--p2">
          <div className="pong-hud__score-label">
            {pongMode === "ai" ? "AI" : "P2"}
          </div>
          <div className="pong-hud__score-value">{state.p2.score}</div>
        </div>
      </div>

      <div className="pong-hud__meta">
        FIRST TO {WIN_SCORE} - HIGH {highScore}
      </div>

      {state.status === "menu" && (
        <div className="pong-hud__menu">
          <div className="pong-hud__title">OBSIDIAN PONG</div>

          <div className="pong-hud__group">
            <div className="pong-hud__group-label">MODE</div>
            <div className="pong-hud__row">
              <button
                type="button"
                className={`pong-hud__opt ${pongMode === "ai" ? "is-active" : ""}`}
                onClick={() => setPongMode("ai")}
              >VS AI</button>
              <button
                type="button"
                className={`pong-hud__opt ${pongMode === "2p" ? "is-active" : ""}`}
                onClick={() => setPongMode("2p")}
              >2P LOCAL</button>
            </div>
          </div>

          {pongMode === "ai" && (
            <div className="pong-hud__group">
              <div className="pong-hud__group-label">AI TIER</div>
              <div className="pong-hud__row">
                <button
                  type="button"
                  className={`pong-hud__opt ${pongAITier === "easy" ? "is-active" : ""}`}
                  onClick={() => setPongAITier("easy")}
                >EASY</button>
                <button
                  type="button"
                  className={`pong-hud__opt ${pongAITier === "medium" ? "is-active" : ""}`}
                  onClick={() => setPongAITier("medium")}
                >MEDIUM</button>
                <button
                  type="button"
                  className={`pong-hud__opt ${pongAITier === "punisher" ? "is-active" : ""}`}
                  onClick={() => setPongAITier("punisher")}
                >PUNISHER</button>
              </div>
            </div>
          )}

          <div className="pong-hud__controls">
            <div>P1: <b>W / S</b>{pongMode === "2p" ? "" : "  or  ↑ / ↓"}</div>
            {pongMode === "2p" && <div>P2: <b>↑ / ↓</b></div>}
            <div className="pong-hud__hint">SPACE to serve - ESC to hub</div>
          </div>

          <button type="button" className="pong-hud__start" onClick={onStart}>
            START - PRESS SPACE
          </button>
        </div>
      )}

      {state.status === "gameover" && (
        <div className="pong-hud__menu">
          <div className="pong-hud__title">
            {state.winner === 1 ? (pongMode === "ai" ? "YOU WIN" : "P1 WINS") : (pongMode === "ai" ? "AI WINS" : "P2 WINS")}
          </div>
          <div className="pong-hud__final">{state.p1.score} - {state.p2.score}</div>
          <button type="button" className="pong-hud__start" onClick={onStart}>
            REMATCH
          </button>
        </div>
      )}
    </div>
  )
}
