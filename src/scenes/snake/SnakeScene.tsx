import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group, Mesh } from "three"
import type { SnakeState, Cell } from "./SnakeGame"
import { GRID, getStepProgress } from "./SnakeGame"

interface SnakeSceneProps {
  state: SnakeState
}

const CELL = 0.55
const ORIGIN_X = -((GRID.cols - 1) * CELL) / 2
const ORIGIN_Y = -((GRID.rows - 1) * CELL) / 2
const MAX_SEGMENTS = 200

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpCell(prev: Cell | undefined, cur: Cell, t: number): [number, number] {
  if (!prev) return [ORIGIN_X + cur.x * CELL, ORIGIN_Y + cur.y * CELL]
  // Suppress lerp across wraparound jumps (distance > 1 cell)
  const dx = Math.abs(cur.x - prev.x)
  const dy = Math.abs(cur.y - prev.y)
  if (dx > 1 || dy > 1) {
    return [ORIGIN_X + cur.x * CELL, ORIGIN_Y + cur.y * CELL]
  }
  return [
    ORIGIN_X + lerp(prev.x, cur.x, t) * CELL,
    ORIGIN_Y + lerp(prev.y, cur.y, t) * CELL,
  ]
}

export default function SnakeScene({ state }: SnakeSceneProps) {
  const segMeshes = useRef<Array<Mesh | null>>([])
  const fruitRef = useRef<Group>(null)
  const fruitPulseRef = useRef<Mesh>(null)
  const wrapFromRef = useRef<Mesh>(null)
  const wrapToRef = useRef<Mesh>(null)

  const tiles = useMemo(() => {
    const out: Array<[number, number]> = []
    for (let x = 0; x < GRID.cols; x++) {
      for (let y = 0; y < GRID.rows; y++) {
        if ((x + y) % 2 === 0) out.push([x, y])
      }
    }
    return out
  }, [])

  useFrame(() => {
    const t = getStepProgress(state)
    const now = performance.now()

    // Render each segment with interpolation between previous and current cell
    for (let i = 0; i < MAX_SEGMENTS; i++) {
      const mesh = segMeshes.current[i]
      if (!mesh) continue
      if (i >= state.segments.length) {
        mesh.visible = false
        continue
      }
      mesh.visible = true
      const cur = state.segments[i]
      const prev = state.prevSegments[i] ?? cur
      if (!cur) continue
      const [wx, wy] = lerpCell(prev, cur, t)
      mesh.position.x = wx
      mesh.position.y = wy

      // Scale tapers from head (i=0) to tail
      const tail = Math.min(i / Math.max(state.segments.length - 1, 1), 1)
      const baseSize = i === 0 ? 0.96 : lerp(0.88, 0.62, tail)
      mesh.scale.setScalar(baseSize)

      // Head: subtle pop on direction change. Tail: gentle wave.
      if (i === 0) {
        mesh.position.z = 0.08
      } else {
        mesh.position.z = Math.sin(now / 220 + i * 0.6) * 0.04
      }
    }

    // Fruit: idle pulse + rotation
    if (fruitRef.current) {
      fruitRef.current.position.x = ORIGIN_X + state.fruit.x * CELL
      fruitRef.current.position.y = ORIGIN_Y + state.fruit.y * CELL
      const idle = 1 + Math.sin(now / 280) * 0.08
      fruitRef.current.scale.setScalar(idle)
      fruitRef.current.rotation.y = now / 600
      fruitRef.current.rotation.x = Math.sin(now / 800) * 0.3
    }

    // Fruit-eat pulse: brief expand-and-fade ring
    if (fruitPulseRef.current) {
      const dt = now - state.fruitEatPulseAt
      if (dt < 500 && state.fruitEatPulseAt > 0) {
        const k = dt / 500
        const scale = 0.4 + k * 2.2
        fruitPulseRef.current.scale.setScalar(scale)
        const m = fruitPulseRef.current.material as { opacity: number; transparent: boolean }
        m.transparent = true
        m.opacity = 1 - k
        fruitPulseRef.current.visible = true
        // Position at LAST fruit location: use current segments[0] (head just ate it)
        const head = state.segments[0]
        if (head) {
          fruitPulseRef.current.position.x = ORIGIN_X + head.x * CELL
          fruitPulseRef.current.position.y = ORIGIN_Y + head.y * CELL
        }
      } else {
        fruitPulseRef.current.visible = false
      }
    }

    // Wraparound flashes
    const flashWindow = 320
    if (wrapFromRef.current) {
      if (state.wrapFlashFrom && now - state.lastFruitAt < flashWindow + 1500) {
        const age = state.tickAcc * 1000
        const k = Math.min(age / flashWindow, 1)
        wrapFromRef.current.position.x = ORIGIN_X + state.wrapFlashFrom.x * CELL
        wrapFromRef.current.position.y = ORIGIN_Y + state.wrapFlashFrom.y * CELL
        wrapFromRef.current.scale.setScalar(1 + k * 0.8)
        const m = wrapFromRef.current.material as { opacity: number; transparent: boolean }
        m.transparent = true
        m.opacity = (1 - k) * 0.85
        wrapFromRef.current.visible = k < 1
      } else {
        wrapFromRef.current.visible = false
      }
    }
    if (wrapToRef.current) {
      if (state.wrapFlashTo) {
        const age = state.tickAcc * 1000
        const k = Math.min(age / flashWindow, 1)
        wrapToRef.current.position.x = ORIGIN_X + state.wrapFlashTo.x * CELL
        wrapToRef.current.position.y = ORIGIN_Y + state.wrapFlashTo.y * CELL
        wrapToRef.current.scale.setScalar(1 + k * 0.8)
        const m = wrapToRef.current.material as { opacity: number; transparent: boolean }
        m.transparent = true
        m.opacity = (1 - k) * 0.85
        wrapToRef.current.visible = k < 1
      } else {
        wrapToRef.current.visible = false
      }
    }
  })

  const arenaW = GRID.cols * CELL
  const arenaH = GRID.rows * CELL

  // Pre-allocate segment meshes with gradient emissive
  const segSlots = Array.from({ length: MAX_SEGMENTS }, (_, i) => i)

  return (
    <group>
      {/* Floor slab */}
      <mesh position={[0, 0, -0.4]} receiveShadow>
        <planeGeometry args={[arenaW + 0.6, arenaH + 0.6]} />
        <meshStandardMaterial color="#0d0d12" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Checker accent tiles */}
      {tiles.map(([x, y], i) => (
        <mesh key={i} position={[ORIGIN_X + x * CELL, ORIGIN_Y + y * CELL, -0.35]}>
          <planeGeometry args={[CELL * 0.95, CELL * 0.95]} />
          <meshStandardMaterial color="#13131a" metalness={0.2} roughness={0.8} />
        </mesh>
      ))}

      {/* Border frame */}
      <mesh position={[0, arenaH / 2 + 0.1, 0]}>
        <boxGeometry args={[arenaW + 0.6, 0.1, 0.3]} />
        <meshStandardMaterial color="#1a1a22" emissive="#7a4cd6" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, -arenaH / 2 - 0.1, 0]}>
        <boxGeometry args={[arenaW + 0.6, 0.1, 0.3]} />
        <meshStandardMaterial color="#1a1a22" emissive="#7a4cd6" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[-arenaW / 2 - 0.1, 0, 0]}>
        <boxGeometry args={[0.1, arenaH + 0.3, 0.3]} />
        <meshStandardMaterial color="#1a1a22" emissive="#7a4cd6" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[arenaW / 2 + 0.1, 0, 0]}>
        <boxGeometry args={[0.1, arenaH + 0.3, 0.3]} />
        <meshStandardMaterial color="#1a1a22" emissive="#7a4cd6" emissiveIntensity={0.25} />
      </mesh>

      {/* Snake segments - pool allocated for performance */}
      <group>
        {segSlots.map((i) => {
          const isHead = i === 0
          const taperT = Math.min(i / 40, 1)
          const emissiveIntensity = isHead ? 1.1 : lerp(0.6, 0.15, taperT)
          const color = isHead ? "#15101f" : "#0d0d12"
          return (
            <mesh
              key={i}
              ref={(el) => { segMeshes.current[i] = el }}
              visible={false}
              castShadow
            >
              {isHead ? (
                <octahedronGeometry args={[CELL * 0.55, 1]} />
              ) : (
                <boxGeometry args={[CELL, CELL, CELL]} />
              )}
              <meshPhysicalMaterial
                color={color}
                metalness={0.55}
                roughness={0.22}
                emissive="#7a4cd6"
                emissiveIntensity={emissiveIntensity}
                clearcoat={1.0}
                clearcoatRoughness={0.18}
              />
            </mesh>
          )
        })}
      </group>

      {/* Fruit */}
      <group ref={fruitRef}>
        <mesh castShadow>
          <octahedronGeometry args={[CELL * 0.36, 0]} />
          <meshPhysicalMaterial
            color="#1a1208"
            metalness={0.5}
            roughness={0.2}
            emissive="#b78aff"
            emissiveIntensity={1.1}
            clearcoat={1.0}
            flatShading
          />
        </mesh>
      </group>

      {/* Fruit-eat pulse ring */}
      <mesh ref={fruitPulseRef} visible={false} position={[0, 0, 0.05]}>
        <ringGeometry args={[CELL * 0.35, CELL * 0.45, 24]} />
        <meshBasicMaterial color="#b78aff" transparent opacity={1} />
      </mesh>

      {/* Wraparound flash markers */}
      <mesh ref={wrapFromRef} visible={false} position={[0, 0, 0.05]}>
        <ringGeometry args={[CELL * 0.25, CELL * 0.45, 20]} />
        <meshBasicMaterial color="#7a4cd6" transparent opacity={0.85} />
      </mesh>
      <mesh ref={wrapToRef} visible={false} position={[0, 0, 0.05]}>
        <ringGeometry args={[CELL * 0.25, CELL * 0.45, 20]} />
        <meshBasicMaterial color="#7a4cd6" transparent opacity={0.85} />
      </mesh>
    </group>
  )
}
