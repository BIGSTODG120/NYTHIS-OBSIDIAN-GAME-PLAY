import type { DriftState } from './DriftGame'

interface DriftHUDProps {
  state: DriftState
  highScore: number
  onStart: () => void
  onBack: () => void
}

export default function DriftHUD({ state, highScore, onStart, onBack }: DriftHUDProps) {
  return (
    <div className="drift-hud">
      <button type="button" className="drift-hud__back" onClick={onBack}>
        &larr; HUB
      </button>

      {state.status === 'playing' && (
        <div className="drift-hud__stats">
          <div className="drift-hud__stat">
            <div className="drift-hud__stat-label">SCORE</div>
            <div className="drift-hud__stat-value">{state.score.toLocaleString()}</div>
          </div>
          <div className="drift-hud__stat">
            <div className="drift-hud__stat-label">LIVES</div>
            <div className="drift-hud__stat-value drift-hud__stat-value--accent">{'A'.repeat(Math.max(0, state.lives))}</div>
          </div>
          <div className="drift-hud__stat">
            <div className="drift-hud__stat-label">WAVE</div>
            <div className="drift-hud__stat-value">{state.wave}</div>
          </div>
          <div className="drift-hud__stat">
            <div className="drift-hud__stat-label">HIGH</div>
            <div className="drift-hud__stat-value drift-hud__stat-value--muted">{highScore.toLocaleString()}</div>
          </div>
        </div>
      )}

      {state.status === 'menu' && (
        <div className="drift-hud__menu">
          <div className="drift-hud__title">OBSIDIAN DRIFT</div>
          <div className="drift-hud__controls">
            <div>ROTATE <b>A D</b> or <b>&larr; &rarr;</b></div>
            <div>THRUST <b>W</b> or <b>&uarr;</b> &nbsp;&middot;&nbsp; FIRE <b>SPACE</b></div>
            <div>HYPERSPACE <b>H</b> &nbsp;&middot;&nbsp; ESC to hub</div>
            <div className="drift-hud__hint">SCORING &mdash; LARGE 20 &middot; MEDIUM 50 &middot; SMALL 100 &middot; +1 LIFE EVERY 10K</div>
          </div>
          <button type="button" className="drift-hud__start" onClick={onStart}>
            START
          </button>
        </div>
      )}

      {state.status === 'gameover' && (
        <div className="drift-hud__menu">
          <div className="drift-hud__title drift-hud__title--lose">SHIP LOST</div>
          <div className="drift-hud__final">
            <div className="drift-hud__final-row">SCORE <b>{state.score.toLocaleString()}</b></div>
            <div className="drift-hud__final-row drift-hud__final-row--accent">WAVES CLEARED <b>{state.wavesCleared}</b></div>
            <div className="drift-hud__final-row drift-hud__final-row--thrust">THRUST FRAMES <b>{state.thrustFramesThisRun}</b></div>
            <div className="drift-hud__final-row drift-hud__final-row--hyper">HYPERSPACE <b>x{state.hyperspaceUses}</b>{state.hyperspaceLostShips > 0 ? <span className="drift-hud__loss"> ({state.hyperspaceLostShips} lost)</span> : null}</div>
            <div className="drift-hud__final-row">BEST <b>{Math.max(highScore, state.score).toLocaleString()}</b></div>
          </div>
          <button type="button" className="drift-hud__start" onClick={onStart}>
            REMATCH
          </button>
        </div>
      )}
    </div>
  )
}
