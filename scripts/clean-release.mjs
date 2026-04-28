import fs from 'node:fs/promises'
import path from 'node:path'

const releaseDir = path.resolve(process.cwd(), 'release')

const deleteIfExists = async (targetPath) => {
  try {
    await fs.rm(targetPath, { recursive: true, force: true })
  } catch {
    // ignore
  }
}

const run = async () => {
  try {
    await fs.access(releaseDir)
  } catch {
    return
  }

  const entries = await fs.readdir(releaseDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(releaseDir, entry.name)

    if (entry.isDirectory() && (entry.name === 'win-unpacked' || entry.name === 'app')) {
      await deleteIfExists(fullPath)
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    if (entry.name === 'latest.yml' || /^GoodMusic-Setup-.*\.(exe|blockmap|zip)$/i.test(entry.name)) {
      await deleteIfExists(fullPath)
    }
  }
}

await run()

