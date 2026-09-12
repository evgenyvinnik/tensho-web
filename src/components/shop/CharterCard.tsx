/**
 * Illustrated Imperial Charter offer. Rules remain localized text, and the
 * explicit purchase button supplies keyboard access to the confirmation flow.
 */
import { useState, useCallback, useId } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import type { ImperialCharter } from '../../systems/types'
import { useItemText } from '../../i18n/useItemText'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { illustrationAssets } from '../../utils/assets'
import { GoldIcon } from '../ui/GoldIcon'

const AnimatedArticle = animated('article')

export interface CharterCardProps {
  charter: ImperialCharter
  finalCost: number
  canAfford: boolean
  onPurchase: () => void
}

export function CharterCard({
  charter,
  finalCost,
  canAfford,
  onPurchase,
}: CharterCardProps) {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const reduceMotion = useReducedMotion()
  const nameId = useId()
  const priceId = useId()
  const descriptionId = useId()
  const [isHovered, setIsHovered] = useState(false)
  const spring = useSpring({
    scale: isHovered && !reduceMotion ? 1.01 : 1,
    brightness: isHovered ? 1.05 : 1,
    config: { tension: 400, friction: 30 },
    immediate: reduceMotion,
  })
  const handleClick = useCallback(() => {
    if (canAfford) onPurchase()
  }, [canAfford, onPurchase])

  return (
    <AnimatedArticle
      data-testid="charter-card"
      aria-labelledby={nameId}
      className="relative min-w-0 w-full overflow-hidden rounded-xl border-2 bg-[linear-gradient(135deg,#2D5F4A,#1C3A2E)]"
      style={{
        transform: spring.scale.to((s) => `scale(${s})`),
        filter: spring.brightness.to((b) => `brightness(${b})`),
        borderColor: charter.isUpgraded ? '#FFD74F' : '#C8B273',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] items-start gap-3 p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:gap-4">
        <img
          src={illustrationAssets.imperialCharter}
          alt={t('shop.ui.imperialCharter')}
          className="game-illustration h-24 w-20 object-contain sm:h-28 sm:w-24"
          draggable={false}
        />
        <div className="min-w-0">
          <h3
            id={nameId}
            className="break-words text-lg font-bold leading-snug text-[var(--color-golden-yellow)]"
          >
            {itemText.name('charters', charter)}
          </h3>
          <span className="mt-2 inline-block max-w-full break-words rounded-full border border-[var(--color-metallic-gold)]/40 bg-black/20 px-2 py-1 text-xs text-[var(--color-metallic-gold)]">
            {charter.isUpgraded ? t('shop.upgraded') : t('shop.ui.baseEdition')}
          </span>
        </div>
        <p
          id={descriptionId}
          className="col-span-2 min-w-0 break-words text-sm leading-relaxed text-[var(--color-beige-white)]/85 sm:col-span-1 sm:col-start-2"
        >
          {itemText.description('charters', charter)}
        </p>
        <button
          type="button"
          aria-labelledby={`${nameId} ${priceId}`}
          aria-describedby={descriptionId}
          onClick={(event) => {
            event.stopPropagation()
            handleClick()
          }}
          disabled={!canAfford}
          className="col-span-2 flex min-h-[48px] min-w-0 items-center justify-center gap-2 rounded-lg border-2 border-[var(--color-golden-yellow)] bg-[var(--color-vibrant-orange)] px-4 py-3 text-lg font-bold text-[var(--color-beige-white)] transition-colors hover:bg-[var(--color-deep-orange)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-golden-yellow)] disabled:cursor-not-allowed disabled:border-gray-500 disabled:bg-gray-600 disabled:text-gray-300 sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:min-w-[100px] sm:self-center"
        >
          <GoldIcon className="h-5 w-5" />
          <span id={priceId} className="min-w-0 break-all">
            {finalCost.toLocaleString(i18n.resolvedLanguage)}G
          </span>
        </button>
      </div>
    </AnimatedArticle>
  )
}

export default CharterCard
