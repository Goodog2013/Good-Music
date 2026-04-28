export {}

declare global {
  interface IngestedAudioFile {
    sourcePath: string
    destinationPath: string
    fileName: string
  }

  interface AudioTagPayload {
    sourcePath: string
    title?: string
    artist?: string
    artwork?: string
  }

  interface Window {
    electronWindow?: {
      minimize: () => Promise<void>
      maximizeToggle: () => Promise<boolean>
      isMaximized: () => Promise<boolean>
      close: () => Promise<void>
      onMaximizedChanged: (callback: (value: boolean) => void) => () => void
      logError?: (message: string) => void
      getPathForFile?: (file: File) => string
      pickAudioFiles?: () => Promise<string[]>
      ingestAudioFiles?: (paths: string[]) => Promise<IngestedAudioFile[]>
      readAudioTags?: (paths: string[]) => Promise<AudioTagPayload[]>
      loadConfigFile?: () => Promise<string | null>
      saveConfigFile?: (payload: string) => Promise<void>
      importConfigFile?: () => Promise<string | null>
      exportConfigFile?: (payload: string) => Promise<boolean>
    }
  }
}

