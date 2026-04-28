import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, type ChangeEvent } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { TitleBar } from '../components/layout/TitleBar'
import { AudioEngineProvider } from '../components/player/AudioEngine'
import { PlayerBar } from '../components/player/PlayerBar'
import { FavoritesScreen } from '../screens/FavoritesScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { PlaylistScreen } from '../screens/PlaylistScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { usePlayerStore } from '../store/playerStore'
import type { AppView } from '../types/music'

const viewOrder: AppView[] = ['home', 'playlist', 'favorites', 'settings']

export const App = () => {
  const activeView = usePlayerStore((state) => state.activeView)
  const addLocalTracks = usePlayerStore((state) => state.addLocalTracks)
  const setActiveView = usePlayerStore((state) => state.setActiveView)
  const playbackNotice = usePlayerStore((state) => state.playbackNotice)
  const dismissPlaybackNotice = usePlayerStore((state) => state.dismissPlaybackNotice)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const onImport = () => {
    fileInputRef.current?.click()
  }

  const onFilesPicked = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    await addLocalTracks(files)
    setActiveView('home')

    if (event.target) {
      event.target.value = ''
    }
  }

  const viewContent = useMemo(() => {
    switch (activeView) {
      case 'home':
        return <HomeScreen onImport={onImport} />
      case 'playlist':
        return <PlaylistScreen />
      case 'favorites':
        return <FavoritesScreen />
      case 'settings':
        return <SettingsScreen />
      default:
        return <HomeScreen onImport={onImport} />
    }
  }, [activeView])

  return (
    <AudioEngineProvider>
      <div className="relative flex h-screen flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-8 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute right-8 top-12 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute bottom-8 left-1/3 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        </div>

        <TitleBar onImport={onImport} />

        <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
          <div className="w-[300px] max-w-[32vw] min-w-[250px]">
            <Sidebar onImport={onImport} />
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={viewOrder.indexOf(activeView)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {viewContent}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <PlayerBar />

        <AnimatePresence>
          {playbackNotice ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2"
            >
              <button
                type="button"
                onClick={dismissPlaybackNotice}
                className="glass-panel rounded-xl border-cyan-300/35 bg-night-900/80 px-4 py-2 text-sm text-cyan-100"
              >
                {playbackNotice}
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
          multiple
          className="hidden"
          onChange={onFilesPicked}
        />
      </div>
    </AudioEngineProvider>
  )
}
