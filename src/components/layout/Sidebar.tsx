import { useMemo, useState } from 'react'
import { FolderPlus, Heart, House, LibraryBig, ListMusic, Settings2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useI18n } from '../../hooks/useI18n'
import { usePlayerStore } from '../../store/playerStore'
import { cn } from '../../utils/cn'

interface SidebarProps {
  onImport: () => void
}

export const Sidebar = ({ onImport }: SidebarProps) => {
  const activeView = usePlayerStore((state) => state.activeView)
  const setActiveView = usePlayerStore((state) => state.setActiveView)
  const playlists = usePlayerStore((state) => state.playlists)
  const tracksCount = usePlayerStore((state) => state.tracks.length)
  const favoritesCount = usePlayerStore((state) => state.favoriteTrackIds.length)
  const activePlaylistId = usePlayerStore((state) => state.activePlaylistId)
  const selectPlaylist = usePlayerStore((state) => state.selectPlaylist)
  const createPlaylist = usePlayerStore((state) => state.createPlaylist)
  const { t } = useI18n()

  const [draft, setDraft] = useState('')

  const navItems = useMemo(
    () => [
      {
        id: 'home',
        label: t('library'),
        counter: tracksCount,
        icon: House,
        onClick: () => setActiveView('home'),
      },
      {
        id: 'playlist',
        label: t('playlists'),
        counter: playlists.length,
        icon: ListMusic,
        onClick: () => {
          if (activePlaylistId) {
            selectPlaylist(activePlaylistId)
            return
          }

          const first = playlists[0]
          if (first) {
            selectPlaylist(first.id)
          } else {
            setActiveView('playlist')
          }
        },
      },
      {
        id: 'favorites',
        label: t('favorites'),
        counter: favoritesCount,
        icon: Heart,
        onClick: () => setActiveView('favorites'),
      },
      {
        id: 'settings',
        label: t('settings'),
        counter: null,
        icon: Settings2,
        onClick: () => setActiveView('settings'),
      },
    ],
    [activePlaylistId, favoritesCount, playlists, selectPlaylist, setActiveView, t, tracksCount],
  )

  const onCreate = () => {
    if (!draft.trim()) {
      return
    }

    createPlaylist(draft.trim())
    setDraft('')
  }

  return (
    <aside className="flex min-h-0 flex-col gap-4 border-r border-white/10 bg-black/25 p-4">
      <div className="glass-panel p-3">
        <button
          type="button"
          onClick={onImport}
          className="btn-accent flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition"
          title={t('addLocalTracks')}
        >
          <FolderPlus size={16} />
          {t('addLocalTracks')}
        </button>
      </div>

      <div className="glass-panel p-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              title={item.label}
              className={cn(
                'mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-gradient-to-r from-fuchsia-500/35 via-blue-500/30 to-cyan-400/25 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white',
              )}
            >
              <span className="flex items-center gap-2">
                <Icon size={15} />
                {item.label}
              </span>
              {item.counter !== null ? (
                <span className="rounded-md border border-white/20 px-2 py-0.5 text-[11px]">{item.counter}</span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="glass-panel flex min-h-0 flex-1 flex-col p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300/80">{t('playlists')}</p>
          <Sparkles size={14} className="text-fuchsia-200/75" />
        </div>

        <div className="mb-3 flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onCreate()
              }
            }}
            placeholder={t('newPlaylist')}
            className="w-full rounded-lg border border-white/15 bg-night-950/70 px-2.5 py-2 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none"
          />
          <button
            type="button"
            onClick={onCreate}
            title={t('createPlaylist')}
            className="btn-accent rounded-lg border px-2.5 transition"
            aria-label={t('createPlaylist')}
          >
            <LibraryBig size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {playlists.map((playlist) => {
            const isActive = playlist.id === activePlaylistId && activeView === 'playlist'

            return (
              <motion.button
                key={playlist.id}
                whileHover={{ scale: 1.01 }}
                type="button"
                onClick={() => selectPlaylist(playlist.id)}
                title={playlist.name}
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-left transition',
                  isActive
                    ? 'border-cyan-300/55 bg-cyan-400/10 text-white shadow-glow'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300/35 hover:bg-white/10',
                )}
              >
                <p className="truncate text-sm font-semibold">{playlist.name}</p>
                <p className="mt-1 truncate text-xs text-slate-300/70">{playlist.trackIds.length} {t('tracks')}</p>
              </motion.button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
