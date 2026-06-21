import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"
import { useAppStore } from "../../core/store"
import { createBreak, startGame, tick } from "./BreakGame"
import type { BreakState } from "./BreakGame"
import { installBreakInput, pollBreakInput, spaceJustPressed, escJustPressed } from "./BreakInput"
import BreakScene from "./BreakScene"
import BreakHUD from "./BreakHUD"

const HIGHSCORE_KEY = "nogp:v2:break:highscore"

function readHighScore(): number {
  try { const v = localStorage.getItem(HIGHSCORE_KEY); return v ? parseInt(v, 10) || 0 : 0 } catch { return 0 }
}
function writeHighScore(v: number): void {
  try { localStorage.setItem(HIGHSCORE_KEY, String(v)) } catch { /* ignore */ }
}

interface LoopProps {
  state: BreakState
  onChange: () => void
  onEnd: (score: number) => void
}

function GameLoop({ state, onChange, onEnd }: LoopProps) {
  const setActiveScene = useAppStore((s) => s.setActiveScene)
  const lastStatus = useRef(state.status)

  useFrame((_, dt) => {
    pollBreakInput(state, dt)

    if (state.status === "menu" && spaceJustPressed()) {
      startGame(state)
    } else if ((state.status === "gameover" || state.status === "won") && spaceJustPressed()) {
      startGame(state)
    }

    if (escJustPressed()) { setActiveScene("hub"); return }

    tick(state, dt)

    if ((state.status === "gameover" || state.status === "won") && lastStatus.current !== "gameover" && lastStatus.current !== "won") {
      onEnd(state.score)
    }
    lastStatus.current = state.status
    onChange()
  })

  return null
}

export default function BreakRoot() {
  const [stateRef] = useState<{ current: BreakState }>(() => ({ current: createBreak() }))
  const [, force] = useState(0)
  const [highScore, setHighScore] = useState(() => readHighScore())
  const setActiveScene = useAppStore((s) => s.setActiveScene)

  useEffect(() => {
    const uninstall = installBreakInput()
    return uninstall
  }, [])

  const handleStart = () => { startGame(stateRef.current); force((n) => n + 1) }
  const handleBack = () => setActiveScene("hub")
  const handleEnd = (score: number) => {
    if (score > highScore) { writeHighScore(score); setHighScore(score) }
  }

  return (
    <div className="break">
      <div className="break__canvas-wrap">
        <Canvas
          camera={{ position: [0, 0, 17], fov: 45 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        >
<ambientLight intensity={0.3} />
          <directionalLight position={[3, 8, 7]} intensity={0.9} color="#e8eef5" />
          <pointLight position={[-5, 4, 5]} intensity={1.4} color="#7a4cd6" distance={16} />
          <pointLight position={[5, -4, 5]} intensity={1.1} color="#b78aff" distance={14} />
          <GameLoop state={stateRef.current} onChange={() => force((n) => n + 1)} onEnd={handleEnd} />
          <BreakScene state={stateRef.current} />
          <EffectComposer>
            <Bloom intensity={0.7} luminanceThreshold={0.2} luminanceSmoothing={0.85} mipmapBlur />
            <Vignette eskil={false} offset={0.18} darkness={0.8} />
          </EffectComposer>
        </Canvas>
      </div>
      <BreakHUD state={stateRef.current} highScore={highScore} onStart={handleStart} onBack={handleBack} />
      <div className="break__brand">OBSIDIAN BREAK</div>
    </div>
  )
}
