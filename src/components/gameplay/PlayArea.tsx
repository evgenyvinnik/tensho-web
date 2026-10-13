/**
 * PlayArea Component for Tensho Mahjong Roguelike
 *
 * Central play area showing score preview with yaku detection and yaku reveals.
 *
 * @module components/gameplay/PlayArea
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GlowEffect } from '../effects/GlowEffect'
import { YakuDefinition } from '../../rules/YakuDetector'
import { CoachPanel } from './CoachPanel'
import type { CoachAdvice } from '../../gameplay/beginnerCoach'
import { scoreMultiplier, scoreNumber } from '../../utils/scoreNumber'
import type { ScoredStructure } from '../../rules/ScoringEngine'
import { scoreRounding } from '../../rules/ScoreEquation'
import { ExactScoreDetails } from './ExactScoreDetails'
import { playAreaHasContent } from '../../gameplay/playAreaContent'
import type { CompleteHandInterpretation } from '../../game/GameOrchestrator'
import type { Tile } from '../../core/Tile'
import { YakuArtwork } from '../ui/YakuArtwork'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Score preview data with detected yaku
 */
export interface ScorePreviewData {
  /** The settled equation's subtotal, as the last-play panel shows it. */
  points: number
  /** The true multiplier, never total ÷ points. */
  mult: number
  /** Post-multiplication effects; rounding down is shown separately. */
  adjustment?: number
  total: number
  yaku?: YakuDefinition[]
  /** Supplied by the scored parse; absence must not imply that tiles are loose. */
  structure?: ScoredStructure
  structurePoints?: number
  interpretation?: CompleteHandInterpretation | null
  skippedSequences?: Tile[][]
  flowerSequences?: { overlapping: Tile[][]; anchored: Tile[][] }
}

/**
 * Props for PlayArea
 */
export interface PlayAreaProps {
  /** Number of currently selected tiles */
  selectedTileCount: number
  /** Number of staged tiles */
  stagedTileCount: number
  /** Total tiles in hand */
  handTileCount?: number
  /** Score preview with detected yaku */
  scorePreview: ScorePreviewData | null
  /** Whether selected face-down tiles conceal all preview information. */
  scorePreviewHidden?: boolean
  /** Human-readable description of the exact play being forecast. */
  previewLabel?: string
  /** Points still needed to clear the active round. */
  remainingToTarget?: number
  /** Hands available to cover the remaining target. */
  handsRemaining?: number
  /**
   * Two priced alternatives for this turn, shown while nothing is selected.
   * The idle play area is where the player is deciding, and putting the coach
   * here costs no vertical space on a screen that has none to spare.
   */
  coachAdvice?: CoachAdvice | null
  /** Visible tile identities used to illustrate the coach's exact choices. */
  coachVisibleTiles?: Tile[]
  /** Apply a coach option's selection to the hand. */
  onCoachChoose?: (tileIds: string[]) => void
  /** Hide the coach for the rest of the session. */
  onCoachDismiss?: () => void
  /** Primary color of the selected table style */
  tableThemeColor?: string
  /** Secondary color of the selected table style */
  tableAccentColor?: string
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get tier-based color for yaku badge
 */
function getYakuTierColor(tier: number): string {
  switch (tier) {
    case 1:
      return 'from-green-600 to-green-800 border-green-400'
    case 2:
      return 'from-blue-600 to-blue-800 border-blue-400'
    case 3:
      return 'from-purple-600 to-purple-800 border-purple-400'
    case 4:
      return 'from-amber-500 to-orange-700 border-amber-400'
    default:
      return 'from-gray-600 to-gray-800 border-gray-400'
  }
}

/**
 * Get tier label for yaku
 */
function getYakuTierLabel(tier: number): string {
  switch (tier) {
    case 1:
      return 'Common'
    case 2:
      return 'Uncommon'
    case 3:
      return 'Rare'
    case 4:
      return 'Legendary'
    default:
      return 'Basic'
  }
}

// =============================================================================
// YAKU BADGE COMPONENT
// =============================================================================

interface YakuBadgeProps {
  yaku: YakuDefinition
  isSelected: boolean
  onToggle: () => void
}

function YakuBadge({ yaku, isSelected, onToggle }: YakuBadgeProps) {
  const { t } = useTranslation()
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`
          whitespace-nowrap rounded-lg px-2 py-1
          bg-gradient-to-br ${getYakuTierColor(yaku.tier)}
          border shadow-lg
          transform hover:scale-105 transition-transform
          cursor-pointer
          ${isSelected ? 'ring-2 ring-white ring-opacity-70' : ''}
        `}
      >
        <YakuArtwork id={yaku.id} className="mr-1 h-7 w-7" />
        <span className="text-xs font-bold text-white drop-shadow-sm">
          {yaku.name}
        </span>
        <span className="ml-1.5 text-[10px] text-white/70">
          ×{yaku.multiplier}
        </span>
        {yaku.ascended && (
          <span
            data-yaku-ascended={yaku.id}
            className="block text-[10px] text-amber-100"
          >
            {t('gameplay.yakumanAscended')}
          </span>
        )}
      </button>

      {/* Tooltip popup */}
      {isSelected && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-64">
          <div className="bg-[var(--color-dark-forest)] border border-[var(--color-metallic-gold)] rounded-lg shadow-xl p-3 text-left">
            {/* Arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-[var(--color-metallic-gold)]" />

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--color-golden-yellow)] font-bold">
                {yaku.name}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded bg-gradient-to-r ${getYakuTierColor(yaku.tier)}`}
              >
                {getYakuTierLabel(yaku.tier)}
              </span>
            </div>

            {/* Japanese name */}
            <p className="text-[var(--color-beige-white)] text-xs opacity-60 mb-2">
              {yaku.japaneseName}
            </p>

            {/* Description */}
            <p className="text-[var(--color-beige-white)] text-sm leading-relaxed">
              {yaku.description}
            </p>

            {/* Multiplier */}
            <div className="mt-2 pt-2 border-t border-[var(--color-metallic-gold)] border-opacity-30">
              <span className="text-red-400 font-bold">×{yaku.multiplier}</span>
              <span className="text-[var(--color-beige-white)] text-xs opacity-60 ml-2">
                multiplier
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * One-line forecast strip for the score bar.
 *
 * It answers "what would this play score?" in the same place the last play's
 * equation appears, so points, multiplier and the coach's two suggestions sit
 * on one line instead of stacking panels over the table.
 */
export function PlayArea({
  selectedTileCount,
  stagedTileCount,
  scorePreview,
  scorePreviewHidden = false,
  previewLabel = 'Play forecast',
  remainingToTarget = 0,
  handsRemaining = 1,
  coachAdvice = null,
  coachVisibleTiles,
  onCoachChoose,
  onCoachDismiss,
  tableThemeColor = '#C8B273',
  tableAccentColor = '#2D5F4A',
}: PlayAreaProps) {
  const { t, i18n } = useTranslation()
  const [selectedYakuId, setSelectedYakuId] = useState<string | null>(null)
  const paceId = useId()
  const activeTileCount = stagedTileCount || selectedTileCount
  const requiredPerHand = Math.ceil(
    remainingToTarget / Math.max(1, handsRemaining)
  )
  const structure = scorePreview?.structure
  const structureHint = !structure
    ? t('gameplay.forecast.groupToScore')
    : structure.kind === 'complete'
      ? t('gameplay.forecast.complete')
      : structure.looseTiles === 0
        ? t('gameplay.forecast.grouped', {
            points: scoreNumber(
              scorePreview?.structurePoints ?? 0,
              i18n.language
            ).display,
          })
        : structure.groupedTiles === 0
          ? t('gameplay.forecast.looseTiles')
          : t('gameplay.forecast.mixed', {
              points: scoreNumber(
                scorePreview?.structurePoints ?? 0,
                i18n.language
              ).display,
              count: structure.looseTiles,
            })
  const adjustment = scorePreview?.adjustment ?? 0
  const rounding = scorePreview
    ? scoreRounding(scorePreview.points, scorePreview.mult)
    : null
  const roundingNote = rounding?.roundedDown
    ? t('scoring.roundedDown', {
        product: scoreNumber(rounding.product, i18n.language).exact,
        rounded: scoreNumber(rounding.rounded, i18n.language).exact,
      })
    : null
  const showing = playAreaHasContent({
    selectedTileCount,
    stagedTileCount,
    scorePreview,
    scorePreviewHidden,
    coachAdvice,
  })
  const clears = Boolean(
    scorePreview &&
    scorePreview.total >= remainingToTarget &&
    remainingToTarget > 0
  )
  const pace = scorePreview
    ? clears
      ? t('gameplay.forecast.clears', 'Clears the round')
      : t(
          'gameplay.forecast.share',
          '{{percent}}% of what remains · {{pace}}',
          {
            percent: Math.min(
              999,
              Math.round(
                (scorePreview.total / Math.max(1, remainingToTarget)) * 100
              )
            ),
            pace:
              scorePreview.total >= requiredPerHand
                ? t('gameplay.forecast.onPace', 'on pace')
                : t('gameplay.forecast.needPerHand', 'need {{points}}/hand', {
                    points: scoreNumber(requiredPerHand, i18n.language).display,
                  }),
          }
        )
    : ''

  return (
    <div
      data-tutorial="yaku-display"
      hidden={!showing}
      className="game-play-area relative flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border px-2 py-1"
      style={{
        borderColor: `${tableThemeColor}66`,
        background: `linear-gradient(105deg, ${tableAccentColor}24, rgba(12, 38, 29, 0.6) 46%, ${tableThemeColor}14)`,
      }}
      onClick={() => setSelectedYakuId(null)} // Close tooltip when clicking outside
    >
      {scorePreviewHidden ? (
        <p
          className="flex min-w-0 items-center gap-2 text-sm"
          aria-label={t('gameplay.previewConcealed', 'Score preview concealed')}
          title={t(
            'gameplay.hiddenHandDesc',
            'Face-down tiles conceal patterns and score until played.'
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-300/70">
            {t('gameplay.hiddenHand', 'Hidden hand')}
          </span>
          <span className="text-lg font-black text-[var(--color-golden-yellow)]">
            ???
          </span>
        </p>
      ) : scorePreview ? (
        <div
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1"
          onClick={(event) => event.stopPropagation()}
        >
          {/* The name and Yaku take a full row on narrow screens, so badges
              wrap sideways instead of being squeezed into a column. */}
          <div className="flex min-w-0 flex-[1_1_12rem] flex-col justify-center">
            <p
              data-testid="forecast-heading"
              className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-metallic-gold)]"
            >
              {previewLabel}
            </p>
            {scorePreview.yaku && scorePreview.yaku.length > 0 ? (
              <div className="flex min-w-0 flex-wrap items-center gap-1">
                {scorePreview.yaku.map((yaku) => (
                  <YakuBadge
                    key={yaku.id}
                    yaku={yaku}
                    isSelected={selectedYakuId === yaku.id}
                    onToggle={() =>
                      setSelectedYakuId((prev) =>
                        prev === yaku.id ? null : yaku.id
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <span
                data-testid="forecast-structure-hint"
                title={structureHint}
                className="game-forecast-explainer truncate text-[11px] text-[var(--color-beige-white)]/60"
              >
                {structureHint}
              </span>
            )}
          </div>

          {/* Very large late-run numbers wrap inside their slot rather than
              push the strip wider than the screen. */}
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {/* The same equation the last-play panel settles: true
                multiplier, after-score effects, then any rounding down. */}
            <div className="flex min-w-0 flex-col items-end">
              <div className="flex min-w-0 flex-wrap items-baseline justify-end gap-x-1 text-sm tabular-nums">
                <strong
                  data-score-preview-points
                  className="min-w-0 text-blue-300 [overflow-wrap:anywhere]"
                >
                  {scoreNumber(scorePreview.points, i18n.language).display}
                </strong>
                <span className="text-[var(--color-golden-yellow)]/60">×</span>
                <strong
                  data-score-preview-mult
                  title={
                    scoreMultiplier(scorePreview.mult, i18n.language).exact
                  }
                  aria-label={
                    scoreMultiplier(scorePreview.mult, i18n.language).exact
                  }
                  className="min-w-0 text-red-300 [overflow-wrap:anywhere]"
                >
                  {scoreMultiplier(scorePreview.mult, i18n.language).display}
                </strong>
                {adjustment !== 0 && (
                  <span
                    data-score-preview-adjustment
                    title={t('scoring.adjustments')}
                    className="min-w-0 text-[var(--color-beige-white)] [overflow-wrap:anywhere]"
                  >
                    {adjustment < 0 ? '−' : '+'}
                    {scoreNumber(Math.abs(adjustment), i18n.language).display}
                  </span>
                )}
                <span
                  data-score-preview-operator
                  title={roundingNote ?? undefined}
                  className="text-[var(--color-golden-yellow)]/60"
                >
                  {roundingNote ? '→' : '='}
                </span>
              </div>
              {roundingNote && (
                <span
                  data-score-preview-rounding
                  className="text-[10px] leading-tight text-[var(--color-beige-white)]/65"
                >
                  {roundingNote}
                </span>
              )}
            </div>

            <GlowEffect
              className="min-w-0"
              variant="gold"
              intensity={0.6}
              pulsing={Boolean(
                scorePreview.yaku && scorePreview.yaku.length > 0
              )}
            >
              <p
                data-testid="score-preview-total"
                title={`${scoreNumber(scorePreview.total, i18n.language).exact} · ${pace}`}
                aria-label={
                  scoreNumber(scorePreview.total, i18n.language).exact
                }
                aria-describedby={paceId}
                className={`text-xl font-black tabular-nums [overflow-wrap:anywhere] ${
                  clears
                    ? 'text-emerald-300'
                    : 'text-[var(--color-golden-yellow)]'
                }`}
              >
                +{scoreNumber(scorePreview.total, i18n.language).display}
              </p>
            </GlowEffect>
            {/* Pace describes the total for assistive tech and in its tooltip,
              without a second line in the score bar. */}
            <p id={paceId} hidden className="game-forecast-pace">
              {pace}
            </p>

            <ExactScoreDetails
              compact
              entries={[
                { label: t('scoring.subtotal'), value: scorePreview.points },
                {
                  label: t('scoring.totalMultiplier'),
                  value: scorePreview.mult,
                },
                ...(rounding?.roundedDown
                  ? [
                      {
                        label: t('scoring.beforeRounding'),
                        value: rounding.product,
                      },
                    ]
                  : []),
                ...(adjustment !== 0
                  ? [{ label: t('scoring.adjustments'), value: adjustment }]
                  : []),
                {
                  label: t('gameplay.forecast.label'),
                  value: scorePreview.total,
                },
              ]}
            />
          </div>
        </div>
      ) : coachAdvice && activeTileCount === 0 && onCoachChoose ? (
        /* Nothing selected: the two moves worth weighing, on the same line. */
        <div
          className="w-full min-w-0"
          onClick={(event) => event.stopPropagation()}
        >
          <CoachPanel
            advice={coachAdvice}
            visibleTiles={coachVisibleTiles}
            onChoose={onCoachChoose}
            onDismiss={onCoachDismiss}
          />
        </div>
      ) : (
        <p className="min-w-0 truncate text-sm text-[var(--color-beige-white)]/70">
          {activeTileCount === 1
            ? t(
                'gameplay.forecast.selectOneMore',
                'Select one more tile to play this group'
              )
            : activeTileCount > 5
              ? t(
                  'gameplay.forecast.returnTiles',
                  'Return tiles until 5 remain, or finish a complete hand'
                )
              : previewLabel}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PlayArea
