/**
 * Progressive Tutorial Hints Configuration
 *
 * Defines hints that are shown progressively during gameplay
 * as the player encounters each game mechanic.
 */

import { TileSuit } from '../core/Tile'
import { TFunction } from 'i18next'

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
  t: TFunction
): ProgressiveHint[] {
  return [
    // === GAME START HINTS (shown immediately on first run) ===
    {
      id: 'welcome',
      trigger: 'gameStart',
      title: t('progressiveHints.welcome.title', 'Welcome to Tensho!'),
      content: t(
        'progressiveHints.welcome.content',
        'Reach the highlighted target before your hands run out. Each Act has three rounds; clear Act 8 to secure a win. Tips appear only when a new system matters.'
      ),
      priority: 1,
      targetSelector: '[data-tutorial="score-target"]',
      arrowDirection: 'bottom',
      autoDismissMs: 7500,
    },

    // === FIRST DRAW HINTS ===
    {
      id: 'hand-intro',
      trigger: 'firstDraw',
      targetSelector: '[data-tutorial="hand"]',
      arrowDirection: 'bottom', // Changed from 'top' - tooltip above PlaySurface, arrow pointing down
      title: t('progressiveHints.hand.title', 'Your Hand'),
      content: t(
        'progressiveHints.hand.content',
        'Tap tiles to stage them, then Play Hand. A complete hand is four groups plus a pair; the wall refills your hand automatically after each cycle.'
      ),
      priority: 1,
      autoDismissMs: 7000,
    },

    // === FIRST DISCARD HINTS ===
    {
      id: 'discard-intro',
      trigger: 'firstDiscard',
      targetSelector: '[data-tutorial="hand"]',
      arrowDirection: 'bottom', // Changed from 'top' - tooltip above PlaySurface
      title: t('progressiveHints.discard.title', 'Discard a Tile'),
      content: t(
        'progressiveHints.discard.content',
        'Drag an unwanted tile into the orange discard well. Use Redraw when you want to replace up to three selected tiles at once.'
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
        'Yaku are scoring patterns that multiply your base points. The preview updates as you stage tiles, so you can compare a hand before committing.'
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
        'Spend round rewards on Decrees, consumables, tiles, and packs—or save Gold for interest. Reroll only when the new options are worth its rising cost.'
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
