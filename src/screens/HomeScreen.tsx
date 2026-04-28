import { motion } from 'framer-motion'
import { AudioLines, Heart, Music2, PlayCircle, UploadCloud } from 'lucide-react'
import { useMemo } from 'react'
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { GlassCard } from '../components/common/GlassCard'
import { VisualizerCanvas } from '../components/visualizer/VisualizerCanvas'
import { usePlayerStore } from '../store/playerStore'
import { formatTime } from '../utils/time'

interface HomeScreenProps {
  onImport: () => void
}

export const HomeScreen = ({ onImport }: HomeScreenProps) => {
  const tracks = usePlayerStore((state) => state.tracks)
  const searchQuery = usePlayerStore((state) => state.searchQuery)
  const currentTrackId = usePlayerStore((state) => state.currentTrackId)
  const favoriteTrackIds = usePlayerStore((state) => state.favoriteTrackIds)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite)
  const activePlaylistId = usePlayerStore((state) => state.activePlaylistId)
  const playlists = usePlayerStore((state) => state.playlists)

  const filtered = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()

    return tracks
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((track) => {
        if (!normalized) {
          return true
        }

        return (
          track.title.toLowerCase().includes(normalized) ||
          track.artist.toLowerCase().includes(normalized) ||
          (track.fileName?.toLowerCase().includes(normalized) ?? false)
        )
      })
  }, [searchQuery, tracks])

  const recentTracks = filtered.slice(0, 10)
  const queueIds = recentTracks.map((track) => track.id)

  const currentTrack = useMemo(
    () => tracks.find((track) => track.id === currentTrackId) ?? null,
    [currentTrackId, tracks],
  )

  const activePlaylist = playlists.find((playlist) => playlist.id === activePlaylistId)

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-0 space-y-4"
    >
      <div className="grid gap-4 xl:grid-cols-[2.4fr_1fr]">
        <ErrorBoundary
          fallback={
            <GlassCard className="flex h-[360px] items-center justify-center p-6 text-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300/75">3D Fallback</p>
                <p className="mt-2 text-lg font-semibold text-white">GPU/WebGL error detected</p>
                <p className="mt-1 text-sm text-slate-300/80">Visualizer was disabled to keep the player usable.</p>
              </div>
            </GlassCard>
          }
        >
          <VisualizerCanvas />
        </ErrorBoundary>

        <div className="space-y-4">
          <GlassCard>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.23em] text-cyan-100/75">Now Playing</p>
              <AudioLines size={16} className="text-cyan-100/70" />
            </div>
            <p className="truncate text-xl font-semibold text-white">{currentTrack?.title ?? 'Выберите трек'}</p>
            <p className="mt-1 truncate text-sm text-slate-300/80">{currentTrack?.artist ?? 'Локальная библиотека'}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-200/80">
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <p className="uppercase tracking-wider text-slate-400">Duration</p>
                <p className="mt-1 text-sm text-white">{formatTime(currentTrack?.duration ?? 0)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <p className="uppercase tracking-wider text-slate-400">Playlist</p>
                <p className="mt-1 truncate text-sm text-white">{activePlaylist?.name ?? 'Library queue'}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <button
              type="button"
              onClick={onImport}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-fuchsia-300/40 bg-fuchsia-300/15 px-3 py-3 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-300/25"
            >
              <UploadCloud size={17} />
              Добавить локальные треки
            </button>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="min-h-[220px] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.23em] text-slate-300/80">Recent / Popular</p>
          <span className="rounded-md border border-white/15 px-2 py-1 text-xs text-slate-200/80">{recentTracks.length} tracks</span>
        </div>

        {recentTracks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-slate-300/70">
            В библиотеке пока нет подходящих треков. Импортируйте `mp3`, `wav` или `ogg`.
          </p>
        ) : (
          <div className="space-y-2">
            {recentTracks.map((track, index) => {
              const isFavorite = favoriteTrackIds.includes(track.id)

              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 transition hover:border-cyan-300/40 hover:bg-white/5"
                >
                  <div className="h-10 w-10 rounded-lg border border-white/10" style={{ background: track.artwork }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{track.title}</p>
                    <p className="truncate text-xs text-slate-300/75">{track.artist}</p>
                  </div>
                  <p className="text-xs text-slate-300/70">{formatTime(track.duration)}</p>
                  {track.isMissing ? <p className="text-[11px] text-amber-200/80">reimport</p> : null}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(track.id)}
                    className={`rounded-lg border px-2 py-1 text-xs transition ${isFavorite ? 'border-rose-300/65 bg-rose-300/20 text-rose-100' : 'border-white/15 text-slate-200 hover:border-rose-300/45 hover:text-rose-100'}`}
                  >
                    <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => playTrack(track.id, queueIds)}
                    className="rounded-lg border border-cyan-300/45 bg-cyan-300/15 px-2.5 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/25"
                  >
                    <span className="inline-flex items-center gap-1">
                      <PlayCircle size={14} />
                      Play
                    </span>
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-300/80">Desktop mode активен: custom title bar и native window controls подключены.</p>
          <Music2 size={16} className="text-cyan-200/70" />
        </div>
      </GlassCard>
    </motion.section>
  )
}

