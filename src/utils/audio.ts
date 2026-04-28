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

const MAX_EMBEDDED_ARTWORK_BYTES = 950_000
const ARTWORK_PREVIEW_SIZE = 240

const toUint8Array = (data: number[] | Uint8Array | ArrayBufferView) => {
  if (Array.isArray(data)) {
    return Uint8Array.from(data)
  }

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }

  return new Uint8Array(0)
}

const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string | undefined>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : undefined)
    }
    reader.onerror = () => resolve(undefined)
    reader.readAsDataURL(blob)
  })

const resizeArtwork = (blob: Blob) =>
  new Promise<string | undefined>((resolve) => {
    const objectUrl = URL.createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      const longerSide = Math.max(image.naturalWidth, image.naturalHeight, 1)
      const scale = Math.min(1, ARTWORK_PREVIEW_SIZE / longerSide)
      const width = Math.max(1, Math.round(image.naturalWidth * scale))
      const height = Math.max(1, Math.round(image.naturalHeight * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(objectUrl)
        resolve(undefined)
        return
      }

      context.drawImage(image, 0, 0, width, height)
      URL.revokeObjectURL(objectUrl)

      try {
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      } catch {
        resolve(undefined)
      }
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(undefined)
    }

    image.src = objectUrl
  })

const parseArtwork = async (picture: { data?: number[] | Uint8Array | ArrayBufferView; format?: string } | undefined) => {
  if (!picture?.data || typeof picture.format !== 'string') {
    return undefined
  }

  const bytes = toUint8Array(picture.data)
  if (bytes.byteLength === 0) {
    return undefined
  }

  const safeBuffer = new ArrayBuffer(bytes.byteLength)
  const safeBytes = new Uint8Array(safeBuffer)
  safeBytes.set(bytes)
  const blob = new Blob([safeBuffer], { type: picture.format })
  const resized = await resizeArtwork(blob)
  if (resized) {
    return resized
  }

  if (blob.size > MAX_EMBEDDED_ARTWORK_BYTES) {
    return undefined
  }

  return readBlobAsDataUrl(blob)
}

export const readAudioTagInfo = (file: File) =>
  new Promise<AudioTagInfo>((resolve) => {
    new jsmediatags.Reader(file)
      .setTagsToRead(['title', 'artist', 'picture'])
      .read({
        onSuccess: async (result: {
          tags: { title?: string; artist?: string; picture?: { data?: number[] | Uint8Array | ArrayBufferView; format?: string } }
        }) => {
          const tags = result.tags ?? {}
          const artwork = await parseArtwork(tags.picture)

          resolve({
            title: typeof tags.title === 'string' ? tags.title : undefined,
            artist: typeof tags.artist === 'string' ? tags.artist : undefined,
            artwork,
          })
        },
        onError: () => resolve({}),
      })
  })

