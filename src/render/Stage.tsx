import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import type { ReactNode } from 'react'

export default function Stage({ children }: { children: ReactNode }) {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 5.5], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0a0a0a']} />
      <fog attach="fog" args={['#0a0a0a', 7, 16]} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 8, 4]} intensity={0.6} color="#e8eef5" />
      <pointLight position={[-4, 2, 3]} intensity={2.4} color="#7a4cd6" distance={12} />
      <pointLight position={[4, -1.5, 3]} intensity={1.5} color="#b78aff" distance={10} />
      <pointLight position={[0, 4, 2]} intensity={0.8} color="#e8eef5" distance={8} />
      {children}
      <EffectComposer>
        <Bloom intensity={0.85} luminanceThreshold={0.15} luminanceSmoothing={0.85} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  )
}
