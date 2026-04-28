import { createToneWav } from '../utils/demoAudio'
import { pickArtworkGradient } from '../utils/track'
import type { AppSettings, Playlist, Track } from '../types/music'

interface DemoTrackDefinition {
  id: string
  title: string
  artist: string
  duration: number
  hue: number
  frequencies: number[]
  tempo: number
}

const DEMO_TRACK_DEFINITIONS: DemoTrackDefinition[] = [
  {
    id: 'demo_neon_drift',
    title: 'Neon Drift',
    artist: 'Goodog Collective',
    duration: 52,
    hue: 282,
    frequencies: [130.81, 196, 261.63],
    tempo: 1.2,
  },
  {
    id: 'demo_subzero',
    title: 'Subzero Orbit',
    artist: 'Aria Voltage',
    duration: 46,
    hue: 205,
    frequencies: [164.81, 247, 329.63, 415.3],
    tempo: 1.05,
  },
  {
    id: 'demo_lagoon',
    title: 'Lagoon Pulse',
    artist: 'Nova Frame',
    duration: 58,
    hue: 168,
    frequencies: [110, 220, 277.18],
    tempo: 0.94,
  },
]

const DEMO_URL_CACHE = new Map<string, string>()

const getDemoUrl = (definition: DemoTrackDefinition) => {
  const existing = DEMO_URL_CACHE.get(definition.id)
  if (existing) {
    return existing
  }

  const blob = createToneWav(definition.frequencies, definition.duration, definition.tempo)
  const url = URL.createObjectURL(blob)
  DEMO_URL_CACHE.set(definition.id, url)

  return url
}

export const getDemoTracks = (): Track[] => {
  const now = Date.now()

  return DEMO_TRACK_DEFINITIONS.map((definition, index) => ({
    id: definition.id,
    title: definition.title,
    artist: definition.artist,
    duration: definition.duration,
    hue: definition.hue,
    source: 'demo',
    url: getDemoUrl(definition),
    artwork: pickArtworkGradient(definition.hue),
    createdAt: now - (index + 1) * 60_000,
  }))
}

export const getDemoPlaylists = (): Playlist[] => [
  {
    id: 'playlist_late_glass',
    name: 'Late Night Glass',
    description: 'Тёплый синт и мягкие неоновые биты для глубокой работы.',
    coverHue: 286,
    trackIds: ['demo_neon_drift', 'demo_subzero'],
    createdAt: Date.now() - 300_000,
  },
  {
    id: 'playlist_hyper_blue',
    name: 'Hyper Blue Grid',
    description: 'Ровный ритм и холодная динамика для концентрации.',
    coverHue: 206,
    trackIds: ['demo_subzero', 'demo_lagoon'],
    createdAt: Date.now() - 260_000,
  },
]

export const defaultSettings: AppSettings = {
  visualizerEnabled: false,
  visualizerIntensity: 72,
}

export const hydrateTrack = (track: Track): Track => {
  if (track.source === 'demo') {
    const demo = DEMO_TRACK_DEFINITIONS.find((item) => item.id === track.id)
    if (demo) {
      return {
        ...track,
        duration: track.duration || demo.duration,
        hue: track.hue || demo.hue,
        artwork: track.artwork || pickArtworkGradient(demo.hue),
        url: getDemoUrl(demo),
        isMissing: false,
      }
    }

    return {
      ...track,
      url: '',
      isMissing: true,
    }
  }

  return {
    ...track,
    url: track.url,
    isMissing: !track.url,
  }
}

