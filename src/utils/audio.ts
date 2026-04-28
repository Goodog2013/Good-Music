export const readAudioDuration = (file: File) =>
  new Promise<number>((resolve) => {
    const audio = document.createElement('audio')
    const src = URL.createObjectURL(file)

    const done = (duration: number) => {
      URL.revokeObjectURL(src)
      resolve(Number.isFinite(duration) ? duration : 0)
    }

    audio.preload = 'metadata'
    audio.src = src
    audio.onloadedmetadata = () => done(audio.duration)
    audio.onerror = () => done(0)
  })

