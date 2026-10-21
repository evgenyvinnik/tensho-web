/**
 * ItemCard Component for Collection Screen
 *
 * One Archive item as its picture, named underneath. Hovering previews its
 * details in a popup; a tap or click pins the popup, and the keyboard opens
 * it. Undiscovered items are silhouettes. A locked reward stays readable in
 * its popup — what it does and how to unlock it — while anything else
 * undiscovered keeps its secret.
 */

import { useTranslation } from 'react-i18next'
import type { ArchiveEntry } from '../../systems/ArchiveSystem'
import type { ArchiveCategory } from '../../config/archiveDefinitions'
import { AnchoredPopover } from '../ui/AnchoredPopover'
import { ControlIcon } from '../ui/ControlIcon'
import { usePreviewPopover } from '../ui/usePreviewPopover'
import { getArchiveIllustration } from './ArchiveArtwork'
import { ItemDetails } from './ItemDetails'
import { getWonStakeTiers } from '../../utils/stakeMastery'
import { StakeVictoryMarker } from './StakeVictoryMarker'

/**
 * Item info for display (from definition files)
 */
export interface ItemDisplayInfo {
  id: string
  name: string
  japaneseName?: string
  description: string
  rarity?: string
  icon?: string
  category: ArchiveCategory
}

export interface ItemCardProps {
  entry: ArchiveEntry
  displayInfo: ItemDisplayInfo | null
}

/**
 * Get rarity color class
 */
function getRarityColor(rarity?: string): string {
  switch (rarity) {
    case 'HeavenlyOrdinance':
    case 'Legendary':
    case 'legendary':
    case 'mythic':
      return 'border-purple-500 bg-purple-500/10'
    case 'ImperialDecree':
    case 'Rare':
    case 'rare':
      return 'border-blue-500 bg-blue-500/10'
    case 'RegionalMandate':
    case 'Uncommon':
    case 'uncommon':
      return 'border-green-500 bg-green-500/10'
    default:
      return 'border-[var(--color-metallic-gold)] bg-[var(--color-dark-forest)]'
  }
}

/**
 * ItemCard - Single item display in collection grid
 */
export function ItemCard({ entry, displayInfo }: ItemCardProps) {
  const { t } = useTranslation()
  const { anchorRef, triggerProps, popoverProps } = usePreviewPopover()

  const isLocked = !entry.isUnlocked
  const known = entry.discoveredAt !== null ? displayInfo : null
  const details = known ?? (isLocked ? displayInfo : null)
  const label = known
    ? known.name
    : isLocked
      ? t('collection.locked', 'Locked')
      : t('collection.undiscovered', 'Undiscovered')
  const art = known
    ? getArchiveIllustration(known.category, known.id)
    : undefined
  const bestStake = getWonStakeTiers(entry).at(-1)

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        data-archive-card={entry.itemId}
        aria-label={label}
        data-known={Boolean(known)}
        {...triggerProps}
        className={`pavilion-archive-card group relative flex min-w-0 flex-col items-center rounded-lg border-2 p-1.5 text-center transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-golden-yellow)] sm:p-2 ${
          known
            ? getRarityColor(known.rarity)
            : 'border-gray-600 bg-gray-800/50'
        } ${isLocked ? 'opacity-60' : ''}`}
      >
        <span className="flex aspect-square w-full items-center justify-center">
          {art ? (
            <img
              src={art}
              alt=""
              aria-hidden="true"
              draggable={false}
              data-archive-card-art
              className="game-illustration h-full w-full object-contain transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-3/5 w-3/5 items-center justify-center"
            >
              <ControlIcon name={isLocked ? 'lock' : 'archive'} size={64} />
            </span>
          )}
        </span>
        <h3
          className={`mt-1 line-clamp-2 w-full text-xs font-bold leading-tight [overflow-wrap:anywhere] sm:text-sm ${
            known ? 'text-[var(--color-beige-white)]' : 'text-gray-500'
          }`}
        >
          {label}
        </h3>
        {/* Known locked rewards stay inspectable; the lock marks them. */}
        {known && bestStake !== undefined && (
          <span className="absolute left-1 top-1">
            <StakeVictoryMarker tier={bestStake} compact />
          </span>
        )}
        {known && isLocked && (
          <span
            data-archive-card-lock
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1"
          >
            <ControlIcon name="lock" size={16} />
          </span>
        )}
      </button>
      <AnchoredPopover {...popoverProps} title={label}>
        <ItemDetails entry={entry} displayInfo={details} showName={!known} />
      </AnchoredPopover>
    </>
  )
}

export default ItemCard
