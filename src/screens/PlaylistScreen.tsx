import { motion } from 'framer-motion'
import { ListPlus, PlayCircle, Trash2, UserRoundPlus } from 'lucide-react'
import { useMemo } from 'react'
import { GlassCard } from '../components/common/GlassCard'
import { useI18n } from '../hooks/useI18n'
import { usePlayerStore } from '../store/playerStore'
import { toArtworkStyle } from '../utils/artwork'
import { formatTime } from '../utils/time'

export const PlaylistScreen = () => {
  const tracks = usePlayerStore((state) => state.tracks)
  const playlists = usePlayerStore((state) => state.playlists)
  const activePlaylistId = usePlayerStore((state) => state.activePlaylistId)
  const searchQuery = usePlayerStore((state) => state.searchQuery)
  const currentTrackId = usePlayerStore((state) => state.currentTrackId)
  const selectPlaylist = usePlayerStore((state) => state.selectPlaylist)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const playPlaylist = usePlayerStore((state) => state.playPlaylist)
  const deletePlaylist = usePlayerStore((state) => state.deletePlaylist)
  const addTrackToPlaylist = usePlayerStore((state) => state.addTrackToPlaylist)
  const removeTrackFromPlaylist = usePlayerStore((state) => state.removeTrackFromPlaylist)
  const { t } = useI18n()

  const activePlaylist = playlists.find((playlist) => playlist.id === activePlaylistId) ?? null

  const filteredTracks = useMemo(() => {
    if (!activePlaylist) {
      return []
    }

    const normalized = searchQuery.trim().toLowerCase()

    return activePlaylist.trackIds
      .map((trackId) => tracks.find((item) => item.id === trackId))
      .filter((track): track is NonNullable<typeof track> => Boolean(track))
      .filter((track) => {
        if (!normalized) {
          return true
        }

        return track.title.toLowerCase().includes(normalized) || track.artist.toLowerCase().includes(normalized)
      })
  }, [activePlaylist, searchQuery, tracks])

  const suggestionTracks = useMemo(() => {
    if (!activePlaylist) {
      return []
    }

    return tracks.filter((track) => !activePlaylist.trackIds.includes(track.id)).slice(0, 8)
  }, [activePlaylist, tracks])

  if (!activePlaylist) {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <GlassCard className="p-10 text-center">
          <p className="text-lg font-semibold text-white">{t('playlistNotSelected')}</p>
          <p className="mt-2 text-sm text-slate-300/80">{t('playlistNotSelectedDesc')}</p>
          {playlists.length > 0 ? (
            <button
              type="button"
              onClick={() => selectPlaylist(playlists[0].id)}
              className="btn-accent mt-4 rounded-xl border px-4 py-2 text-sm font-semibold transition"
            >
              {t('openFirstPlaylist')}
            </button>
          ) : null}
        </GlassCard>
      </motion.section>
    )
  }

  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34 }} className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="h-24 w-24 rounded-2xl border border-white/15"
            style={{
              background: `linear-gradient(145deg, hsl(${activePlaylist.coverHue} 88% 58% / 0.9), hsl(${(activePlaylist.coverHue + 70) % 360} 92% 60% / 0.85))`,
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300/80">{t('playlist')}</p>
            <h2 className="truncate font-display text-2xl text-white">{activePlaylist.name}</h2>
            <p className="mt-1 text-sm text-slate-300/75">{activePlaylist.description}</p>
            <p className="mt-2 text-xs text-slate-400">{activePlaylist.trackIds.length} {t('tracks')}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => playPlaylist(activePlaylist.id)}
              className="btn-accent rounded-xl border px-3 py-2 text-sm font-semibold transition"
              title={t('playAll')}
            >
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle size={16} />
                {t('playAll')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => deletePlaylist(activePlaylist.id)}
              className="rounded-xl border border-rose-300/45 bg-rose-300/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/20"
              title={t('delete')}
            >
              <span className="inline-flex items-center gap-1.5">
                <Trash2 size={16} />
                {t('delete')}
              </span>
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.23em] text-slate-300/80">{t('tracks')}</p>
        {filteredTracks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-slate-300/70">
            {t('noTracksFound')}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => playTrack(track.id, activePlaylist.trackIds)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  title={t('play')}
                >
                  <div className="h-10 w-10 rounded-lg border border-white/10 bg-cover bg-center" style={toArtworkStyle(track.artwork)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{track.title}</p>
                    <p className="truncate text-xs text-slate-300/75">{track.artist}</p>
                  </div>
                </button>
                <p className="text-xs text-slate-300/75">{formatTime(track.duration)}</p>
                <button
                  type="button"
                  onClick={() => playTrack(track.id, activePlaylist.trackIds)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${currentTrackId === track.id ? 'border-cyan-300/65 bg-cyan-300/20 text-cyan-100' : 'border-white/15 text-slate-200 hover:border-cyan-300/50 hover:text-cyan-100'}`}
                  title={t('play')}
                >
                  {t('play')}
                </button>
                <button
                  type="button"
                  onClick={() => removeTrackFromPlaylist(track.id, activePlaylist.id)}
                  className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-200 transition hover:border-rose-300/55 hover:text-rose-100"
                  title={t('remove')}
                >
                  {t('remove')}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.23em] text-slate-300/80">{t('addFromLibrary')}</p>

        {suggestionTracks.length === 0 ? (
          <p className="text-sm text-slate-300/75">{t('allTracksAlreadyInPlaylist')}</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {suggestionTracks.map((track) => (
              <div key={track.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <button
                  type="button"
                  onClick={() => playTrack(track.id, activePlaylist.trackIds)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  title={t('play')}
                >
                  <div className="h-9 w-9 rounded-lg border border-white/10 bg-cover bg-center" style={toArtworkStyle(track.artwork)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{track.title}</p>
                    <p className="truncate text-xs text-slate-300/70">{track.artist}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => addTrackToPlaylist(track.id, activePlaylist.id)}
                  className="btn-accent rounded-lg border px-2.5 py-1 text-xs font-semibold transition"
                  title={t('addToPlaylistHint')}
                >
                  <span className="inline-flex items-center gap-1">
                    <UserRoundPlus size={13} />
                    {t('addToPlaylist')}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => playPlaylist(activePlaylist.id)}
          className="mt-3 rounded-xl border border-fuchsia-300/45 bg-fuchsia-300/15 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-100 transition hover:bg-fuchsia-300/25"
          title={t('queueThisPlaylist')}
        >
          <span className="inline-flex items-center gap-1">
            <ListPlus size={14} />
            {t('queueThisPlaylist')}
          </span>
        </button>
      </GlassCard>
    </motion.section>
  )
}
