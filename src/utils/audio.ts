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

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const toUint8Array = (data: unknown) => {
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }

  if (Array.isArray(data)) {
    return Uint8Array.from(data)
  }

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }

  if (isRecord(data) && typeof data.length === 'number' && Number.isFinite(data.length)) {
    const size = Math.max(0, Math.floor(data.length))
    const bytes = new Uint8Array(size)
    for (let index = 0; index < size; index += 1) {
      const value = data[String(index)]
      bytes[index] = typeof value === 'number' ? value & 0xff : 0
    }
    return bytes
  }

  return new Uint8Array(0)
}

const normalizeFormat = (format: unknown) => (typeof format === 'string' ? format.replaceAll('\x00', '').trim().toLowerCase() : '')

const detectImageMime = (bytes: Uint8Array) => {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (bytes.length >= 6) {
    const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5])
    if (sig === 'GIF87a' || sig === 'GIF89a') {
      return 'image/gif'
    }
  }
  if (bytes.length >= 12) {
    const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
    const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
    if (riff === 'RIFF' && webp === 'WEBP') {
      return 'image/webp'
    }
  }

  return 'application/octet-stream'
}

const decodeText = (bytes: Uint8Array) => {
  try {
    return new TextDecoder().decode(bytes).trim()
  } catch {
    let text = ''
    for (let index = 0; index < bytes.length; index += 1) {
      text += String.fromCharCode(bytes[index])
    }
    return text.trim()
  }
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

const parseArtwork = async (picture: { data?: unknown; format?: unknown } | undefined) => {
  if (!picture?.data) {
    return undefined
  }

  const bytes = toUint8Array(picture.data)
  if (bytes.byteLength === 0) {
    return undefined
  }

  const format = normalizeFormat(picture.format)

  if (format === '-->') {
    const linkedUrl = decodeText(bytes)
    if (linkedUrl.startsWith('http://') || linkedUrl.startsWith('https://') || linkedUrl.startsWith('file://')) {
      return linkedUrl
    }
    return undefined
  }

  const blobType = format.startsWith('image/') ? format : detectImageMime(bytes)
  const safeBuffer = new ArrayBuffer(bytes.byteLength)
  const safeBytes = new Uint8Array(safeBuffer)
  safeBytes.set(bytes)
  const blob = new Blob([safeBuffer], { type: blobType })
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
        onSuccess: async (result: { tags: { title?: string; artist?: string; picture?: { data?: unknown; format?: unknown } } }) => {
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

