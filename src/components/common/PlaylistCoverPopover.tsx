import { Eraser, ImagePlus, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useI18n } from '../../hooks/useI18n'
import { usePlayerStore } from '../../store/playerStore'
import { toArtworkStyle } from '../../utils/artwork'
import { resizeImageFileToDataUrl } from '../../utils/image'

interface PlaylistCoverPopoverProps {
  playlistId: string
  playlistTrackIds: string[]
}

export const PlaylistCoverPopover = ({ playlistId, playlistTrackIds }: PlaylistCoverPopoverProps) => {
  const tracks = usePlayerStore((state) => state.tracks)
  const setPlaylistCoverImage = usePlayerStore((state) => state.setPlaylistCoverImage)
  const setPlaylistCoverFromTrack = usePlayerStore((state) => state.setPlaylistCoverFromTrack)
  const clearPlaylistCover = usePlayerStore((state) => state.clearPlaylistCover)
  const setPlaybackNotice = usePlayerStore((state) => state.setPlaybackNotice)
  const { t } = useI18n()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const playlistTracks = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return playlistTrackIds
      .map((trackId) => tracks.find((track) => track.id === trackId))
      .filter((track): track is NonNullable<typeof track> => Boolean(track))
      .filter((track) => {
        if (!normalized) {
          return true
        }

        return track.title.toLowerCase().includes(normalized) || track.artist.toLowerCase().includes(normalized)
      })
  }, [playlistTrackIds, query, tracks])

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

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const resized = await resizeImageFileToDataUrl(file)
    if (!resized) {
      setPlaybackNotice(t('invalidImageFile'))
      event.target.value = ''
      return
    }

    setPlaylistCoverImage(playlistId, resized)
    setPlaybackNotice(t('playlistIconUpdated'))
    setOpen(false)
    event.target.value = ''
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="btn-accent rounded-xl border px-3 py-2 text-sm font-semibold transition"
        title={t('editPlaylistCover')}
      >
        <span className="inline-flex items-center gap-1.5">
          <ImagePlus size={15} />
          {t('playlistCover')}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-40 w-80 rounded-xl border border-white/20 bg-night-900/95 p-2 shadow-glass backdrop-blur-xl">
          <p className="px-2 pb-2 text-xs uppercase tracking-[0.16em] text-slate-300/80">{t('editPlaylistCover')}</p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-accent mb-2 flex w-full items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition"
            title={t('uploadPlaylistCover')}
          >
            {t('uploadPlaylistCover')}
          </button>

          <div className="mb-2 rounded-lg border border-white/10 bg-night-950/75 px-2 py-1.5">
            <div className="flex items-center gap-2">
              <Search size={13} className="text-slate-300/70" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('searchInPlaylist')}
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {playlistTracks.length === 0 ? (
            <p className="px-2 py-2 text-xs text-slate-300/75">{t('noTracksInPlaylist')}</p>
          ) : (
            <div className="max-h-52 space-y-1 overflow-y-auto px-1">
              {playlistTracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => {
                    setPlaylistCoverFromTrack(playlistId, track.id)
                    setPlaybackNotice(t('playlistIconUpdated'))
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-left transition hover:border-cyan-300/40"
                  title={`${track.title} - ${track.artist}`}
                >
                  <div className="h-8 w-8 rounded-md border border-white/10 bg-cover bg-center" style={toArtworkStyle(track.artwork)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white">{track.title}</p>
                    <p className="truncate text-[11px] text-slate-300/75">{track.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              clearPlaylistCover(playlistId)
              setPlaybackNotice(t('playlistIconCleared'))
              setOpen(false)
            }}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-300/45 bg-rose-300/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-300/20"
            title={t('clearPlaylistCover')}
          >
            <Eraser size={13} />
            {t('clearPlaylistCover')}
          </button>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
        className="hidden"
        onChange={(event) => {
          void onUpload(event)
        }}
      />
    </div>
  )
}
