/**
 * ActionBar Component for Tensho Mahjong Roguelike
 *
 * Bottom action bar with gameplay buttons (Skip, Redraw, Play)
 * and wall remaining indicator.
 *
 * @module components/gameplay/ActionBar
 */

import { TFunction } from 'i18next'
import { Button } from '../ui/Button'
import {
  MAX_TACTICAL_PLAY_TILES,
  MIN_TACTICAL_PLAY_TILES,
  isTacticalPlaySize,
} from '../../game/playRules'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for ActionBar
 */
export interface ActionBarProps {
  /** Number of tiles remaining in wall */
  wallRemaining: number
  /** Number of hands remaining this round */
  handsRemaining: number
  /** Number of discards remaining this round */
  discardsRemaining: number
  /** Number of redraw actions remaining */
  redrawsRemaining: number
  /** Number of tiles currently staged/selected */
  selectedTileCount: number
  /** Total number of tiles currently in hand */
  handTileCount: number
  /** Whether the current selection (or whole hand when empty) is complete */
  isCompleteHandSelection: boolean
  /** Exact play size imposed by the active Boss Mandate, if any */
  requiredPlaySize?: number
  /** Authoritative legality, including required locked tiles. */
  playAllowed?: boolean
  playRestriction?: string
  /** Authoritative redraw legality, including tile locks and replacement chains. */
  redrawAllowed?: boolean
  /** Authoritative single-tile discard legality, including Mandates and locks. */
  discardAllowed?: boolean
  onDiscard?: () => void
  /** Current round number (1-3) */
  currentRound: number
  /** Handler for skip action */
  onSkip: () => void
  /** Handler for replacing the selected tiles */
  onRedraw: () => void
  /** Handler for play hand action */
  onPlayHand: () => void
  /** Forecast for the exact tiles that will be played */
  projectedScore?: number
  /** Whether the forecast reaches the remaining round target */
  willClear?: boolean
  /** Whether Dead Wall Writ can replace the selected tile */
  canUseDeadWallWrit?: boolean
  /** Handler for the once-per-round Dead Wall draw */
  onDeadWallDraw?: () => void
  /** Translation function for i18n */
  t: TFunction
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Bottom action bar for gameplay controls.
 *
 * Features:
 * - Wall remaining indicator
 * - Hands/Discards remaining indicators
 * - Skip button (disabled for boss rounds)
 * - Contextual Play button (full hand or selected group)
 * - 44px minimum touch targets for accessibility
 */
export function ActionBar({
  wallRemaining,
  handsRemaining,
  discardsRemaining,
  redrawsRemaining,
  selectedTileCount,
  handTileCount,
  isCompleteHandSelection,
  requiredPlaySize,
  playAllowed = true,
  playRestriction,
  redrawAllowed = true,
  discardAllowed = false,
  onDiscard,
  currentRound,
  onSkip,
  onRedraw,
  onPlayHand,
  projectedScore,
  willClear = false,
  canUseDeadWallWrit = false,
  onDeadWallDraw,
  t,
}: ActionBarProps) {
  const isStageAction = selectedTileCount === 0
  const mandateCount = isStageAction ? handTileCount : selectedTileCount
  const meetsMandate =
    requiredPlaySize === undefined || mandateCount === requiredPlaySize
  const isTacticalSelection = isTacticalPlaySize(selectedTileCount)
  const isCompleteSelection =
    selectedTileCount > MAX_TACTICAL_PLAY_TILES && isCompleteHandSelection
  const canStageCompleteHand =
    isStageAction && isCompleteHandSelection && meetsMandate
  const canCommitSelection =
    !isStageAction &&
    meetsMandate &&
    (isTacticalSelection || isCompleteSelection)
  const canPlay =
    playAllowed &&
    handsRemaining > 0 &&
    (canStageCompleteHand || canCommitSelection)
  const canRedraw =
    redrawAllowed &&
    redrawsRemaining > 0 &&
    selectedTileCount > 0 &&
    selectedTileCount <= 3 &&
    wallRemaining >= selectedTileCount
  const canSkip = currentRound !== 3 // Can't skip boss rounds
  const canDiscard =
    selectedTileCount === 1 && discardAllowed && discardsRemaining > 0
  const mandateDelta =
    requiredPlaySize === undefined ? 0 : requiredPlaySize - mandateCount
  const playLabel = isStageAction
    ? requiredPlaySize !== undefined && !meetsMandate
      ? t('gameplay.selectExact', 'SELECT {{count}}', {
          count: requiredPlaySize,
        })
      : isCompleteHandSelection
        ? t('gameplay.stageHand', 'STAGE HAND')
        : t('gameplay.selectRange', 'SELECT {{min}}–{{max}}', {
            min: MIN_TACTICAL_PLAY_TILES,
            max: MAX_TACTICAL_PLAY_TILES,
          })
    : mandateDelta > 0
      ? t('gameplay.selectMore', 'SELECT {{count}} MORE', {
          count: mandateDelta,
        })
      : mandateDelta < 0
        ? t('gameplay.returnTiles', 'RETURN {{count}}', {
            count: Math.abs(mandateDelta),
          })
        : selectedTileCount === 1
          ? t('gameplay.selectMore', 'SELECT {{count}} MORE', { count: 1 })
          : isCompleteSelection
            ? t('gameplay.confirmHand', 'CONFIRM HAND')
            : selectedTileCount > MAX_TACTICAL_PLAY_TILES
              ? t('gameplay.notComplete', 'NOT COMPLETE')
              : t('gameplay.playCount', 'PLAY {{count}}', {
                  count: selectedTileCount,
                })
  const forecastDescription =
    projectedScore !== undefined
      ? ` Forecast: ${projectedScore.toLocaleString()} points${willClear ? ', enough to win the round' : ''}.`
      : ''
  const playDescription = isStageAction
    ? requiredPlaySize !== undefined && !meetsMandate
      ? `This Boss Mandate requires exactly ${requiredPlaySize} tiles`
      : isCompleteHandSelection
        ? `Move all ${handTileCount} tiles to the board for confirmation.${forecastDescription}`
        : `Select ${MIN_TACTICAL_PLAY_TILES} to ${MAX_TACTICAL_PLAY_TILES} tiles for a tactical play, or complete the hand to declare it`
    : mandateDelta > 0
      ? `Select ${mandateDelta} more tile${mandateDelta === 1 ? '' : 's'} to meet the Boss Mandate`
      : mandateDelta < 0
        ? `Return ${Math.abs(mandateDelta)} tile${mandateDelta === -1 ? '' : 's'} to meet the Boss Mandate`
        : selectedTileCount === 1
          ? 'Select one more tile before playing'
          : isCompleteSelection
            ? `Confirm the complete ${selectedTileCount}-tile hand.${forecastDescription}`
            : selectedTileCount > MAX_TACTICAL_PLAY_TILES
              ? `This selection is not a complete hand; return to ${MAX_TACTICAL_PLAY_TILES} tiles or fewer`
              : `Play ${selectedTileCount} selected tiles.${forecastDescription}`
  return (
    <div
      data-frame-corner-row="bottom"
      className="gameplay-frame-corner-row sticky bottom-0 z-20 flex flex-shrink-0 items-center justify-center gap-1.5 rounded-sm border-t border-white/5 bg-[var(--color-dark-forest)] px-2 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.2)] safe-area-bottom sm:gap-3 sm:px-4"
    >
      {/* Keep action identities stable: a second discard tap must never skip. */}
      <Button
        data-game-action="skip"
        variant="secondary"
        size="sm"
        onClick={onSkip}
        disabled={!canSkip}
        aria-label={t('gameplay.skip', 'SKIP')}
        title={t('gameplay.skip', 'SKIP')}
        className="!min-w-[44px] !w-11 shrink-0 !px-1 sm:!w-auto sm:!min-w-[80px] sm:!px-4"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="mx-auto h-5 w-5 sm:hidden"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 5 9 7-9 7V5Zm13 0v14" />
        </svg>
        <span className="hidden whitespace-nowrap sm:inline">
          {t('gameplay.skip', 'SKIP')}
        </span>
      </Button>

      {onDiscard && (
        <Button
          data-game-action="discard"
          variant="secondary"
          size="sm"
          onClick={onDiscard}
          disabled={!canDiscard}
          aria-label={t('gameplay.discard', 'Discard')}
          title={t('gameplay.discard', 'Discard')}
          className="!min-w-[44px] !w-11 shrink-0 !px-1 sm:!w-auto sm:!min-w-[80px] sm:!px-4"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="mx-auto h-5 w-5 sm:hidden"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7" />
          </svg>
          <span className="hidden whitespace-nowrap sm:inline">
            {t('gameplay.discard', 'Discard')}
          </span>
        </Button>
      )}

      <Button
        data-game-action="redraw"
        variant="secondary"
        size="sm"
        onClick={onRedraw}
        disabled={!canRedraw}
        aria-label={t('gameplay.redrawSelected', 'Redraw selected tiles')}
        title={`${t(
          'gameplay.redrawHint',
          'Return up to 3 selected tiles and draw replacements'
        )} · ${t('gameplay.redrawsRemaining', 'Redraws remaining')}: ${redrawsRemaining}`}
        className="relative !min-w-[44px] !w-11 shrink-0 !px-1 sm:!w-auto sm:!min-w-[80px] sm:!px-4 sm:text-sm"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="mx-auto h-5 w-5 sm:hidden"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 7v5h-5M4 17v-5h5M5.5 8a7 7 0 0 1 12-2L20 9M4 15l2.5 3a7 7 0 0 0 12-2" />
        </svg>
        <span className="hidden whitespace-nowrap sm:inline">
          {t('gameplay.redraw', 'REDRAW')}
        </span>
        {/* The only place redraws are counted; wall, hands and discards
            are shown once each on the table itself. */}
        <span
          data-redraws-remaining={redrawsRemaining}
          aria-hidden="true"
          className="pointer-events-none absolute right-1 top-1 rounded-full bg-black/40 px-1 text-[9px] leading-tight tabular-nums before:content-[attr(data-redraws-remaining)]"
        />
      </Button>

      {onDeadWallDraw && (
        <Button
          data-game-action="dead-wall"
          variant="secondary"
          size="sm"
          onClick={onDeadWallDraw}
          disabled={!canUseDeadWallWrit}
          aria-label={t('gameplay.deadWallDraw', 'DEAD WALL DRAW')}
          title={t('gameplay.deadWallDraw', 'DEAD WALL DRAW')}
          className="!min-w-[44px] !w-11 shrink-0 !px-1 sm:!w-auto sm:!min-w-[92px] sm:!px-3"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="mx-auto h-5 w-5 sm:hidden"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 5h6v14H4zM14 4h6v6h-6zM17 13v7m-3-3 3 3 3-3" />
          </svg>
          <span className="hidden whitespace-nowrap sm:inline">
            {t('gameplay.deadDraw', 'DEAD DRAW')}
          </span>
        </Button>
      )}

      {/* Contextual play button */}
      <Button
        data-game-action="play"
        variant="primary"
        size="sm"
        onClick={onPlayHand}
        disabled={!canPlay}
        aria-label={playRestriction ?? playDescription}
        title={playRestriction ?? playDescription}
        className={`inline-flex !min-w-0 flex-1 items-center justify-center !px-1 text-[11px] sm:!min-w-[82px] sm:max-w-[220px] sm:!px-4 sm:text-sm ${willClear && canCommitSelection ? 'shadow-[0_0_22px_rgba(74,222,128,0.45)]' : ''}`}
      >
        <span className="flex min-w-0 flex-col items-center text-center leading-snug [overflow-wrap:anywhere]">
          {playRestriction ? (
            <span className="text-center leading-snug">{playRestriction}</span>
          ) : (
            <span className="max-w-full">{playLabel}</span>
          )}
          {willClear && canCommitSelection && (
            <span className="mt-1 max-w-full text-[9px] font-black uppercase tracking-wide text-emerald-100">
              {t('gameplay.winsRound', 'Wins round')}
            </span>
          )}
        </span>
        {projectedScore !== undefined && (
          <span
            data-game-action-score
            className="ml-1.5 hidden min-w-0 text-xs opacity-75 [overflow-wrap:anywhere] sm:inline"
          >
            +{projectedScore.toLocaleString()}
          </span>
        )}
      </Button>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ActionBar
