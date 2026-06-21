import type { BreakState, PowerType } from "./BreakGame"
import { POWER_DURATION_MS } from "./BreakGame"

interface BreakHUDProps {
  state: BreakState
  highScore: number
  onStart: () => void
  onBack: () => void
}

const POWER_LABEL: Record<PowerType, string> = {
  expand: "EXPAND",
  multi: "MULTI",
  slow: "SLOW",
  laser: "LASER",
}

const POWER_COLOR: Record<PowerType, string> = {
  expand: "#5fd1ff",
  multi: "#ffd470",
  slow: "#9affc8",
  laser: "#ff6680",
}

function timeLeft(expiresAt: number, type: PowerType): number {
  const remain = expiresAt - performance.now()
  const full = POWER_DURATION_MS[type]
  if (full <= 0) return 0
  return Math.max(0, Math.min(1, remain / full))
}

export default function BreakHUD({ state, highScore, onStart, onBack }: BreakHUDProps) {
  return (
    <div className="break-hud">
      <button type="button" className="break-hud__back" onClick={onBack}>← HUB</button>

      <div className="break-hud__topbar">
        <div className="break-hud__block">
          <div className="break-hud__label">SCORE</div>
          <div className="break-hud__value break-hud__value--crystal">{state.score}</div>
        </div>
        <div className="break-hud__block">
          <div className="break-hud__label">LIVES</div>
          <div className="break-hud__lives">
            {Array.from({ length: state.lives }, (_, i) => (<span key={i} className="break-hud__life" />))}
          </div>
        </div>
        <div className="break-hud__block">
          <div className="break-hud__label">BRICKS</div>
          <div className="break-hud__value">{state.bricksBroken}</div>
        </div>
        <div className="break-hud__block">
          <div className="break-hud__label">HIGH</div>
          <div className="break-hud__value break-hud__value--muted">{highScore}</div>
        </div>
      </div>

      {state.activePowers.length > 0 && (
        <div className="break-hud__powers">
          {state.activePowers.map((p, i) => {
            const ratio = timeLeft(p.expiresAt, p.type)
            return (
              <div key={`${p.type}-${i}`} className="break-hud__power" style={{ borderColor: POWER_COLOR[p.type] }}>
                <div className="break-hud__power-label" style={{ color: POWER_COLOR[p.type] }}>{POWER_LABEL[p.type]}</div>
                <div className="break-hud__power-bar">
                  <div className="break-hud__power-bar-fill" style={{ width: `${ratio * 100}%`, background: POWER_COLOR[p.type] }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {state.status === "menu" && (
        <div className="break-hud__menu">
          <div className="break-hud__title">OBSIDIAN BREAK</div>
          <div className="break-hud__controls">
            <div>MOVE: <b>A / D</b>  or  <b>← / →</b></div>
            <div>SPIN: hold <b>SHIFT</b> while moving</div>
            <div>POWERS: catch crystal drops with paddle</div>
            <div className="break-hud__hint">SPACE to start - ESC to hub</div>
          </div>
          <button type="button" className="break-hud__start" onClick={onStart}>START - PRESS SPACE</button>
        </div>
      )}

      {state.status === "gameover" && (
        <div className="break-hud__menu">
          <div className="break-hud__title">GAME OVER</div>
          <div className="break-hud__final">
            <div className="break-hud__final-row">SCORE <b>{state.score}</b></div>
            <div className="break-hud__final-row">BRICKS <b>{state.bricksBroken}</b></div>
            <div className="break-hud__final-row">POWERS <b>{state.powerUpsCaught}</b></div>
            {state.lastPowerCaught && (
              <div className="break-hud__final-row break-hud__final-row--power">
                LAST POWER <b style={{ color: POWER_COLOR[state.lastPowerCaught] }}>{POWER_LABEL[state.lastPowerCaught]}</b>
              </div>
            )}
            <div className="break-hud__final-row">BEST <b>{Math.max(highScore, state.score)}</b></div>
          </div>
          <button type="button" className="break-hud__start" onClick={onStart}>REMATCH</button>
        </div>
      )}

      {state.status === "won" && (
        <div className="break-hud__menu">
          <div className="break-hud__title">WALL CLEARED</div>
          <div className="break-hud__final">
            <div className="break-hud__final-row">SCORE <b>{state.score}</b></div>
            <div className="break-hud__final-row">POWERS <b>{state.powerUpsCaught}</b></div>
            <div className="break-hud__final-row">LIVES LEFT <b>{state.lives}</b></div>
            <div className="break-hud__final-row">BEST <b>{Math.max(highScore, state.score)}</b></div>
          </div>
          <button type="button" className="break-hud__start" onClick={onStart}>NEW RUN</button>
        </div>
      )}
    </div>
  )
}
