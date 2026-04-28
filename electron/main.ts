import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, dialog, ipcMain } from 'electron'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const jsmediatags = require('jsmediatags') as {
  Reader: new (file: string) => {
    setTagsToRead: (tags: string[]) => {
      read: (callbacks: { onSuccess: (result: unknown) => void; onError: (error: unknown) => void }) => void
    }
  }
}
const runtimeRoot = app.isPackaged ? path.dirname(process.execPath) : process.cwd()
const configPath = path.join(runtimeRoot, '.gmcfg')
const tracksDir = path.join(runtimeRoot, 'tracks')
const MAX_ARTWORK_BYTES = 380_000

let mainWindow: BrowserWindow | null = null

const ensureProjectDirs = () => {
  fs.mkdirSync(tracksDir, { recursive: true })
}

const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_')

const resolveWindowIconPath = () => {
  const packagedIcon = path.join(process.resourcesPath, 'ICO.ico')
  if (app.isPackaged && fs.existsSync(packagedIcon)) {
    return packagedIcon
  }

  const localDevIcon = path.join(process.cwd(), 'src', 'ICO.ico')
  if (fs.existsSync(localDevIcon)) {
    return localDevIcon
  }

  return undefined
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const toUint8Array = (data: unknown) => {
  if (data instanceof Uint8Array) {
    return data
  }

  if (Array.isArray(data)) {
    return Uint8Array.from(data)
  }

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }

  if (isRecord(data) && typeof data.length === 'number' && Number.isFinite(data.length)) {
    const size = Math.max(0, Math.floor(data.length))
    const out = new Uint8Array(size)
    for (let index = 0; index < size; index += 1) {
      const value = data[String(index)]
      out[index] = typeof value === 'number' ? value & 0xff : 0
    }
    return out
  }

  return new Uint8Array(0)
}

const detectImageMime = (bytes: Uint8Array, format: unknown) => {
  if (typeof format === 'string' && format.toLowerCase().startsWith('image/')) {
    return format.toLowerCase()
  }

  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (bytes.length >= 6) {
    const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5])
    if (sig === 'GIF87a' || sig === 'GIF89a') {
      return 'image/gif'
    }
  }
  if (bytes.length >= 12) {
    const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
    const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
    if (riff === 'RIFF' && webp === 'WEBP') {
      return 'image/webp'
    }
  }

  return 'application/octet-stream'
}

const chunk = <T,>(items: T[], size: number) => {
  const step = Math.max(1, size)
  const result: T[][] = []
  for (let index = 0; index < items.length; index += step) {
    result.push(items.slice(index, index + step))
  }
  return result
}

const readAudioTagsFromPath = (sourcePath: string) =>
  new Promise<{ sourcePath: string; title?: string; artist?: string; artwork?: string }>((resolve) => {
    new jsmediatags.Reader(sourcePath)
      .setTagsToRead(['title', 'artist', 'picture'])
      .read({
        onSuccess: (result: unknown) => {
          const tags = isRecord(result) && isRecord(result.tags) ? result.tags : {}
          const title = typeof tags.title === 'string' ? tags.title.trim() : undefined
          const artist = typeof tags.artist === 'string' ? tags.artist.trim() : undefined

          let artwork: string | undefined
          if (isRecord(tags.picture)) {
            const bytes = toUint8Array(tags.picture.data)
            if (bytes.length > 0 && bytes.byteLength <= MAX_ARTWORK_BYTES) {
              const mime = detectImageMime(bytes, tags.picture.format)
              if (mime.startsWith('image/')) {
                artwork = `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`
              }
            }
          }

          resolve({ sourcePath, title, artist, artwork })
        },
        onError: () => {
          resolve({ sourcePath })
        },
      })
  })

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
    icon: resolveWindowIconPath(),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
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
  let pendingConfigPayload: string | null = null
  let configWritePromise: Promise<void> | null = null

  const flushLatestConfig = async () => {
    if (configWritePromise) {
      return configWritePromise
    }

    configWritePromise = (async () => {
      while (pendingConfigPayload !== null) {
        const payload = pendingConfigPayload
        pendingConfigPayload = null
        await fs.promises.writeFile(configPath, payload, 'utf8')
      }
    })().finally(() => {
      configWritePromise = null
    })

    return configWritePromise
  }

  ipcMain.on('renderer:log-error', (_event, message: string) => {
    try {
      const logFile = path.join(runtimeRoot, 'renderer-errors.log')
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
    try {
      ensureProjectDirs()
    } catch {
      return []
    }

    const imported: Array<{ sourcePath: string; destinationPath: string; fileName: string }> = []

    for (const sourcePath of sourcePaths) {
      if (typeof sourcePath !== 'string' || sourcePath.length === 0 || !fs.existsSync(sourcePath)) {
        continue
      }

      try {
        const ext = path.extname(sourcePath)
        const base = safeFileName(path.basename(sourcePath, ext))
        const fileName = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}_${base}${ext}`
        const destinationPath = path.join(tracksDir, fileName)

        fs.copyFileSync(sourcePath, destinationPath)
        imported.push({
          sourcePath,
          destinationPath,
          fileName,
        })
      } catch {
        imported.push({
          sourcePath,
          destinationPath: sourcePath,
          fileName: path.basename(sourcePath),
        })
      }
    }

    return imported
  })

  ipcMain.handle('library:read-audio-tags', async (_event, sourcePaths: string[]) => {
    const unique = Array.from(
      new Set(
        sourcePaths.filter(
          (sourcePath): sourcePath is string => typeof sourcePath === 'string' && sourcePath.length > 0 && fs.existsSync(sourcePath),
        ),
      ),
    )

    const out: Array<{ sourcePath: string; title?: string; artist?: string; artwork?: string }> = []

    for (const batch of chunk(unique, 8)) {
      const values = await Promise.all(batch.map((sourcePath) => readAudioTagsFromPath(sourcePath)))
      out.push(...values)
    }

    return out
  })

  ipcMain.handle('library:pick-audio-files', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import audio files',
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg'] }],
      properties: ['openFile', 'multiSelections'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return []
    }

    return result.filePaths
  })

  ipcMain.handle('library:load-config', () => {
    if (!fs.existsSync(configPath)) {
      return null
    }

    return fs.readFileSync(configPath, 'utf8')
  })

  ipcMain.handle('library:save-config', async (_event, payload: string) => {
    pendingConfigPayload = payload

    try {
      await flushLatestConfig()
    } catch {
      // ignore config write failures
    }
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
      defaultPath: path.join(runtimeRoot, 'good-music.gmcfg'),
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





