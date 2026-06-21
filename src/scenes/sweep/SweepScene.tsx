import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { SweepSnapshot } from './SweepGame'

const TILE_SIZE = 0.85
const BOARD_OFFSET = 4

const NUMBER_COLORS = ['#9b5cff', '#3b82f6', '#10b981', '#ef4444', '#a855f7', '#f59e0b', '#ec4899', '#e5e7eb']

interface TileVisuals {
  color: string
  emissive: string
  emissiveIntensity: number
}

function tileVisuals(revealed: boolean, mine: boolean, flagged: boolean, hovered: boolean): TileVisuals {
  if (flagged) return { color: '#7a4cd6', emissive: '#9b5cff', emissiveIntensity: 0.45 }
  if (revealed && mine) return { color: '#7f1d1d', emissive: '#ef4444', emissiveIntensity: 0.9 }
  if (revealed) return { color: '#1c1822', emissive: '#000000', emissiveIntensity: 0 }
  if (hovered) return { color: '#4a4258', emissive: '#7a4cd6', emissiveIntensity: 0.15 }
  return { color: '#3a3445', emissive: '#000000', emissiveIntensity: 0 }
}

interface SweepSceneProps {
  snapshot: SweepSnapshot
  onReveal: (x: number, y: number, shift: boolean) => void
  onFlag: (x: number, y: number) => void
}

export default function SweepScene({ snapshot, onReveal, onFlag }: SweepSceneProps) {
  const { cells, width, height, state } = snapshot
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const revsRef = useRef<number[]>(Array(width * height).fill(0))
  const [, force] = useState(0)

  useFrame((_, dt) => {
    let dirty = false
    const step = Math.min(1, dt * 9)
    for (let i = 0; i < cells.length; i++) {
      const target = cells[i]!.revealed ? 1 : 0
      const current = revsRef.current[i]!
      const delta = (target - current) * step
      const next = current + delta
      if (Math.abs(target - next) < 0.005) {
        if (current !== target) { revsRef.current[i] = target; dirty = true }
      } else {
        revsRef.current[i] = next
        dirty = true
      }
    }
    if (dirty) force((n) => (n + 1) & 0xffff)
  })

  const handleClick = (x: number, y: number) => (e: any) => {
    e.stopPropagation()
    if (state === 'won' || state === 'lost') return
    onReveal(x, y, !!e.shiftKey)
  }

  const handleContext = (x: number, y: number) => (e: any) => {
    e.stopPropagation()
    if (e.nativeEvent && typeof e.nativeEvent.preventDefault === 'function') {
      e.nativeEvent.preventDefault()
    }
    if (state === 'won' || state === 'lost') return
    onFlag(x, y)
  }

  const meshes: any[] = []
  const overlays: any[] = []

  // Board base plate (subtle ground for the grid to sit on)
  meshes.push(
    <mesh key="base" position={[0, -0.25, 0]} receiveShadow={false}>
      <boxGeometry args={[width + 0.3, 0.08, height + 0.3]} />
      <meshStandardMaterial color="#0f0a14" emissive="#1a0f2a" emissiveIntensity={0.15} metalness={0.4} roughness={0.6} />
    </mesh>
  )

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const cell = cells[i]!
      const wx = x - BOARD_OFFSET
      const wz = y - BOARD_OFFSET
      const rev = revsRef.current[i] ?? 0
      const yScale = 1 - rev * 0.78
      const yPos = -rev * 0.32
      const v = tileVisuals(cell.revealed, cell.mine, cell.flagged, hoveredIdx === i)

      meshes.push(
        <mesh
          key={`t-${i}`}
          position={[wx, yPos, wz]}
          scale={[1, yScale, 1]}
          onClick={handleClick(x, y)}
          onContextMenu={handleContext(x, y)}
          onPointerOver={() => setHoveredIdx(i)}
          onPointerOut={() => setHoveredIdx((h) => (h === i ? null : h))}
        >
          <boxGeometry args={[TILE_SIZE, 0.4, TILE_SIZE]} />
          <meshStandardMaterial color={v.color} emissive={v.emissive} emissiveIntensity={v.emissiveIntensity} metalness={0.45} roughness={0.4} />
        </mesh>
      )

      if (cell.revealed && cell.mine) {
        overlays.push(
          <mesh key={`m-${i}`} position={[wx, 0.05, wz]} rotation={[0, Math.PI / 4, 0]}>
            <octahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial color="#1a0606" emissive="#ef4444" emissiveIntensity={1.4} metalness={0.7} roughness={0.2} />
          </mesh>
        )
      }

      if (cell.revealed && !cell.mine && cell.neighbors > 0) {
        const c = NUMBER_COLORS[cell.neighbors - 1] ?? '#e5e7eb'
        overlays.push(
          <Html key={`n-${i}`} position={[wx, 0.12, wz]} center distanceFactor={9} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div style={{ color: c, fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 38, textShadow: '0 0 10px rgba(0,0,0,0.95)' }}>{cell.neighbors}</div>
          </Html>
        )
      }

      if (!cell.revealed && cell.flagged) {
        overlays.push(
          <Html key={`f-${i}`} position={[wx, 0.4, wz]} center distanceFactor={9} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div style={{ color: '#b78aff', fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 30, textShadow: '0 0 12px rgba(155,92,255,0.9)' }}>F</div>
          </Html>
        )
      }
    }
  }

  return <>{meshes}{overlays}</>
}
