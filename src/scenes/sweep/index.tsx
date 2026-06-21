import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useAppStore } from '../../core/store'
import { SweepGame } from './SweepGame'
import type { SweepSnapshot } from './SweepGame'
import { SweepInput } from './SweepInput'
import SweepScene from './SweepScene'
import SweepHUD from './SweepHUD'
import './sweep.css'

const BEST_TIME_KEY = 'nogp:v2:sweep:besttime'
const DAILY_KEY = (d: string) => `nogp:v2:sweep:daily:${d}`

function readBestTime(): number | null {
  try {
    const v = localStorage.getItem(BEST_TIME_KEY)
    if (!v) return null
    const n = parseInt(v, 10)
    return Number.isFinite(n) && n > 0 ? n : null
  } catch { return null }
}

function writeBestTime(ms: number): void {
  try { localStorage.setItem(BEST_TIME_KEY, String(Math.floor(ms))) } catch { /* ignore */ }
}

function recordDaily(date: string, ms: number, chords: number): void {
  try {
    localStorage.setItem(DAILY_KEY(date), JSON.stringify({ ms: Math.floor(ms), chords, ts: Date.now() }))
  } catch { /* ignore */ }
}

interface TickerProps {
  game: SweepGame
  onTick: () => void
}

function Ticker({ game, onTick }: TickerProps) {
  const lastSync = useRef(0)
  useFrame(() => {
    if (game.state !== 'playing') return
    const now = performance.now()
    if (now - lastSync.current > 250) {
      lastSync.current = now
      onTick()
    }
  })
  return null
}

export default function SweepRoot() {
  const setActiveScene = useAppStore((s) => s.setActiveScene)
  const gameRef = useRef<SweepGame>(new SweepGame())
  const [snapshot, setSnapshot] = useState<SweepSnapshot>(() => gameRef.current.snapshot())
  const [bestTime, setBestTime] = useState<number | null>(() => readBestTime())

  const sync = () => setSnapshot(gameRef.current.snapshot())

  const handleNewGame = (daily: boolean) => {
    gameRef.current.reset(daily)
    // Transition out of 'idle' so the menu dismisses on STANDARD/DAILY click.
    // First reveal will still place mines and start timer (firstClick guard).
    gameRef.current.state = 'playing'
    sync()
  }

  const handleBack = () => setActiveScene('hub')

  const handleReveal = (x: number, y: number, _shift: boolean) => {
    const g = gameRef.current
    const prevState = g.state
    const i = y * g.width + x
    const cell = g.cells[i]
    if (!cell) return

    if (cell.revealed && !cell.mine && cell.neighbors > 0) {
      g.chord(x, y)
    } else if (cell.revealed) {
      return
    } else {
      g.reveal(x, y)
    }

    if (prevState !== 'won' && g.state === 'won') {
      const ms = g.elapsedMs
      if (g.dailyMode) {
        recordDaily(g.dailyDate, ms, g.chordsUsed)
      } else {
        if (bestTime === null || ms < bestTime) {
          writeBestTime(ms)
          setBestTime(Math.floor(ms))
        }
      }
    }
    sync()
  }

  const handleFlag = (x: number, y: number) => {
    gameRef.current.flag(x, y)
    sync()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setActiveScene('hub')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setActiveScene])

  return (
    <div className="sweep" onContextMenu={(e) => e.preventDefault()}>
      <div className="sweep__canvas-wrap">
        <Canvas
          camera={{ position: [0, 11, 0.01], fov: 38 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
<ambientLight intensity={0.55} />
          <directionalLight position={[4, 12, 6]} intensity={1.0} color="#e8eef5" />
          <pointLight position={[-5, 8, 5]} intensity={2.2} color="#7a4cd6" distance={18} />
          <pointLight position={[5, 8, -5]} intensity={1.4} color="#b78aff" distance={16} />
          <pointLight position={[0, -3, 0]} intensity={0.9} color="#9b5cff" distance={10} />
          <Ticker game={gameRef.current} onTick={sync} />
          <SweepScene snapshot={snapshot} onReveal={handleReveal} onFlag={handleFlag} />
          <EffectComposer>
            <Bloom intensity={0.6} luminanceThreshold={0.25} luminanceSmoothing={0.85} mipmapBlur />
            <Vignette eskil={false} offset={0.15} darkness={0.75} />
          </EffectComposer>
        </Canvas>
      </div>
      <SweepInput onNewGame={handleNewGame} />
      <SweepHUD snapshot={snapshot} bestTime={bestTime} onStart={handleNewGame} onBack={handleBack} />
      <div className="sweep__brand">OBSIDIAN SWEEP &mdash; 9 &times; 9 &middot; 10 MINES</div>
    </div>
  )
}


