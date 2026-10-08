import { useTranslation } from 'react-i18next'
import { austerityMultiplier } from '../../systems/austerity'

export function AusterityDetails({ count }: { count: number }) {
  const { t, i18n } = useTranslation()
  return (
    <p
      data-austerity-details
      className="mt-3 rounded-lg border border-amber-200/25 bg-black/20 p-2.5 text-sm leading-relaxed [overflow-wrap:anywhere]"
    >
      {t('closedHandAusterity.progress', {
        count,
        factor: austerityMultiplier(count).toLocaleString(
          i18n.language,
          { maximumFractionDigits: 3 }
        ),
      })}
    </p>
  )
}
