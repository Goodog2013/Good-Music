import { motion } from 'framer-motion'
import { Eraser, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react'
import { GlassCard } from '../components/common/GlassCard'
import { usePlayerStore } from '../store/playerStore'

export const SettingsScreen = () => {
  const settings = usePlayerStore((state) => state.settings)
  const setVisualizerEnabled = usePlayerStore((state) => state.setVisualizerEnabled)
  const setVisualizerIntensity = usePlayerStore((state) => state.setVisualizerIntensity)
  const clearLibrary = usePlayerStore((state) => state.clearLibrary)

  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34 }} className="space-y-4">
      <GlassCard className="p-4">
        <p className="text-xs uppercase tracking-[0.23em] text-slate-300/80">Settings</p>
        <h2 className="mt-2 font-display text-2xl text-white">Visual & Library</h2>
        <p className="mt-1 text-sm text-slate-300/80">Управление 3D-сценой и состоянием музыкальной библиотеки.</p>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">3D Visualizer</p>
            <button
              type="button"
              onClick={() => setVisualizerEnabled(!settings.visualizerEnabled)}
              className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-slate-100"
            >
              {settings.visualizerEnabled ? <ToggleRight size={20} className="text-cyan-200" /> : <ToggleLeft size={20} className="text-slate-300" />}
            </button>
          </div>
          <p className="text-sm text-slate-300/80">Включите или выключите реактивную 3D-сцену на главном экране.</p>

          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Visualizer Intensity</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={20}
                max={100}
                step={1}
                value={settings.visualizerIntensity}
                onChange={(event) => setVisualizerIntensity(Number(event.target.value))}
                className="player-range"
              />
              <span className="w-10 text-right text-sm font-semibold text-cyan-100">{Math.round(settings.visualizerIntensity)}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Library Maintenance</p>
            <Sparkles size={16} className="text-fuchsia-200" />
          </div>

          <p className="text-sm text-slate-300/80">
            Очистка удаляет локальные треки и пользовательские плейлисты, затем восстанавливает демо-набор для красивого первого экрана.
          </p>

          <button
            type="button"
            onClick={clearLibrary}
            className="mt-4 rounded-xl border border-rose-300/45 bg-rose-300/15 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/25"
          >
            <span className="inline-flex items-center gap-1.5">
              <Eraser size={16} />
              Clear Library
            </span>
          </button>
        </GlassCard>
      </div>
    </motion.section>
  )
}

