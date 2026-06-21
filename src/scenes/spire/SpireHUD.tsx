import type { SpireState } from './SpireGame'
import { totalSecondsStr } from './SpireGame'

interface Props {
  state: SpireState
  bestLevel: number
  bestTime: number
  onStart: () => void
  onBack: () => void
  onContinue: () => void
}

export default function SpireHUD({ state, bestLevel, bestTime, onStart, onBack, onContinue }: Props) {
  return (
    <div className="spire-hud">
      <button type="button" className="spire-hud__back" onClick={onBack}>&larr; HUB</button>

      {state.status === 'playing' && (
        <>
          <div className="spire-hud__stats">
            <div className="spire-hud__stat"><div className="spire-hud__stat-label">LEVEL</div><div className="spire-hud__stat-value spire-hud__stat-value--accent">{state.level}</div></div>
            <div className="spire-hud__stat"><div className="spire-hud__stat-label">FRAGMENTS</div><div className="spire-hud__stat-value">{state.fragmentsPlacedThisLevel}/{state.fragmentsRequired}</div></div>
            <div className="spire-hud__stat"><div className="spire-hud__stat-label">TIME</div><div className="spire-hud__stat-value">{totalSecondsStr(state)}</div></div>
            <div className="spire-hud__stat"><div className="spire-hud__stat-label">REWIND</div><div className="spire-hud__stat-value spire-hud__stat-value--upg1">x{state.rewindCharges}</div></div>
            <div className="spire-hud__stat"><div className="spire-hud__stat-label">SENSE</div><div className="spire-hud__stat-value spire-hud__stat-value--upg2">x{state.senseCharges}</div></div>
          </div>
          <div className="spire-hud__cursor-readout">
            RING <b>{state.cursorRing}</b> &middot; ANGLE <b>{Math.round((state.cursorAngle * 180 / Math.PI))}&deg;</b>
          </div>
        </>
      )}

      {state.status === 'menu' && (
        <div className="spire-hud__menu">
          <div className="spire-hud__title">OBSIDIAN SPIRE</div>
          <div className="spire-hud__subtitle">NYTHIS ORIGINAL &middot; CRYSTAL TOWER PUZZLE</div>
          <div className="spire-hud__controls">
            <div>ROTATE CURSOR <b>A D</b> or <b>&larr; &rarr;</b></div>
            <div>CHANGE RING <b>W</b>/<b>&uarr;</b> up &middot; <b>S</b>/<b>&darr;</b> down</div>
            <div>PLACE FRAGMENT <b>SPACE</b></div>
            <div>REWIND 3s <b>R</b> &middot; CRYSTAL SENSE <b>E</b> &middot; ESC to hub</div>
            <div className="spire-hud__hint">PLACE FRAGMENTS ON SOLID SLOTS &mdash; TOWER ROTATES &mdash; MISSED PLACEMENTS ADD A REQUIREMENT</div>
          </div>
          <button type="button" className="spire-hud__start" onClick={onStart}>ASCEND</button>
        </div>
      )}

      {state.status === 'level-clear' && (
        <div className="spire-hud__menu">
          <div className="spire-hud__title spire-hud__title--win">LEVEL {state.level} COMPLETE</div>
          <div className="spire-hud__final">
            <div className="spire-hud__final-row">FRAGMENTS PLACED <b>{state.fragmentsPlacedThisLevel}</b></div>
            <div className="spire-hud__final-row spire-hud__final-row--upg1">REWINDS USED <b>x{state.rewindsUsed}</b></div>
            <div className="spire-hud__final-row spire-hud__final-row--upg2">SENSES USED <b>x{state.sensesUsed}</b></div>
            <div className="spire-hud__final-row spire-hud__final-row--accent">TOTAL TIME <b>{totalSecondsStr(state)}</b></div>
            <div className="spire-hud__final-row spire-hud__final-row--muted">BEST LEVEL <b>{Math.max(bestLevel, state.level)}</b></div>
          </div>
          <button type="button" className="spire-hud__start" onClick={onContinue}>ASCEND TO LEVEL {state.level + 1}</button>
        </div>
      )}

      {state.status === 'gameover' && (
        <div className="spire-hud__menu">
          <div className="spire-hud__title spire-hud__title--lose">SPIRE COLLAPSED</div>
          <div className="spire-hud__final">
            <div className="spire-hud__final-row">LEVEL REACHED <b>{state.level}</b></div>
            <div className="spire-hud__final-row spire-hud__final-row--upg1">REWINDS USED <b>x{state.rewindsUsed}</b></div>
            <div className="spire-hud__final-row spire-hud__final-row--upg2">SENSES USED <b>x{state.sensesUsed}</b></div>
            <div className="spire-hud__final-row spire-hud__final-row--accent">TOTAL TIME <b>{totalSecondsStr(state)}</b></div>
            <div className="spire-hud__final-row">BEST LEVEL <b>{Math.max(bestLevel, state.level)}</b></div>
            <div className="spire-hud__final-row spire-hud__final-row--muted">BEST TIME <b>{Math.max(bestTime, state.totalTimeMs) > 0 ? Math.floor(Math.max(bestTime, state.totalTimeMs) / 1000) + 's' : '--'}</b></div>
          </div>
          <button type="button" className="spire-hud__start" onClick={onStart}>REBUILD</button>
        </div>
      )}
    </div>
  )
}
