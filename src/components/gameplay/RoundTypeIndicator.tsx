/**
 * RoundTypeIndicator Component for Tensho Mahjong Roguelike
 *
 * Displays the current round type (Small/Large/Boss) with Japanese name
 * and optional boss mandate information.
 *
 * @module components/gameplay/RoundTypeIndicator
 */

import { RoundType, ROUND_TYPE_CONFIG, isCJKLanguage } from './gameplayTypes'
import { useTranslation } from 'react-i18next'
import { useId, useState } from 'react'
import { Popup } from '../ui/Popup'
import { illustrationAssets } from '../../utils/assets'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for RoundTypeIndicator
 */
export interface RoundTypeIndicatorProps {
  /** Current round type */
  roundType: RoundType
  /** Boss mandate name (only shown for Boss rounds) */
  mandateName?: string
  mandateId?: string
  mandateDescription?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Round type indicator with Japanese text and mandate display.
 *
 * Shows the round type in a colored pill/badge format:
 * - Small (小局): Green
 * - Large (大局): Blue
 * - Boss (親局): Purple with mandate name
 *
 * Japanese names are shown when the UI language is CJK.
 */
export function RoundTypeIndicator({
  roundType,
  mandateName,
  mandateId,
  mandateDescription,
}: RoundTypeIndicatorProps) {
  const { t } = useTranslation()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const descriptionId = useId()
  const art =
    mandateId === 'cerulean_bell' ? illustrationAssets.ceruleanBell : undefined
  const config = ROUND_TYPE_CONFIG[roundType]
  const showCJK = isCJKLanguage()
  const localizedRoundType = t(`rounds.${roundType.toLowerCase()}`, roundType)

  return (
    <>
      <div
        className={`
        inline-flex items-center gap-2 px-2 py-1 sm:px-3
        ${config.bgColor} ${config.borderColor}
        border rounded-full
      `}
      >
        {/* Japanese name, shown for CJK languages unless it duplicates the
          localized label below - in Japanese the two are the same word. */}
        {showCJK && config.japaneseName !== localizedRoundType && (
          <span className={`font-bold ${config.color}`}>
            {config.japaneseName}
          </span>
        )}

        {/* Localized round type */}
        <span className="text-xs text-[var(--color-beige-white)] sm:text-sm">
          {localizedRoundType}
        </span>

        {/* Mandate name for boss rounds */}
        {mandateName && (
          <button
            type="button"
            data-mandate-details={mandateId}
            aria-haspopup="dialog"
            onClick={() => setDetailsOpen(true)}
            className="flex min-h-11 min-w-0 items-center gap-1 rounded text-xs font-medium text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-golden-yellow)]"
          >
            {art && (
              <img
                src={art}
                alt=""
                className="h-8 w-8 shrink-0 object-contain"
              />
            )}
            <span className="break-words">{mandateName}</span>
          </button>
        )}
      </div>
      {mandateName && (
        <Popup
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          title={mandateName}
          descriptionId={descriptionId}
        >
          {art && (
            <img
              src={art}
              alt=""
              className="mx-auto mb-4 h-32 w-32 object-contain"
            />
          )}
          <p id={descriptionId} className="text-center leading-relaxed">
            {mandateDescription}
          </p>
        </Popup>
      )}
    </>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default RoundTypeIndicator
