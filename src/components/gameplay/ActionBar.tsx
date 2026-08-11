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
  currentRound,
  onSkip,
  onRedraw,
  onPlayHand,
  projectedScore,
  willClear = false,
  canUseDeadWallWrit = false,
  onDeadWallDraw,
  t: _t,
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
    handsRemaining > 0 && (canStageCompleteHand || canCommitSelection)
  const canRedraw =
    redrawsRemaining > 0 && selectedTileCount > 0 && selectedTileCount <= 3
  const canSkip = currentRound !== 3 // Can't skip boss rounds
  const mandateDelta =
    requiredPlaySize === undefined ? 0 : requiredPlaySize - mandateCount
  const playLabel = isStageAction
    ? requiredPlaySize !== undefined && !meetsMandate
      ? `SELECT ${requiredPlaySize}`
      : isCompleteHandSelection
        ? 'STAGE HAND'
        : `SELECT ${MIN_TACTICAL_PLAY_TILES}–${MAX_TACTICAL_PLAY_TILES}`
    : mandateDelta > 0
      ? `SELECT ${mandateDelta} MORE`
      : mandateDelta < 0
        ? `RETURN ${Math.abs(mandateDelta)}`
        : selectedTileCount === 1
          ? 'SELECT 1 MORE'
          : isCompleteSelection
            ? 'CONFIRM HAND'
            : selectedTileCount > MAX_TACTICAL_PLAY_TILES
              ? 'NOT COMPLETE'
              : `PLAY ${selectedTileCount}`
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
  const compactPlayLabel = isStageAction
    ? requiredPlaySize !== undefined && !meetsMandate
      ? `${requiredPlaySize} TILES`
      : isCompleteHandSelection
        ? 'STAGE'
        : `${MIN_TACTICAL_PLAY_TILES}–${MAX_TACTICAL_PLAY_TILES} TILES`
    : isCompleteSelection
      ? 'CONFIRM'
      : mandateDelta !== 0 || selectedTileCount > MAX_TACTICAL_PLAY_TILES
        ? 'ADJUST'
        : selectedTileCount === 1
          ? '+1 TILE'
          : `PLAY ${selectedTileCount}`

  return (
    <div
      data-frame-corner-row="bottom"
      className="gameplay-frame-corner-row z-20 flex flex-shrink-0 items-center justify-center gap-1.5 rounded-sm border-t border-white/5 bg-[var(--color-dark-forest)] px-2 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.2)] safe-area-bottom sm:gap-3 sm:px-4"
    >
      {/* Resource indicators */}
      <div className="hidden items-center gap-3 text-sm md:flex">
        {/* Wall remaining */}
        <div
          className="flex items-center gap-1 text-[var(--color-beige-white)]"
          title="Tiles in wall"
        >
          <span className="text-gray-400">📦</span>
          <span>{wallRemaining}</span>
        </div>

        {/* Hands remaining */}
        <div
          className="flex items-center gap-1 text-[var(--color-beige-white)]"
          title="Hands remaining"
        >
          <span className="text-blue-400">✋</span>
          <span>{handsRemaining}</span>
        </div>

        {/* Discards remaining */}
        <div
          className="flex items-center gap-1 text-[var(--color-beige-white)]"
          title="Discards remaining"
        >
          <span className="text-red-400">🗑️</span>
          <span>{discardsRemaining}</span>
        </div>

        <div
          className="flex items-center gap-1 text-[var(--color-beige-white)]"
          title="Redraws remaining"
        >
          <span className="text-purple-300">↻</span>
          <span>{redrawsRemaining}</span>
        </div>
      </div>

      {/* Skip button */}
      <Button
        data-game-action="skip"
        variant="secondary"
        size="sm"
        onClick={onSkip}
        disabled={!canSkip}
        className="min-w-[52px] px-2 sm:min-w-[80px] sm:px-4"
      >
        SKIP
      </Button>

      <Button
        data-game-action="redraw"
        variant="secondary"
        size="sm"
        onClick={onRedraw}
        disabled={!canRedraw}
        aria-label="Redraw selected tiles"
        title="Return up to 3 selected tiles and draw replacements"
        className="!min-w-[58px] !px-1 text-[10px] sm:!min-w-[80px] sm:!px-4 sm:text-sm"
      >
        <span className="sm:hidden">DRAW</span>
        <span className="hidden sm:inline">REDRAW</span>
      </Button>

      {onDeadWallDraw && (
        <Button
          data-game-action="dead-wall"
          variant="secondary"
          size="sm"
          onClick={onDeadWallDraw}
          disabled={!canUseDeadWallWrit}
          aria-label="DEAD WALL DRAW"
          className="min-w-[52px] px-2 sm:min-w-[92px] sm:px-3"
        >
          <span className="sm:hidden">WALL</span>
          <span className="hidden sm:inline">DEAD DRAW</span>
        </Button>
      )}

      {/* Contextual play button */}
      <Button
        data-game-action="play"
        variant="primary"
        size="sm"
        onClick={onPlayHand}
        disabled={!canPlay}
        aria-label={playDescription}
        title={playDescription}
        className={`inline-flex !min-w-0 flex-1 items-center justify-center !px-1 text-[11px] sm:!min-w-[82px] sm:max-w-[220px] sm:!px-4 sm:text-sm ${willClear && canCommitSelection ? 'shadow-[0_0_22px_rgba(74,222,128,0.45)]' : ''}`}
      >
        <span className="flex flex-col items-center leading-none">
          <span className="whitespace-nowrap sm:hidden">{compactPlayLabel}</span>
          <span className="hidden whitespace-nowrap sm:inline">{playLabel}</span>
          {willClear && canCommitSelection && (
            <span className="mt-1 whitespace-nowrap text-[9px] font-black uppercase tracking-wide text-emerald-100">
              Wins round
            </span>
          )}
        </span>
        {projectedScore !== undefined && (
          <span
            data-game-action-score
            className="ml-1.5 hidden text-xs opacity-75 sm:inline"
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
