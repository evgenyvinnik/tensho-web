import { useTranslation } from 'react-i18next'
import { scoreNumber } from '../../utils/scoreNumber'

/** Native, keyboard/touch-operable disclosure; no hover-only information. */
export function ExactScoreDetails({
  entries,
  always = false,
  compact = false,
}: {
  entries: { label: string; value: number }[]
  always?: boolean
  /** Icon-sized trigger whose values open over, not inside, a dense row. */
  compact?: boolean
}) {
  const { t, i18n } = useTranslation()
  const numbers = entries.map((entry) => ({
    ...entry,
    ...scoreNumber(entry.value, i18n.language),
  }))
  if (!always && !numbers.some((number) => number.isCompact)) return null
  if (compact)
    return (
      <details
        data-exact-score-details
        className="relative shrink-0 text-left text-xs text-[var(--color-beige-white)]/75 [overflow-wrap:anywhere]"
      >
        <summary
          title={t('scoring.exactValues')}
          className="flex min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded-full text-base text-[var(--color-metallic-gold)] hover:text-[var(--color-golden-yellow)] focus-visible:outline-2 focus-visible:outline-amber-300 [&::-webkit-details-marker]:hidden"
        >
          {/* Generated glyph: the summary's text stays exactly the label. */}
          <span aria-hidden="true" className="before:content-['ⓘ']" />
          <span className="sr-only">{t('scoring.exactValues')}</span>
        </summary>
        <dl className="absolute right-0 top-full z-30 mt-1 w-56 max-w-[80vw] space-y-2 rounded-lg border border-[var(--color-metallic-gold)]/40 bg-[var(--color-dark-forest)] p-2 shadow-xl">
          {numbers.map((number) => (
            <div key={number.label}>
              <dt className="text-[10px] opacity-70">{number.label}</dt>
              <dd className="font-mono tabular-nums">{number.exact}</dd>
            </div>
          ))}
        </dl>
      </details>
    )
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
