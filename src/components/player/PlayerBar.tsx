import { motion } from 'framer-motion'
import { Heart, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useMemo } from 'react'
import { useI18n } from '../../hooks/useI18n'
import { usePlayerStore } from '../../store/playerStore'
import { toArtworkStyle } from '../../utils/artwork'
import { formatTime } from '../../utils/time'

const RepeatIcon = ({ mode }: { mode: 'off' | 'all' | 'one' }) => {
  if (mode === 'one') {
    return <Repeat1 size={16} />
  }

  return <Repeat size={16} />
}

export const PlayerBar = () => {
  const tracks = usePlayerStore((state) => state.tracks)
  const currentTrackId = usePlayerStore((state) => state.currentTrackId)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const volume = usePlayerStore((state) => state.volume)
  const shuffle = usePlayerStore((state) => state.shuffle)
  const repeatMode = usePlayerStore((state) => state.repeatMode)
  const favoriteTrackIds = usePlayerStore((state) => state.favoriteTrackIds)
  const togglePlayPause = usePlayerStore((state) => state.togglePlayPause)
  const previousTrack = usePlayerStore((state) => state.previousTrack)
  const nextTrack = usePlayerStore((state) => state.nextTrack)
  const seekTo = usePlayerStore((state) => state.seekTo)
  const setVolume = usePlayerStore((state) => state.setVolume)
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle)
  const cycleRepeatMode = usePlayerStore((state) => state.cycleRepeatMode)
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite)
  const { t } = useI18n()

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
        <button
          type="button"
          onClick={() => currentTrack && togglePlayPause()}
          className="flex items-center gap-3 text-left"
          title={currentTrack ? t('play') : t('chooseTrack')}
        >
          <div
            className="h-14 w-14 rounded-xl border border-white/15 bg-cover bg-center shadow-neon"
            style={toArtworkStyle(currentTrack?.artwork)}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{currentTrack?.title ?? 'No Track Selected'}</p>
            <p className="truncate text-xs text-slate-300/75">{currentTrack?.artist ?? t('addLocalTracks')}</p>
          </div>
        </button>

        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={toggleShuffle}
              title={t('playerShuffle')}
              className={`rounded-lg border px-2.5 py-1.5 transition ${shuffle ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100' : 'border-white/15 text-slate-300 hover:text-white'}`}
              aria-label={t('playerShuffle')}
            >
              <Shuffle size={15} />
            </button>

            <button
              type="button"
              onClick={previousTrack}
              title={t('playerPrevious')}
              className="rounded-full border border-white/20 p-2 text-slate-100 transition hover:border-cyan-300/70 hover:text-cyan-100"
              aria-label={t('playerPrevious')}
            >
              <SkipBack size={18} />
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              title={isPlaying ? t('playerPause') : t('playerPlay')}
              className="btn-accent-strong rounded-full border p-3 shadow-glow transition"
              aria-label={isPlaying ? t('playerPause') : t('playerPlay')}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              title={t('playerNext')}
              className="rounded-full border border-white/20 p-2 text-slate-100 transition hover:border-cyan-300/70 hover:text-cyan-100"
              aria-label={t('playerNext')}
            >
              <SkipForward size={18} />
            </button>

            <button
              type="button"
              onClick={cycleRepeatMode}
              title={t('playerRepeat')}
              className={`rounded-lg border px-2.5 py-1.5 transition ${repeatMode !== 'off' ? 'border-fuchsia-300/55 bg-fuchsia-300/15 text-fuchsia-100' : 'border-white/15 text-slate-300 hover:text-white'}`}
              aria-label={t('playerRepeat')}
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
              title="Track progress"
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
            title={t('playerFavorite')}
            className={`rounded-lg border p-2 transition ${isFavorite ? 'border-rose-300/65 bg-rose-300/15 text-rose-100' : 'border-white/15 text-slate-200 hover:border-rose-300/40 hover:text-rose-100'}`}
            aria-label={t('playerFavorite')}
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
              aria-label={t('playerVolume')}
              title={t('playerVolume')}
            />
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
