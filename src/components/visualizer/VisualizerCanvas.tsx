import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Stars } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useMemo, useRef } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import { MathUtils, Vector3 } from 'three'
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser'
import { useI18n } from '../../hooks/useI18n'
import { usePlayerStore } from '../../store/playerStore'
import type { VisualizerMode } from '../../types/music'

const sceneScale = new Vector3()

const OrbitalMode = ({ bins, energy, intensity }: { bins: number[]; energy: number; intensity: number }) => {
  const orbRef = useRef<Mesh | null>(null)
  const ringRef = useRef<Group | null>(null)
  const barsRef = useRef<Array<Mesh | null>>([])
  const normalizedIntensity = intensity / 100

  const ringItems = useMemo(() => Array.from({ length: 52 }, (_, index) => index), [])

  useFrame(({ camera, pointer }, delta) => {
    if (orbRef.current) {
      orbRef.current.rotation.y += delta * 0.28
      orbRef.current.rotation.x += delta * 0.16

      const targetScale = 1.35 + energy * 0.95 * normalizedIntensity
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

  return (
    <>
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
    </>
  )
}

const RingsMode = ({ bins, energy, intensity }: { bins: number[]; energy: number; intensity: number }) => {
  const ringRefs = useRef<Array<Mesh | null>>([])
  const rings = useMemo(() => Array.from({ length: 12 }, (_, index) => index), [])

  useFrame(({ camera, pointer }, delta) => {
    const intensityScale = intensity / 100

    ringRefs.current.forEach((ring, index) => {
      if (!ring) {
        return
      }

      const bin = bins[(index * 2) % bins.length] ?? 0
      const pulse = 0.88 + bin * (0.55 * intensityScale + 0.4)

      ring.scale.x = MathUtils.lerp(ring.scale.x, pulse, 0.16)
      ring.scale.y = MathUtils.lerp(ring.scale.y, pulse, 0.16)
      ring.rotation.z += delta * (0.18 + index * 0.03)

      const material = ring.material as MeshStandardMaterial
      material.emissiveIntensity = MathUtils.lerp(material.emissiveIntensity, 0.35 + bin * 1.9 + energy * 0.4, 0.2)
    })

    camera.position.x = MathUtils.lerp(camera.position.x, pointer.x * 0.45, 0.05)
    camera.position.y = MathUtils.lerp(camera.position.y, 0.95 + pointer.y * 0.25, 0.05)
    camera.lookAt(0, 0, 0)
  })

  return (
    <group>
      {rings.map((ring, index) => (
        <mesh
          key={ring}
          ref={(element) => {
            ringRefs.current[index] = element
          }}
          rotation={[Math.PI / 2, 0, index * 0.15]}
          position={[0, 0, -index * 0.07]}
        >
          <torusGeometry args={[0.95 + index * 0.16, 0.02 + index * 0.0025, 24, 140]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? '#69e5ff' : '#f66eff'}
            emissive={index % 2 === 0 ? '#69e5ff' : '#f66eff'}
            emissiveIntensity={0.6}
            roughness={0.26}
            metalness={0.18}
          />
        </mesh>
      ))}
    </group>
  )
}

const WaveMode = ({ bins, energy, intensity }: { bins: number[]; energy: number; intensity: number }) => {
  const barsRef = useRef<Array<Mesh | null>>([])
  const points = useMemo(() => {
    const size = 9
    const gap = 0.5
    const result: Array<{ x: number; z: number; index: number }> = []

    for (let x = 0; x < size; x += 1) {
      for (let z = 0; z < size; z += 1) {
        const offsetX = (x - (size - 1) / 2) * gap
        const offsetZ = (z - (size - 1) / 2) * gap
        result.push({ x: offsetX, z: offsetZ, index: x * size + z })
      }
    }

    return result
  }, [])

  useFrame(({ camera, pointer }, delta) => {
    const intensityScale = intensity / 100

    barsRef.current.forEach((bar, index) => {
      if (!bar) {
        return
      }

      const bin = bins[index % bins.length] ?? 0
      const targetY = 0.12 + bin * (3.2 * intensityScale + 0.9)

      bar.scale.y = MathUtils.lerp(bar.scale.y, targetY, 0.13)
      bar.position.y = bar.scale.y * 0.18 - 0.4
      bar.rotation.y += delta * (0.2 + energy * 0.2)

      const material = bar.material as MeshStandardMaterial
      material.emissiveIntensity = MathUtils.lerp(material.emissiveIntensity, 0.7 + bin * 2.2, 0.18)
    })

    camera.position.x = MathUtils.lerp(camera.position.x, pointer.x * 0.6, 0.05)
    camera.position.y = MathUtils.lerp(camera.position.y, 1.3 + pointer.y * 0.3, 0.05)
    camera.lookAt(0, -0.2, 0)
  })

  return (
    <group>
      {points.map((point) => (
        <mesh
          key={point.index}
          ref={(element) => {
            barsRef.current[point.index] = element
          }}
          position={[point.x, -0.38, point.z]}
        >
          <boxGeometry args={[0.18, 1, 0.18]} />
          <meshStandardMaterial color="#59d7ff" emissive="#3fc7ff" emissiveIntensity={1} roughness={0.34} metalness={0.08} />
        </mesh>
      ))}
    </group>
  )
}

const ReactiveScene = ({ bins, energy, intensity, mode }: { bins: number[]; energy: number; intensity: number; mode: VisualizerMode }) => {
  return (
    <>
      <color attach="background" args={['#050710']} />
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 3, 3]} intensity={16} color="#6ac2ff" />
      <pointLight position={[-3, 1, -2]} intensity={12} color="#f166ff" />

      {mode === 'orbital' ? <OrbitalMode bins={bins} energy={energy} intensity={intensity} /> : null}
      {mode === 'rings' ? <RingsMode bins={bins} energy={energy} intensity={intensity} /> : null}
      {mode === 'wave' ? <WaveMode bins={bins} energy={energy} intensity={intensity} /> : null}

      <Stars radius={42} depth={28} count={1200} factor={2.6} saturation={0.4} fade speed={1} />
      <Environment preset="night" />
    </>
  )
}

export const VisualizerCanvas = () => {
  const { bins, energy } = useAudioAnalyser()
  const visualizerEnabled = usePlayerStore((state) => state.settings.visualizerEnabled)
  const visualizerIntensity = usePlayerStore((state) => state.settings.visualizerIntensity)
  const visualizerMode = usePlayerStore((state) => state.settings.visualizerMode)
  const { t } = useI18n()

  if (!visualizerEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel flex h-[360px] items-center justify-center overflow-hidden"
      >
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-300/70">{t('visualizerDisabled')}</p>
          <p className="mt-2 text-xl font-semibold text-white">{t('visualizerDisabledDesc')}</p>
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
        <ReactiveScene bins={bins} energy={energy} intensity={visualizerIntensity} mode={visualizerMode} />
      </Canvas>
    </motion.div>
  )
}
