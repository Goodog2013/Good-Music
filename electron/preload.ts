import { contextBridge, ipcRenderer, webUtils } from 'electron'

interface IngestedAudioFile {
  sourcePath: string
  destinationPath: string
  fileName: string
}

contextBridge.exposeInMainWorld('electronWindow', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximizeToggle: () => ipcRenderer.invoke('window:maximize-toggle') as Promise<boolean>,
  isMaximized: () => ipcRenderer.invoke('window:is-maximized') as Promise<boolean>,
  close: () => ipcRenderer.invoke('window:close'),
  logError: (message: string) => {
    ipcRenderer.send('renderer:log-error', message)
  },
  onMaximizedChanged: (callback: (value: boolean) => void) => {
    const handler = (_event: unknown, value: boolean) => {
      callback(value)
    }

    ipcRenderer.on('window:maximized-changed', handler)

    return () => {
      ipcRenderer.removeListener('window:maximized-changed', handler)
    }
  },
  getPathForFile: (file: File) => {
    try {
      return webUtils.getPathForFile(file)
    } catch {
      return ''
    }
  },
  ingestAudioFiles: (paths: string[]) => ipcRenderer.invoke('library:ingest-files', paths) as Promise<IngestedAudioFile[]>,
  loadConfigFile: () => ipcRenderer.invoke('library:load-config') as Promise<string | null>,
  saveConfigFile: (payload: string) => ipcRenderer.invoke('library:save-config', payload) as Promise<void>,
  importConfigFile: () => ipcRenderer.invoke('library:import-config') as Promise<string | null>,
  exportConfigFile: (payload: string) => ipcRenderer.invoke('library:export-config', payload) as Promise<boolean>,
})

