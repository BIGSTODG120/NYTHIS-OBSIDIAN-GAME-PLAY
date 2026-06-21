import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"
import { useAppStore } from "../../core/store"
import { createState, serve, tick, WIN_SCORE } from "./PongGame"
import type { PongState } from "./PongGame"
import { aiTick } from "./PongAI"
import { installInput, p1Input, p2InputHuman, spaceJustPressed, escJustPressed } from "./PongInput"
import PongScene from "./PongScene"
import PongHUD from "./PongHUD"

const HIGHSCORE_KEY = "nogp:v2:pong:highscore"

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
  state: PongState
  onChange: () => void
  onWin: (winnerScore: number) => void
}

function GameLoop({ state, onChange, onWin }: LoopProps) {
  const { pongMode, pongAITier, setActiveScene } = useAppStore()
  const lastStatus = useRef(state.status)

  useFrame((_, dt) => {
    // Input
    p1Input(state, dt)
    if (pongMode === "2p") {
      p2InputHuman(state, dt)
    } else {
      aiTick(state, pongAITier, dt)
    }

    // Serve trigger
    if (state.status === "menu" && spaceJustPressed()) {
      state.p1.score = 0
      state.p2.score = 0
      serve(state)
    } else if (state.status === "gameover" && spaceJustPressed()) {
      state.p1.score = 0
      state.p2.score = 0
      state.winner = 0
      serve(state)
    }

    // ESC to hub
    if (escJustPressed()) {
      setActiveScene("hub")
      return
    }

    // Physics
    tick(state, dt)

    // Win detection (status just transitioned to gameover)
    if (state.status === "gameover" && lastStatus.current !== "gameover") {
      const winnerScore = state.winner === 1 ? state.p1.score : state.p2.score
      onWin(winnerScore)
    }
    lastStatus.current = state.status

    onChange()
  })

  return null
}

export default function PongRoot() {
  const [stateRef] = useState<{ current: PongState }>(() => ({ current: createState() }))
  const [, force] = useState(0)
  const [highScore, setHighScore] = useState(() => readHighScore())
  const setActiveScene = useAppStore((s) => s.setActiveScene)

  useEffect(() => {
    const uninstall = installInput()
    return uninstall
  }, [])

  const handleStart = () => {
    stateRef.current.p1.score = 0
    stateRef.current.p2.score = 0
    stateRef.current.winner = 0
    serve(stateRef.current)
    force((n) => n + 1)
  }

  const handleBack = () => setActiveScene("hub")

  const handleWin = (winnerScore: number) => {
    if (winnerScore > highScore) {
      writeHighScore(winnerScore)
      setHighScore(winnerScore)
    }
  }

  return (
    <div className="pong">
      <div className="pong__canvas-wrap">
        <Canvas
          camera={{ position: [0, 0, 9.5], fov: 45 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        >
<ambientLight intensity={0.25} />
          <directionalLight position={[5, 6, 6]} intensity={0.7} color="#e8eef5" />
          <pointLight position={[-4, 0, 4]} intensity={1.8} color="#7a4cd6" distance={14} />
          <pointLight position={[4, 0, 4]} intensity={1.3} color="#b78aff" distance={12} />
          <GameLoop state={stateRef.current} onChange={() => force((n) => n + 1)} onWin={handleWin} />
          <PongScene state={stateRef.current} />
          <EffectComposer>
            <Bloom intensity={0.7} luminanceThreshold={0.2} luminanceSmoothing={0.85} mipmapBlur />
            <Vignette eskil={false} offset={0.18} darkness={0.8} />
          </EffectComposer>
        </Canvas>
      </div>
      <PongHUD state={stateRef.current} highScore={highScore} onStart={handleStart} onBack={handleBack} />
      <div className="pong__brand">OBSIDIAN PONG - FIRST TO {WIN_SCORE}</div>
    </div>
  )
}
