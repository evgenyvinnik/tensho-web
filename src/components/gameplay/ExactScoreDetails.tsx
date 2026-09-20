import { useTranslation } from 'react-i18next'
import { scoreNumber } from '../../utils/scoreNumber'

/** Native, keyboard/touch-operable disclosure; no hover-only information. */
export function ExactScoreDetails({
  entries,
  always = false,
}: {
  entries: { label: string; value: number }[]
  always?: boolean
}) {
  const { t, i18n } = useTranslation()
  const numbers = entries.map((entry) => ({
    ...entry,
    ...scoreNumber(entry.value, i18n.language),
  }))
  if (!always && !numbers.some((number) => number.isCompact)) return null
  return (
    <details
      data-exact-score-details
      className="col-span-2 min-w-0 text-left text-xs text-[var(--color-beige-white)]/75 [overflow-wrap:anywhere]"
    >
      <summary className="min-h-[44px] cursor-pointer py-2 underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-amber-300">
        {t('scoring.exactValues')}
      </summary>
      <dl className="space-y-2 rounded-lg bg-black/20 p-2">
        {numbers.map((number) => (
          <div key={number.label}>
            <dt className="text-[10px] opacity-70">{number.label}</dt>
            <dd className="font-mono tabular-nums">{number.exact}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
