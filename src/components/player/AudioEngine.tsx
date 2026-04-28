import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { MathUtils } from 'three'
import { AudioAnalyserContext, EMPTY_FRAME } from '../../hooks/useAudioAnalyser'
import { usePlayerStore } from '../../store/playerStore'

const rampVolume = async (audio: HTMLAudioElement, from: number, to: number, durationMs: number) => {
  const startedAt = performance.now()

  return new Promise<void>((resolve) => {
    const tick = (time: number) => {
      const progress = Math.min((time - startedAt) / durationMs, 1)
      audio.volume = MathUtils.lerp(from, to, progress)

      if (progress >= 1) {
        resolve()
        return
      }

      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  })
}

export const AudioEngineProvider = ({ children }: PropsWithChildren) => {
  const tracks = usePlayerStore((state) => state.tracks)
  const currentTrackId = usePlayerStore((state) => state.currentTrackId)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const volume = usePlayerStore((state) => state.volume)
  const pendingSeek = usePlayerStore((state) => state.pendingSeek)
  const visualizerEnabled = usePlayerStore((state) => state.settings.visualizerEnabled)
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime)
  const setDuration = usePlayerStore((state) => state.setDuration)
  const nextTrack = usePlayerStore((state) => state.nextTrack)
  const consumeSeek = usePlayerStore((state) => state.consumeSeek)
  const setPlaybackNotice = usePlayerStore((state) => state.setPlaybackNotice)

  const currentTrack = useMemo(
    () => tracks.find((track) => track.id === currentTrackId) ?? null,
    [currentTrackId, tracks],
  )

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const [frame, setFrame] = useState(EMPTY_FRAME)

  const ensureAudioGraph = async () => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    if (!sourceRef.current) {
      sourceRef.current = audioContextRef.current.createMediaElementSource(audio)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.84

      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)
    }

    if (audioContextRef.current.state !== 'running') {
      await audioContextRef.current.resume()
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const onDurationChange = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const onEnded = () => {
      nextTrack()
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onDurationChange)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onDurationChange)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
    }
  }, [nextTrack, setCurrentTime, setDuration])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    let cancelled = false

    const syncTrack = async () => {
      if (!currentTrack || currentTrack.isMissing || !currentTrack.url) {
        audio.pause()
        usePlayerStore.setState({ isPlaying: false })

        if (currentTrack?.isMissing) {
          setPlaybackNotice('Источник локального трека недоступен. Импортируйте файл снова.')
        }
        return
      }

      const sourceChanged = audio.dataset.trackId !== currentTrack.id

      if (sourceChanged) {
        const wasPlaying = !audio.paused
        if (wasPlaying) {
          await rampVolume(audio, audio.volume, 0.02, 140)
        }

        audio.src = currentTrack.url
        audio.dataset.trackId = currentTrack.id
        audio.load()
        setDuration(currentTrack.duration || 0)

        if (isPlaying && !cancelled) {
          try {
            await ensureAudioGraph()
            audio.volume = 0.03
            await audio.play()
            await rampVolume(audio, 0.03, volume, 190)
          } catch {
            setPlaybackNotice('Не удалось запустить воспроизведение. Нажмите Play ещё раз.')
          }
        }
      }
    }

    syncTrack()

    return () => {
      cancelled = true
    }
  }, [currentTrack, isPlaying, setDuration, setPlaybackNotice, volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack || currentTrack.isMissing || !currentTrack.url) {
      return
    }

    const run = async () => {
      if (isPlaying) {
        try {
          await ensureAudioGraph()
          await audio.play()
          setPlaybackNotice(null)
        } catch {
          usePlayerStore.setState({ isPlaying: false })
          setPlaybackNotice('Автовоспроизведение заблокировано, нажмите Play вручную.')
        }
      } else {
        audio.pause()
      }
    }

    run()
  }, [currentTrack, isPlaying, setPlaybackNotice])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || pendingSeek === null || !Number.isFinite(pendingSeek)) {
      return
    }

    try {
      audio.currentTime = pendingSeek
    } catch {
      // Ignore seek failures for invalid track state.
    }

    consumeSeek()
  }, [consumeSeek, pendingSeek])

  useEffect(() => {
    if (!visualizerEnabled) {
      return
    }

    const loop = () => {
      const analyser = analyserRef.current

      if (analyser) {
        const raw = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(raw)

        const bins = Array.from({ length: 32 }, (_, index) => {
          const start = Math.floor((index * raw.length) / 32)
          const end = Math.floor(((index + 1) * raw.length) / 32)
          const slice = raw.slice(start, Math.max(end, start + 1))
          const avg = slice.reduce((acc, value) => acc + value, 0) / slice.length
          return avg / 255
        })

        const energy = bins.reduce((acc, value) => acc + value, 0) / bins.length
        setFrame({ bins, energy })
      } else {
        setFrame((previous) => ({
          bins: previous.bins.map((value) => Math.max(0, value - 0.03)),
          energy: Math.max(0, previous.energy - 0.03),
        }))
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [visualizerEnabled])

  const analyserFrame = visualizerEnabled ? frame : EMPTY_FRAME

  return (
    <AudioAnalyserContext.Provider value={analyserFrame}>
      {children}
      <audio ref={audioRef} preload="metadata" className="hidden" />
    </AudioAnalyserContext.Provider>
  )
}
