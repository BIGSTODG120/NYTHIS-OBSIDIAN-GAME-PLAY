import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

interface CrystalShardProps {
  position?: [number, number, number]
  scale?: number
  speed?: number
  emissive?: string
}

export default function CrystalShard({
  position = [0, 0, 0],
  scale = 1,
  speed = 0.2,
  emissive = '#7a4cd6',
}: CrystalShardProps) {
  const mesh = useRef<Mesh>(null)

  useFrame((state, dt) => {
    if (!mesh.current) return
    mesh.current.rotation.y += dt * speed
    mesh.current.rotation.x += dt * speed * 0.4
    const t = state.clock.elapsedTime
    mesh.current.position.y = position[1] + Math.sin(t * Math.abs(speed) * 2) * 0.08
  })

  return (
    <mesh ref={mesh} position={position} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <meshPhysicalMaterial
        color="#0d0d12"
        metalness={0.6}
        roughness={0.18}
        emissive={emissive}
        emissiveIntensity={0.5}
        clearcoat={1.0}
        clearcoatRoughness={0.15}
        iridescence={0.3}
        iridescenceIOR={1.5}
        flatShading
      />
    </mesh>
  )
}
