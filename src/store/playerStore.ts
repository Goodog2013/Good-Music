import { create } from 'zustand'
import { defaultSettings, getDemoPlaylists, getDemoTracks, hydrateTrack } from '../data/demoLibrary'
import { readAudioDuration, readAudioTagInfo, toFileUrl } from '../utils/audio'
import { clamp } from '../utils/time'
import { isSupportedAudioFile, makeId, parseArtistAndTitle, pickArtworkGradient } from '../utils/track'
import type {
  AccentColor,
  AppLanguage,
  AppSettings,
  AppTheme,
  AppView,
  PersistedLibrarySnapshot,
  Playlist,
  RepeatMode,
  Track,
  VisualizerMode,
} from '../types/music'

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
  setVisualizerMode: (mode: VisualizerMode) => void
  setLanguage: (language: AppLanguage) => void
  setTheme: (theme: AppTheme) => void
  setAccent: (accent: AccentColor) => void
  buildSnapshot: () => PersistedLibrarySnapshot
  loadSnapshot: (snapshot: PersistedLibrarySnapshot) => void
  importConfig: () => Promise<boolean>
  exportConfig: () => Promise<boolean>
  saveProjectConfig: () => Promise<void>
  clearLibrary: () => void
}

const ensureUnique = (ids: string[]) => Array.from(new Set(ids))

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const safeNumber = (value: unknown, fallback = 0) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback)

const parseVisualizerMode = (value: unknown): VisualizerMode => {
  if (value === 'orbital' || value === 'rings' || value === 'wave') {
    return value
  }
  return defaultSettings.visualizerMode
}

const parseLanguage = (value: unknown): AppLanguage => {
  if (value === 'ru' || value === 'en') {
    return value
  }
  return defaultSettings.language
}

const parseTheme = (value: unknown): AppTheme => {
  if (value === 'midnight' || value === 'graphite' || value === 'ocean') {
    return value
  }
  return defaultSettings.theme
}

const parseAccent = (value: unknown): AccentColor => {
  if (value === 'cyan' || value === 'violet' || value === 'rose' || value === 'emerald') {
    return value
  }
  return defaultSettings.accent
}

const sanitizeTrack = (value: unknown): Track | null => {
  if (!isRecord(value)) {
    return null
  }

  const id = typeof value.id === 'string' ? value.id : ''
  const title = typeof value.title === 'string' ? value.title : ''
  const artist = typeof value.artist === 'string' ? value.artist : 'Unknown Artist'

  if (!id || !title) {
    return null
  }

  const source = value.source === 'local' || value.source === 'demo' ? value.source : 'demo'
  const filePath = typeof value.filePath === 'string' ? value.filePath : undefined

  return {
    id,
    title,
    artist,
    duration: safeNumber(value.duration),
    url: typeof value.url === 'string' ? value.url : '',
    filePath,
    source,
    artwork: typeof value.artwork === 'string' ? value.artwork : pickArtworkGradient(safeNumber(value.hue, 220)),
    hue: safeNumber(value.hue, 220),
    createdAt: safeNumber(value.createdAt, Date.now()),
    fileName: typeof value.fileName === 'string' ? value.fileName : undefined,
    isMissing: Boolean(value.isMissing),
  }
}

const sanitizePlaylist = (value: unknown): Playlist | null => {
  if (!isRecord(value)) {
    return null
  }

  const id = typeof value.id === 'string' ? value.id : ''
  const name = typeof value.name === 'string' ? value.name : ''
  if (!id || !name) {
    return null
  }

  return {
    id,
    name,
    description: typeof value.description === 'string' ? value.description : 'Custom playlist',
    coverHue: safeNumber(value.coverHue, 260),
    trackIds: Array.isArray(value.trackIds) ? value.trackIds.filter((item): item is string => typeof item === 'string') : [],
    createdAt: safeNumber(value.createdAt, Date.now()),
  }
}

const sanitizeSnapshot = (value: unknown): PersistedLibrarySnapshot | null => {
  if (!isRecord(value)) {
    return null
  }

  const tracks = Array.isArray(value.tracks)
    ? value.tracks.map((track) => sanitizeTrack(track)).filter((track): track is Track => Boolean(track))
    : []

  const playlists = Array.isArray(value.playlists)
    ? value.playlists.map((playlist) => sanitizePlaylist(playlist)).filter((playlist): playlist is Playlist => Boolean(playlist))
    : []

  const favoriteTrackIds = Array.isArray(value.favoriteTrackIds)
    ? value.favoriteTrackIds.filter((trackId): trackId is string => typeof trackId === 'string')
    : []

  const activePlaylistId = typeof value.activePlaylistId === 'string' ? value.activePlaylistId : null

  const parsedSettings = isRecord(value.settings) ? value.settings : {}
  const settings: AppSettings = {
    visualizerEnabled:
      typeof parsedSettings.visualizerEnabled === 'boolean'
        ? parsedSettings.visualizerEnabled
        : defaultSettings.visualizerEnabled,
    visualizerIntensity: clamp(safeNumber(parsedSettings.visualizerIntensity, defaultSettings.visualizerIntensity), 20, 100),
    visualizerMode: parseVisualizerMode(parsedSettings.visualizerMode),
    language: parseLanguage(parsedSettings.language),
    theme: parseTheme(parsedSettings.theme),
    accent: parseAccent(parsedSettings.accent),
  }

  return {
    tracks,
    playlists,
    favoriteTrackIds,
    activePlaylistId,
    settings,
  }
}

const getDemoState = () => {
  const demoTracks = getDemoTracks()
  const demoPlaylists = getDemoPlaylists()
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

const resolveQueue = (state: Pick<PlayerStore, 'queueTrackIds' | 'tracks'>) => {
  const validTrackIds = new Set(state.tracks.map((track) => track.id))
  const queue = ensureUnique(state.queueTrackIds.filter((trackId) => validTrackIds.has(trackId)))

  if (queue.length > 0) {
    return queue
  }

  return state.tracks.map((track) => track.id)
}

const findTrackIndex = (queue: string[], currentTrackId: string | null) => queue.findIndex((trackId) => trackId === currentTrackId)

const hydrateFromSnapshot = (snapshot: PersistedLibrarySnapshot) => {
  const hydratedTracks = snapshot.tracks.map((track) => {
    const hydrated = hydrateTrack(track)

    if (hydrated.source === 'local' && hydrated.filePath) {
      return {
        ...hydrated,
        url: toFileUrl(hydrated.filePath),
        isMissing: false,
      }
    }

    return hydrated
  })

  const validTrackIds = new Set(hydratedTracks.map((track) => track.id))

  const hydratedPlaylists = snapshot.playlists.map((playlist) => ({
    ...playlist,
    trackIds: playlist.trackIds.filter((trackId) => validTrackIds.has(trackId)),
  }))

  const fallbackQueue = hydratedPlaylists[0]?.trackIds.length
    ? hydratedPlaylists[0].trackIds
    : hydratedTracks.map((track) => track.id)

  const safeActivePlaylistId = hydratedPlaylists.find((playlist) => playlist.id === snapshot.activePlaylistId)
    ? snapshot.activePlaylistId
    : hydratedPlaylists[0]?.id ?? null

  const safeFavorites = snapshot.favoriteTrackIds.filter((trackId) => validTrackIds.has(trackId))

  return {
    tracks: hydratedTracks.length > 0 ? hydratedTracks : getDemoTracks(),
    playlists: hydratedPlaylists.length > 0 ? hydratedPlaylists : getDemoPlaylists(),
    favoriteTrackIds: safeFavorites,
    activePlaylistId: safeActivePlaylistId,
    queueTrackIds: fallbackQueue,
    currentTrackId: fallbackQueue[0] ?? hydratedTracks[0]?.id ?? null,
    settings: {
      ...defaultSettings,
      ...snapshot.settings,
      visualizerMode: parseVisualizerMode(snapshot.settings.visualizerMode),
      language: parseLanguage(snapshot.settings.language),
      theme: parseTheme(snapshot.settings.theme),
      accent: parseAccent(snapshot.settings.accent),
    },
  }
}

const buildSnapshotFromState = (state: PlayerStore): PersistedLibrarySnapshot => ({
  tracks: state.tracks.map((track) => ({
    ...track,
    url: track.source === 'demo' ? '' : '',
    isMissing: track.source === 'local' ? false : track.isMissing,
  })),
  playlists: state.playlists,
  favoriteTrackIds: state.favoriteTrackIds,
  activePlaylistId: state.activePlaylistId,
  settings: state.settings,
})

const initial = getDemoState()

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  tracks: initial.tracks,
  playlists: initial.playlists,
  favoriteTrackIds: initial.favoriteTrackIds,
  activePlaylistId: initial.activePlaylistId,
  activeView: 'home',
  searchQuery: '',
  queueTrackIds: initial.queueTrackIds,
  currentTrackId: initial.currentTrackId,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  pendingSeek: null,
  volume: 0.72,
  shuffle: false,
  repeatMode: 'off',
  playbackNotice: null,
  settings: initial.settings,
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
      set({ playbackNotice: 'Playlist is empty.' })
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
      set({ playbackNotice: 'Local source for this track is unavailable. Re-import this file.' })
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
        set({ playbackNotice: 'Add tracks to the library first.' })
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
      set({ playbackNotice: 'Current local track is unavailable. Re-import the file.' })
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
      set({ playbackNotice: 'No files selected.' })
      return { added: 0, skipped: 0 }
    }

    const resolveSourcePath = (file: File) => {
      const legacyPath = (file as File & { path?: string }).path
      if (typeof legacyPath === 'string' && legacyPath.length > 0) {
        return legacyPath
      }

      if (window.electronWindow?.getPathForFile) {
        const nextPath = window.electronWindow.getPathForFile(file)
        if (typeof nextPath === 'string' && nextPath.length > 0) {
          return nextPath
        }
      }

      return undefined
    }

    const fileSourcePathMap = new Map<File, string>()
    files.forEach((file) => {
      const resolvedPath = resolveSourcePath(file)
      if (resolvedPath) {
        fileSourcePathMap.set(file, resolvedPath)
      }
    })

    let importedPathMap = new Map<string, string>()

    if (window.electronWindow?.ingestAudioFiles) {
      const sourcePaths = files
        .map((file) => fileSourcePathMap.get(file))
        .filter((path): path is string => typeof path === 'string' && path.length > 0)

      if (sourcePaths.length > 0) {
        const imported = await window.electronWindow.ingestAudioFiles(sourcePaths)
        importedPathMap = new Map(imported.map((item) => [item.sourcePath, item.destinationPath]))
      }
    }

    const safeTracks: Track[] = []
    let supportedCount = 0
    let skipped = 0

    for (const file of files) {
      if (!isSupportedAudioFile(file)) {
        skipped += 1
        continue
      }
      supportedCount += 1

      const [duration, tags] = await Promise.all([readAudioDuration(file), readAudioTagInfo(file)])
      const parsedFromName = parseArtistAndTitle(file.name)
      const hue = file.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360

      const sourcePath = fileSourcePathMap.get(file)
      const filePath = sourcePath ? importedPathMap.get(sourcePath) : undefined

      // In desktop mode we should always keep track URLs file-based to avoid blob memory pressure.
      if (window.electronWindow?.ingestAudioFiles && !filePath) {
        skipped += 1
        continue
      }

      safeTracks.push({
        id: makeId('track'),
        title: tags.title?.trim() || parsedFromName.title,
        artist: tags.artist?.trim() || parsedFromName.artist,
        duration,
        source: 'local',
        url: filePath ? toFileUrl(filePath) : URL.createObjectURL(file),
        filePath,
        artwork: tags.artwork || pickArtworkGradient(hue),
        hue,
        fileName: file.name,
        isMissing: false,
        createdAt: Date.now(),
      })
    }

    if (safeTracks.length === 0) {
      if (supportedCount > 0 && window.electronWindow?.ingestAudioFiles) {
        set({ playbackNotice: 'Could not resolve selected file paths. Reopen file picker and try again.' })
      } else {
        set({ playbackNotice: 'Only mp3, wav and ogg files are supported.' })
      }
      return { added: 0, skipped }
    }

    set((state) => {
      const queue = resolveQueue(state)

      return {
        tracks: [...safeTracks, ...state.tracks],
        queueTrackIds: [...queue, ...safeTracks.map((track) => track.id)],
        playbackNotice:
          skipped > 0 ? `${safeTracks.length} track(s) added. ${skipped} skipped.` : `${safeTracks.length} track(s) added.`,
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
  setVisualizerMode: (mode) => {
    set((state) => ({
      settings: {
        ...state.settings,
        visualizerMode: mode,
      },
    }))
  },
  setLanguage: (language) => {
    set((state) => ({
      settings: {
        ...state.settings,
        language,
      },
    }))
  },
  setTheme: (theme) => {
    set((state) => ({
      settings: {
        ...state.settings,
        theme,
      },
    }))
  },
  setAccent: (accent) => {
    set((state) => ({
      settings: {
        ...state.settings,
        accent,
      },
    }))
  },
  buildSnapshot: () => buildSnapshotFromState(get()),
  loadSnapshot: (snapshot) => {
    const safe = sanitizeSnapshot(snapshot)
    if (!safe) {
      set({ playbackNotice: 'Invalid .gmcfg file.' })
      return
    }

    const next = hydrateFromSnapshot(safe)
    set({
      tracks: next.tracks,
      playlists: next.playlists,
      favoriteTrackIds: next.favoriteTrackIds,
      activePlaylistId: next.activePlaylistId,
      queueTrackIds: next.queueTrackIds,
      currentTrackId: next.currentTrackId,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      pendingSeek: null,
      settings: next.settings,
      playbackNotice: 'Configuration loaded.',
    })
  },
  importConfig: async () => {
    if (!window.electronWindow?.importConfigFile) {
      set({ playbackNotice: 'Desktop import is unavailable.' })
      return false
    }

    const raw = await window.electronWindow.importConfigFile()
    if (!raw) {
      return false
    }

    try {
      const parsed: unknown = JSON.parse(raw)
      const snapshot = sanitizeSnapshot(parsed)
      if (!snapshot) {
        set({ playbackNotice: 'Invalid .gmcfg file.' })
        return false
      }

      get().loadSnapshot(snapshot)
      return true
    } catch {
      set({ playbackNotice: 'Could not parse .gmcfg file.' })
      return false
    }
  },
  exportConfig: async () => {
    if (!window.electronWindow?.exportConfigFile) {
      set({ playbackNotice: 'Desktop export is unavailable.' })
      return false
    }

    const raw = JSON.stringify(get().buildSnapshot(), null, 2)
    const ok = await window.electronWindow.exportConfigFile(raw)

    if (ok) {
      set({ playbackNotice: 'Configuration exported.' })
    }

    return ok
  },
  saveProjectConfig: async () => {
    if (!window.electronWindow?.saveConfigFile) {
      return
    }

    const raw = JSON.stringify(get().buildSnapshot(), null, 2)
    await window.electronWindow.saveConfigFile(raw)
  },
  clearLibrary: () => {
    const demo = getDemoState()

    get().tracks
      .filter((track) => track.source === 'local' && track.url.startsWith('blob:'))
      .forEach((track) => {
        URL.revokeObjectURL(track.url)
      })

    set({
      tracks: demo.tracks,
      playlists: demo.playlists,
      favoriteTrackIds: demo.favoriteTrackIds,
      activePlaylistId: demo.activePlaylistId,
      queueTrackIds: demo.queueTrackIds,
      currentTrackId: demo.currentTrackId,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      pendingSeek: null,
      playbackNotice: 'Library reset to demo data.',
    })
  },
}))

export const parseSnapshotText = (raw: string): PersistedLibrarySnapshot | null => {
  try {
    const parsed: unknown = JSON.parse(raw)
    return sanitizeSnapshot(parsed)
  } catch {
    return null
  }
}
