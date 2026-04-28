const DEFAULT_PREVIEW_SIZE = 280

export const resizeImageFileToDataUrl = async (file: File, maxSide = DEFAULT_PREVIEW_SIZE) => {
  if (!file.type.startsWith('image/')) {
    return undefined
  }

  return new Promise<string | undefined>((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      const longerSide = Math.max(image.naturalWidth, image.naturalHeight, 1)
      const scale = Math.min(1, maxSide / longerSide)
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
        const webp = canvas.toDataURL('image/webp', 0.82)
        resolve(webp)
      } catch {
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.82))
        } catch {
          resolve(undefined)
        }
      }
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(undefined)
    }

    image.src = objectUrl
  })
}
