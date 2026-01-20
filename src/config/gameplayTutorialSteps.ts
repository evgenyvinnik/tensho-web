/**
 * Gameplay Tutorial Steps Configuration
 *
 * Defines the in-game tutorial steps that guide players through
 * actual gameplay with arrows pointing to UI elements.
 * Explains all game mechanics in context as players see them.
 */

import type { GameTutorialStep } from '../components/ui/GameTutorial'

/**
 * Default gameplay tutorial steps
 * These target specific elements in the gameplay UI and explain mechanics in depth
 */
export function getGameplayTutorialSteps(t: (key: string, fallback: string) => string): GameTutorialStep[] {
  return [
    // === INTRODUCTION ===
    {
      id: 'welcome',
      position: { x: 50, y: 40 },
      arrowDirection: 'top',
      title: t('gameTutorial.welcome.title', 'Welcome to Your First Run!'),
      content: t(
        'gameTutorial.welcome.content',
        'This is a "run" - a single session where you\'ll progress through Acts, building your score and collecting upgrades. Let\'s learn the basics!'
      ),
    },

    // === ACT & ROUND DISPLAY ===
    {
      id: 'act-round',
      targetSelector: '[data-tutorial="act-round"]',
      arrowDirection: 'bottom',
      title: t('gameTutorial.actRound.title', 'Acts & Rounds'),
      content: t(
        'gameTutorial.actRound.content',
        'You\'re in Act 1. Each Act has 3 rounds: Small (1×), Large (1.5×), and Boss (2×). Complete all 8 Acts to win the run!'
      ),
      highlightPadding: 10,
    },

    // === SCORE TARGET ===
    {
      id: 'score-target',
      targetSelector: '[data-tutorial="score-target"]',
      arrowDirection: 'right',
      title: t('gameTutorial.target.title', 'Score Target'),
      content: t(
        'gameTutorial.target.content',
        'This is your target score for this round. You must reach it to advance. Fail, and your run ends!'
      ),
      highlightPadding: 10,
    },

    // === CURRENT SCORE ===
    {
      id: 'current-score',
      targetSelector: '[data-tutorial="current-score"]',
      arrowDirection: 'right',
      title: t('gameTutorial.score.title', 'Your Score'),
      content: t(
        'gameTutorial.score.content',
        'Your current score. Win hands to add points here. Scoring formula: (Base + Bonuses) × Multipliers.'
      ),
      highlightPadding: 10,
    },

    // === HAND INTRODUCTION ===
    {
      id: 'hand-intro',
      targetSelector: '[data-tutorial="hand"]',
      arrowDirection: 'bottom',
      title: t('gameTutorial.hand.title', 'Your Hand'),
      content: t(
        'gameTutorial.hand.content',
        'These are your tiles. You need to form a winning hand: 4 groups + 1 pair. Groups can be sequences (1-2-3) or triplets (3-3-3).'
      ),
      highlightPadding: 12,
    },

    // === TILE TYPES ===
    {
      id: 'tile-types',
      targetSelector: '[data-tutorial="hand"]',
      arrowDirection: 'bottom',
      title: t('gameTutorial.tileTypes.title', 'Tile Types'),
      content: t(
        'gameTutorial.tileTypes.content',
        'Suited tiles (Characters, Circles, Bamboo) are numbered 1-9. Honor tiles (Winds, Dragons) can only form triplets, not sequences.'
      ),
      highlightPadding: 12,
    },

    // === TILE VALUES ===
    {
      id: 'tile-values',
      targetSelector: '[data-tutorial="hand"]',
      arrowDirection: 'bottom',
      title: t('gameTutorial.tileValues.title', 'Tile Values'),
      content: t(
        'gameTutorial.tileValues.content',
        'Terminals (1,9): 10 pts. Simples (2-8): 5 pts. Honors: 15 pts. Structures add more: Pair +10, Sequence +20, Triplet +30.'
      ),
      highlightPadding: 12,
    },

    // === WALL ===
    {
      id: 'wall-intro',
      targetSelector: '[data-tutorial="wall"]',
      arrowDirection: 'top',
      title: t('gameTutorial.wall.title', 'The Wall'),
      content: t(
        'gameTutorial.wall.content',
        'The wall contains 144 tiles. Draw from it to improve your hand. It includes bonus tiles (Flowers & Seasons) that give special effects!'
      ),
      highlightPadding: 10,
    },

    // === DRAW ACTION ===
    {
      id: 'draw-action',
      targetSelector: '[data-tutorial="draw-button"]',
      arrowDirection: 'left',
      title: t('gameTutorial.draw.title', 'Draw a Tile'),
      content: t(
        'gameTutorial.draw.content',
        'Tap Draw to take a tile from the wall. You\'ll then need to discard one tile to maintain 13 tiles.'
      ),
      waitForAction: true,
      actionHint: t('gameTutorial.draw.hint', '👆 Tap Draw to continue...'),
      highlightPadding: 10,
    },

    // === DISCARD ===
    {
      id: 'discard-intro',
      targetSelector: '[data-tutorial="hand"]',
      arrowDirection: 'bottom',
      title: t('gameTutorial.discard.title', 'Discard a Tile'),
      content: t(
        'gameTutorial.discard.content',
        'Now select a tile you don\'t need and discard it. Think about what patterns you\'re building!'
      ),
      waitForAction: true,
      actionHint: t('gameTutorial.discard.hint', '👆 Select a tile and tap Discard...'),
      highlightPadding: 12,
    },

    // === YAKU ===
    {
      id: 'yaku-intro',
      targetSelector: '[data-tutorial="yaku-display"]',
      arrowDirection: 'top',
      title: t('gameTutorial.yaku.title', 'Yaku - Score Multipliers'),
      content: t(
        'gameTutorial.yaku.content',
        'Yaku are special patterns that multiply your score. Examples: Tanyao (all simples), Toitoi (all triplets), Chinitsu (one suit only).'
      ),
      highlightPadding: 10,
    },

    // === YAKU TIERS ===
    {
      id: 'yaku-tiers',
      targetSelector: '[data-tutorial="yaku-display"]',
      arrowDirection: 'top',
      title: t('gameTutorial.yakuTiers.title', 'Yaku Tiers'),
      content: t(
        'gameTutorial.yakuTiers.content',
        'Yaku have 4 tiers. Tier 1: ×1.2-1.3. Tier 2: ×1.6-2.2. Tier 3: ×2.5-3.2. Tier 4 (Yakuman): ×4.0-5.5. Multiple Yaku stack!'
      ),
      highlightPadding: 10,
    },

    // === GOLD ===
    {
      id: 'gold',
      targetSelector: '[data-tutorial="gold"]',
      arrowDirection: 'left',
      title: t('gameTutorial.gold.title', 'Gold'),
      content: t(
        'gameTutorial.gold.content',
        'Gold is earned from winning hands. Spend it at the Tea House between rounds. Tip: Keep 25 Gold to earn maximum interest (+5/round)!'
      ),
      highlightPadding: 10,
    },

    // === DECREES ===
    {
      id: 'decrees',
      targetSelector: '[data-tutorial="decrees"]',
      arrowDirection: 'top',
      title: t('gameTutorial.decrees.title', 'Decrees'),
      content: t(
        'gameTutorial.decrees.content',
        'Decrees are powerful rule modifiers that last your entire run. They can change what\'s legal, boost multipliers, or alter tile behavior.'
      ),
      highlightPadding: 12,
    },

    // === DECREE CATEGORIES ===
    {
      id: 'decree-types',
      targetSelector: '[data-tutorial="decrees"]',
      arrowDirection: 'top',
      title: t('gameTutorial.decreeTypes.title', 'Decree Types'),
      content: t(
        'gameTutorial.decreeTypes.content',
        '5 categories: Structural (hand rules), Tile Identity (what tiles count as), Yaku Doctrine (Yaku rules), Entropy (probability), Scaling (reward commitment).'
      ),
      highlightPadding: 12,
    },

    // === HANDS REMAINING ===
    {
      id: 'hands-remaining',
      targetSelector: '[data-tutorial="hands-remaining"]',
      arrowDirection: 'right',
      title: t('gameTutorial.handsRemaining.title', 'Hands Remaining'),
      content: t(
        'gameTutorial.handsRemaining.content',
        'You have limited attempts to reach the target. Each completed hand (win or fail) uses one. Run out and your run ends!'
      ),
      highlightPadding: 10,
    },

    // === DISCARDS REMAINING ===
    {
      id: 'discards-remaining',
      targetSelector: '[data-tutorial="discards-remaining"]',
      arrowDirection: 'right',
      title: t('gameTutorial.discardsRemaining.title', 'Discards Remaining'),
      content: t(
        'gameTutorial.discardsRemaining.content',
        'Discards per hand are limited. When you run out, you must try to win with what you have. Plan your draws carefully!'
      ),
      highlightPadding: 10,
    },

    // === FLORA TRACK ===
    {
      id: 'flora',
      targetSelector: '[data-tutorial="flora"]',
      arrowDirection: 'top',
      title: t('gameTutorial.flora.title', 'Flowers & Seasons'),
      content: t(
        'gameTutorial.flora.content',
        'When you draw bonus tiles: Flowers give run-wide bonuses. Seasons give round-specific effects. Both auto-trigger and you draw a replacement.'
      ),
      highlightPadding: 10,
    },

    // === READY TO PLAY ===
    {
      id: 'complete',
      position: { x: 50, y: 40 },
      arrowDirection: 'top',
      title: t('gameTutorial.complete.title', 'You\'re Ready!'),
      content: t(
        'gameTutorial.complete.content',
        'Build winning hands, stack Yaku for multipliers, collect Decrees from the Tea House, and reach Act 8 to complete your run. Good luck!'
      ),
    },
  ]
}

/**
 * Data attributes to add to gameplay UI elements for tutorial targeting:
 *
 * - data-tutorial="hand"              - The player's hand container
 * - data-tutorial="wall"              - The wall/draw pile display
 * - data-tutorial="draw-button"       - The draw button
 * - data-tutorial="discard-button"    - The discard button
 * - data-tutorial="score-target"      - The target score display
 * - data-tutorial="current-score"     - The current score display
 * - data-tutorial="gold"              - The gold/currency display
 * - data-tutorial="decrees"           - The decrees/jokers area
 * - data-tutorial="act-round"         - The act/round indicator
 * - data-tutorial="hands-remaining"   - Hands remaining counter
 * - data-tutorial="discards-remaining"- Discards remaining counter
 * - data-tutorial="yaku-display"      - Active/potential Yaku display
 * - data-tutorial="flora"             - Flowers & Seasons track
 */
export const TUTORIAL_SELECTORS = {
  HAND: '[data-tutorial="hand"]',
  WALL: '[data-tutorial="wall"]',
  DRAW_BUTTON: '[data-tutorial="draw-button"]',
  DISCARD_BUTTON: '[data-tutorial="discard-button"]',
  SCORE_TARGET: '[data-tutorial="score-target"]',
  CURRENT_SCORE: '[data-tutorial="current-score"]',
  GOLD: '[data-tutorial="gold"]',
  DECREES: '[data-tutorial="decrees"]',
  ACT_ROUND: '[data-tutorial="act-round"]',
  HANDS_REMAINING: '[data-tutorial="hands-remaining"]',
  DISCARDS_REMAINING: '[data-tutorial="discards-remaining"]',
  YAKU_DISPLAY: '[data-tutorial="yaku-display"]',
  FLORA: '[data-tutorial="flora"]',
} as const
