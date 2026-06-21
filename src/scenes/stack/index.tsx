import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useAppStore } from '../../core/store'
import { createState, startGame, tick } from './StackGame'
import type { StackState } from './StackGame'
import { installStackInput } from './StackInput'
import StackScene from './StackScene'
import StackHUD from './StackHUD'
import './stack.css'

const HIGHSCORE_KEY = 'nogp:v2:stack:highscore'
const MAXLINES_KEY  = 'nogp:v2:stack:maxlines'

function readInt(key: string): number {
  try { const v = localStorage.getItem(key); return v ? parseInt(v, 10) || 0 : 0 } catch { return 0 }
}
function writeInt(key: string, v: number): void {
  try { localStorage.setItem(key, String(v)) } catch { /* ignore */ }
}

function GameLoop({ state, onChange, onWin }: { state: StackState; onChange: () => void; onWin: (s: StackState) => void }) {
  const lastStatus = useRef(state.status)
  useFrame((_, dt) => {
    const dtMs = Math.min(dt, 1 / 15) * 1000
    tick(state, dtMs)
    if (state.status === 'gameover' && lastStatus.current !== 'gameover') onWin(state)
    lastStatus.current = state.status
    onChange()
  })
  return null
}

export default function StackRoot() {
  const setActiveScene = useAppStore((s) => s.setActiveScene)
  const [stateRef] = useState<{ current: StackState }>(() => ({ current: createState() }))
  const [, force] = useState(0)
  const [highScore, setHighScore] = useState(() => readInt(HIGHSCORE_KEY))
  const [maxLines, setMaxLines] = useState(() => readInt(MAXLINES_KEY))

  useEffect(() => {
    const uninstall = installStackInput(stateRef.current, () => setActiveScene('hub'))
    return uninstall
  }, [stateRef, setActiveScene])

  const handleStart = () => { startGame(stateRef.current); force((n) => n + 1) }
  const handleBack  = () => setActiveScene('hub')
  const handleWin = (s: StackState) => {
    if (s.score > highScore) { writeInt(HIGHSCORE_KEY, s.score); setHighScore(s.score) }
    if (s.lines > maxLines)  { writeInt(MAXLINES_KEY,  s.lines); setMaxLines(s.lines) }
  }

  return (
    <div className="stack">
      <div className="stack__canvas-wrap">
        <Canvas
          camera={{ position: [0, 0, 22], fov: 38 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
<ambientLight intensity={0.55} />
          <directionalLight position={[6, 10, 8]} intensity={1.0} color="#e8eef5" />
          <pointLight position={[-6, 4, 10]} intensity={1.6} color="#7a4cd6" distance={28} />
          <pointLight position={[6, -4, 10]} intensity={1.0} color="#b78aff" distance={24} />
          <GameLoop state={stateRef.current} onChange={() => force((n) => n + 1)} onWin={handleWin} />
          <StackScene state={stateRef.current} />
          <EffectComposer>
            <Bloom intensity={0.65} luminanceThreshold={0.25} luminanceSmoothing={0.85} mipmapBlur />
            <Vignette eskil={false} offset={0.15} darkness={0.7} />
          </EffectComposer>
        </Canvas>
      </div>
      <StackHUD state={stateRef.current} highScore={highScore} maxLines={maxLines} onStart={handleStart} onBack={handleBack} />
      <div className="stack__brand">OBSIDIAN STACK &mdash; 10x20 BOARD &middot; SINGLE 40 / DOUBLE 100 / TRIPLE 300 / TETRIS 1200 (x LEVEL+1)</div>
    </div>
  )
}
