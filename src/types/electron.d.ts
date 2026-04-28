export {}

declare global {
  interface IngestedAudioFile {
    sourcePath: string
    destinationPath: string
    fileName: string
  }

  interface Window {
    electronWindow?: {
      minimize: () => Promise<void>
      maximizeToggle: () => Promise<boolean>
      isMaximized: () => Promise<boolean>
      close: () => Promise<void>
      onMaximizedChanged: (callback: (value: boolean) => void) => () => void
      logError?: (message: string) => void
      ingestAudioFiles?: (paths: string[]) => Promise<IngestedAudioFile[]>
      loadConfigFile?: () => Promise<string | null>
      saveConfigFile?: (payload: string) => Promise<void>
      importConfigFile?: () => Promise<string | null>
      exportConfigFile?: (payload: string) => Promise<boolean>
    }
  }
}

