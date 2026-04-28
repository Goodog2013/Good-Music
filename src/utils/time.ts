export const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const rounded = Math.floor(seconds)
  const minutes = Math.floor(rounded / 60)
  const remainder = rounded % 60

  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

