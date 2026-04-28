import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Stars } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useMemo, useRef } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import { MathUtils, Vector3 } from 'three'
import { usePlayerStore } from '../../store/playerStore'
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser'

const sceneScale = new Vector3()

const ReactiveScene = ({ bins, energy, intensity }: { bins: number[]; energy: number; intensity: number }) => {
  const orbRef = useRef<Mesh | null>(null)
  const ringRef = useRef<Group | null>(null)
  const barsRef = useRef<Array<Mesh | null>>([])

  const normalizedIntensity = intensity / 100

  useFrame(({ camera, pointer }, delta) => {
    if (orbRef.current) {
      orbRef.current.rotation.y += delta * 0.28
      orbRef.current.rotation.x += delta * 0.16

      const targetScale = 1.4 + energy * 0.92 * normalizedIntensity
      orbRef.current.scale.lerp(sceneScale.setScalar(targetScale), 0.08)
    }

    if (ringRef.current) {
      ringRef.current.rotation.y += delta * (0.2 + energy * 0.4)
    }

    barsRef.current.forEach((mesh, index) => {
      if (!mesh) {
        return
      }

      const bin = bins[index % bins.length] ?? 0
      const targetY = 0.28 + bin * (2.5 * normalizedIntensity + 1.2)

      mesh.scale.y = MathUtils.lerp(mesh.scale.y, targetY, 0.14)
      mesh.position.y = mesh.scale.y * 0.32

      const material = mesh.material as MeshStandardMaterial
      material.emissiveIntensity = MathUtils.lerp(material.emissiveIntensity, 0.9 + bin * 2.6, 0.18)
    })

    camera.position.x = MathUtils.lerp(camera.position.x, pointer.x * 0.7, 0.05)
    camera.position.y = MathUtils.lerp(camera.position.y, 1.1 + pointer.y * 0.3, 0.05)
    camera.lookAt(0, 0, 0)
  })

  const ringItems = useMemo(() => Array.from({ length: 52 }, (_, index) => index), [])

  return (
    <>
      <color attach="background" args={['#050710']} />
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 3, 3]} intensity={16} color="#6ac2ff" />
      <pointLight position={[-3, 1, -2]} intensity={12} color="#f166ff" />

      <mesh ref={orbRef}>
        <icosahedronGeometry args={[1.25, 16]} />
        <meshStandardMaterial color="#6ad4ff" emissive="#2f65ff" emissiveIntensity={0.95} roughness={0.22} metalness={0.38} />
      </mesh>

      <group ref={ringRef}>
        {ringItems.map((item) => {
          const angle = (item / ringItems.length) * Math.PI * 2
          const radius = 2.45

          return (
            <mesh
              key={item}
              ref={(element) => {
                barsRef.current[item] = element
              }}
              position={[Math.cos(angle) * radius, 0.24, Math.sin(angle) * radius]}
              rotation={[0, -angle, 0]}
            >
              <boxGeometry args={[0.1, 1, 0.12]} />
              <meshStandardMaterial color="#49d8ff" emissive="#49d8ff" emissiveIntensity={1.15} roughness={0.4} metalness={0.1} />
            </mesh>
          )
        })}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
        <ringGeometry args={[2.6, 3.6, 64]} />
        <meshStandardMaterial color="#0f3f7d" emissive="#0d3f86" emissiveIntensity={0.75} opacity={0.85} transparent />
      </mesh>

      <Stars radius={42} depth={28} count={1200} factor={2.6} saturation={0.4} fade speed={1} />
      <Environment preset="night" />
    </>
  )
}

export const VisualizerCanvas = () => {
  const { bins, energy } = useAudioAnalyser()
  const { visualizerEnabled, visualizerIntensity } = usePlayerStore((state) => state.settings)

  if (!visualizerEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel flex h-[360px] items-center justify-center overflow-hidden"
      >
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-300/70">3D Disabled</p>
          <p className="mt-2 text-xl font-semibold text-white">Визуализатор выключен в настройках</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="glass-panel h-[360px] overflow-hidden"
    >
      <Canvas camera={{ position: [0, 1.1, 5], fov: 48 }} dpr={[1, 2]}>
        <ReactiveScene bins={bins} energy={energy} intensity={visualizerIntensity} />
      </Canvas>
    </motion.div>
  )
}

