import type { StackState } from './StackGame'

interface Props {
  state: StackState
  highScore: number
  maxLines: number
  onStart: () => void
  onBack: () => void
}

const PIECE_COLOR: Record<string, string> = {
  I: '#22d3ee', O: '#fbbf24', T: '#a855f7',
  S: '#22c55e', Z: '#ef4444', J: '#3b82f6', L: '#fb923c',
}

function PieceMini({ type }: { type: string }) {
  return (
    <span className="stack-hud__piece" style={{ background: PIECE_COLOR[type] || '#9b8fb8' }}>
      {type}
    </span>
  )
}

export default function StackHUD({ state, highScore, maxLines, onStart, onBack }: Props) {
  return (
    <div className="stack-hud">
      <button type="button" className="stack-hud__back" onClick={onBack}>
        &larr; HUB
      </button>

      {state.status === 'playing' && (
        <>
          <div className="stack-hud__stats">
            <div className="stack-hud__stat"><div className="stack-hud__stat-label">SCORE</div><div className="stack-hud__stat-value">{state.score.toLocaleString()}</div></div>
            <div className="stack-hud__stat"><div className="stack-hud__stat-label">LINES</div><div className="stack-hud__stat-value">{state.lines}</div></div>
            <div className="stack-hud__stat"><div className="stack-hud__stat-label">LEVEL</div><div className="stack-hud__stat-value stack-hud__stat-value--accent">{state.level}</div></div>
            <div className="stack-hud__stat"><div className="stack-hud__stat-label">HIGH</div><div className="stack-hud__stat-value stack-hud__stat-value--muted">{highScore.toLocaleString()}</div></div>
          </div>

          <div className="stack-hud__sidepanel stack-hud__sidepanel--right">
            <div className="stack-hud__panel-title">NEXT</div>
            <div className="stack-hud__piece-list">
              {state.next.slice(0, 3).map((t, i) => <PieceMini key={`n-${i}`} type={t} />)}
            </div>
          </div>

          <div className="stack-hud__sidepanel stack-hud__sidepanel--left">
            <div className="stack-hud__panel-title">HOLD</div>
            <div className="stack-hud__piece-list">
              {state.hold ? <PieceMini type={state.hold} /> : <span className="stack-hud__empty">--</span>}
            </div>
            <div className="stack-hud__hint">HOLDS x{state.holdsUsed}</div>
          </div>
        </>
      )}

      {state.status === 'menu' && (
        <div className="stack-hud__menu">
          <div className="stack-hud__title">OBSIDIAN STACK</div>
          <div className="stack-hud__controls">
            <div>MOVE <b>A D</b> or <b>&larr; &rarr;</b></div>
            <div>ROTATE <b>W</b>/<b>&uarr;</b> CW &nbsp;&middot;&nbsp; <b>Z</b> CCW</div>
            <div>SOFT DROP <b>S</b>/<b>&darr;</b> &nbsp;&middot;&nbsp; HARD DROP <b>SPACE</b></div>
            <div>HOLD <b>C</b>/<b>SHIFT</b> &nbsp;&middot;&nbsp; ESC to hub</div>
            <div className="stack-hud__hint">SCORING &mdash; SINGLE 40 &middot; DOUBLE 100 &middot; TRIPLE 300 &middot; TETRIS 1200 (x LEVEL+1)</div>
          </div>
          <button type="button" className="stack-hud__start" onClick={onStart}>START</button>
        </div>
      )}

      {state.status === 'gameover' && (
        <div className="stack-hud__menu">
          <div className="stack-hud__title stack-hud__title--lose">STACK COLLAPSED</div>
          <div className="stack-hud__final">
            <div className="stack-hud__final-row">SCORE <b>{state.score.toLocaleString()}</b></div>
            <div className="stack-hud__final-row stack-hud__final-row--accent">LINES <b>{state.lines}</b></div>
            <div className="stack-hud__final-row">LEVEL REACHED <b>{state.level}</b></div>
            <div className="stack-hud__final-row stack-hud__final-row--upg1">HOLDS USED <b>x{state.holdsUsed}</b></div>
            <div className="stack-hud__final-row stack-hud__final-row--upg2">GARBAGE SURVIVED <b>{state.garbageRowsSurvived}</b></div>
            <div className="stack-hud__final-row">BEST <b>{Math.max(highScore, state.score).toLocaleString()}</b></div>
            <div className="stack-hud__final-row stack-hud__final-row--muted">MAX LINES EVER <b>{Math.max(maxLines, state.lines)}</b></div>
          </div>
          <button type="button" className="stack-hud__start" onClick={onStart}>REMATCH</button>
        </div>
      )}
    </div>
  )
}
