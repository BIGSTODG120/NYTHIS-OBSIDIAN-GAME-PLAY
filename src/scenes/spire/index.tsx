import { useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useAppStore } from '../../core/store'
import { createState, startGame, tick, nextLevel } from './SpireGame'
import type { SpireState } from './SpireGame'
import { installSpireInput } from './SpireInput'
import SpireScene from './SpireScene'
import SpireHUD from './SpireHUD'
import './spire.css'

const LEVEL_KEY = 'nogp:v2:spire:level'
const TIME_KEY  = 'nogp:v2:spire:totaltime'

function readInt(key: string): number {
  try { const v = localStorage.getItem(key); return v ? parseInt(v, 10) || 0 : 0 } catch { return 0 }
}
function writeInt(key: string, v: number): void {
  try { localStorage.setItem(key, String(v)) } catch { /* ignore */ }
}

function GameLoop({ state, onChange }: { state: SpireState; onChange: () => void }) {
  useFrame((_, dt) => {
    const dtMs = Math.min(dt, 1 / 15) * 1000
    tick(state, dtMs)
    onChange()
  })
  return null
}

export default function SpireRoot() {
  const setActiveScene = useAppStore((s) => s.setActiveScene)
  const [stateRef] = useState<{ current: SpireState }>(() => ({ current: createState() }))
  const [, force] = useState(0)
  const [bestLevel, setBestLevel] = useState(() => readInt(LEVEL_KEY))
  const [bestTime,  setBestTime]  = useState(() => readInt(TIME_KEY))

  useEffect(() => {
    const uninstall = installSpireInput(stateRef.current, () => setActiveScene('hub'))
    return uninstall
  }, [stateRef, setActiveScene])

  const handleStart = () => { startGame(stateRef.current, 1); force((n) => n + 1) }
  const handleBack  = () => setActiveScene('hub')
  const handleContinue = () => {
    const s = stateRef.current
    if (s.level > bestLevel) { writeInt(LEVEL_KEY, s.level); setBestLevel(s.level) }
    if (s.totalTimeMs > bestTime) { writeInt(TIME_KEY, s.totalTimeMs); setBestTime(s.totalTimeMs) }
    nextLevel(s)
    force((n) => n + 1)
  }

  return (
    <div className="spire">
      <div className="spire__canvas-wrap">
        <Canvas
          camera={{ position: [4, 5, 9], fov: 42 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
<ambientLight intensity={0.45} />
          <directionalLight position={[6, 8, 8]} intensity={0.85} color="#e8eef5" />
          <pointLight position={[-6, 4, 6]} intensity={2.1} color="#7a4cd6" distance={20} />
          <pointLight position={[6, -2, 6]} intensity={1.1} color="#b78aff" distance={18} />
          <GameLoop state={stateRef.current} onChange={() => force((n) => n + 1)} />
          <SpireScene state={stateRef.current} />
          <EffectComposer>
            <Bloom intensity={0.85} luminanceThreshold={0.2} luminanceSmoothing={0.85} mipmapBlur />
            <Vignette eskil={false} offset={0.15} darkness={0.7} />
          </EffectComposer>
        </Canvas>
      </div>
      <SpireHUD state={stateRef.current} bestLevel={bestLevel} bestTime={bestTime} onStart={handleStart} onBack={handleBack} onContinue={handleContinue} />
      <div className="spire__brand">OBSIDIAN SPIRE &mdash; NYTHIS ORIGINAL &middot; ROTATE &middot; PLACE &middot; ASCEND</div>
    </div>
  )
}

