import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"
import { useAppStore } from "../../core/store"
import { createSnake, startGame, tick } from "./SnakeGame"
import type { SnakeState } from "./SnakeGame"
import { installSnakeInput, pollSnakeInput, maybeStart, escJustPressed } from "./SnakeInput"
import SnakeScene from "./SnakeScene"
import SnakeHUD from "./SnakeHUD"

const HIGHSCORE_KEY = "nogp:v2:snake:highscore"

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
  state: SnakeState
  onChange: () => void
  onGameOver: (score: number) => void
}

function GameLoop({ state, onChange, onGameOver }: LoopProps) {
  const { snakeWraparound, setActiveScene } = useAppStore()
  const lastStatus = useRef(state.status)

  useFrame((_, dt) => {
    pollSnakeInput(state)
    maybeStart(state)

    if (escJustPressed()) {
      setActiveScene("hub")
      return
    }

    tick(state, dt, snakeWraparound)

    if (state.status === "gameover" && lastStatus.current !== "gameover") {
      onGameOver(state.score)
    }
    lastStatus.current = state.status

    onChange()
  })

  return null
}

export default function SnakeRoot() {
  const [stateRef] = useState<{ current: SnakeState }>(() => ({ current: createSnake() }))
  const [, force] = useState(0)
  const [highScore, setHighScore] = useState(() => readHighScore())
  const setActiveScene = useAppStore((s) => s.setActiveScene)

  useEffect(() => {
    const uninstall = installSnakeInput()
    return uninstall
  }, [])

  const handleStart = () => {
    startGame(stateRef.current)
    force((n) => n + 1)
  }

  const handleBack = () => setActiveScene("hub")

  const handleGameOver = (score: number) => {
    if (score > highScore) {
      writeHighScore(score)
      setHighScore(score)
    }
  }

  return (
    <div className="snake">
      <div className="snake__canvas-wrap">
        <Canvas
          camera={{ position: [0, 0, 11.5], fov: 45 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        >
<ambientLight intensity={0.3} />
          <directionalLight position={[3, 6, 7]} intensity={0.85} color="#e8eef5" />
          <pointLight position={[-5, 3, 5]} intensity={1.4} color="#7a4cd6" distance={16} />
          <pointLight position={[5, -3, 5]} intensity={1.1} color="#b78aff" distance={14} />
          <GameLoop state={stateRef.current} onChange={() => force((n) => n + 1)} onGameOver={handleGameOver} />
          <SnakeScene state={stateRef.current} />
          <EffectComposer>
            <Bloom intensity={0.65} luminanceThreshold={0.2} luminanceSmoothing={0.85} mipmapBlur />
            <Vignette eskil={false} offset={0.18} darkness={0.8} />
          </EffectComposer>
        </Canvas>
      </div>
      <SnakeHUD state={stateRef.current} highScore={highScore} onStart={handleStart} onBack={handleBack} />
      <div className="snake__brand">OBSIDIAN SNAKE</div>
    </div>
  )
}
