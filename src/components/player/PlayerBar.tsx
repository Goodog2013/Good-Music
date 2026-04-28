import { motion } from 'framer-motion'
import { Heart, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useMemo } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { formatTime } from '../../utils/time'

const RepeatIcon = ({ mode }: { mode: 'off' | 'all' | 'one' }) => {
  if (mode === 'one') {
    return <Repeat1 size={16} />
  }

  return <Repeat size={16} />
}

export const PlayerBar = () => {
  const {
    tracks,
    currentTrackId,
    currentTime,
    duration,
    isPlaying,
    volume,
    shuffle,
    repeatMode,
    favoriteTrackIds,
    togglePlayPause,
    previousTrack,
    nextTrack,
    seekTo,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
    toggleFavorite,
  } = usePlayerStore((state) => ({
    tracks: state.tracks,
    currentTrackId: state.currentTrackId,
    currentTime: state.currentTime,
    duration: state.duration,
    isPlaying: state.isPlaying,
    volume: state.volume,
    shuffle: state.shuffle,
    repeatMode: state.repeatMode,
    favoriteTrackIds: state.favoriteTrackIds,
    togglePlayPause: state.togglePlayPause,
    previousTrack: state.previousTrack,
    nextTrack: state.nextTrack,
    seekTo: state.seekTo,
    setVolume: state.setVolume,
    toggleShuffle: state.toggleShuffle,
    cycleRepeatMode: state.cycleRepeatMode,
    toggleFavorite: state.toggleFavorite,
  }))

  const currentTrack = useMemo(() => tracks.find((track) => track.id === currentTrackId) ?? null, [currentTrackId, tracks])

  const isFavorite = currentTrack ? favoriteTrackIds.includes(currentTrack.id) : false

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : currentTrack?.duration ?? 0

  return (
    <motion.footer
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative z-20 border-t border-white/10 bg-black/25 px-4 pb-4 pt-3 backdrop-blur-xl"
    >
      <div className="glass-panel grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1.1fr_2fr_1.2fr] lg:items-center">
        <div className="flex items-center gap-3">
          <div
            className="h-14 w-14 rounded-xl border border-white/15 shadow-neon"
            style={{ background: currentTrack?.artwork ?? 'linear-gradient(145deg, #2d3f70, #8146ff)' }}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{currentTrack?.title ?? 'No Track Selected'}</p>
            <p className="truncate text-xs text-slate-300/75">{currentTrack?.artist ?? 'Импортируйте локальные треки'}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={toggleShuffle}
              className={`rounded-lg border px-2.5 py-1.5 transition ${shuffle ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100' : 'border-white/15 text-slate-300 hover:text-white'}`}
              aria-label="Toggle shuffle"
            >
              <Shuffle size={15} />
            </button>

            <button
              type="button"
              onClick={previousTrack}
              className="rounded-full border border-white/20 p-2 text-slate-100 transition hover:border-cyan-300/70 hover:text-cyan-100"
              aria-label="Previous track"
            >
              <SkipBack size={18} />
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              className="rounded-full border border-cyan-300/70 bg-cyan-300/20 p-3 text-cyan-50 shadow-glow transition hover:bg-cyan-300/30"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              className="rounded-full border border-white/20 p-2 text-slate-100 transition hover:border-cyan-300/70 hover:text-cyan-100"
              aria-label="Next track"
            >
              <SkipForward size={18} />
            </button>

            <button
              type="button"
              onClick={cycleRepeatMode}
              className={`rounded-lg border px-2.5 py-1.5 transition ${repeatMode !== 'off' ? 'border-fuchsia-300/55 bg-fuchsia-300/15 text-fuchsia-100' : 'border-white/15 text-slate-300 hover:text-white'}`}
              aria-label="Cycle repeat mode"
            >
              <RepeatIcon mode={repeatMode} />
            </button>
          </div>

          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-xs text-slate-300/80">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={safeDuration || 1}
              step={0.01}
              value={Math.min(currentTime, safeDuration || 0)}
              onChange={(event) => seekTo(Number(event.target.value))}
              className="player-range"
              aria-label="Track progress"
            />
            <span>{formatTime(safeDuration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={!currentTrack}
            onClick={() => {
              if (currentTrack) {
                toggleFavorite(currentTrack.id)
              }
            }}
            className={`rounded-lg border p-2 transition ${isFavorite ? 'border-rose-300/65 bg-rose-300/15 text-rose-100' : 'border-white/15 text-slate-200 hover:border-rose-300/40 hover:text-rose-100'}`}
            aria-label="Toggle favorite"
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>

          <div className="flex w-full max-w-[180px] items-center gap-2 rounded-xl border border-white/15 px-3 py-2">
            {volume <= 0.01 ? <VolumeX size={15} className="text-slate-300" /> : <Volume2 size={15} className="text-slate-300" />}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="player-range"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </motion.footer>
  )
}

