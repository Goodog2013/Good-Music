import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useMemo } from 'react'
import { GlassCard } from '../components/common/GlassCard'
import { usePlayerStore } from '../store/playerStore'
import { formatTime } from '../utils/time'

export const FavoritesScreen = () => {
  const { tracks, favoriteTrackIds, currentTrackId, playTrack, toggleFavorite, searchQuery } = usePlayerStore((state) => ({
    tracks: state.tracks,
    favoriteTrackIds: state.favoriteTrackIds,
    currentTrackId: state.currentTrackId,
    playTrack: state.playTrack,
    toggleFavorite: state.toggleFavorite,
    searchQuery: state.searchQuery,
  }))

  const favorites = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()

    return favoriteTrackIds
      .map((trackId) => tracks.find((track) => track.id === trackId))
      .filter((track): track is NonNullable<typeof track> => Boolean(track))
      .filter((track) => {
        if (!normalized) {
          return true
        }

        return track.title.toLowerCase().includes(normalized) || track.artist.toLowerCase().includes(normalized)
      })
  }, [favoriteTrackIds, searchQuery, tracks])

  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34 }} className="space-y-4">
      <GlassCard className="p-4">
        <p className="text-xs uppercase tracking-[0.23em] text-slate-300/80">Favorites</p>
        <h2 className="mt-2 font-display text-2xl text-white">Liked Tracks</h2>
        <p className="mt-1 text-sm text-slate-300/80">Быстрый доступ к трекам, которые вы пометили сердцем.</p>
      </GlassCard>

      <GlassCard className="p-4">
        {favorites.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-slate-300/70">
            Здесь пока пусто. Отметьте треки и они появятся в избранном.
          </p>
        ) : (
          <div className="space-y-2">
            {favorites.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"
              >
                <div className="h-10 w-10 rounded-lg border border-white/10" style={{ background: track.artwork }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{track.title}</p>
                  <p className="truncate text-xs text-slate-300/75">{track.artist}</p>
                </div>
                <p className="text-xs text-slate-300/70">{formatTime(track.duration)}</p>
                <button
                  type="button"
                  onClick={() => playTrack(track.id, favorites.map((item) => item.id))}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${currentTrackId === track.id ? 'border-cyan-300/65 bg-cyan-300/20 text-cyan-100' : 'border-white/15 text-slate-200 hover:border-cyan-300/50 hover:text-cyan-100'}`}
                >
                  Play
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(track.id)}
                  className="rounded-lg border border-rose-300/60 bg-rose-300/20 px-2 py-1 text-rose-100"
                >
                  <Heart size={14} fill="currentColor" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.section>
  )
}

