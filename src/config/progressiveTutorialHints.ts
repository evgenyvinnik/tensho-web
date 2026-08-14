/**
 * Progressive Tutorial Hints Configuration
 *
 * Defines hints that are shown progressively during gameplay
 * as the player encounters each game mechanic.
 */

import { TileSuit } from '../core/Tile'
import { TFunction } from 'i18next'
import type { BeginnerPatternKind } from '../gameplay/beginnerCoach'

/**
 * Trigger types for progressive hints
 */
export type TutorialTrigger =
  | 'gameStart' // Show immediately on first game
  | 'firstDraw' // Before player's first draw
  | 'firstDiscard' // After first draw, before discard
  | 'firstHandPlayed' // After playing first hand
  | 'roundComplete' // After completing a round
  | 'flowerDrawn' // When player draws a flower/season
  | 'shopEntered' // First time entering shop
  | 'decreeAcquired' // When player gets first decree
  | 'bossRound' // When entering first boss round

/**
 * Tile example for visual hints
 */
export interface TileExample {
  suit: TileSuit
  rank: number
  label?: string
}

/**
 * Arrow direction for positioning
 */
export type ArrowDirection = 'top' | 'bottom' | 'left' | 'right'

/**
 * Progressive hint definition
 */
export interface ProgressiveHint {
  id: string
  trigger: TutorialTrigger
  targetSelector?: string
  position?: { x: number; y: number }
  arrowDirection: ArrowDirection
  title: string
  content: string
  exampleTiles?: TileExample[][]
  priority: number // Lower = shown first
  autoDismissMs?: number // Auto-dismiss after this time (default: 8000)
}

/**
 * Get all progressive tutorial hints
 */
export function getProgressiveHints(
  t: TFunction,
  beginnerPattern?: BeginnerPatternKind
): ProgressiveHint[] {
  const patternName =
    beginnerPattern && beginnerPattern !== 'redraw'
      ? t(`melds.${beginnerPattern}`, beginnerPattern)
      : null

  return [
    // === GAME START HINTS (shown immediately on first run) ===
    {
      id: 'guided-first-move-v2',
      trigger: 'gameStart',
      title: t('gameplay.firstMoveTitle', 'Your first move is already here'),
      content:
        beginnerPattern === 'redraw'
          ? t(
              'gameplay.firstMoveContentRedraw',
              'You do not need to know Mahjong yet. The glowing tiles are isolated; select them and use Redraw to look for a Pair, Sequence, or Triplet. Open Learn patterns whenever you want the visual primer.'
            )
          : t(
              'gameplay.firstMoveContentPattern',
              'You do not need to know Mahjong yet. The glowing tiles already make a {{pattern}}. Tap them, read the exact forecast, then Play. Open Learn patterns whenever you want the visual primer.',
              { pattern: patternName ?? t('gameplay.pattern', 'shape') }
            ),
      priority: 1,
      targetSelector: '[data-tutorial="hand"]',
      arrowDirection: 'bottom',
      autoDismissMs: 12_000,
    },

    // === FIRST DISCARD HINTS ===
    {
      id: 'discard-intro',
      trigger: 'firstDiscard',
      targetSelector: '[data-tutorial="hand"]',
      arrowDirection: 'bottom', // Changed from 'top' - tooltip above PlaySurface
      title: t('progressiveHints.discard.title', 'Hand Improved'),
      content: t(
        'progressiveHints.discard.content',
        'Discards replace one unwanted tile without spending a hand. Watch the shanten badge: lower is closer to a complete pattern. Redraw replaces up to three selected tiles.'
      ),
      priority: 1,
      autoDismissMs: 6000,
    },

    // === FIRST HAND PLAYED HINTS ===
    {
      id: 'yaku-intro',
      trigger: 'firstHandPlayed',
      targetSelector: '[data-tutorial="yaku-display"]',
      arrowDirection: 'bottom', // Changed from 'top' - yaku display is in middle of screen
      title: t('progressiveHints.yaku.title', 'Yaku = Multipliers'),
      content: t(
        'progressiveHints.yaku.content',
        'Partial structures always score, while a complete pattern unlocks Yaku multipliers. Use the forecast to decide between points now and improving the hand you keep.'
      ),
      priority: 1,
      autoDismissMs: 7000,
    },

    // === FLOWER DRAWN HINTS ===
    {
      id: 'flora-intro',
      trigger: 'flowerDrawn',
      targetSelector: '[data-tutorial="flora"]',
      arrowDirection: 'bottom', // Changed from 'top' - flora is near top of screen
      title: t('progressiveHints.flora.title', 'Flowers & Seasons'),
      content: t(
        'progressiveHints.flora.content',
        'Flowers give run-wide bonuses. Seasons give round effects. Auto-triggered on draw!'
      ),
      priority: 1,
      autoDismissMs: 6000,
    },

    // === SHOP ENTERED HINTS ===
    {
      id: 'shop-intro',
      trigger: 'shopEntered',
      position: { x: 50, y: 30 },
      arrowDirection: 'top',
      title: t('progressiveHints.shop.title', 'The Tea House'),
      content: t(
        'progressiveHints.shop.content',
        'Your cash-out explains every Gold gained. Buy a synergy now or keep savings for interest; ordinary item purchases are immediate, while Charters still ask for confirmation.'
      ),
      priority: 1,
      autoDismissMs: 7000,
    },

    // === DECREE ACQUIRED HINTS ===
    {
      id: 'decrees-intro',
      trigger: 'decreeAcquired',
      targetSelector: '[data-tutorial="decrees"]',
      arrowDirection: 'bottom', // Changed from 'top' - decrees bar is near top of screen
      title: t('progressiveHints.decrees.title', 'Decrees'),
      content: t(
        'progressiveHints.decrees.content',
        'Decrees are persistent rule modifiers. They can change legal hands, scoring, economy, and tile behavior; inspect or sell them from this row.'
      ),
      priority: 1,
      autoDismissMs: 7000,
    },

    // === BOSS ROUND HINTS ===
    {
      id: 'boss-mandate',
      trigger: 'bossRound',
      targetSelector: '[data-tutorial="act-round"]',
      arrowDirection: 'bottom',
      title: t('progressiveHints.boss.title', 'Boss Round!'),
      content: t(
        'progressiveHints.boss.content',
        'Boss rounds have mandates - special restrictions! Adapt your strategy.'
      ),
      priority: 1,
      autoDismissMs: 6000,
    },
  ]
}

/**
 * Get hints for a specific trigger
 */
export function getHintsForTrigger(
  hints: ProgressiveHint[],
  trigger: TutorialTrigger
): ProgressiveHint[] {
  return hints
    .filter((h) => h.trigger === trigger)
    .sort((a, b) => a.priority - b.priority)
}

/**
 * LocalStorage key for tracking shown hints
 */
export const PROGRESSIVE_HINTS_STORAGE_KEY = 'tensho_progressive_hints_shown'

/**
 * LocalStorage key for disabling all hints
 */
export const HINTS_DISABLED_STORAGE_KEY = 'tensho_hints_disabled'
