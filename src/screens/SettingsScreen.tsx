import { motion } from 'framer-motion'
import { Eraser, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react'
import { GlassCard } from '../components/common/GlassCard'
import { useI18n } from '../hooks/useI18n'
import { usePlayerStore } from '../store/playerStore'
import type { AccentColor, AppLanguage, AppTheme, VisualizerMode } from '../types/music'

const settingButton = (active: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
    active ? 'btn-accent border' : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/30'
  }`

export const SettingsScreen = () => {
  const settings = usePlayerStore((state) => state.settings)
  const setVisualizerEnabled = usePlayerStore((state) => state.setVisualizerEnabled)
  const setVisualizerIntensity = usePlayerStore((state) => state.setVisualizerIntensity)
  const setVisualizerMode = usePlayerStore((state) => state.setVisualizerMode)
  const setLanguage = usePlayerStore((state) => state.setLanguage)
  const setTheme = usePlayerStore((state) => state.setTheme)
  const setAccent = usePlayerStore((state) => state.setAccent)
  const clearLibrary = usePlayerStore((state) => state.clearLibrary)
  const { t } = useI18n()

  const languageOptions: Array<{ value: AppLanguage; label: string }> = [
    { value: 'ru', label: t('russian') },
    { value: 'en', label: t('english') },
  ]

  const themeOptions: Array<{ value: AppTheme; label: string }> = [
    { value: 'midnight', label: t('themeMidnight') },
    { value: 'graphite', label: t('themeGraphite') },
    { value: 'ocean', label: t('themeOcean') },
  ]

  const accentOptions: Array<{ value: AccentColor; label: string }> = [
    { value: 'cyan', label: t('accentCyan') },
    { value: 'violet', label: t('accentViolet') },
    { value: 'rose', label: t('accentRose') },
    { value: 'emerald', label: t('accentEmerald') },
  ]

  const visualizerModes: Array<{ value: VisualizerMode; label: string }> = [
    { value: 'orbital', label: t('modeOrbital') },
    { value: 'rings', label: t('modeRings') },
    { value: 'wave', label: t('modeWave') },
  ]

  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34 }} className="space-y-4">
      <GlassCard className="p-4">
        <p className="text-xs uppercase tracking-[0.23em] text-slate-300/80">{t('settings')}</p>
        <h2 className="mt-2 font-display text-2xl text-white">{t('visualSettingsTitle')}</h2>
        <p className="mt-1 text-sm text-slate-300/80">{t('visualSettingsDesc')}</p>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{t('visualizer')}</p>
            <button
              type="button"
              onClick={() => setVisualizerEnabled(!settings.visualizerEnabled)}
              className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-slate-100"
              title={t('visualizer')}
            >
              {settings.visualizerEnabled ? <ToggleRight size={20} className="text-cyan-200" /> : <ToggleLeft size={20} className="text-slate-300" />}
            </button>
          </div>
          <p className="text-sm text-slate-300/80">{t('visualizerDesc')}</p>

          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">{t('visualizerIntensity')}</p>
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

          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">{t('visualizerMode')}</p>
            <div className="flex flex-wrap gap-2">
              {visualizerModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setVisualizerMode(mode.value)}
                  className={settingButton(settings.visualizerMode === mode.value)}
                  title={mode.label}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{t('language')}</p>
            <Sparkles size={16} className="text-fuchsia-200" />
          </div>
          <div className="flex flex-wrap gap-2">
            {languageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLanguage(option.value)}
                className={settingButton(settings.language === option.value)}
                title={option.label}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">{t('theme')}</p>
          <div className="flex flex-wrap gap-2">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={settingButton(settings.theme === option.value)}
                title={option.label}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">{t('accent')}</p>
          <div className="flex flex-wrap gap-2">
            {accentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAccent(option.value)}
                className={settingButton(settings.accent === option.value)}
                title={option.label}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{t('libraryMaintenance')}</p>
              <Sparkles size={16} className="text-fuchsia-200" />
            </div>

            <p className="text-sm text-slate-300/80">{t('clearDesc')}</p>

            <button
              type="button"
              onClick={clearLibrary}
              className="mt-4 rounded-xl border border-rose-300/45 bg-rose-300/15 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/25"
              title={t('clearLibrary')}
            >
              <span className="inline-flex items-center gap-1.5">
                <Eraser size={16} />
                {t('clearLibrary')}
              </span>
            </button>
          </div>
        </GlassCard>
      </div>
    </motion.section>
  )
}
