import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js'

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

export interface AudioTagInfo {
  title?: string
  artist?: string
  artwork?: string
}

export const toFileUrl = (filePath: string) => {
  const normalized = filePath.replace(/\\/g, '/')
  const prefixed = normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`
  return encodeURI(prefixed)
}

const toDataUrl = (data: number[], format: string) => {
  const bytes = new Uint8Array(data)
  let binary = ''

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }

  return `data:${format};base64,${btoa(binary)}`
}

export const readAudioTagInfo = (file: File) =>
  new Promise<AudioTagInfo>((resolve) => {
    new jsmediatags.Reader(file)
      .setTagsToRead(['title', 'artist', 'picture'])
      .read({
        onSuccess: (result: { tags: { title?: string; artist?: string; picture?: { data?: number[]; format?: string } } }) => {
          const tags = result.tags ?? {}
          const picture = tags.picture

          resolve({
            title: typeof tags.title === 'string' ? tags.title : undefined,
            artist: typeof tags.artist === 'string' ? tags.artist : undefined,
            artwork:
              picture && Array.isArray(picture.data) && typeof picture.format === 'string'
                ? toDataUrl(picture.data, picture.format)
                : undefined,
          })
        },
        onError: () => resolve({}),
      })
  })

