import { contextBridge, ipcRenderer } from 'electron'

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
})

