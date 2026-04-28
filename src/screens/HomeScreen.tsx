import { motion } from 'framer-motion'
import { AudioLines, Heart, PlayCircle, UploadCloud } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AddToPlaylistPopoverButton } from '../components/common/AddToPlaylistPopoverButton'
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { GlassCard } from '../components/common/GlassCard'
import { VisualizerCanvas } from '../components/visualizer/VisualizerCanvas'
import { useI18n } from '../hooks/useI18n'
import { usePlayerStore } from '../store/playerStore'
import { toArtworkStyle } from '../utils/artwork'
import { formatTime } from '../utils/time'

interface HomeScreenProps {
  onImport: () => void
}

const PAGE_SIZE = 8

export const HomeScreen = ({ onImport }: HomeScreenProps) => {
  const tracks = usePlayerStore((state) => state.tracks)
  const searchQuery = usePlayerStore((state) => state.searchQuery)
  const currentTrackId = usePlayerStore((state) => state.currentTrackId)
  const favoriteTrackIds = usePlayerStore((state) => state.favoriteTrackIds)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite)
  const activePlaylistId = usePlayerStore((state) => state.activePlaylistId)
  const playlists = usePlayerStore((state) => state.playlists)
  const { t } = useI18n()

  const [page, setPage] = useState(1)

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visiblePage = Math.min(page, totalPages)
  const offset = (visiblePage - 1) * PAGE_SIZE
  const recentTracks = filtered.slice(offset, offset + PAGE_SIZE)
  const queueIds = filtered.map((track) => track.id)

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
              <p className="text-xs uppercase tracking-[0.23em] text-cyan-100/75">{t('nowPlaying')}</p>
              <AudioLines size={16} className="text-cyan-100/70" />
            </div>
            <p className="truncate text-xl font-semibold text-white">{currentTrack?.title ?? t('chooseTrack')}</p>
            <p className="mt-1 truncate text-sm text-slate-300/80">{currentTrack?.artist ?? t('localLibrary')}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-200/80">
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <p className="uppercase tracking-wider text-slate-400">{t('duration')}</p>
                <p className="mt-1 text-sm text-white">{formatTime(currentTrack?.duration ?? 0)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <p className="uppercase tracking-wider text-slate-400">{t('playlist')}</p>
                <p className="mt-1 truncate text-sm text-white">{activePlaylist?.name ?? t('libraryQueue')}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <button
              type="button"
              onClick={onImport}
              className="btn-accent flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition"
              title={t('addLocalTracks')}
            >
              <UploadCloud size={17} />
              {t('addLocalTracks')}
            </button>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="min-h-[220px] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.23em] text-slate-300/80">{t('recentPopular')}</p>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-white/15 px-2 py-1 text-xs text-slate-200/80">
              {filtered.length} {t('tracks')}
            </span>
            <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={visiblePage <= 1}
                title={t('prevPage')}
                className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 transition disabled:opacity-45"
              >
                {t('prevPage')}
              </button>
              <span className="px-1.5 text-xs text-slate-300/85">
                {t('page')} {visiblePage}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={visiblePage >= totalPages}
                title={t('nextPage')}
                className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 transition disabled:opacity-45"
              >
                {t('nextPage')}
              </button>
            </div>
          </div>
        </div>

        {recentTracks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-slate-300/70">
            {t('noTracksFound')}
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
                  <button
                    type="button"
                    onClick={() => playTrack(track.id, queueIds)}
                    title={t('play')}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div
                      className="h-10 w-10 rounded-lg border border-white/10 bg-cover bg-center"
                      style={toArtworkStyle(track.artwork)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{track.title}</p>
                      <p className="truncate text-xs text-slate-300/75">{track.artist}</p>
                    </div>
                  </button>

                  <p className="text-xs text-slate-300/70">{formatTime(track.duration)}</p>
                  {track.isMissing ? <p className="text-[11px] text-amber-200/80">{t('reimport')}</p> : null}

                  <AddToPlaylistPopoverButton trackId={track.id} />

                  <button
                    type="button"
                    onClick={() => toggleFavorite(track.id)}
                    title={t('playerFavorite')}
                    className={`rounded-lg border px-2 py-1 text-xs transition ${isFavorite ? 'border-rose-300/65 bg-rose-300/20 text-rose-100' : 'border-white/15 text-slate-200 hover:border-rose-300/45 hover:text-rose-100'}`}
                  >
                    <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    type="button"
                    onClick={() => playTrack(track.id, queueIds)}
                    title={t('play')}
                    className="btn-accent rounded-lg border px-2.5 py-1 text-xs font-semibold transition"
                  >
                    <span className="inline-flex items-center gap-1">
                      <PlayCircle size={14} />
                      {t('play')}
                    </span>
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </GlassCard>
    </motion.section>
  )
}
