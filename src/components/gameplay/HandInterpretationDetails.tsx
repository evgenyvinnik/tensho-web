import { useTranslation } from 'react-i18next'
import type { CompleteHandInterpretation } from '../../game/GameOrchestrator'
import { getTileImagePath } from '../../utils/assets'
import { tileName } from '../../i18n/tileText'

/** Optional native disclosure: works with touch and keyboard, without a tutorial overlay. */
export function HandInterpretationDetails({
  interpretation,
}: {
  interpretation?: CompleteHandInterpretation | null
}) {
  const { t } = useTranslation()
  if (
    !interpretation ||
    (interpretation.naturalComplete &&
      !interpretation.substitutions.length &&
      !interpretation.usedShantenClemency &&
      !interpretation.allWild)
  )
    return null
  const { substitutions, completionTile, usedShantenClemency, allWild } =
    interpretation
  return (
    <details
      data-hand-interpretation
      className="col-span-2 min-w-0 text-xs text-[var(--color-beige-white)] [overflow-wrap:anywhere]"
    >
      <summary className="min-h-11 cursor-pointer py-3 underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-amber-300">
        {t('handInterpretation.why')}
      </summary>
      <div className="space-y-3 rounded-lg border border-[var(--color-metallic-gold)]/40 bg-black/20 p-3">
        <p>{t('handInterpretation.assisted')}</p>
        {allWild && <p>{t('handInterpretation.allWild')}</p>}
        {substitutions.map(({ physical, effective }) => (
          <div key={physical.id} data-interpreted-tile={physical.id}>
            <div aria-hidden="true" className="mb-1 flex items-center gap-3">
              <img
                src={getTileImagePath(physical.suit, physical.rank)}
                alt=""
                width={36}
                height={48}
                className="h-12 w-9 object-contain"
              />
              <span>→</span>
              <img
                src={getTileImagePath(effective.suit, effective.rank)}
                alt=""
                width={36}
                height={48}
                className="h-12 w-9 object-contain"
              />
            </div>
            <p>
              {t('handInterpretation.substitution', {
                from: tileName(physical, t),
                to: tileName(effective, t),
              })}
            </p>
          </div>
        ))}
        {completionTile && (
          <p>
            {t('handInterpretation.virtual', {
              tile: tileName(completionTile, t),
            })}
          </p>
        )}
        {usedShantenClemency && <p>{t('handInterpretation.penalty')}</p>}
        {(substitutions.length > 0 || completionTile || allWild) && (
          <p className="opacity-70">{t('handInterpretation.unchanged')}</p>
        )}
      </div>
    </details>
  )
}
