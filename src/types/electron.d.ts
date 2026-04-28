export {}

declare global {
  interface Window {
    electronWindow?: {
      minimize: () => Promise<void>
      maximizeToggle: () => Promise<boolean>
      isMaximized: () => Promise<boolean>
      close: () => Promise<void>
      onMaximizedChanged: (callback: (value: boolean) => void) => () => void
      logError?: (message: string) => void
    }
  }
}

