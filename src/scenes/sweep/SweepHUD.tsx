import type { SweepSnapshot } from './SweepGame'

interface SweepHUDProps {
  snapshot: SweepSnapshot
  bestTime: number | null
  onStart: (daily: boolean) => void
  onBack: () => void
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export default function SweepHUD({ snapshot, bestTime, onStart, onBack }: SweepHUDProps) {
  const minesRemaining = snapshot.totalMines - snapshot.flagsCount
  const showStats = snapshot.state !== 'idle'

  return (
    <div className="sweep-hud">
      <button type="button" className="sweep-hud__back" onClick={onBack}>&larr; HUB</button>

      {showStats && (
        <div className="sweep-hud__stats">
          <div className="sweep-hud__stat">
            <div className="sweep-hud__stat-label">MINES</div>
            <div className="sweep-hud__stat-value">{String(Math.max(0, minesRemaining)).padStart(2, '0')}</div>
          </div>
          <div className="sweep-hud__stat">
            <div className="sweep-hud__stat-label">TIME</div>
            <div className="sweep-hud__stat-value">{formatTime(snapshot.elapsedMs)}</div>
          </div>
          <div className="sweep-hud__stat">
            <div className="sweep-hud__stat-label">CHORDS</div>
            <div className="sweep-hud__stat-value sweep-hud__stat-value--accent">{snapshot.chordsUsed}</div>
          </div>
          <div className="sweep-hud__stat">
            <div className="sweep-hud__stat-label">BEST</div>
            <div className="sweep-hud__stat-value sweep-hud__stat-value--muted">{bestTime !== null ? formatTime(bestTime) : '--:--'}</div>
          </div>
          {snapshot.dailyMode && <div className="sweep-hud__daily-badge">DAILY {snapshot.dailyDate}</div>}
        </div>
      )}

      {snapshot.state === 'idle' && (
        <div className="sweep-hud__menu">
          <div className="sweep-hud__title">OBSIDIAN SWEEP</div>
          <div className="sweep-hud__controls">
            <div>LEFT-CLICK <b>REVEAL</b> &nbsp;&nbsp; RIGHT-CLICK <b>FLAG</b></div>
            <div>CLICK A NUMBER WITH CORRECT FLAGS &rarr; <b>CHORD-CLICK</b></div>
            <div>R = restart standard &nbsp; D = daily seed</div>
            <div className="sweep-hud__hint">9 &times; 9 BOARD &middot; 10 MINES &middot; FIRST CLICK IS ALWAYS SAFE</div>
          </div>
          <div className="sweep-hud__row">
            <button type="button" className="sweep-hud__start" onClick={() => onStart(false)}>STANDARD</button>
            <button type="button" className="sweep-hud__start sweep-hud__start--alt" onClick={() => onStart(true)}>DAILY SEED</button>
          </div>
        </div>
      )}

      {snapshot.state === 'won' && (
        <div className="sweep-hud__menu">
          <div className="sweep-hud__title sweep-hud__title--win">SWEPT CLEAN</div>
          <div className="sweep-hud__final">
            <div className="sweep-hud__final-row">TIME <b>{formatTime(snapshot.elapsedMs)}</b></div>
            <div className="sweep-hud__final-row sweep-hud__final-row--chord">CHORDS USED <b>x{snapshot.chordsUsed}</b></div>
            {snapshot.dailyMode && <div className="sweep-hud__final-row sweep-hud__final-row--daily">DAILY <b>{snapshot.dailyDate}</b></div>}
            <div className="sweep-hud__final-row">BEST <b>{formatTime(bestTime !== null ? Math.min(bestTime, snapshot.elapsedMs) : snapshot.elapsedMs)}</b></div>
          </div>
          <div className="sweep-hud__row">
            <button type="button" className="sweep-hud__start" onClick={() => onStart(false)}>NEW STANDARD</button>
            <button type="button" className="sweep-hud__start sweep-hud__start--alt" onClick={() => onStart(true)}>NEW DAILY</button>
          </div>
        </div>
      )}

      {snapshot.state === 'lost' && (
        <div className="sweep-hud__menu">
          <div className="sweep-hud__title sweep-hud__title--lose">DETONATED</div>
          <div className="sweep-hud__final">
            <div className="sweep-hud__final-row">TIME <b>{formatTime(snapshot.elapsedMs)}</b></div>
            <div className="sweep-hud__final-row sweep-hud__final-row--chord">CHORDS USED <b>x{snapshot.chordsUsed}</b></div>
            {snapshot.dailyMode && <div className="sweep-hud__final-row sweep-hud__final-row--daily">DAILY <b>{snapshot.dailyDate}</b></div>}
          </div>
          <div className="sweep-hud__row">
            <button type="button" className="sweep-hud__start" onClick={() => onStart(false)}>RETRY STANDARD</button>
            <button type="button" className="sweep-hud__start sweep-hud__start--alt" onClick={() => onStart(true)}>RETRY DAILY</button>
          </div>
        </div>
      )}
    </div>
  )
}
