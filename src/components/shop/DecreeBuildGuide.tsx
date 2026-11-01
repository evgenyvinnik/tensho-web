import { useTranslation } from 'react-i18next'
import { TeachingIllustration } from '../ui/TeachingIllustration'

/** Optional, keyboard/touch accessible advice; never interrupts a purchase. */
export function DecreeBuildGuide() {
  const { t } = useTranslation()
  return (
    <details
      data-decree-build-guide
      className="mt-2 border-t border-[var(--color-metallic-gold)]/20 text-sm leading-relaxed"
    >
      <summary className="min-h-11 cursor-pointer content-center py-2 font-semibold text-[var(--color-metallic-gold)] focus-visible:outline-2">
        {t('runJourney.guideTitle')}
      </summary>
      <div className="space-y-2 pb-2 text-[var(--color-beige-white)]/85">
        <TeachingIllustration kind="synergy" />
        <p>{t('runJourney.guideEarly')}</p>
        <p>{t('runJourney.guideLate')}</p>
        <p className="rounded-lg border border-[var(--color-metallic-gold)]/25 bg-black/15 p-2 text-[var(--color-golden-yellow)]">
          {t('runJourney.guideExample')}
        </p>
        <p>{t('runJourney.guideMatch')}</p>
      </div>
    </details>
  )
}
