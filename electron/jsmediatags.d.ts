declare module 'jsmediatags/dist/jsmediatags.min.js' {
  interface ReadCallbacks {
    onSuccess: (result: unknown) => void
    onError: (error: unknown) => void
  }

  interface ReaderInstance {
    setTagsToRead: (tags: string[]) => ReaderInstance
    read: (callbacks: ReadCallbacks) => void
  }

  interface JsMediaTags {
    Reader: new (file: string) => ReaderInstance
  }

  const jsmediatags: JsMediaTags
  export default jsmediatags
}
