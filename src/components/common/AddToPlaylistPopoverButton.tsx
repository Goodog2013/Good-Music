import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../hooks/useI18n'
import { usePlayerStore } from '../../store/playerStore'

interface AddToPlaylistPopoverButtonProps {
  trackId: string
  className?: string
}

export const AddToPlaylistPopoverButton = ({ trackId, className }: AddToPlaylistPopoverButtonProps) => {
  const playlists = usePlayerStore((state) => state.playlists)
  const addTrackToPlaylist = usePlayerStore((state) => state.addTrackToPlaylist)
  const createPlaylist = usePlayerStore((state) => state.createPlaylist)
  const setPlaybackNotice = usePlayerStore((state) => state.setPlaybackNotice)
  const { t } = useI18n()

  const [open, setOpen] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  const onSelectPlaylist = (playlistId: string) => {
    const playlist = usePlayerStore.getState().playlists.find((item) => item.id === playlistId)
    if (!playlist) {
      return
    }

    if (playlist.trackIds.includes(trackId)) {
      setPlaybackNotice(`${t('alreadyInPlaylist')}: ${playlist.name}`)
      setOpen(false)
      return
    }

    addTrackToPlaylist(trackId, playlistId)
    setPlaybackNotice(`${t('addedToPlaylist')}: ${playlist.name}`)
    setOpen(false)
  }

  const onCreateAndAdd = () => {
    const trimmed = newPlaylistName.trim()
    if (!trimmed) {
      return
    }

    createPlaylist(trimmed)
    const created = usePlayerStore.getState().playlists[0]

    if (!created) {
      return
    }

    addTrackToPlaylist(trackId, created.id)
    setPlaybackNotice(`${t('addedToPlaylist')}: ${created.name}`)
    setNewPlaylistName('')
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title={t('addToPlaylistHint')}
        className={
          className ??
          'rounded-lg border border-white/15 px-2 py-1 text-xs text-slate-200 transition hover:border-cyan-300/45 hover:text-cyan-100'
        }
      >
        <Plus size={14} />
      </button>

      {open ? (
        <div className="absolute right-0 top-9 z-40 w-64 rounded-xl border border-white/20 bg-night-900/95 p-2 shadow-glass backdrop-blur-xl">
          <p className="px-2 pb-2 text-xs uppercase tracking-[0.16em] text-slate-300/80">{t('addToPlaylistHint')}</p>

          {playlists.length === 0 ? (
            <p className="px-2 pb-2 text-xs text-slate-300/80">{t('noPlaylistToAdd')}</p>
          ) : (
            <div className="max-h-40 space-y-1 overflow-y-auto px-1 pb-2">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => onSelectPlaylist(playlist.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-left text-xs text-slate-200 transition hover:border-cyan-300/40 hover:bg-white/10"
                  title={playlist.name}
                >
                  <span className="truncate">{playlist.name}</span>
                  <span className="ml-2 shrink-0 text-[10px] text-slate-400">{playlist.trackIds.length}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-white/10 p-2">
            <input
              value={newPlaylistName}
              onChange={(event) => setNewPlaylistName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onCreateAndAdd()
                }
              }}
              placeholder={t('newPlaylist')}
              className="mb-2 w-full rounded-lg border border-white/15 bg-night-950/80 px-2 py-1.5 text-xs text-white placeholder:text-slate-400 focus:border-cyan-300/65 focus:outline-none"
            />
            <button
              type="button"
              onClick={onCreateAndAdd}
              className="btn-accent w-full rounded-lg border px-2 py-1.5 text-xs font-semibold transition"
              title={t('createPlaylist')}
            >
              {t('createPlaylist')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

