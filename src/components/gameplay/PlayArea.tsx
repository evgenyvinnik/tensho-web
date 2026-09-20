/**
 * PlayArea Component for Tensho Mahjong Roguelike
 *
 * Central play area showing score preview with yaku detection and yaku reveals.
 *
 * @module components/gameplay/PlayArea
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { YakuReveal } from '../effects/YakuReveal'
import { GlowEffect } from '../effects/GlowEffect'
import { YakuRevealState } from './gameplayTypes'
import { YakuDefinition } from '../../rules/YakuDetector'
import { CoachPanel } from './CoachPanel'
import type { CoachAdvice } from '../../gameplay/beginnerCoach'
import { scoreMultiplier, scoreNumber } from '../../utils/scoreNumber'
import type { ScoredStructure } from '../../rules/ScoringEngine'
import { ExactScoreDetails } from './ExactScoreDetails'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Score preview data with detected yaku
 */
export interface ScorePreviewData {
  points: number
  mult: number
  total: number
  yaku?: YakuDefinition[]
  /** Supplied by the scored parse; absence must not imply that tiles are loose. */
  structure?: ScoredStructure
  structurePoints?: number
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
  handTileCount: number
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
  /** Active yaku reveal animations */
  yakuReveals: YakuRevealState[]
  /** Handler for yaku reveal completion */
  onYakuComplete: (id: string) => void
  /**
   * Two priced alternatives for this turn, shown while nothing is selected.
   * The idle play area is where the player is deciding, and putting the coach
   * here costs no vertical space on a screen that has none to spare.
   */
  coachAdvice?: CoachAdvice | null
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
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`
          rounded-lg px-2 py-1
          bg-gradient-to-br ${getYakuTierColor(yaku.tier)}
          border shadow-lg
          transform hover:scale-105 transition-transform
          cursor-pointer
          ${isSelected ? 'ring-2 ring-white ring-opacity-70' : ''}
        `}
      >
        <span className="text-xs font-bold text-white drop-shadow-sm">
          {yaku.name}
        </span>
        <span className="ml-1.5 text-[10px] text-white/70">
          ×{yaku.multiplier}
        </span>
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
 * Central play area for gameplay.
 *
 * Features:
 * - Beautiful score preview panel with detected yaku
 * - Shows selected/staged tile count
 * - Displays yaku reveal animations when hands are scored
 * - Dashed border to indicate the play area
 */
export function PlayArea({
  selectedTileCount,
  stagedTileCount,
  handTileCount,
  scorePreview,
  scorePreviewHidden = false,
  previewLabel = 'Play forecast',
  remainingToTarget = 0,
  handsRemaining = 1,
  yakuReveals,
  onYakuComplete,
  coachAdvice = null,
  onCoachChoose,
  onCoachDismiss,
  tableThemeColor = '#C8B273',
  tableAccentColor = '#2D5F4A',
}: PlayAreaProps) {
  const { t, i18n } = useTranslation()
  const [selectedYakuId, setSelectedYakuId] = useState<string | null>(null)
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

  const handleYakuToggle = (yakuId: string) => {
    setSelectedYakuId((prev) => (prev === yakuId ? null : yakuId))
  }

  return (
    <div
      data-tutorial="yaku-display"
      className="game-play-area mx-3 mb-1 flex min-h-[68px] flex-shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--color-metallic-gold)]/45 bg-[var(--color-dark-forest)]/70 px-3 py-2 shadow-inner"
      style={{
        borderColor: `${tableThemeColor}80`,
        background: `linear-gradient(105deg, ${tableAccentColor}24, rgba(12, 38, 29, 0.76) 46%, ${tableThemeColor}18)`,
        boxShadow: `inset 0 0 28px ${tableThemeColor}18`,
      }}
      onClick={() => setSelectedYakuId(null)} // Close tooltip when clicking outside
    >
      {/* Score Preview Panel */}
      {scorePreviewHidden ? (
        <div
          className="text-center"
          aria-label={t('gameplay.previewConcealed', 'Score preview concealed')}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300/70">
            {t('gameplay.hiddenHand', 'Hidden hand')}
          </p>
          <p className="mt-1 text-4xl font-black text-[var(--color-golden-yellow)]">
            ???
          </p>
          <p className="mt-2 text-sm text-[var(--color-beige-white)] opacity-60">
            {t(
              'gameplay.hiddenHandDesc',
              'Face-down tiles conceal patterns and score until played.'
            )}
          </p>
        </div>
      ) : scorePreview ? (
        <div
          className="grid w-full min-w-0 grid-cols-2 items-start gap-x-3 gap-y-2"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="col-span-2 min-w-0 [overflow-wrap:anywhere]">
            <div className="flex flex-wrap items-center gap-1.5">
              <p
                data-testid="forecast-heading"
                className="mr-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-metallic-gold)]"
              >
                {previewLabel}
              </p>
              {scorePreview.yaku && scorePreview.yaku.length > 0 ? (
                scorePreview.yaku.map((yaku) => (
                  <YakuBadge
                    key={yaku.id}
                    yaku={yaku}
                    isSelected={selectedYakuId === yaku.id}
                    onToggle={() => handleYakuToggle(yaku.id)}
                  />
                ))
              ) : (
                <span
                  data-testid="forecast-structure-hint"
                  className="game-forecast-explainer text-xs text-[var(--color-beige-white)]/60"
                >
                  {structureHint}
                </span>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm tabular-nums">
            <strong className="min-w-0 text-blue-300 [overflow-wrap:anywhere]">
              {scoreNumber(scorePreview.points, i18n.language).display}
            </strong>
            <span className="text-[var(--color-golden-yellow)]/60">×</span>
            <strong
              data-score-preview-mult
              title={scoreMultiplier(scorePreview.mult, i18n.language).exact}
              aria-label={
                scoreMultiplier(scorePreview.mult, i18n.language).exact
              }
              className="min-w-0 text-red-300 [overflow-wrap:anywhere]"
            >
              {scoreMultiplier(scorePreview.mult, i18n.language).display}
            </strong>
          </div>

          <div className="min-w-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--color-beige-white)]/45 [overflow-wrap:anywhere]">
              {t('gameplay.forecast.label', 'Forecast')}
            </p>
            <GlowEffect
              className="min-w-0 max-w-full"
              variant="gold"
              intensity={0.6}
              pulsing={Boolean(
                scorePreview.yaku && scorePreview.yaku.length > 0
              )}
            >
              <p
                data-testid="score-preview-total"
                title={scoreNumber(scorePreview.total, i18n.language).exact}
                aria-label={
                  scoreNumber(scorePreview.total, i18n.language).exact
                }
                className="text-2xl font-black tabular-nums text-[var(--color-golden-yellow)] [overflow-wrap:anywhere] sm:text-3xl"
              >
                +{scoreNumber(scorePreview.total, i18n.language).display}
              </p>
            </GlowEffect>
          </div>

          <p
            className={`game-forecast-pace col-span-2 min-w-0 text-xs leading-relaxed [overflow-wrap:anywhere] ${
              scorePreview.total >= remainingToTarget && remainingToTarget > 0
                ? 'font-bold text-emerald-300'
                : 'text-[var(--color-beige-white)]/55'
            }`}
          >
            {scorePreview.total >= remainingToTarget && remainingToTarget > 0
              ? t('gameplay.forecast.clears', 'Clears the round')
              : t(
                  'gameplay.forecast.share',
                  '{{percent}}% of what remains · {{pace}}',
                  {
                    percent: Math.min(
                      999,
                      Math.round(
                        (scorePreview.total / Math.max(1, remainingToTarget)) *
                          100
                      )
                    ),
                    pace:
                      scorePreview.total >= requiredPerHand
                        ? t('gameplay.forecast.onPace', 'on pace')
                        : t(
                            'gameplay.forecast.needPerHand',
                            'need {{points}}/hand',
                            {
                              points: scoreNumber(
                                requiredPerHand,
                                i18n.language
                              ).display,
                            }
                          ),
                  }
                )}
          </p>
          <ExactScoreDetails
            entries={[
              { label: t('scoring.basePoints'), value: scorePreview.points },
              { label: t('scoring.totalMultiplier'), value: scorePreview.mult },
              {
                label: t('gameplay.forecast.label'),
                value: scorePreview.total,
              },
            ]}
          />
        </div>
      ) : coachAdvice && activeTileCount === 0 && onCoachChoose ? (
        /* Nothing selected: show the two moves worth weighing. */
        <div className="w-full" onClick={(event) => event.stopPropagation()}>
          <CoachPanel
            advice={coachAdvice}
            onChoose={onCoachChoose}
            onDismiss={onCoachDismiss}
          />
        </div>
      ) : (
        /* Default state when no tiles */
        <div className="text-center">
          <p className="text-[var(--color-beige-white)] opacity-50 px-4">
            {activeTileCount === 1
              ? t(
                  'gameplay.forecast.selectOneMore',
                  'Select one more tile to play this group'
                )
              : activeTileCount > 5
                ? t(
                    'gameplay.forecast.notCompleteHand',
                    'This selection is not a complete Mahjong hand'
                  )
                : previewLabel}
          </p>
          <p className="text-[var(--color-golden-yellow)] opacity-70 text-sm mt-1">
            {activeTileCount === 0
              ? t(
                  'gameplay.completeToUnlockStage',
                  'Complete all {{count}} tiles to unlock Stage Hand',
                  { count: handTileCount }
                )
              : activeTileCount > 5
                ? t(
                    'gameplay.forecast.returnTiles',
                    'Return tiles until 5 remain, or finish a complete hand'
                  )
                : t(
                    'gameplay.forecast.groupToScore',
                    'Group your tiles to score in full; complete hands unlock Yaku'
                  )}
          </p>
        </div>
      )}

      {/* Yaku Reveal Animations */}
      {yakuReveals.map((yaku) => (
        <YakuReveal
          key={yaku.id}
          japaneseName={yaku.japaneseName}
          multiplier={yaku.multiplier}
          tier={yaku.tier}
          onComplete={() => onYakuComplete(yaku.id)}
        />
      ))}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PlayArea
