/**
 * Gameplay Tutorial Steps Configuration
 *
 * Defines the in-game tutorial steps that guide players through
 * actual gameplay with arrows pointing to UI elements.
 */

import type { GameTutorialStep } from '../components/ui/GameTutorial'

/**
 * Default gameplay tutorial steps
 * These target specific elements in the gameplay UI
 */
export function getGameplayTutorialSteps(t: (key: string, fallback: string) => string): GameTutorialStep[] {
  return [
    {
      id: 'hand-intro',
      targetSelector: '[data-tutorial="hand"]',
      arrowDirection: 'bottom',
      title: t('gameTutorial.hand.title', 'Your Hand'),
      content: t(
        'gameTutorial.hand.content',
        'This is your hand. You start with 13 tiles and need to form a winning combination.'
      ),
      highlightPadding: 12,
    },
    {
      id: 'wall-intro',
      targetSelector: '[data-tutorial="wall"]',
      arrowDirection: 'top',
      title: t('gameTutorial.wall.title', 'The Wall'),
      content: t(
        'gameTutorial.wall.content',
        'The wall contains the remaining tiles. Draw tiles from here to improve your hand.'
      ),
      highlightPadding: 8,
    },
    {
      id: 'draw-action',
      targetSelector: '[data-tutorial="draw-button"]',
      arrowDirection: 'left',
      title: t('gameTutorial.draw.title', 'Draw a Tile'),
      content: t(
        'gameTutorial.draw.content',
        'Tap the Draw button to take a tile from the wall.'
      ),
      waitForAction: true,
      actionHint: t('gameTutorial.draw.hint', 'Tap Draw to continue...'),
      highlightPadding: 8,
    },
    {
      id: 'discard-intro',
      targetSelector: '[data-tutorial="hand"]',
      arrowDirection: 'bottom',
      title: t('gameTutorial.discard.title', 'Discard a Tile'),
      content: t(
        'gameTutorial.discard.content',
        'After drawing, you must discard one tile. Tap a tile in your hand to select it, then tap Discard.'
      ),
      waitForAction: true,
      actionHint: t('gameTutorial.discard.hint', 'Select and discard a tile...'),
      highlightPadding: 12,
    },
    {
      id: 'score-target',
      targetSelector: '[data-tutorial="score-target"]',
      arrowDirection: 'right',
      title: t('gameTutorial.target.title', 'Score Target'),
      content: t(
        'gameTutorial.target.content',
        'This is your target score. Complete a winning hand that scores at least this much to clear the round.'
      ),
      highlightPadding: 8,
    },
    {
      id: 'current-score',
      targetSelector: '[data-tutorial="current-score"]',
      arrowDirection: 'right',
      title: t('gameTutorial.score.title', 'Current Score'),
      content: t(
        'gameTutorial.score.content',
        'Your score accumulates as you win hands. Keep building to reach the target!'
      ),
      highlightPadding: 8,
    },
    {
      id: 'gold',
      targetSelector: '[data-tutorial="gold"]',
      arrowDirection: 'left',
      title: t('gameTutorial.gold.title', 'Gold'),
      content: t(
        'gameTutorial.gold.content',
        'Gold is used to buy Decrees in the Tea House shop. Save up for powerful upgrades!'
      ),
      highlightPadding: 8,
    },
    {
      id: 'decrees',
      targetSelector: '[data-tutorial="decrees"]',
      arrowDirection: 'top',
      title: t('gameTutorial.decrees.title', 'Your Decrees'),
      content: t(
        'gameTutorial.decrees.content',
        'Decrees modify the rules and boost your score. Collect them from the Tea House between rounds.'
      ),
      highlightPadding: 12,
    },
    {
      id: 'complete',
      position: { x: 50, y: 50 },
      arrowDirection: 'top',
      title: t('gameTutorial.complete.title', 'Ready to Play!'),
      content: t(
        'gameTutorial.complete.content',
        'Build your hand, score big, and reach the target to advance. Good luck!'
      ),
    },
  ]
}

/**
 * Data attributes to add to gameplay UI elements for tutorial targeting:
 *
 * - data-tutorial="hand"         - The player's hand container
 * - data-tutorial="wall"         - The wall/draw pile
 * - data-tutorial="draw-button"  - The draw button
 * - data-tutorial="discard"      - The discard pile/area
 * - data-tutorial="score-target" - The target score display
 * - data-tutorial="current-score"- The current score display
 * - data-tutorial="gold"         - The gold/currency display
 * - data-tutorial="decrees"      - The decrees/jokers area
 * - data-tutorial="act-round"    - The act/round indicator
 */
export const TUTORIAL_SELECTORS = {
  HAND: '[data-tutorial="hand"]',
  WALL: '[data-tutorial="wall"]',
  DRAW_BUTTON: '[data-tutorial="draw-button"]',
  DISCARD: '[data-tutorial="discard"]',
  SCORE_TARGET: '[data-tutorial="score-target"]',
  CURRENT_SCORE: '[data-tutorial="current-score"]',
  GOLD: '[data-tutorial="gold"]',
  DECREES: '[data-tutorial="decrees"]',
  ACT_ROUND: '[data-tutorial="act-round"]',
} as const
