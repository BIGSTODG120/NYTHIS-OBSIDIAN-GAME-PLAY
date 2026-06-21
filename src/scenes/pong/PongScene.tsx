import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh } from "three"
import type { PongState } from "./PongGame"
import { ARENA, PADDLE, BALL } from "./PongGame"

interface PongSceneProps {
  state: PongState
}

export default function PongScene({ state }: PongSceneProps) {
  const ballRef = useRef<Mesh>(null)
  const p1Ref = useRef<Mesh>(null)
  const p2Ref = useRef<Mesh>(null)

  useFrame(() => {
    if (ballRef.current) {
      ballRef.current.position.x = state.ball.x
      ballRef.current.position.y = state.ball.y
    }
    if (p1Ref.current) p1Ref.current.position.y = state.p1.y
    if (p2Ref.current) p2Ref.current.position.y = state.p2.y
  })

  const p1X = -ARENA.width / 2 + 0.6
  const p2X = ARENA.width / 2 - 0.6

  return (
    <group>
      {/* Arena floor */}
      <mesh position={[0, 0, -0.5]} receiveShadow>
        <planeGeometry args={[ARENA.width + 1, ARENA.height + 1]} />
        <meshStandardMaterial color="#0d0d12" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Center line */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[0, -ARENA.height / 2 + 0.25 + i * 0.5, -0.4]}>
          <boxGeometry args={[0.08, 0.25, 0.02]} />
          <meshStandardMaterial color="#7a4cd6" emissive="#7a4cd6" emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* Top/bottom walls */}
      <mesh position={[0, ARENA.height / 2, 0]}>
        <boxGeometry args={[ARENA.width, 0.1, 0.3]} />
        <meshStandardMaterial color="#1a1a22" emissive="#7a4cd6" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, -ARENA.height / 2, 0]}>
        <boxGeometry args={[ARENA.width, 0.1, 0.3]} />
        <meshStandardMaterial color="#1a1a22" emissive="#7a4cd6" emissiveIntensity={0.3} />
      </mesh>

      {/* P1 paddle (violet) */}
      <mesh ref={p1Ref} position={[p1X, 0, 0]} castShadow>
        <boxGeometry args={[PADDLE.width, PADDLE.height, 0.4]} />
        <meshPhysicalMaterial
          color="#0d0d12"
          metalness={0.5}
          roughness={0.2}
          emissive="#7a4cd6"
          emissiveIntensity={0.6}
          clearcoat={1.0}
        />
      </mesh>

      {/* P2 paddle (amber) */}
      <mesh ref={p2Ref} position={[p2X, 0, 0]} castShadow>
        <boxGeometry args={[PADDLE.width, PADDLE.height, 0.4]} />
        <meshPhysicalMaterial
          color="#0d0d12"
          metalness={0.5}
          roughness={0.2}
          emissive="#b78aff"
          emissiveIntensity={0.55}
          clearcoat={1.0}
        />
      </mesh>

      {/* Ball */}
      <mesh ref={ballRef} position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[BALL.radius, 16, 16]} />
        <meshPhysicalMaterial
          color="#e8eef5"
          metalness={0.3}
          roughness={0.15}
          emissive="#e8eef5"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  )
}
