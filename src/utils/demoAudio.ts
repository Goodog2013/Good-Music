export const createToneWav = (frequencies: number[], durationSec: number, tempo = 1): Blob => {
  const sampleRate = 44_100
  const channels = 1
  const samples = Math.floor(sampleRate * durationSec)
  const bytesPerSample = 2
  const blockAlign = channels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples * blockAlign
  const totalSize = 44 + dataSize

  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bytesPerSample * 8, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  for (let sample = 0; sample < samples; sample += 1) {
    const time = sample / sampleRate
    const pulse = Math.sin(time * Math.PI * 2 * tempo * 0.35)
    const envelope = 0.62 + 0.22 * Math.sin(time * Math.PI * 2 * 0.08 + 0.7)

    const tone = frequencies.reduce((acc, frequency, index) => {
      const wobble = 1 + 0.03 * Math.sin(time * Math.PI * 2 * (0.17 + index * 0.05))
      return acc + Math.sin(time * Math.PI * 2 * frequency * wobble + index * 0.25)
    }, 0)

    const normalized = (tone / frequencies.length) * envelope * (0.7 + pulse * 0.08)
    const sampleValue = Math.max(-1, Math.min(1, normalized))
    view.setInt16(44 + sample * 2, sampleValue * 32767, true)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

