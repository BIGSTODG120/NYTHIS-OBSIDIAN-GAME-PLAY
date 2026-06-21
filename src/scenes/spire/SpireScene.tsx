import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { SpireState } from './SpireGame'
import { SLOTS_PER_RING, senseActive } from './SpireGame'

const RING_RADIUS = 2.4
const RING_HEIGHT = 1.2

interface Props { state: SpireState }

export default function SpireScene({ state }: Props) {
  const towerRef = useRef<Group>(null)
  const cursorRef = useRef<Group>(null)

  useFrame(() => {
    // No tween needed — platforms rotate via state.rotation each tick.
    if (cursorRef.current) {
      // Position cursor above the active ring at current angle
      const ringY = state.cursorRing * RING_HEIGHT
      cursorRef.current.position.set(
        Math.cos(state.cursorAngle) * RING_RADIUS,
        ringY,
        Math.sin(state.cursorAngle) * RING_RADIUS,
      )
    }
  })

  const senseOn = senseActive(state)

  return (
    <>
      {/* Tower */}
      <group ref={towerRef} position={[0, -RING_HEIGHT * 2, 0]}>
        {state.platforms.map((p) => (
          <group key={`ring-${p.ringId}`} position={[0, p.ringId * RING_HEIGHT, 0]} rotation={[0, p.rotation, 0]}>
            {p.slots.map((solid, slotI) => {
              const angle = (slotI / SLOTS_PER_RING) * Math.PI * 2
              const x = Math.cos(angle) * RING_RADIUS
              const z = Math.sin(angle) * RING_RADIUS
              const isActive = p.ringId === state.cursorRing
              const color = solid
                ? (senseOn ? '#22c55e' : (isActive ? '#b78aff' : '#7a4cd6'))
                : '#1a1525'
              const emissiveI = solid ? (senseOn ? 0.85 : (isActive ? 0.7 : 0.35)) : 0.05
              return (
                <mesh key={`slot-${slotI}`} position={[x, 0, z]}>
                  <boxGeometry args={[0.85, 0.35, 0.85]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={emissiveI}
                    metalness={0.55}
                    roughness={0.35}
                    transparent={!solid}
                    opacity={solid ? 1 : 0.18}
                  />
                </mesh>
              )
            })}
            {/* Ring core glow */}
            <mesh>
              <torusGeometry args={[RING_RADIUS, 0.08, 8, 32]} />
              <meshBasicMaterial color={p.ringId === state.cursorRing ? '#b78aff' : '#3a3445'} transparent opacity={p.ringId === state.cursorRing ? 0.85 : 0.4} />
            </mesh>
          </group>
        ))}

        {/* Placed fragments */}
        {state.fragments.map((f, i) => {
          const x = Math.cos(f.angle) * RING_RADIUS
          const z = Math.sin(f.angle) * RING_RADIUS
          const y = f.ringId * RING_HEIGHT + 0.45
          return (
            <mesh key={`frag-${i}`} position={[x, y, z]} rotation={[Math.PI / 4, f.angle, 0]}>
              <octahedronGeometry args={[0.32, 0]} />
              <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.9} metalness={0.7} roughness={0.2} />
            </mesh>
          )
        })}

        {/* Cursor indicator (floating obsidian above active ring) */}
        <group ref={cursorRef}>
          <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
            <octahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial color="#e5e7eb" emissive="#b78aff" emissiveIntensity={1.1} metalness={0.85} roughness={0.15} />
          </mesh>
        </group>
      </group>

      {/* Distant starfield (subtle) */}
      {Array.from({ length: 60 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 30
        const y = (Math.random() - 0.5) * 30
        const z = -8 - Math.random() * 4
        return (
          <mesh key={`star-${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshBasicMaterial color="#9b8fb8" />
          </mesh>
        )
      })}
    </>
  )
}
