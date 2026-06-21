import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Group, Mesh } from 'three'
import type { DriftState } from './DriftGame'
import { WORLD, SHIP_RADIUS } from './DriftGame'

interface SceneProps {
  state: DriftState
}

// Pre-generate starfield positions once.
function makeStars(count: number): Array<[number, number, number, number]> {
  const stars: Array<[number, number, number, number]> = []
  for (let i = 0; i < count; i++) {
    stars.push([
      (Math.random() - 0.5) * WORLD.w * 1.3,
      (Math.random() - 0.5) * WORLD.h * 1.3,
      -3 - Math.random() * 2,
      0.02 + Math.random() * 0.05,
    ])
  }
  return stars
}

function WorldBounds() {
  const geo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(WORLD.w, WORLD.h, 0.01)),
    []
  )
  return (
    <lineSegments position={[0, 0, -0.5]} geometry={geo}>
      <lineBasicMaterial color="#3a3445" transparent opacity={0.6} />
    </lineSegments>
  )
}

export default function DriftScene({ state }: SceneProps) {
  const stars = useMemo(() => makeStars(80), [])
  const shipRef = useRef<Group>(null)
  const flameRef = useRef<Mesh>(null)

  useFrame(() => {
    if (shipRef.current) {
      shipRef.current.position.x = state.ship.pos.x
      shipRef.current.position.y = state.ship.pos.y
      shipRef.current.rotation.z = state.ship.rot
      // Blink during invulnerability
      const visible = state.ship.alive && (state.ship.invuln <= 0 || Math.floor(performance.now() / 80) % 2 === 0)
      shipRef.current.visible = visible
    }
    if (flameRef.current) {
      flameRef.current.visible = state.ship.alive && state.ship.thrusting
    }
  })

  return (
    <>
      {/* Starfield background */}
      {stars.map(([x, y, z, r], i) => (
        <mesh key={`star-${i}`} position={[x, y, z]}>
          <sphereGeometry args={[r, 6, 6]} />
          <meshBasicMaterial color="#9b8fb8" />
        </mesh>
      ))}

      {/* World boundary outline (faint violet rectangle) */}
      <WorldBounds />

      {/* Asteroids */}
      {state.asteroids.map((a) => (
        <mesh
          key={`a-${a.id}`}
          position={[a.pos.x, a.pos.y, 0]}
          rotation={[a.rot * 0.4, a.rot * 0.7, a.rot]}
        >
          <icosahedronGeometry args={[a.radius, 0]} />
          <meshStandardMaterial
            color={a.size === 'large' ? '#4a4258' : a.size === 'medium' ? '#5a5268' : '#6b6878'}
            emissive="#2a1f3a"
            emissiveIntensity={0.25}
            metalness={0.35}
            roughness={0.7}
            flatShading
          />
        </mesh>
      ))}

      {/* Bullets */}
      {state.bullets.map((b, i) => (
        <mesh key={`b-${i}`} position={[b.pos.x, b.pos.y, 0.1]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#e8eef5" />
        </mesh>
      ))}

      {/* Ship + thrust flame */}
      <group ref={shipRef}>
        {/* Hull: 3-sided cone pointing local +Y */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <coneGeometry args={[SHIP_RADIUS, SHIP_RADIUS * 2.2, 3]} />
          <meshStandardMaterial
            color="#b78aff"
            emissive="#7a4cd6"
            emissiveIntensity={0.55}
            metalness={0.6}
            roughness={0.25}
            flatShading
          />
        </mesh>
        {/* Thrust afterburner cone (visible only when thrusting) - Upgrade 1 evidence */}
        <mesh ref={flameRef} position={[0, -SHIP_RADIUS - 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[SHIP_RADIUS * 0.55, 0.85, 8]} />
          <meshBasicMaterial color="#b78aff" transparent opacity={0.85} />
        </mesh>
      </group>
    </>
  )
}

