declare module 'jsmediatags/dist/jsmediatags.min.js' {
  const jsmediatags: {
    Reader: new (file: unknown) => {
      setTagsToRead: (tags: string[]) => {
        read: (callbacks: {
          onSuccess: (data: { tags: { title?: string; artist?: string; picture?: { format?: string; data?: number[] } } }) => void
          onError?: () => void
        }) => void
      }
    }
  }

  export default jsmediatags
}
