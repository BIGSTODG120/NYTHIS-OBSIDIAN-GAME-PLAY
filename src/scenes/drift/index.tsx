import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useAppStore } from '../../core/store'
import { createState, startGame, tick } from './DriftGame'
import type { DriftState } from './DriftGame'
import { installDriftInput, applyRotationFrame } from './DriftInput'
import DriftScene from './DriftScene'
import DriftHUD from './DriftHUD'
import './drift.css'

const HIGHSCORE_KEY = 'nogp:v2:drift:highscore'

function readHighScore(): number {
  try {
    const v = localStorage.getItem(HIGHSCORE_KEY)
    return v ? parseInt(v, 10) || 0 : 0
  } catch { return 0 }
}

function writeHighScore(v: number): void {
  try { localStorage.setItem(HIGHSCORE_KEY, String(v)) } catch { /* ignore */ }
}

interface LoopProps {
  state: DriftState
  onChange: () => void
  onWin: (finalScore: number) => void
}

function GameLoop({ state, onChange, onWin }: LoopProps) {
  const lastStatus = useRef(state.status)

  useFrame((_, dt) => {
    const clamped = Math.min(dt, 1 / 30)
    applyRotationFrame(state, clamped)
    tick(state, clamped)

    if (state.status === 'gameover' && lastStatus.current !== 'gameover') {
      onWin(state.score)
    }
    lastStatus.current = state.status

    onChange()
  })

  return null
}

export default function DriftRoot() {
  const setActiveScene = useAppStore((s) => s.setActiveScene)
  const [stateRef] = useState<{ current: DriftState }>(() => ({ current: createState() }))
  const [, force] = useState(0)
  const [highScore, setHighScore] = useState(() => readHighScore())

  useEffect(() => {
    const uninstall = installDriftInput(stateRef.current, () => setActiveScene('hub'))
    return uninstall
  }, [stateRef, setActiveScene])

  const handleStart = () => {
    startGame(stateRef.current)
    force((n) => n + 1)
  }

  const handleBack = () => setActiveScene('hub')

  const handleWin = (finalScore: number) => {
    if (finalScore > highScore) {
      writeHighScore(finalScore)
      setHighScore(finalScore)
    }
  }

  return (
    <div className="drift">
      <div className="drift__canvas-wrap">
        <Canvas
          camera={{ position: [0, 0, 14], fov: 35 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
<ambientLight intensity={0.4} />
          <directionalLight position={[6, 6, 8]} intensity={0.9} color="#e8eef5" />
          <pointLight position={[-6, 4, 6]} intensity={2.0} color="#7a4cd6" distance={20} />
          <pointLight position={[6, -4, 6]} intensity={1.3} color="#b78aff" distance={18} />
          <GameLoop state={stateRef.current} onChange={() => force((n) => n + 1)} onWin={handleWin} />
          <DriftScene state={stateRef.current} />
          <EffectComposer>
            <Bloom intensity={0.7} luminanceThreshold={0.2} luminanceSmoothing={0.85} mipmapBlur />
            <Vignette eskil={false} offset={0.15} darkness={0.75} />
          </EffectComposer>
        </Canvas>
      </div>
      <DriftHUD state={stateRef.current} highScore={highScore} onStart={handleStart} onBack={handleBack} />
      <div className="drift__brand">OBSIDIAN DRIFT &mdash; ASTEROID FIELD &middot; LARGE 20 / MED 50 / SMALL 100 / +LIFE 10K</div>
    </div>
  )
}
