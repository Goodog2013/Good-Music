import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, dialog, ipcMain } from 'electron'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = process.cwd()
const configPath = path.join(projectRoot, '.gmcfg')
const tracksDir = path.join(projectRoot, 'tracks')

let mainWindow: BrowserWindow | null = null

const ensureProjectDirs = () => {
  fs.mkdirSync(tracksDir, { recursive: true })
}

const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_')

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
  ensureProjectDirs()

  ipcMain.on('renderer:log-error', (_event, message: string) => {
    try {
      const logFile = path.join(projectRoot, 'renderer-errors.log')
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

  ipcMain.handle('library:ingest-files', (_event, sourcePaths: string[]) => {
    ensureProjectDirs()

    const imported = sourcePaths
      .filter((sourcePath) => typeof sourcePath === 'string' && sourcePath.length > 0 && fs.existsSync(sourcePath))
      .map((sourcePath) => {
        const ext = path.extname(sourcePath)
        const base = safeFileName(path.basename(sourcePath, ext))
        const fileName = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}_${base}${ext}`
        const destinationPath = path.join(tracksDir, fileName)

        fs.copyFileSync(sourcePath, destinationPath)

        return {
          sourcePath,
          destinationPath,
          fileName,
        }
      })

    return imported
  })

  ipcMain.handle('library:load-config', () => {
    if (!fs.existsSync(configPath)) {
      return null
    }

    return fs.readFileSync(configPath, 'utf8')
  })

  ipcMain.handle('library:save-config', (_event, payload: string) => {
    fs.writeFileSync(configPath, payload, 'utf8')
  })

  ipcMain.handle('library:import-config', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import .gmcfg',
      filters: [{ name: 'Good Music Config', extensions: ['gmcfg', 'json'] }],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const targetPath = result.filePaths[0]
    if (!targetPath || !fs.existsSync(targetPath)) {
      return null
    }

    return fs.readFileSync(targetPath, 'utf8')
  })

  ipcMain.handle('library:export-config', async (_event, payload: string) => {
    const result = await dialog.showSaveDialog({
      title: 'Export .gmcfg',
      defaultPath: path.join(projectRoot, 'good-music.gmcfg'),
      filters: [{ name: 'Good Music Config', extensions: ['gmcfg'] }],
    })

    if (result.canceled || !result.filePath) {
      return false
    }

    fs.writeFileSync(result.filePath, payload, 'utf8')
    return true
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
