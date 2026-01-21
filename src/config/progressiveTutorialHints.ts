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
      position: { x: 50, y: 40 },
      arrowDirection: 'top',
      title: t('progressiveHints.welcome.title', 'Welcome to Tensho!'),
      content: t(
        'progressiveHints.welcome.content',
        "Build mahjong hands to score points. Reach the target before running out of hands. Let's learn as you play!"
      ),
      priority: 1,
      autoDismissMs: 6000,
    },
    {
      id: 'score-target',
      trigger: 'gameStart',
      targetSelector: '[data-tutorial="score-target"]',
      arrowDirection: 'bottom',
      title: t('progressiveHints.target.title', 'Score Target'),
      content: t(
        'progressiveHints.target.content',
        'Reach this score to complete the round. Fail and your run ends!'
      ),
      priority: 2,
      autoDismissMs: 5000,
    },
    {
      id: 'act-round-intro',
      trigger: 'gameStart',
      targetSelector: '[data-tutorial="act-round"]',
      arrowDirection: 'bottom',
      title: t('progressiveHints.actRound.title', 'Acts & Rounds'),
      content: t(
        'progressiveHints.actRound.content',
        'Complete 3 rounds per Act. 8 Acts to win the run!'
      ),
      priority: 3,
      autoDismissMs: 5000,
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
        'Your tiles! Form 4 groups + 1 pair to win. Groups: sequences (1-2-3) or triplets (3-3-3).'
      ),
      priority: 1,
      autoDismissMs: 7000,
    },
    {
      id: 'draw-button',
      trigger: 'firstDraw',
      targetSelector: '[data-tutorial="draw-button"]',
      arrowDirection: 'top', // Changed from 'left' - tooltip above action buttons, arrow pointing up
      title: t('progressiveHints.draw.title', 'Draw Tiles'),
      content: t(
        'progressiveHints.draw.content',
        'Tap Draw to take a tile from the wall. Then discard one you don\'t need.'
      ),
      priority: 2,
      autoDismissMs: 6000,
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
        'Tap a tile to select it, then discard. Think about what patterns you\'re building!'
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
        'Special patterns that multiply your score! Tanyao (all simples), Toitoi (all triplets), and more.'
      ),
      priority: 1,
      autoDismissMs: 7000,
    },
    {
      id: 'scoring-formula',
      trigger: 'firstHandPlayed',
      targetSelector: '[data-tutorial="current-score"]',
      arrowDirection: 'bottom', // Changed from 'top' - score is near top of screen
      title: t('progressiveHints.scoring.title', 'Scoring Formula'),
      content: t(
        'progressiveHints.scoring.content',
        'Score = (Base Points + Bonuses) × Multipliers. Stack Yaku for big scores!'
      ),
      priority: 2,
      autoDismissMs: 6000,
    },

    // === ROUND COMPLETE HINTS ===
    {
      id: 'gold-intro',
      trigger: 'roundComplete',
      targetSelector: '[data-tutorial="gold"]',
      arrowDirection: 'bottom',
      title: t('progressiveHints.gold.title', 'Gold'),
      content: t(
        'progressiveHints.gold.content',
        'Earned from winning hands. Spend at the Tea House. Keep 25+ for max interest!'
      ),
      priority: 1,
      autoDismissMs: 6000,
    },
    {
      id: 'hands-discards',
      trigger: 'roundComplete',
      targetSelector: '[data-tutorial="hands-remaining"]',
      arrowDirection: 'right',
      title: t('progressiveHints.handsRemaining.title', 'Limited Attempts'),
      content: t(
        'progressiveHints.handsRemaining.content',
        'You have limited hands and discards per round. Use them wisely!'
      ),
      priority: 2,
      autoDismissMs: 5000,
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
        'Buy Decrees and upgrades between rounds. Reroll if you don\'t like the selection!'
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
        'Powerful rule modifiers! Change what\'s legal, boost multipliers, alter tile behavior.'
      ),
      priority: 1,
      autoDismissMs: 7000,
    },
    {
      id: 'decree-types',
      trigger: 'decreeAcquired',
      targetSelector: '[data-tutorial="decrees"]',
      arrowDirection: 'bottom', // Changed from 'top' - decrees bar is near top of screen
      title: t('progressiveHints.decreeTypes.title', '5 Decree Types'),
      content: t(
        'progressiveHints.decreeTypes.content',
        'Structural, Tile Identity, Yaku Doctrine, Entropy, and Scaling. Collect them all!'
      ),
      priority: 2,
      autoDismissMs: 6000,
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
