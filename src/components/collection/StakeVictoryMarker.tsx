import { useTranslation } from 'react-i18next'
import { getStakeByTier } from '../../config/stakeDefinitions'
import { STAKE_NAME_KEYS } from '../../i18n/stakeRules'
import { PavilionIcon } from '../ui/PavilionIcon'

/** A cosmetic victory record, never a gameplay Eternal/Rental sticker. */
export function StakeVictoryMarker({
  tier,
  compact = false,
}: {
  tier: number
  compact?: boolean
}) {
  const { t, i18n } = useTranslation()
  const stake = getStakeByTier(tier)
  if (!stake) return null
  const label = t('collection.stakeVictory', {
    stake: t(`stakes.${STAKE_NAME_KEYS[tier - 1]}`),
  })
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      data-stake-victory={tier}
      className="inline-flex min-w-0 items-center gap-1 rounded-md border-2 bg-[var(--color-dark-forest)] px-1.5 py-1 text-xs text-[var(--color-beige-white)]"
      style={{ borderColor: stake.color }}
    >
      <PavilionIcon name="trophy" size={compact ? 18 : 22} />
      <span
        className={
          compact ? 'font-bold tabular-nums' : '[overflow-wrap:anywhere]'
        }
      >
        {compact ? tier.toLocaleString(i18n.language) : label}
      </span>
    </span>
  )
}
