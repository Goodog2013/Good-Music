import { create } from 'zustand'
import { shallow } from 'zustand/shallow'
import { subscribeWithSelector } from 'zustand/middleware'
import { defaultSettings, getDemoPlaylists, getDemoTracks, hydrateTrack } from '../data/demoLibrary'
import { readAudioDuration } from '../utils/audio'
import { makeId, parseArtistAndTitle, pickArtworkGradient, isSupportedAudioFile } from '../utils/track'
import { clamp } from '../utils/time'
import type { AppSettings, AppView, Playlist, RepeatMode, Track } from '../types/music'

const STORAGE_KEY = 'goodogs-music-library-v1'

interface PersistedSnapshot {
  tracks: Track[]
  playlists: Playlist[]
  favoriteTrackIds: string[]
  activePlaylistId: string | null
  settings: AppSettings
}

interface PlayerStore {
  tracks: Track[]
  playlists: Playlist[]
  favoriteTrackIds: string[]
  activePlaylistId: string | null
  activeView: AppView
  searchQuery: string
  queueTrackIds: string[]
  currentTrackId: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  pendingSeek: number | null
  volume: number
  shuffle: boolean
  repeatMode: RepeatMode
  playbackNotice: string | null
  settings: AppSettings
  setActiveView: (view: AppView) => void
  setSearchQuery: (query: string) => void
  setPlaybackNotice: (notice: string | null) => void
  dismissPlaybackNotice: () => void
  selectPlaylist: (playlistId: string) => void
  createPlaylist: (name: string, description?: string) => void
  deletePlaylist: (playlistId: string) => void
  addTrackToPlaylist: (trackId: string, playlistId: string) => void
  removeTrackFromPlaylist: (trackId: string, playlistId: string) => void
  playPlaylist: (playlistId: string) => void
  playTrack: (trackId: string, queueIds?: string[]) => void
  togglePlayPause: () => void
  nextTrack: () => void
  previousTrack: () => void
  seekTo: (seconds: number) => void
  consumeSeek: () => void
  setCurrentTime: (seconds: number) => void
  setDuration: (seconds: number) => void
  setVolume: (volume: number) => void
  toggleShuffle: () => void
  cycleRepeatMode: () => void
  toggleFavorite: (trackId: string) => void
  addLocalTracks: (files: File[]) => Promise<{ added: number; skipped: number }>
  setVisualizerEnabled: (enabled: boolean) => void
  setVisualizerIntensity: (intensity: number) => void
  clearLibrary: () => void
}

const ensureUnique = (ids: string[]) => Array.from(new Set(ids))

const loadPersistedSnapshot = (): PersistedSnapshot | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as PersistedSnapshot
    return parsed
  } catch {
    return null
  }
}

const hydrateInitialState = () => {
  const demoTracks = getDemoTracks()
  const demoPlaylists = getDemoPlaylists()
  const persisted = loadPersistedSnapshot()

  if (!persisted) {
    const queueTrackIds = demoPlaylists[0]?.trackIds ?? demoTracks.map((track) => track.id)

    return {
      tracks: demoTracks,
      playlists: demoPlaylists,
      favoriteTrackIds: [demoTracks[0]?.id].filter(Boolean) as string[],
      activePlaylistId: demoPlaylists[0]?.id ?? null,
      queueTrackIds,
      currentTrackId: queueTrackIds[0] ?? demoTracks[0]?.id ?? null,
      settings: defaultSettings,
    }
  }

  const hydratedTracks = persisted.tracks.map((track) => hydrateTrack(track))
  const validTrackIds = new Set(hydratedTracks.map((track) => track.id))

  const hydratedPlaylists = persisted.playlists.map((playlist) => ({
    ...playlist,
    trackIds: playlist.trackIds.filter((trackId) => validTrackIds.has(trackId)),
  }))

  const fallbackQueue = hydratedPlaylists[0]?.trackIds.length
    ? hydratedPlaylists[0].trackIds
    : hydratedTracks.map((track) => track.id)

  const safeActivePlaylistId = hydratedPlaylists.find((playlist) => playlist.id === persisted.activePlaylistId)
    ? persisted.activePlaylistId
    : hydratedPlaylists[0]?.id ?? null

  const safeFavorites = persisted.favoriteTrackIds.filter((trackId) => validTrackIds.has(trackId))

  return {
    tracks: hydratedTracks.length > 0 ? hydratedTracks : demoTracks,
    playlists: hydratedPlaylists.length > 0 ? hydratedPlaylists : demoPlaylists,
    favoriteTrackIds: safeFavorites,
    activePlaylistId: safeActivePlaylistId,
    queueTrackIds: fallbackQueue,
    currentTrackId: fallbackQueue[0] ?? hydratedTracks[0]?.id ?? null,
    settings: {
      ...defaultSettings,
      ...persisted.settings,
    },
  }
}

const resolveQueue = (state: Pick<PlayerStore, 'queueTrackIds' | 'tracks'>) => {
  const validTrackIds = new Set(state.tracks.map((track) => track.id))
  const queue = ensureUnique(state.queueTrackIds.filter((trackId) => validTrackIds.has(trackId)))

  if (queue.length > 0) {
    return queue
  }

  return state.tracks.map((track) => track.id)
}

const findTrackIndex = (queue: string[], currentTrackId: string | null) => queue.findIndex((trackId) => trackId === currentTrackId)

const initialState = hydrateInitialState()

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector((set, get) => ({
    tracks: initialState.tracks,
    playlists: initialState.playlists,
    favoriteTrackIds: initialState.favoriteTrackIds,
    activePlaylistId: initialState.activePlaylistId,
    activeView: 'home',
    searchQuery: '',
    queueTrackIds: initialState.queueTrackIds,
    currentTrackId: initialState.currentTrackId,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    pendingSeek: null,
    volume: 0.72,
    shuffle: false,
    repeatMode: 'off',
    playbackNotice: null,
    settings: initialState.settings,
    setActiveView: (view) => {
      set({ activeView: view })
    },
    setSearchQuery: (query) => {
      set({ searchQuery: query })
    },
    setPlaybackNotice: (notice) => {
      set({ playbackNotice: notice })
    },
    dismissPlaybackNotice: () => {
      set({ playbackNotice: null })
    },
    selectPlaylist: (playlistId) => {
      const playlist = get().playlists.find((item) => item.id === playlistId)
      if (!playlist) {
        return
      }

      set({
        activePlaylistId: playlistId,
        activeView: 'playlist',
      })
    },
    createPlaylist: (name, description = 'Custom playlist') => {
      const trimmed = name.trim()
      if (!trimmed) {
        return
      }

      const nextPlaylist: Playlist = {
        id: makeId('playlist'),
        name: trimmed,
        description,
        coverHue: Math.round(Math.random() * 360),
        trackIds: [],
        createdAt: Date.now(),
      }

      set((state) => ({
        playlists: [nextPlaylist, ...state.playlists],
        activePlaylistId: nextPlaylist.id,
        activeView: 'playlist',
      }))
    },
    deletePlaylist: (playlistId) => {
      const state = get()
      const target = state.playlists.find((playlist) => playlist.id === playlistId)
      if (!target) {
        return
      }

      const nextPlaylists = state.playlists.filter((playlist) => playlist.id !== playlistId)
      const nextActivePlaylistId = state.activePlaylistId === playlistId ? nextPlaylists[0]?.id ?? null : state.activePlaylistId

      set({
        playlists: nextPlaylists,
        activePlaylistId: nextActivePlaylistId,
      })
    },
    addTrackToPlaylist: (trackId, playlistId) => {
      set((state) => ({
        playlists: state.playlists.map((playlist) => {
          if (playlist.id !== playlistId) {
            return playlist
          }

          if (playlist.trackIds.includes(trackId)) {
            return playlist
          }

          return {
            ...playlist,
            trackIds: [...playlist.trackIds, trackId],
          }
        }),
      }))
    },
    removeTrackFromPlaylist: (trackId, playlistId) => {
      set((state) => ({
        playlists: state.playlists.map((playlist) => {
          if (playlist.id !== playlistId) {
            return playlist
          }

          return {
            ...playlist,
            trackIds: playlist.trackIds.filter((id) => id !== trackId),
          }
        }),
      }))
    },
    playPlaylist: (playlistId) => {
      const state = get()
      const playlist = state.playlists.find((item) => item.id === playlistId)

      if (!playlist || playlist.trackIds.length === 0) {
        set({ playbackNotice: 'В этом плейлисте пока нет треков.' })
        return
      }

      set({
        activePlaylistId: playlistId,
        queueTrackIds: playlist.trackIds,
        currentTrackId: playlist.trackIds[0],
        currentTime: 0,
        duration: 0,
        isPlaying: true,
        pendingSeek: 0,
      })
    },
    playTrack: (trackId, queueIds) => {
      const state = get()
      const track = state.tracks.find((item) => item.id === trackId)

      if (!track) {
        return
      }

      if (track.isMissing || !track.url) {
        set({ playbackNotice: 'Источник локального трека недоступен. Импортируйте файл повторно.' })
        return
      }

      const nextQueue = queueIds && queueIds.length > 0 ? ensureUnique(queueIds) : resolveQueue(state)

      set({
        queueTrackIds: nextQueue,
        currentTrackId: trackId,
        currentTime: 0,
        duration: track.duration || 0,
        pendingSeek: 0,
        isPlaying: true,
        playbackNotice: null,
      })
    },
    togglePlayPause: () => {
      const state = get()
      const queue = resolveQueue(state)

      if (!state.currentTrackId) {
        const firstTrack = queue[0]
        if (!firstTrack) {
          set({ playbackNotice: 'Добавьте треки в библиотеку, чтобы начать воспроизведение.' })
          return
        }

        set({
          currentTrackId: firstTrack,
          queueTrackIds: queue,
          isPlaying: true,
          pendingSeek: 0,
          playbackNotice: null,
        })
        return
      }

      const currentTrack = state.tracks.find((track) => track.id === state.currentTrackId)
      if (!currentTrack || currentTrack.isMissing || !currentTrack.url) {
        set({ playbackNotice: 'Текущий локальный трек недоступен. Импортируйте его снова.' })
        return
      }

      set({ isPlaying: !state.isPlaying, playbackNotice: null })
    },
    nextTrack: () => {
      const state = get()
      const queue = resolveQueue(state)

      if (queue.length === 0) {
        return
      }

      if (state.repeatMode === 'one') {
        set({ pendingSeek: 0, currentTime: 0, isPlaying: true })
        return
      }

      const currentIndex = findTrackIndex(queue, state.currentTrackId)
      const safeIndex = currentIndex < 0 ? 0 : currentIndex

      let nextIndex = safeIndex + 1

      if (state.shuffle && queue.length > 1) {
        const available = queue.filter((trackId) => trackId !== state.currentTrackId)
        const randomTrack = available[Math.floor(Math.random() * available.length)]
        nextIndex = queue.findIndex((trackId) => trackId === randomTrack)
      }

      if (nextIndex >= queue.length) {
        if (state.repeatMode === 'all') {
          nextIndex = 0
        } else {
          set({ isPlaying: false, currentTime: state.duration })
          return
        }
      }

      set({
        queueTrackIds: queue,
        currentTrackId: queue[nextIndex],
        currentTime: 0,
        pendingSeek: 0,
        isPlaying: true,
      })
    },
    previousTrack: () => {
      const state = get()
      const queue = resolveQueue(state)

      if (queue.length === 0) {
        return
      }

      if (state.currentTime > 3) {
        set({ pendingSeek: 0, currentTime: 0 })
        return
      }

      const currentIndex = findTrackIndex(queue, state.currentTrackId)
      const safeIndex = currentIndex < 0 ? 0 : currentIndex
      let previousIndex = safeIndex - 1

      if (previousIndex < 0) {
        previousIndex = state.repeatMode === 'all' ? queue.length - 1 : 0
      }

      set({
        queueTrackIds: queue,
        currentTrackId: queue[previousIndex],
        currentTime: 0,
        pendingSeek: 0,
        isPlaying: true,
      })
    },
    seekTo: (seconds) => {
      const nextSeconds = clamp(seconds, 0, get().duration || Number.POSITIVE_INFINITY)
      set({ currentTime: nextSeconds, pendingSeek: nextSeconds })
    },
    consumeSeek: () => {
      set({ pendingSeek: null })
    },
    setCurrentTime: (seconds) => {
      set({ currentTime: seconds })
    },
    setDuration: (seconds) => {
      if (Number.isFinite(seconds)) {
        set({ duration: seconds })
      }
    },
    setVolume: (volume) => {
      set({ volume: clamp(volume, 0, 1) })
    },
    toggleShuffle: () => {
      set((state) => ({ shuffle: !state.shuffle }))
    },
    cycleRepeatMode: () => {
      set((state) => {
        if (state.repeatMode === 'off') {
          return { repeatMode: 'all' as const }
        }
        if (state.repeatMode === 'all') {
          return { repeatMode: 'one' as const }
        }
        return { repeatMode: 'off' as const }
      })
    },
    toggleFavorite: (trackId) => {
      set((state) => {
        if (state.favoriteTrackIds.includes(trackId)) {
          return {
            favoriteTrackIds: state.favoriteTrackIds.filter((id) => id !== trackId),
          }
        }

        return {
          favoriteTrackIds: [trackId, ...state.favoriteTrackIds],
        }
      })
    },
    addLocalTracks: async (files) => {
      if (files.length === 0) {
        set({ playbackNotice: 'Файлы не выбраны.' })
        return { added: 0, skipped: 0 }
      }

      const tracks = await Promise.all(
        files.map(async (file) => {
          if (!isSupportedAudioFile(file)) {
            return null
          }

          const duration = await readAudioDuration(file)
          const { artist, title } = parseArtistAndTitle(file.name)
          const hue = file.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360

          const nextTrack: Track = {
            id: makeId('track'),
            title,
            artist,
            duration,
            source: 'local',
            url: URL.createObjectURL(file),
            artwork: pickArtworkGradient(hue),
            hue,
            fileName: file.name,
            isMissing: false,
            createdAt: Date.now(),
          }

          return nextTrack
        }),
      )

      const safeTracks = tracks.filter((track): track is Track => Boolean(track))
      const skipped = files.length - safeTracks.length

      if (safeTracks.length === 0) {
        set({ playbackNotice: 'Поддерживаются только mp3, wav и ogg файлы.' })
        return { added: 0, skipped }
      }

      set((state) => {
        const queue = resolveQueue(state)

        return {
          tracks: [...safeTracks, ...state.tracks],
          queueTrackIds: [...queue, ...safeTracks.map((track) => track.id)],
          playbackNotice: `Добавлено ${safeTracks.length} трек(ов).`,
        }
      })

      return { added: safeTracks.length, skipped }
    },
    setVisualizerEnabled: (enabled) => {
      set((state) => ({
        settings: {
          ...state.settings,
          visualizerEnabled: enabled,
        },
      }))
    },
    setVisualizerIntensity: (intensity) => {
      set((state) => ({
        settings: {
          ...state.settings,
          visualizerIntensity: clamp(intensity, 20, 100),
        },
      }))
    },
    clearLibrary: () => {
      const demoTracks = getDemoTracks()
      const demoPlaylists = getDemoPlaylists()

      get().tracks
        .filter((track) => track.source === 'local' && track.url)
        .forEach((track) => {
          URL.revokeObjectURL(track.url)
        })

      set({
        tracks: demoTracks,
        playlists: demoPlaylists,
        favoriteTrackIds: [demoTracks[0]?.id].filter(Boolean) as string[],
        activePlaylistId: demoPlaylists[0]?.id ?? null,
        queueTrackIds: demoPlaylists[0]?.trackIds ?? demoTracks.map((track) => track.id),
        currentTrackId: demoTracks[0]?.id ?? null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        pendingSeek: null,
        playbackNotice: 'Библиотека очищена и сброшена к демо-набору.',
      })
    },
  })),
)

if (typeof window !== 'undefined') {
  usePlayerStore.subscribe(
    (state) => ({
      tracks: state.tracks,
      playlists: state.playlists,
      favoriteTrackIds: state.favoriteTrackIds,
      activePlaylistId: state.activePlaylistId,
      settings: state.settings,
    }),
    (snapshot) => {
      const persistable: PersistedSnapshot = {
        tracks: snapshot.tracks.map((track) => ({
          ...track,
          url: track.source === 'demo' ? '' : '',
          isMissing: track.source === 'local' ? true : false,
        })),
        playlists: snapshot.playlists,
        favoriteTrackIds: snapshot.favoriteTrackIds,
        activePlaylistId: snapshot.activePlaylistId,
        settings: snapshot.settings,
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
    },
    {
      equalityFn: shallow,
    },
  )
}

