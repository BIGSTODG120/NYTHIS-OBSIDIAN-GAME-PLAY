import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group, Mesh } from "three"
import type { BreakState } from "./BreakGame"
import { ARENA, PADDLE, BALL, BRICK, ROW_COLORS, brickWorld } from "./BreakGame"

interface BreakSceneProps {
  state: BreakState
}

const MAX_BALLS = 8
const MAX_POWERS = 10
const MAX_LASERS = 30
const BRICK_COUNT = BRICK.cols * BRICK.rows

const POWER_COLOR: Record<string, string> = {
  expand: "#5fd1ff",
  multi: "#ffd470",
  slow: "#9affc8",
  laser: "#ff6680",
}

export default function BreakScene({ state }: BreakSceneProps) {
  const paddleRef = useRef<Mesh>(null)
  const spinRingRef = useRef<Mesh>(null)
  const ballRefs = useRef<Array<Mesh | null>>([])
  const brickRefs = useRef<Array<Mesh | null>>([])
  const powerRefs = useRef<Array<Group | null>>([])
  const laserRefs = useRef<Array<Mesh | null>>([])

  const brickList = useMemo(() => {
    const out: Array<{ index: number; col: number; row: number; pos: { x: number; y: number } }> = []
    for (let r = 0; r < BRICK.rows; r++) {
      for (let c = 0; c < BRICK.cols; c++) {
        const idx = r * BRICK.cols + c
        out.push({ index: idx, col: c, row: r, pos: brickWorld({ col: c, row: r, alive: true }) })
      }
    }
    return out
  }, [])

  useFrame(() => {
    if (paddleRef.current) {
      paddleRef.current.position.x = state.paddleX
      paddleRef.current.position.y = PADDLE.y + PADDLE.height / 2
      paddleRef.current.scale.x = state.paddleWidth / PADDLE.baseWidth
    }
    if (spinRingRef.current) {
      spinRingRef.current.position.x = state.paddleX
      spinRingRef.current.position.y = PADDLE.y + PADDLE.height / 2
      spinRingRef.current.visible = state.paddleSpin !== 0
      const now = performance.now()
      spinRingRef.current.rotation.z = (now / 200) * state.paddleSpin
      spinRingRef.current.scale.x = state.paddleWidth / PADDLE.baseWidth
    }

    // Balls
    for (let i = 0; i < MAX_BALLS; i++) {
      const mesh = ballRefs.current[i]
      if (!mesh) continue
      const b = state.balls[i]
      if (b && b.active) {
        mesh.visible = true
        mesh.position.x = b.x
        mesh.position.y = b.y
      } else {
        mesh.visible = false
      }
    }

    // Bricks
    for (let i = 0; i < BRICK_COUNT; i++) {
      const mesh = brickRefs.current[i]
      const br = state.bricks[i]
      if (!mesh) continue
      mesh.visible = br ? br.alive : false
    }

    // Powers
    for (let i = 0; i < MAX_POWERS; i++) {
      const g = powerRefs.current[i]
      if (!g) continue
      const p = state.powerDrops[i]
      if (p) {
        g.visible = true
        g.position.x = p.x
        g.position.y = p.y
        g.rotation.z = performance.now() / 400
      } else {
        g.visible = false
      }
    }

    // Lasers
    for (let i = 0; i < MAX_LASERS; i++) {
      const mesh = laserRefs.current[i]
      if (!mesh) continue
      const sh = state.laserShots[i]
      if (sh && sh.alive) {
        mesh.visible = true
        mesh.position.x = sh.x
        mesh.position.y = sh.y
      } else {
        mesh.visible = false
      }
    }
  })

  return (
    <group>
      {/* Arena floor */}
      <mesh position={[0, 0, -0.5]} receiveShadow>
        <planeGeometry args={[ARENA.width + 0.6, ARENA.height + 0.6]} />
        <meshStandardMaterial color="#0d0d12" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-ARENA.width / 2 - 0.1, 0, 0]}>
        <boxGeometry args={[0.1, ARENA.height + 0.3, 0.3]} />
        <meshStandardMaterial color="#1a1a22" emissive="#7a4cd6" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[ARENA.width / 2 + 0.1, 0, 0]}>
        <boxGeometry args={[0.1, ARENA.height + 0.3, 0.3]} />
        <meshStandardMaterial color="#1a1a22" emissive="#7a4cd6" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, ARENA.height / 2 + 0.1, 0]}>
        <boxGeometry args={[ARENA.width + 0.6, 0.1, 0.3]} />
        <meshStandardMaterial color="#1a1a22" emissive="#7a4cd6" emissiveIntensity={0.25} />
      </mesh>

      {/* Bricks - pooled */}
      {brickList.map(({ index, row, pos }) => (
        <mesh
          key={index}
          ref={(el) => { brickRefs.current[index] = el }}
          position={[pos.x, pos.y, 0]}
          castShadow
        >
          <boxGeometry args={[BRICK.width, BRICK.height, 0.35]} />
          <meshPhysicalMaterial
            color="#0d0d12"
            metalness={0.5}
            roughness={0.25}
            emissive={ROW_COLORS[row] ?? "#7a4cd6"}
            emissiveIntensity={0.55}
            clearcoat={1.0}
            clearcoatRoughness={0.2}
          />
        </mesh>
      ))}

      {/* Paddle */}
      <mesh ref={paddleRef} position={[0, PADDLE.y + PADDLE.height / 2, 0]} castShadow>
        <boxGeometry args={[PADDLE.baseWidth, PADDLE.height, 0.5]} />
        <meshPhysicalMaterial
          color="#0d0d12"
          metalness={0.55}
          roughness={0.2}
          emissive="#b78aff"
          emissiveIntensity={0.7}
          clearcoat={1.0}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* Spin indicator ring above paddle */}
      <mesh ref={spinRingRef} visible={false} position={[0, PADDLE.y + PADDLE.height / 2, 0.35]}>
        <torusGeometry args={[PADDLE.baseWidth * 0.55, 0.04, 6, 24]} />
        <meshStandardMaterial color="#b78aff" emissive="#b78aff" emissiveIntensity={1.3} />
      </mesh>

      {/* Balls - pooled */}
      {Array.from({ length: MAX_BALLS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { ballRefs.current[i] = el }}
          visible={false}
          castShadow
        >
          <sphereGeometry args={[BALL.radius, 14, 14]} />
          <meshPhysicalMaterial
            color="#e8eef5"
            metalness={0.3}
            roughness={0.15}
            emissive="#e8eef5"
            emissiveIntensity={0.55}
          />
        </mesh>
      ))}

      {/* Power drops - pooled */}
      {Array.from({ length: MAX_POWERS }, (_, i) => {
        const drop = state.powerDrops[i]
        const color = drop ? POWER_COLOR[drop.type] ?? "#b78aff" : "#b78aff"
        return (
          <group
            key={i}
            ref={(el) => { powerRefs.current[i] = el }}
            visible={false}
          >
            <mesh>
              <octahedronGeometry args={[0.22, 0]} />
              <meshPhysicalMaterial
                color="#0d0d12"
                metalness={0.5}
                roughness={0.2}
                emissive={color}
                emissiveIntensity={1.0}
                clearcoat={1.0}
                flatShading
              />
            </mesh>
          </group>
        )
      })}

      {/* Lasers - pooled */}
      {Array.from({ length: MAX_LASERS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { laserRefs.current[i] = el }}
          visible={false}
        >
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#ff6680" emissive="#ff6680" emissiveIntensity={1.4} />
        </mesh>
      ))}
    </group>
  )
}
