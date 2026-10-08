import { useTranslation } from 'react-i18next'
import type { OwnedDecree } from '../../systems/types'

/** Optional detail keeps the inventory compact without concealing copy costs. */
export function CopyCostDetails({ decree }: { decree: OwnedDecree }) {
  const { t } = useTranslation()
  if (
    ![decree.effect, ...(decree.extraEffects ?? [])].some(
      (e) => e.type === 'copy_decree'
    )
  )
    return null
  return (
    <details
      data-copy-cost-details
      className="mt-3 rounded-lg border border-amber-200/25 bg-black/20 p-2.5 text-sm leading-relaxed"
    >
      <summary className="cursor-pointer py-1 font-semibold text-[var(--color-golden-yellow)] focus-visible:outline focus-visible:outline-2">
        {t('copyCosts.title')}
      </summary>
      {(['rescue', 'risk', 'limits'] as const).map((key) => (
        <p key={key} className="mt-2 text-[var(--color-beige-white)]/85">
          {t(`copyCosts.${key}`)}
        </p>
      ))}
    </details>
  )
}
