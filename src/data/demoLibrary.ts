import { toFileUrl } from '../utils/audio'
import type { AppSettings, Playlist, Track } from '../types/music'

export const getDemoTracks = (): Track[] => []

export const getDemoPlaylists = (): Playlist[] => []

export const defaultSettings: AppSettings = {
  visualizerEnabled: false,
  visualizerIntensity: 72,
  visualizerMode: 'orbital',
  language: 'ru',
  theme: 'midnight',
  accent: 'cyan',
}

export const hydrateTrack = (track: Track): Track => {
  if (track.source !== 'local') {
    return {
      ...track,
      url: '',
      isMissing: true,
    }
  }

  return {
    ...track,
    url: track.filePath ? toFileUrl(track.filePath) : track.url,
    isMissing: !track.filePath && !track.url,
  }
}

