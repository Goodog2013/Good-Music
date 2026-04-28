import type { CSSProperties } from 'react'

const FALLBACK_ARTWORK = 'linear-gradient(145deg, #2d3f70, #8146ff)'

const isArtworkUrl = (value: string) => /^(data:|blob:|file:|https?:)/i.test(value)

export const toArtworkStyle = (artwork?: string): CSSProperties => {
  if (!artwork) {
    return { background: FALLBACK_ARTWORK }
  }

  if (isArtworkUrl(artwork)) {
    return { backgroundImage: `url("${artwork}")` }
  }

  return { background: artwork }
}

