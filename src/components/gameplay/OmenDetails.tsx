import { useTranslation } from 'react-i18next'
import type { OmenDefinition } from '../../config/omenDefinitions'
import { useItemText } from '../../i18n/useItemText'
import { OmenArtwork } from '../ui/OmenArtwork'

/** An earned Omen's panel on the rail: what it does and what it costs. */
export function OmenDetails({ omen }: { omen: OmenDefinition }) {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  return (
    <div data-omen-details={omen.id} className="flex items-start gap-3 text-sm">
      <OmenArtwork omenId={omen.id} className="h-16 w-16 shrink-0" />
      <div className="min-w-0 [overflow-wrap:anywhere]">
        <p className="leading-relaxed">{itemText.description('omens', omen)}</p>
        {omen.trigger === 'OnNextShop' &&
          omen.tradeoff.type === 'lose_gold' && (
            <p data-omen-cost className="mt-1 leading-relaxed text-amber-200">
              {t('omens.effects.shopFee', {
                amount: new Intl.NumberFormat(i18n.language).format(
                  Number(omen.tradeoff.value) || 0
                ),
              })}
            </p>
          )}
      </div>
    </div>
  )
}
