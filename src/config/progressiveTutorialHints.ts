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
      title: t('gameplay.firstMoveTitle', 'Your first move'),
      content:
        beginnerPattern === 'redraw'
          ? t(
              'gameplay.firstMoveContentRedraw',
              'Select the glowing isolated tiles and Redraw to find a group. Learn the tiles opens the visual guide.'
            )
          : t(
              'gameplay.firstMoveContentPattern',
              'Glowing tiles: {{pattern}}. Select them, check the points, then Play. Learn the tiles opens the visual guide.',
              { pattern: patternName ?? t('gameplay.pattern', 'shape') }
            ),
      priority: 0,
      targetSelector: '[data-tutorial="hand"]',
      arrowDirection: 'bottom',
    },

    // === FIRST DISCARD HINTS ===
    {
      id: 'discard-intro',
      trigger: 'firstDiscard',
      targetSelector: '[data-tutorial="hand"]',
      arrowDirection: 'bottom', // Changed from 'top' - tooltip above PlaySurface
      title: t('progressiveHints.discard.title', 'Improve your hand'),
      content: t(
        'progressiveHints.discard.content',
        'Discard replaces one tile and spends a discard, not a play. Redraw swaps up to three selected tiles for one redraw. A lower shanten number means you are closer to a complete hand.'
      ),
      priority: 1,
    },

    // === FIRST HAND PLAYED HINTS ===
    {
      id: 'yaku-intro',
      trigger: 'firstHandPlayed',
      targetSelector: '[data-tutorial="yaku-display"]',
      arrowDirection: 'bottom', // Changed from 'top' - yaku display is in middle of screen
      title: t('progressiveHints.yaku.title', 'Patterns and multipliers'),
      content: t(
        'progressiveHints.yaku.content',
        'You can score with a small group; a complete hand can unlock Yaku multipliers. Check the score preview before deciding what to play and what to keep.'
      ),
      priority: 0,
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
        'These tiles activate when drawn. Flowers last for the run; Seasons affect the current round. Inspect the Flowers / Seasons panel to see your active effects.'
      ),
      priority: 1,
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
        'The cash-out shows where your Gold came from. Buy items that work together, or save for interest. Ordinary purchases are immediate; Charters ask for confirmation.'
      ),
      priority: 1,
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
        'Decrees stay with you and can change scoring, money, tiles, or which hands are allowed. Inspect their descriptions before building around them or selling them.'
      ),
      priority: 1,
    },

    // === BOSS ROUND HINTS ===
    {
      id: 'boss-mandate',
      trigger: 'bossRound',
      targetSelector: '[data-tutorial="act-round"]',
      arrowDirection: 'bottom',
      title: t('progressiveHints.boss.title', 'Boss round'),
      content: t(
        'progressiveHints.boss.content',
        'A boss adds a special rule called a mandate. Read it before choosing your tiles; your usual plan may need to change.'
      ),
      priority: 1,
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
