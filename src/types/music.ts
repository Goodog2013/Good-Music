export type RepeatMode = 'off' | 'one' | 'all'

export type AppView = 'home' | 'playlist' | 'favorites' | 'settings'

export type TrackSource = 'demo' | 'local'

export type AppLanguage = 'ru' | 'en'

export type AppTheme = 'midnight' | 'graphite' | 'ocean'

export type AccentColor = 'cyan' | 'violet' | 'rose' | 'emerald'

export type VisualizerMode = 'orbital' | 'rings' | 'wave'

export interface Track {
  id: string
  title: string
  artist: string
  duration: number
  url: string
  filePath?: string
  source: TrackSource
  artwork: string
  hue: number
  createdAt: number
  fileName?: string
  isMissing?: boolean
}

export interface Playlist {
  id: string
  name: string
  description: string
  coverHue: number
  coverImage?: string
  coverTrackId?: string
  trackIds: string[]
  createdAt: number
}

export interface AppSettings {
  visualizerEnabled: boolean
  visualizerIntensity: number
  visualizerMode: VisualizerMode
  language: AppLanguage
  theme: AppTheme
  accent: AccentColor
}

export interface PersistedLibrarySnapshot {
  tracks: Track[]
  playlists: Playlist[]
  favoriteTrackIds: string[]
  activePlaylistId: string | null
  settings: AppSettings
}

