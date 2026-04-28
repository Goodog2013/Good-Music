import { motion } from 'framer-motion'
import { ListPlus, PlayCircle, Trash2, UserRoundPlus } from 'lucide-react'
import { useMemo } from 'react'
import { GlassCard } from '../components/common/GlassCard'
import { usePlayerStore } from '../store/playerStore'
import { formatTime } from '../utils/time'

export const PlaylistScreen = () => {
  const {
    tracks,
    playlists,
    activePlaylistId,
    searchQuery,
    currentTrackId,
    selectPlaylist,
    playTrack,
    playPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = usePlayerStore((state) => ({
    tracks: state.tracks,
    playlists: state.playlists,
    activePlaylistId: state.activePlaylistId,
    searchQuery: state.searchQuery,
    currentTrackId: state.currentTrackId,
    selectPlaylist: state.selectPlaylist,
    playTrack: state.playTrack,
    playPlaylist: state.playPlaylist,
    deletePlaylist: state.deletePlaylist,
    addTrackToPlaylist: state.addTrackToPlaylist,
    removeTrackFromPlaylist: state.removeTrackFromPlaylist,
  }))

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
          <p className="text-lg font-semibold text-white">Плейлист не выбран</p>
          <p className="mt-2 text-sm text-slate-300/80">Создайте плейлист в левой панели или выберите существующий.</p>
          {playlists.length > 0 ? (
            <button
              type="button"
              onClick={() => selectPlaylist(playlists[0].id)}
              className="mt-4 rounded-xl border border-cyan-300/45 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/25"
            >
              Открыть первый плейлист
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
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300/80">Playlist</p>
            <h2 className="truncate font-display text-2xl text-white">{activePlaylist.name}</h2>
            <p className="mt-1 text-sm text-slate-300/75">{activePlaylist.description}</p>
            <p className="mt-2 text-xs text-slate-400">{activePlaylist.trackIds.length} tracks</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => playPlaylist(activePlaylist.id)}
              className="rounded-xl border border-cyan-300/45 bg-cyan-300/15 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/25"
            >
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle size={16} />
                Play All
              </span>
            </button>
            <button
              type="button"
              onClick={() => deletePlaylist(activePlaylist.id)}
              className="rounded-xl border border-rose-300/45 bg-rose-300/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/20"
            >
              <span className="inline-flex items-center gap-1.5">
                <Trash2 size={16} />
                Delete
              </span>
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.23em] text-slate-300/80">Tracks</p>
        {filteredTracks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-slate-300/70">
            В плейлисте пока нет треков с текущим фильтром.
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
                <div className="h-10 w-10 rounded-lg border border-white/10" style={{ background: track.artwork }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{track.title}</p>
                  <p className="truncate text-xs text-slate-300/75">{track.artist}</p>
                </div>
                <p className="text-xs text-slate-300/75">{formatTime(track.duration)}</p>
                <button
                  type="button"
                  onClick={() => playTrack(track.id, activePlaylist.trackIds)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${currentTrackId === track.id ? 'border-cyan-300/65 bg-cyan-300/20 text-cyan-100' : 'border-white/15 text-slate-200 hover:border-cyan-300/50 hover:text-cyan-100'}`}
                >
                  Play
                </button>
                <button
                  type="button"
                  onClick={() => removeTrackFromPlaylist(track.id, activePlaylist.id)}
                  className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-200 transition hover:border-rose-300/55 hover:text-rose-100"
                >
                  Remove
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.23em] text-slate-300/80">Add From Library</p>

        {suggestionTracks.length === 0 ? (
          <p className="text-sm text-slate-300/75">Все доступные треки уже в плейлисте.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {suggestionTracks.map((track) => (
              <div key={track.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <div className="h-9 w-9 rounded-lg border border-white/10" style={{ background: track.artwork }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{track.title}</p>
                  <p className="truncate text-xs text-slate-300/70">{track.artist}</p>
                </div>
                <button
                  type="button"
                  onClick={() => addTrackToPlaylist(track.id, activePlaylist.id)}
                  className="rounded-lg border border-cyan-300/45 bg-cyan-300/15 px-2.5 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/25"
                >
                  <span className="inline-flex items-center gap-1">
                    <UserRoundPlus size={13} />
                    Add
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
        >
          <span className="inline-flex items-center gap-1">
            <ListPlus size={14} />
            Queue This Playlist
          </span>
        </button>
      </GlassCard>
    </motion.section>
  )
}

