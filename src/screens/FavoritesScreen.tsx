import { motion } from 'framer-motion'
import { Heart, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { GlassCard } from '../components/common/GlassCard'
import { useI18n } from '../hooks/useI18n'
import { usePlayerStore } from '../store/playerStore'
import { formatTime } from '../utils/time'

export const FavoritesScreen = () => {
  const tracks = usePlayerStore((state) => state.tracks)
  const favoriteTrackIds = usePlayerStore((state) => state.favoriteTrackIds)
  const currentTrackId = usePlayerStore((state) => state.currentTrackId)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite)
  const addTrackToPlaylist = usePlayerStore((state) => state.addTrackToPlaylist)
  const activePlaylistId = usePlayerStore((state) => state.activePlaylistId)
  const playlists = usePlayerStore((state) => state.playlists)
  const setPlaybackNotice = usePlayerStore((state) => state.setPlaybackNotice)
  const searchQuery = usePlayerStore((state) => state.searchQuery)
  const { t } = useI18n()

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

  const onAddToPlaylist = (trackId: string) => {
    const playlist = playlists.find((item) => item.id === activePlaylistId) ?? playlists[0]

    if (!playlist) {
      setPlaybackNotice(t('noPlaylistToAdd'))
      return
    }

    if (playlist.trackIds.includes(trackId)) {
      setPlaybackNotice(`${t('alreadyInPlaylist')}: ${playlist.name}`)
      return
    }

    addTrackToPlaylist(trackId, playlist.id)
    setPlaybackNotice(`${t('addedToPlaylist')}: ${playlist.name}`)
  }

  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34 }} className="space-y-4">
      <GlassCard className="p-4">
        <p className="text-xs uppercase tracking-[0.23em] text-slate-300/80">{t('favorites')}</p>
        <h2 className="mt-2 font-display text-2xl text-white">{t('favoritesTitle')}</h2>
        <p className="mt-1 text-sm text-slate-300/80">{t('favoritesDesc')}</p>
      </GlassCard>

      <GlassCard className="p-4">
        {favorites.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-slate-300/70">
            {t('favoritesEmpty')}
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
                <button
                  type="button"
                  onClick={() => playTrack(track.id, favorites.map((item) => item.id))}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  title={t('play')}
                >
                  <div className="h-10 w-10 rounded-lg border border-white/10 bg-cover bg-center" style={{ backgroundImage: track.artwork.startsWith('data:') ? `url(${track.artwork})` : undefined, background: track.artwork.startsWith('data:') ? undefined : track.artwork }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{track.title}</p>
                    <p className="truncate text-xs text-slate-300/75">{track.artist}</p>
                  </div>
                </button>
                <p className="text-xs text-slate-300/70">{formatTime(track.duration)}</p>
                <button
                  type="button"
                  onClick={() => onAddToPlaylist(track.id)}
                  title={t('addToPlaylistHint')}
                  className="rounded-lg border border-white/15 px-2 py-1 text-slate-200 transition hover:border-cyan-300/45 hover:text-cyan-100"
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => playTrack(track.id, favorites.map((item) => item.id))}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${currentTrackId === track.id ? 'border-cyan-300/65 bg-cyan-300/20 text-cyan-100' : 'border-white/15 text-slate-200 hover:border-cyan-300/50 hover:text-cyan-100'}`}
                  title={t('play')}
                >
                  {t('play')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(track.id)}
                  title={t('playerFavorite')}
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
