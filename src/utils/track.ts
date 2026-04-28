import { clamp } from './time'

export const makeId = (prefix: string) => `${prefix}_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`}`

export const parseArtistAndTitle = (fileName: string) => {
  const raw = fileName.replace(/\.[a-zA-Z0-9]+$/, '')
  const split = raw.split(' - ')

  if (split.length >= 2) {
    return {
      artist: split[0].trim(),
      title: split.slice(1).join(' - ').trim(),
    }
  }

  return {
    artist: 'Unknown Artist',
    title: raw.trim(),
  }
}

export const isSupportedAudioFile = (file: File) => {
  const type = file.type.toLowerCase()
  if (type === 'audio/mpeg' || type === 'audio/wav' || type === 'audio/ogg') {
    return true
  }

  const fileName = file.name.toLowerCase()
  return fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.ogg')
}

export const pickArtworkGradient = (hue: number) => {
  const h1 = Math.round(clamp(hue, 0, 360))
  const h2 = (h1 + 68) % 360

  return `linear-gradient(145deg, hsl(${h1} 90% 58% / 0.95), hsl(${h2} 92% 55% / 0.88))`
}

