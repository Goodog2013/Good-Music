import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as electron from 'electron'

type ElectronModule = typeof import('electron')
const electronApi = electron as ElectronModule & { default?: Partial<ElectronModule> }

const app = electronApi.app ?? electronApi.default?.app
const BrowserWindow = electronApi.BrowserWindow ?? electronApi.default?.BrowserWindow
const ipcMain = electronApi.ipcMain ?? electronApi.default?.ipcMain

if (!app || !BrowserWindow || !ipcMain) {
  throw new Error('Electron API is unavailable in main process.')
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: InstanceType<typeof BrowserWindow> | null = null

const sendWindowState = () => {
  if (!mainWindow) {
    return
  }

  mainWindow.webContents.send('window:maximized-changed', mainWindow.isMaximized())
}

const createWindow = () => {
  const preloadMjsPath = path.join(__dirname, 'preload.mjs')
  const preloadJsPath = path.join(__dirname, 'preload.js')
  const preloadPath = fs.existsSync(preloadMjsPath) ? preloadMjsPath : preloadJsPath

  mainWindow = new BrowserWindow({
    width: 1460,
    height: 940,
    minWidth: 1120,
    minHeight: 740,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#070711',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('maximize', sendWindowState)
  mainWindow.on('unmaximize', sendWindowState)
  mainWindow.on('ready-to-show', () => {
    sendWindowState()
    mainWindow?.show()
  })
}

app.whenReady().then(() => {
  ipcMain.on('renderer:log-error', (_event, message: string) => {
    try {
      const logFile = path.join(app.getPath('userData'), 'renderer-errors.log')
      const line = `[${new Date().toISOString()}] ${message}\n`
      fs.appendFileSync(logFile, line, 'utf8')
    } catch {
      // ignore file logging failures
    }
  })

  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('window:maximize-toggle', () => {
    if (!mainWindow) {
      return false
    }

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
      return false
    }

    mainWindow.maximize()
    return true
  })

  ipcMain.handle('window:is-maximized', () => {
    if (!mainWindow) {
      return false
    }

    return mainWindow.isMaximized()
  })

  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

