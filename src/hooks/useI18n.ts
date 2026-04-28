import { useMemo } from 'react'
import { getText, type TranslationKey } from '../i18n/translations'
import { usePlayerStore } from '../store/playerStore'

export const useI18n = () => {
  const language = usePlayerStore((state) => state.settings.language)

  const t = useMemo(() => {
    return (key: TranslationKey) => getText(language, key)
  }, [language])

  return {
    language,
    t,
  }
}
