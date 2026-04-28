export type RepeatMode = 'off' | 'one' | 'all'

export type AppView = 'home' | 'playlist' | 'favorites' | 'settings'

export type TrackSource = 'demo' | 'local'

export interface Track {
  id: string
  title: string
  artist: string
  duration: number
  url: string
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
  trackIds: string[]
  createdAt: number
}

export interface AppSettings {
  visualizerEnabled: boolean
  visualizerIntensity: number
}

