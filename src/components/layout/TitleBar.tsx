import { useEffect, useMemo, useState } from 'react'
import { Maximize2, Minimize2, Minus, Search, Square, X } from 'lucide-react'
import { usePlayerStore } from '../../store/playerStore'
import { cn } from '../../utils/cn'

const sectionLabelByView = {
  home: 'Главная',
  playlist: 'Плейлист',
  favorites: 'Избранное',
  settings: 'Настройки',
} as const

interface TitleBarProps {
  onImport: () => void
}

export const TitleBar = ({ onImport }: TitleBarProps) => {
  const activeView = usePlayerStore((state) => state.activeView)
  const searchQuery = usePlayerStore((state) => state.searchQuery)
  const setSearchQuery = usePlayerStore((state) => state.setSearchQuery)
  const [isMaximized, setIsMaximized] = useState(false)

  const isDesktop = typeof window !== 'undefined' && Boolean(window.electronWindow)
  const sectionLabel = useMemo(() => sectionLabelByView[activeView], [activeView])

  useEffect(() => {
    if (!window.electronWindow) {
      return
    }

    window.electronWindow
      .isMaximized()
      .then((value) => {
        setIsMaximized(value)
      })
      .catch(() => {
        setIsMaximized(false)
      })

    const unsubscribe = window.electronWindow.onMaximizedChanged((value) => {
      setIsMaximized(value)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const onToggleMaximize = async () => {
    if (!window.electronWindow) {
      return
    }

    const next = await window.electronWindow.maximizeToggle()
    setIsMaximized(next)
  }

  return (
    <header className="window-drag relative z-30 flex h-14 items-center border-b border-white/10 bg-black/20 px-4 backdrop-blur-xl">
      <div className="window-no-drag flex min-w-0 items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-fuchsia-500 via-blue-500 to-cyan-400 shadow-neon" />
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-[0.26em] text-cyan-100/70">Goodog Audio Lab</p>
          <p className="truncate font-display text-sm text-white/95">Pulse Desktop</p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-5">
        <div className="window-no-drag flex h-9 flex-1 items-center gap-2 rounded-xl border border-white/15 bg-night-950/70 px-3">
          <Search size={15} className="text-cyan-200/70" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Поиск треков, артистов, плейлистов"
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-400/70 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onImport}
          className="window-no-drag rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-100 transition hover:bg-cyan-300/20"
        >
          Import
        </button>
      </div>

      <div className="window-no-drag flex items-center gap-2">
        <p className="hidden rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200/85 md:block">
          {sectionLabel}
        </p>

        <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/30 p-1.5">
          <button
            type="button"
            className="titlebar-btn"
            onClick={() => window.electronWindow?.minimize()}
            aria-label="Minimize window"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            className="titlebar-btn"
            onClick={onToggleMaximize}
            aria-label="Toggle maximize window"
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            type="button"
            className={cn('titlebar-btn titlebar-close', !isDesktop && 'opacity-75')}
            onClick={() => window.electronWindow?.close()}
            aria-label="Close window"
          >
            {isDesktop ? <X size={13} /> : <Square size={11} />}
          </button>
        </div>
      </div>
    </header>
  )
}

