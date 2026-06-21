import { useMemo } from 'react'
import type { ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { StackState, PieceType, Cell } from './StackGame'
import { BOARD_W, BOARD_H, ghostY } from './StackGame'

const PIECE_SHAPES_FOR_RENDER: Record<PieceType, number[][][]> = {
  I: [[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],[[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],[[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]],
  O: [[[1,1],[1,1]],[[1,1],[1,1]],[[1,1],[1,1]],[[1,1],[1,1]]],
  T: [[[0,1,0],[1,1,1],[0,0,0]],[[0,1,0],[0,1,1],[0,1,0]],[[0,0,0],[1,1,1],[0,1,0]],[[0,1,0],[1,1,0],[0,1,0]]],
  S: [[[0,1,1],[1,1,0],[0,0,0]],[[0,1,0],[0,1,1],[0,0,1]],[[0,0,0],[0,1,1],[1,1,0]],[[1,0,0],[1,1,0],[0,1,0]]],
  Z: [[[1,1,0],[0,1,1],[0,0,0]],[[0,0,1],[0,1,1],[0,1,0]],[[0,0,0],[1,1,0],[0,1,1]],[[0,1,0],[1,1,0],[1,0,0]]],
  J: [[[1,0,0],[1,1,1],[0,0,0]],[[0,1,1],[0,1,0],[0,1,0]],[[0,0,0],[1,1,1],[0,0,1]],[[0,1,0],[0,1,0],[1,1,0]]],
  L: [[[0,0,1],[1,1,1],[0,0,0]],[[0,1,0],[0,1,0],[0,1,1]],[[0,0,0],[1,1,1],[1,0,0]],[[1,1,0],[0,1,0],[0,1,0]]],
}

// Canonical Tetris guideline colors
const PIECE_COLOR: Record<PieceType, string> = {
  I: '#22d3ee', // cyan
  O: '#fbbf24', // yellow
  T: '#a855f7', // purple
  S: '#22c55e', // green
  Z: '#ef4444', // red
  J: '#3b82f6', // blue
  L: '#fb923c', // orange
}

const GARBAGE_COLOR = '#5a5268'

function boardToWorld(col: number, row: number): [number, number, number] {
  const x = (col - BOARD_W / 2 + 0.5)
  const y = (BOARD_H / 2 - row - 0.5)
  return [x, y, 0]
}

function BoardFrame() {
  const geo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.PlaneGeometry(BOARD_W, BOARD_H)),
    []
  )
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#3a3445" transparent opacity={0.7} />
    </lineSegments>
  )
}

interface Props { state: StackState }

export default function StackScene({ state }: Props) {
  // Re-render every frame so state updates flow through.
  useFrame(() => { /* state-driven render, force re-eval via parent's force() */ })

  const board = state.board
  const current = state.current
  const ghost = ghostY(state)

  return (
    <>
      <BoardFrame />

      {/* Locked board cells */}
      {board.map((row: Cell[], r: number) =>
        row.map((cell, c) => {
          if (cell === '') return null
          const color = cell === 'G' ? GARBAGE_COLOR : PIECE_COLOR[cell as PieceType]
          return (
            <mesh key={`b-${r}-${c}`} position={boardToWorld(c, r)}>
              <boxGeometry args={[0.92, 0.92, 0.5]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} metalness={0.4} roughness={0.4} />
            </mesh>
          )
        })
      )}

      {/* Ghost piece (Upgrade 1 visual support) */}
      {current && ghost !== null && ghost !== current.y && (
        <GhostPiece type={current.type} rot={current.rot} x={current.x} y={ghost} />
      )}

      {/* Active piece */}
      {current && (
        <ActivePiece type={current.type} rot={current.rot} x={current.x} y={current.y} />
      )}
    </>
  )
}

function ActivePiece({ type, rot, x, y }: { type: PieceType; rot: 0|1|2|3; x: number; y: number }) {
  const shape = PIECE_SHAPES_FOR_RENDER[type][rot]!
  const color = PIECE_COLOR[type]
  const cells: ReactElement[] = []
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy]!.length; dx++) {
      if (!shape[dy]![dx]) continue
      const r = y + dy
      const c = x + dx
      if (r < 0) continue
      cells.push(
        <mesh key={`p-${dy}-${dx}`} position={boardToWorld(c, r)}>
          <boxGeometry args={[0.92, 0.92, 0.55]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} metalness={0.5} roughness={0.3} />
        </mesh>
      )
    }
  }
  return <>{cells}</>
}

function GhostPiece({ type, rot, x, y }: { type: PieceType; rot: 0|1|2|3; x: number; y: number }) {
  const shape = PIECE_SHAPES_FOR_RENDER[type][rot]!
  const color = PIECE_COLOR[type]
  const cells: ReactElement[] = []
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy]!.length; dx++) {
      if (!shape[dy]![dx]) continue
      const r = y + dy
      const c = x + dx
      cells.push(
        <mesh key={`g-${dy}-${dx}`} position={boardToWorld(c, r)}>
          <boxGeometry args={[0.88, 0.88, 0.15]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} transparent opacity={0.28} metalness={0.2} roughness={0.6} />
        </mesh>
      )
    }
  }
  return <>{cells}</>
}
