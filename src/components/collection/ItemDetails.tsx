/**
 * ItemDetails Component for Collection Screen
 *
 * What an Archive item's picture does not say: its effect, rarity, cost,
 * statistics, discovery date and unlock condition. Shown in the card's
 * popup on hover or tap.
 */

import { useTranslation } from 'react-i18next'
import type { ArchiveEntry } from '../../systems/ArchiveSystem'
import { formatDiscoveryDate } from '../../systems/ArchiveSystem'
import type { ItemDisplayInfo } from './ItemCard'
import { VOID_SCRIPTS } from '../../systems/VoidScriptSystem'
import { ControlIcon } from '../ui/ControlIcon'
import { getWonStakeTiers } from '../../utils/stakeMastery'
import { StakeVictoryMarker } from './StakeVictoryMarker'

export interface ItemDetailsProps {
  entry: ArchiveEntry
  /** Null hides what the item is: only how to unlock it shows. */
  displayInfo: ItemDisplayInfo | null
  /** Name the item in the body (when the panel's title does not). */
  showName?: boolean
}

/**
 * Get rarity display info
 */
export function getRarityInfo(rarity?: string): {
  label: string | null
  color: string
  bgColor: string
} {
  switch (rarity) {
    case 'HeavenlyOrdinance':
    case 'Legendary':
    case 'legendary':
    case 'mythic':
      return {
        label: 'legendary',
        color: 'text-purple-300',
        bgColor: 'bg-purple-500/20',
      }
    case 'ImperialDecree':
    case 'Rare':
    case 'rare':
      return {
        label: 'rare',
        color: 'text-blue-300',
        bgColor: 'bg-blue-500/20',
      }
    case 'RegionalMandate':
    case 'Uncommon':
    case 'uncommon':
      return {
        label: 'uncommon',
        color: 'text-green-300',
        bgColor: 'bg-green-500/20',
      }
    case 'LocalEdict':
    case 'Common':
    case 'common':
      return {
        label: 'common',
        color: 'text-gray-300',
        bgColor: 'bg-gray-500/20',
      }
    default:
      return {
        label: null,
        color: 'text-[var(--color-beige-white)]',
        bgColor: 'bg-[var(--color-dark-forest)]',
      }
  }
}

export function ItemDetails({
  entry,
  displayInfo,
  showName = false,
}: ItemDetailsProps) {
  const { t, i18n } = useTranslation()

  const isDiscovered = entry.discoveredAt !== null && displayInfo !== null
  const rarityInfo = getRarityInfo(displayInfo?.rarity)
  const voidScript = displayInfo ? VOID_SCRIPTS[displayInfo.id] : undefined

  return (
    <div className="min-w-0 space-y-3 text-sm [overflow-wrap:anywhere]">
      {displayInfo && showName && (
        <p className="font-bold text-[var(--color-golden-yellow)]">
          {displayInfo.name}
        </p>
      )}
      {displayInfo && (displayInfo.japaneseName || rarityInfo.label) && (
        <div className="flex flex-wrap items-center gap-2">
          {displayInfo.japaneseName && (
            <span className="font-tile text-[var(--color-metallic-gold)]">
              {displayInfo.japaneseName}
            </span>
          )}
          {rarityInfo.label && (
            <span
              data-archive-rarity={rarityInfo.label}
              className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${rarityInfo.color} ${rarityInfo.bgColor}`}
            >
              {t(`shop.ui.rarity_${rarityInfo.label}`)}
            </span>
          )}
        </div>
      )}

      {displayInfo && (
        <p data-archive-effect className="text-[var(--color-beige-white)]">
          {displayInfo.description}
        </p>
      )}

      {voidScript && (
        <div className="rounded-lg border border-red-400/35 bg-red-950/35 p-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-red-300">
            {t('collection.voidCost', 'Void cost')}
          </h3>
          <p data-archive-script-cost className="mt-1 text-red-100">
            {t(`consumableUse.penalty_${voidScript.penalty.type}`, {
              count: voidScript.penalty.value || 1,
            })}
          </p>
          <p className="mt-2 text-xs italic text-[var(--color-metallic-gold)]">
            {voidScript.mahjongTwist}
          </p>
        </div>
      )}

      {isDiscovered && getWonStakeTiers(entry).length > 0 && (
        <div className="flex flex-wrap gap-2" data-archive-victories>
          {getWonStakeTiers(entry).map((tier) => (
            <StakeVictoryMarker key={tier} tier={tier} />
          ))}
        </div>
      )}

      {isDiscovered && (
        <div data-archive-stats className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[var(--color-metallic-gold)] bg-[var(--color-forest-green)] p-2">
            <p className="text-xs text-[var(--color-metallic-gold)]">
              {t('collection.timesUsed', 'Times Used')}
            </p>
            <p
              data-archive-stat-value
              className="text-lg font-bold tabular-nums text-[var(--color-golden-yellow)]"
            >
              {entry.timesUsed.toLocaleString(i18n.language)}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--color-metallic-gold)] bg-[var(--color-forest-green)] p-2">
            <p className="text-xs text-[var(--color-metallic-gold)]">
              {t('collection.runsWon', 'Runs Won')}
            </p>
            <p
              data-archive-stat-value
              className="text-lg font-bold tabular-nums text-green-400"
            >
              {entry.timesWonWith.toLocaleString(i18n.language)}
            </p>
          </div>
        </div>
      )}

      {isDiscovered && (
        <p className="text-xs text-[var(--color-metallic-gold)]">
          {t('collection.discovered')}:{' '}
          <span
            data-archive-discovery-date
            className="text-[var(--color-beige-white)]"
          >
            {entry.discoveredAt === 0
              ? t('collection.starterItem')
              : formatDiscoveryDate(entry.discoveredAt, i18n.language)}
          </span>
        </p>
      )}

      {!entry.isUnlocked && (
        <div
          data-archive-unlock
          className="flex items-start gap-2 rounded-lg border border-gray-600 bg-gray-800/50 p-2 text-gray-300"
        >
          <ControlIcon name="lock" size={18} className="mt-0.5" />
          <p>
            <span className="font-bold">
              {entry.unlockCondition
                ? `${t('collection.unlock', 'Unlock:')} `
                : t('collection.locked', 'Locked')}
            </span>
            {entry.unlockCondition &&
              (entry.category === 'decrees'
                ? t(`decreeUnlocks.${entry.itemId}`, entry.unlockCondition)
                : entry.category === 'consumables'
                  ? t(
                      `consumableUnlocks.${entry.itemId}`,
                      entry.unlockCondition
                    )
                  : entry.unlockCondition)}
          </p>
        </div>
      )}
    </div>
  )
}

export default ItemDetails
