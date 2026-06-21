import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { ReactNode } from 'react'
import Stage from '../../render/Stage'
import CrystalShard from '../../render/CrystalShard'

function ParallaxRig({ children }: { children: ReactNode }) {
  const { camera, pointer } = useThree()
  const target = useRef(new Vector3())

  useFrame(() => {
    target.current.set(pointer.x * 0.6, 1.2 + pointer.y * 0.3, 5.5)
    camera.position.lerp(target.current, 0.05)
    camera.lookAt(0, 0, 0)
  })

  return <>{children}</>
}

export default function HubScene() {
  return (
    <Stage>
      <ParallaxRig>
        <CrystalShard scale={1.5} speed={0.18} />
        <CrystalShard position={[-2.8, 0.4, -0.5]} scale={0.55} speed={0.45} emissive="#7a4cd6" />
        <CrystalShard position={[2.6, -0.8, -1.2]} scale={0.7} speed={-0.32} emissive="#b78aff" />
        <CrystalShard position={[2.1, 1.5, -2.5]} scale={0.4} speed={0.55} emissive="#7a4cd6" />
        <CrystalShard position={[-3.5, -1.2, -3]} scale={0.3} speed={0.7} emissive="#7a4cd6" />
        <CrystalShard position={[3.8, 2.0, -3.5]} scale={0.25} speed={-0.6} emissive="#b78aff" />
        <CrystalShard position={[-1.5, 2.5, -2]} scale={0.35} speed={0.4} emissive="#b78aff" />
      </ParallaxRig>
    </Stage>
  )
}
