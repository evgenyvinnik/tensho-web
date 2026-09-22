import { useTranslation } from 'react-i18next'
import { useOmenStore } from '../../stores/omenStore'
import { ALL_OMENS } from '../../config/omenDefinitions'
import { useItemText } from '../../i18n/useItemText'
import { DoubleOmenArtwork } from '../ui/DoubleOmenArtwork'
import type { OmenTagSystem } from '../../systems/OmenTagSystem'

/** Optional native disclosure: no timer, overlay, focus change or hover requirement. */
export function PendingOmens({ system }: { system: OmenTagSystem }) {
  const { activeTags: tags } = useOmenStore()
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const ongoing = system.getOngoingEffects()
  const effectCount =
    tags.length +
    Number(Boolean(ongoing.lockedSeason)) +
    Number(ongoing.noInterestRounds > 0) +
    Number(ongoing.interestBoostRounds > 0)
  if (!effectCount) return null
  const number = (value: number) =>
    new Intl.NumberFormat(i18n.language).format(value)
  const armed = tags.filter((tag) => tag.definitionId === 'double_omen').length
  return (
    <details
      data-testid="pending-omens"
      className="mx-3 mb-2 min-w-0 rounded-lg border border-[var(--color-metallic-gold)]/40 bg-[var(--color-dark-forest)]/80 px-3 text-[var(--color-beige-white)]"
    >
      <summary className="min-h-11 cursor-pointer content-center break-words py-1 text-sm focus-visible:outline-2 focus-visible:outline-amber-300">
        {armed > 0 && (
          <DoubleOmenArtwork className="mr-2 inline-block h-10 w-10 align-middle" />
        )}
        {t('omens.pending')} · {number(effectCount)}
      </summary>
      {tags.length > 0 && (
        <ul className="space-y-3 pb-3 text-sm">
          {tags.map((tag) => {
            const definition = ALL_OMENS.find(
              (omen) => omen.id === tag.definitionId
            )
            if (!definition) return null
            return (
              <li
                key={tag.id}
                className="break-words"
                data-omen-id={definition.id}
              >
                <p className="font-semibold text-[var(--color-golden-yellow)]">
                  {itemText.name('omens', definition)}
                </p>
                <p className="leading-relaxed">
                  {itemText.description('omens', definition)}
                </p>
                {definition.trigger === 'OnNextShop' &&
                  definition.tradeoff.type === 'lose_gold' && (
                    <p
                      data-omen-cost
                      className="mt-1 leading-relaxed text-amber-200"
                    >
                      {t('omens.effects.shopFee', {
                        amount: number(Number(definition.tradeoff.value) || 0),
                      })}
                    </p>
                  )}
              </li>
            )
          })}
        </ul>
      )}
      {effectCount > tags.length && (
        <div className="space-y-2 pb-3 text-sm leading-relaxed">
          {ongoing.lockedSeason && (
            <p data-omen-effect="season-lock">
              {t('omens.effects.seasonLock', {
                season: t(`flora.${ongoing.lockedSeason.toLowerCase()}`),
              })}
            </p>
          )}
          {ongoing.noInterestRounds > 0 && (
            <p data-omen-effect="no-interest" className="text-amber-200">
              {t('omens.effects.noInterest', {
                rounds: number(ongoing.noInterestRounds),
              })}
            </p>
          )}
          {ongoing.interestBoostRounds > 0 && (
            <p data-omen-effect="interest-boost">
              {t('omens.effects.interestBoost', {
                amount: number(ongoing.interestCapBonus),
                rounds: number(ongoing.interestBoostRounds),
              })}
            </p>
          )}
        </div>
      )}
    </details>
  )
}
