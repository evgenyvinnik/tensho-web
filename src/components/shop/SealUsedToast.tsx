/**
 * SealUsedToast: Seals just used in the Tea House, and what they did.
 *
 * A short note under the header naming the Seals (one bought, or every Seal
 * a pack claim used) and, for those laid on wall tiles, what each tile
 * became. It leaves by itself; tapping it
 * dismisses it sooner. The Seal has already worked before this shows.
 *
 * @module components/shop/SealUsedToast
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { FateSeal } from '../../systems/FateSealSystem'
import type { SealedTile } from '../../gameplay/wallSeals'
import { useItemText } from '../../i18n/useItemText'
import { getFateSealIllustration } from '../../utils/assets'
import { TileImage } from '../tiles/TileImage'

const SHOW_MS = 3500

export interface SealUsedToastProps {
  seals: readonly FateSeal[]
  changes: readonly SealedTile[]
  top: number
  onDone: () => void
}

export function SealUsedToast({
  seals,
  changes,
  top,
  onDone,
}: SealUsedToastProps) {
  const { t } = useTranslation()
  const itemText = useItemText()

  useEffect(() => {
    const timer = setTimeout(onDone, SHOW_MS)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <button
      type="button"
      role="status"
      data-seal-used={seals.map((seal) => seal.id).join(' ')}
      onClick={onDone}
      className="cash-out-toast-enter fixed right-3 z-40 flex max-w-[calc(100vw-24px)] items-center gap-2 rounded-xl border border-[var(--color-metallic-gold)] bg-[var(--color-dark-forest)]/95 px-3 py-2 text-left text-sm text-[var(--color-beige-white)] shadow-xl"
      style={{ top }}
    >
      <img
        src={getFateSealIllustration(seals[0]?.id)}
        alt=""
        aria-hidden="true"
        className="game-illustration h-9 w-9 shrink-0 object-contain"
      />
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {t('shop.sealUsed', {
          name: seals.map((seal) => itemText.name('seals', seal)).join(', '),
        })}
      </span>
      {changes.length > 0 && (
        <span aria-hidden="true" className="flex shrink-0 items-center gap-0.5">
          {changes.map(({ before, after }) =>
            after ? (
              <TileImage
                key={before.id}
                tile={after}
                size="small"
                showTooltip={false}
              />
            ) : null
          )}
        </span>
      )}
    </button>
  )
}

export default SealUsedToast
