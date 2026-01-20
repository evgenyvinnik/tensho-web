/**
 * GameplayScreen Component
 *
 * Main gameplay screen that connects to the GameOrchestrator via useGameController.
 * This is the interactive gameplay interface for Tensho Mahjong Roguelike.
 */

import { useEffect, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation, ROUTES } from '../../router'
import { useGameController, useGameEvent } from '../../game'
import { useResponsiveTileSize } from '../../hooks/useResponsiveTileSize'
import { Button } from '../ui/Button'
import { TablePattern } from '../ui/TablePattern'
import { HandWithDiscardZone } from '../hand/AnimatedHand'
import { ScorePopup } from '../effects/ScorePopup'
import { YakuReveal } from '../effects/YakuReveal'
import { GameTutorial, useGameTutorial } from '../ui/GameTutorial'
import { getGameplayTutorialSteps } from '../../config/gameplayTutorialSteps'
import { Tile } from '../../core/Tile'

/**
 * Score popup state
 */
interface ScorePopupState {
  id: number
  score: number
  multiplier?: number
  variant: 'default' | 'bonus' | 'critical'
}

/**
 * Yaku reveal state
 */
interface YakuRevealState {
  id: string
  japaneseName: string
  multiplier: number
  tier: 1 | 2 | 3 | 4
}

/**
 * GameplayScreen - Main gameplay interface
 */
export function GameplayScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()

  // Get game controller
  const game = useGameController()

  // Responsive tile size
  const tileSize = useResponsiveTileSize()

  // Tutorial steps and state
  const tutorialSteps = getGameplayTutorialSteps(t)
  const tutorial = useGameTutorial(tutorialSteps)

  // Local UI state
  const [scorePopups, setScorePopups] = useState<ScorePopupState[]>([])
  const [yakuReveals, setYakuReveals] = useState<YakuRevealState[]>([])
  const [popupIdCounter, setPopupIdCounter] = useState(0)

  // Start new run if not active
  useEffect(() => {
    if (!game.isRunActive && game.phase === 'menu') {
      game.startNewRun()
    }
  }, [game.isRunActive, game.phase, game.startNewRun])

  // Start tutorial for first-time players
  useEffect(() => {
    if (game.isRunActive && !tutorial.hasCompleted && !tutorial.isActive) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        tutorial.start()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [game.isRunActive, tutorial.hasCompleted, tutorial.isActive, tutorial.start])

  // Complete tutorial step when user draws a tile
  useGameEvent('tileDrawn', useCallback(() => {
    tutorial.completeCurrentStep()
  }, [tutorial]))

  // Complete tutorial step when user discards a tile
  useGameEvent('tileDiscarded', useCallback(() => {
    tutorial.completeCurrentStep()
  }, [tutorial]))

  // Navigate to shop when phase changes
  useEffect(() => {
    if (game.phase === 'shop') {
      navigateTo(ROUTES.SHOP)
    } else if (game.phase === 'gameOver') {
      navigateTo(ROUTES.GAME_OVER)
    }
  }, [game.phase, navigateTo])

  // Listen for score updates to show popups
  useGameEvent('scoreUpdate', useCallback((data) => {
    setPopupIdCounter((prev) => {
      const newId = prev + 1
      setScorePopups((popups) => [
        ...popups,
        {
          id: newId,
          score: data.delta,
          variant: data.delta >= 1000 ? 'critical' : data.delta >= 500 ? 'bonus' : 'default',
        },
      ])
      return newId
    })
  }, []))

  // Listen for yaku scored events
  useGameEvent('yakuScored', useCallback((data) => {
    const tier = data.multiplier >= 4 ? 4 : data.multiplier >= 2 ? 3 : data.multiplier >= 1.5 ? 2 : 1
    setYakuReveals((reveals) => [
      ...reveals,
      {
        id: data.yakuId,
        japaneseName: data.yakuName,
        multiplier: data.multiplier,
        tier: tier as 1 | 2 | 3 | 4,
      },
    ])
  }, []))

  // Clear popups after animation
  const handlePopupComplete = useCallback((id: number) => {
    setScorePopups((popups) => popups.filter((p) => p.id !== id))
  }, [])

  const handleYakuComplete = useCallback((id: string) => {
    setYakuReveals((reveals) => reveals.filter((r) => r.id !== id))
  }, [])

  // Tile click handler
  const handleTileClick = useCallback((tile: Tile) => {
    game.toggleTileSelection(tile.id)
  }, [game])

  // Tile discard handler
  const handleTileDiscard = useCallback((tile: Tile) => {
    game.discard(tile.id)
  }, [game])

  // Draw tile handler
  const handleDraw = useCallback(() => {
    game.draw()
  }, [game])

  // Play hand handler
  const handlePlayHand = useCallback(() => {
    if (game.selectedTileIds.length > 0) {
      game.playHand()
    } else {
      // Select all and play
      game.selectAllTiles()
      game.playHand()
    }
  }, [game])

  // Settings navigation
  const handleSettings = useCallback(() => {
    navigateTo(ROUTES.SETTINGS)
  }, [navigateTo])

  // Skip round handler
  const handleSkip = useCallback(() => {
    game.skipRound()
  }, [game])

  // Calculate shanten display (simplified)
  const shantenDisplay = game.handTiles.length >= 13 ? '聴牌' : `${14 - game.handTiles.length}向聴`

  return (
    <TablePattern
      showOrnaments={true}
      animated={false}
      patternScale={1}
      className="viewport-full"
    >
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-dark-forest)] text-[var(--color-beige-white)]">
          <span data-tutorial="gold" className="text-lg font-bold text-[var(--color-golden-yellow)]">¥{game.gold}</span>
          <span data-tutorial="act-round" className="text-lg">
            {t('gameplay.act')} {game.currentAct} - R{game.currentRound}
          </span>
          <button
            onClick={handleSettings}
            className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={t('menu.settings')}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </button>
        </div>

        {/* Decree bar */}
        <div data-tutorial="decrees" className="flex gap-2 px-4 py-2 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-16 h-20 bg-[var(--color-dark-forest)] rounded-lg border-2 border-[var(--color-metallic-gold)] flex items-center justify-center text-2xl"
            >
              📜
            </div>
          ))}
          <div className="flex-shrink-0 w-16 h-20 bg-[var(--color-dark-forest)] rounded-lg border-2 border-dashed border-[var(--color-metallic-gold)] flex items-center justify-center text-2xl opacity-50">
            +
          </div>
        </div>

        {/* Round target and score */}
        <div className="flex-shrink-0 mx-4 my-4 p-4 bg-[var(--color-dark-forest)] rounded-lg text-center relative">
          <p className="text-sm text-[var(--color-beige-white)] opacity-70 mb-2">
            {t('gameplay.target').toUpperCase()}
          </p>
          <p data-tutorial="score-target" className="text-4xl font-bold text-[var(--color-golden-yellow)] animate-pulse-glow">
            {game.targetScore.toLocaleString()}
          </p>
          <p data-tutorial="current-score" className="text-lg text-[var(--color-beige-white)] mt-2">
            {t('gameplay.score').toUpperCase()}: {game.score.toLocaleString()}
          </p>

          {/* Score popups */}
          {scorePopups.map((popup) => (
            <ScorePopup
              key={popup.id}
              points={popup.score}
              variant={popup.variant}
              position={{ x: 50, y: 20 }}
              onComplete={() => handlePopupComplete(popup.id)}
            />
          ))}
        </div>

        {/* Play area / Meld display */}
        <div data-tutorial="yaku-display" className="flex-1 mx-4 mb-2 bg-[var(--color-dark-forest)] bg-opacity-50 rounded-lg border-2 border-dashed border-[var(--color-metallic-gold)] flex flex-col items-center justify-center p-4">
          {game.selectedTileIds.length > 0 ? (
            <div className="text-center">
              <p className="text-[var(--color-beige-white)] mb-2">
                {game.selectedTileIds.length} tiles selected
              </p>
              <p className="text-[var(--color-golden-yellow)] text-sm">
                Tap "Play Hand" to score
              </p>
            </div>
          ) : (
            <p className="text-[var(--color-beige-white)] opacity-50 text-center px-4">
              Select tiles to play
            </p>
          )}

          {/* Yaku reveals */}
          {yakuReveals.map((yaku) => (
            <YakuReveal
              key={yaku.id}
              japaneseName={yaku.japaneseName}
              multiplier={yaku.multiplier}
              tier={yaku.tier}
              onComplete={() => handleYakuComplete(yaku.id)}
            />
          ))}
        </div>

        {/* Shanten status */}
        <div className="mx-4 mb-2 px-4 py-2 bg-[var(--color-dark-forest)] rounded-lg text-center">
          <span className="text-[var(--color-golden-yellow)] font-bold">{shantenDisplay}</span>
          <span className="text-[var(--color-beige-white)] mx-2">•</span>
          <span className="text-[var(--color-beige-white)]">
            <span data-tutorial="hands-remaining">Hands: {game.handsRemaining}</span> | <span data-tutorial="discards-remaining">Discards: {game.discardsRemaining}</span>
          </span>
        </div>

        {/* Info row */}
        <div className="mx-4 mb-2 flex items-center justify-between text-[var(--color-beige-white)] text-sm">
          <span data-tutorial="flora">🌸×{game.state.flowerSystem.getFlowerCount()}</span>
          <span>🍂 Season Active</span>
          <span data-tutorial="wall">Wall: {game.wallRemaining}</span>
        </div>

        {/* Hand area with drag-to-discard support */}
        <div data-tutorial="hand" className="mx-4 mb-2 p-4 bg-[var(--color-dark-forest)] rounded-lg">
          <HandWithDiscardZone
            tiles={game.handTiles}
            size={tileSize}
            selectedIds={new Set(game.selectedTileIds)}
            onTileClick={handleTileClick}
            onTileDiscard={handleTileDiscard}
            discardZoneLabel={t('gameplay.discard')}
            overlap={true}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 px-4 py-4 bg-[var(--color-dark-forest)]">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSkip}
            disabled={game.currentRound === 3} // Can't skip boss rounds
          >
            SKIP
          </Button>
          <div data-tutorial="draw-button">
            <Button variant="secondary" size="sm" onClick={handleDraw} disabled={game.handTiles.length >= 14}>
              {t('gameplay.draw').toUpperCase()}
            </Button>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePlayHand}
            disabled={game.handsRemaining <= 0}
          >
            PLAY HAND
          </Button>
        </div>
      </div>

      {/* In-game tutorial overlay */}
      <GameTutorial
        isActive={tutorial.isActive}
        currentStep={tutorial.currentStep}
        steps={tutorialSteps}
        onStepComplete={tutorial.nextStep}
        onSkip={tutorial.skip}
        onComplete={tutorial.complete}
      />
    </TablePattern>
  )
}
