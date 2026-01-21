/**
 * GameplayScreen Component for Tensho Mahjong Roguelike
 *
 * Main gameplay screen that connects to the GameOrchestrator via useGameController.
 * This is the interactive gameplay interface for Tensho Mahjong Roguelike.
 *
 * @module components/screens/GameplayScreen
 */

import { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation, ROUTES } from '../../router'
import { useGameController, useGameEvent } from '../../game/useGameController'
import { useResponsiveTileSize } from '../../hooks/useResponsiveTileSize'
import { useProgressiveTutorial } from '../../hooks/useProgressiveTutorial'
import { Button } from '../ui/Button'
import { TablePattern } from '../ui/TablePattern'
import { PlaySurface } from '../gameplay/PlaySurface'
import { ScorePopup } from '../effects/ScorePopup'
import { YakuReveal } from '../effects/YakuReveal'
import { ProgressiveHintOverlay } from '../ui/ProgressiveHint'
import { ConfirmPopup } from '../ui/Popup'
import { getProgressiveHints } from '../../config/progressiveTutorialHints'
import { Tile } from '../../core/Tile'
import { FlowerVariant, SeasonVariant } from '../../systems/types'
import { GlowEffect } from '../effects/GlowEffect'

// Extracted gameplay components
import { DecreeCardCompact, DecreeSlotEmpty } from '../gameplay/DecreeBar'
import { RoundTypeIndicator } from '../gameplay/RoundTypeIndicator'
import { PointsMultDisplay } from '../gameplay/PointsMultDisplay'
import { FloraTrackCompact } from '../gameplay/FloraTrackCompact'
import { ConsumablesBar } from '../gameplay/ConsumablesBar'
import { RoundType, ScorePopupState, YakuRevealState } from '../gameplay/gameplayTypes'

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Main gameplay screen component.
 *
 * Manages the entire gameplay interface including:
 * - Hand tile display and interaction
 * - Score tracking and visualization
 * - Decree bar with owned decrees
 * - Flora track (flowers and seasons)
 * - Consumables bar
 * - Progressive tutorial hints
 * - Round type indicator with boss mandates
 */
export function GameplayScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()

  // Game controller
  const game = useGameController()

  // Responsive tile size
  const tileSize = useResponsiveTileSize()

  // Progressive tutorial hints
  const progressiveHints = useMemo(() => getProgressiveHints(t), [t])
  const tutorial = useProgressiveTutorial(progressiveHints)

  // Tutorial trigger refs
  const hasTriggeredGameStart = useRef(false)
  const hasTriggeredFirstDraw = useRef(false)
  const hasTriggeredFirstDiscard = useRef(false)
  const hasTriggeredFirstHand = useRef(false)
  const hasTriggeredRoundComplete = useRef(false)
  const hasTriggeredBossRound = useRef(false)

  // Local UI state
  const [scorePopups, setScorePopups] = useState<ScorePopupState[]>([])
  const [yakuReveals, setYakuReveals] = useState<YakuRevealState[]>([])
  const [stagedTileIds, setStagedTileIds] = useState<string[]>([])
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const popupIdCounterRef = useRef(0)

  // Points/Mult display state
  const [currentPoints, setCurrentPoints] = useState(0)
  const [currentMult, setCurrentMult] = useState(1)
  const [isScoreAnimating, setIsScoreAnimating] = useState(false)

  // Flora panel expanded state
  const [isFloraExpanded, setIsFloraExpanded] = useState(false)

  // Consumables state (placeholder - would connect to actual store)
  const [consumables] = useState({
    fateSeals: 0,
    celestialOrbs: 0,
    voidScripts: 0,
  })

  // ==========================================================================
  // EFFECTS - Game lifecycle
  // ==========================================================================

  // Start new run if not active
  useEffect(() => {
    if (!game.isRunActive && game.phase === 'menu') {
      game.startNewRun()
    }
  }, [game.isRunActive, game.phase, game.startNewRun])

  // Navigate to shop/game over when phase changes
  useEffect(() => {
    if (game.phase === 'shop') {
      navigateTo(ROUTES.SHOP)
    } else if (game.phase === 'gameOver') {
      navigateTo(ROUTES.GAME_OVER)
    }
  }, [game.phase, navigateTo])

  // ==========================================================================
  // EFFECTS - Tutorial triggers
  // ==========================================================================

  // Trigger gameStart hints when run becomes active
  useEffect(() => {
    if (game.isRunActive && !hasTriggeredGameStart.current) {
      hasTriggeredGameStart.current = true
      const timer = setTimeout(() => {
        tutorial.triggerHints('gameStart')
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [game.isRunActive, tutorial])

  // Reset trigger refs when starting a new run
  useEffect(() => {
    if (!game.isRunActive) {
      hasTriggeredGameStart.current = false
      hasTriggeredFirstDraw.current = false
      hasTriggeredFirstDiscard.current = false
      hasTriggeredFirstHand.current = false
      hasTriggeredRoundComplete.current = false
      hasTriggeredBossRound.current = false
    }
  }, [game.isRunActive])

  // Trigger firstDraw hints before first draw
  useEffect(() => {
    if (game.isRunActive && !hasTriggeredFirstDraw.current && game.handTiles.length > 0) {
      const timer = setTimeout(() => {
        if (!hasTriggeredFirstDraw.current) {
          hasTriggeredFirstDraw.current = true
          tutorial.triggerHints('firstDraw')
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [game.isRunActive, game.handTiles.length, tutorial])

  // Trigger bossRound hints when entering boss round
  useEffect(() => {
    if (game.currentRound === 3 && !hasTriggeredBossRound.current) {
      hasTriggeredBossRound.current = true
      tutorial.triggerHints('bossRound')
    }
  }, [game.currentRound, tutorial])

  // ==========================================================================
  // EVENT HANDLERS - Game events
  // ==========================================================================

  // Trigger firstDiscard hints after first draw action
  useGameEvent(
    'tileDrawn',
    useCallback(() => {
      if (!hasTriggeredFirstDiscard.current) {
        hasTriggeredFirstDiscard.current = true
        setTimeout(() => {
          tutorial.triggerHints('firstDiscard')
        }, 500)
      }
    }, [tutorial])
  )

  // Trigger firstHandPlayed hints after playing first hand
  useGameEvent(
    'handPlayed',
    useCallback(() => {
      if (!hasTriggeredFirstHand.current) {
        hasTriggeredFirstHand.current = true
        setTimeout(() => {
          tutorial.triggerHints('firstHandPlayed')
        }, 1000)
      }
    }, [tutorial])
  )

  // Trigger roundComplete hints after completing a round
  useGameEvent(
    'roundEnd',
    useCallback(() => {
      if (!hasTriggeredRoundComplete.current) {
        hasTriggeredRoundComplete.current = true
        tutorial.triggerHints('roundComplete')
      }
    }, [tutorial])
  )

  // Trigger flowerDrawn hints when a flower is collected
  useGameEvent(
    'flowerCollected',
    useCallback(() => {
      tutorial.triggerHints('flowerDrawn')
    }, [tutorial])
  )

  // Listen for score updates to show popups
  useGameEvent(
    'scoreUpdate',
    useCallback((data) => {
      popupIdCounterRef.current += 1
      const newId = popupIdCounterRef.current
      setScorePopups((popups) => [
        ...popups,
        {
          id: newId,
          score: data.delta,
          variant: data.delta >= 1000 ? 'critical' : data.delta >= 500 ? 'bonus' : 'default',
        },
      ])
    }, [])
  )

  // Listen for yaku scored events
  useGameEvent(
    'yakuScored',
    useCallback((data) => {
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
    }, [])
  )

  // Track score for points/mult display
  useGameEvent(
    'handPlayed',
    useCallback(
      (data) => {
        const basePoints = data.score / (currentMult || 1)
        setCurrentPoints(basePoints)
        setIsScoreAnimating(true)
        setTimeout(() => setIsScoreAnimating(false), 1500)
      },
      [currentMult]
    )
  )

  // Update mult when yaku is scored
  useGameEvent(
    'yakuScored',
    useCallback((data) => {
      setCurrentMult((prev) => prev * data.multiplier)
    }, [])
  )

  // Reset points/mult on round start
  useGameEvent(
    'roundStart',
    useCallback(() => {
      setCurrentPoints(0)
      setCurrentMult(1)
    }, [])
  )

  // ==========================================================================
  // CALLBACKS - UI interaction handlers
  // ==========================================================================

  const handlePopupComplete = useCallback((id: number) => {
    setScorePopups((popups) => popups.filter((p) => p.id !== id))
  }, [])

  const handleYakuComplete = useCallback((id: string) => {
    setYakuReveals((reveals) => reveals.filter((r) => r.id !== id))
  }, [])

  const handleTileClick = useCallback(
    (tile: Tile) => {
      game.toggleTileSelection(tile.id)
    },
    [game]
  )

  const handleTileDiscard = useCallback(
    (tile: Tile) => {
      game.discard(tile.id)
    },
    [game]
  )

  const handleTilesStaged = useCallback((tiles: Tile[]) => {
    const ids = tiles.map((t) => t.id)
    setStagedTileIds(ids)
  }, [])

  const handleDraw = useCallback(() => {
    game.draw()
  }, [game])

  const handlePlayHand = useCallback(() => {
    let tileIds: string[] = []

    // Priority: staged tiles > selected tiles > all tiles
    if (stagedTileIds.length > 0) {
      tileIds = stagedTileIds
    } else if (game.selectedTileIds.length > 0) {
      tileIds = Array.from(game.selectedTileIds)
    } else {
      tileIds = game.handTiles.map((t) => t.id)
    }

    if (tileIds.length === 0) {
      return
    }

    const result = game.playHand(tileIds)

    if (result?.success) {
      if (stagedTileIds.length > 0) {
        setStagedTileIds([])
      } else if (game.selectedTileIds.length > 0) {
        game.clearSelection()
      }
    }
  }, [game, stagedTileIds])

  const handleSettings = useCallback(() => {
    navigateTo(ROUTES.SETTINGS)
  }, [navigateTo])

  const handleExitGame = useCallback(() => {
    game.endRun()
    navigateTo(ROUTES.MENU)
  }, [game, navigateTo])

  const handleSkip = useCallback(() => {
    game.skipRound()
  }, [game])

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  // Shanten display
  const tilesNeeded = 14 - game.handTiles.length
  const shantenDisplay =
    game.handTiles.length >= 13 ? t('gameplay.tenpai') : t('gameplay.shanten', { count: tilesNeeded })

  // Score preview for staged/selected tiles
  const scorePreview = useMemo(() => {
    let previewTiles: Tile[] = []

    if (stagedTileIds.length > 0) {
      previewTiles = game.handTiles.filter((t) => stagedTileIds.includes(t.id))
    } else if (game.selectedTileIds.length > 0) {
      previewTiles = game.handTiles.filter((t) => game.selectedTileIds.includes(t.id))
    } else {
      previewTiles = game.handTiles
    }

    if (previewTiles.length === 0) return null

    // Calculate base points from tiles
    let basePoints = 0
    for (const tile of previewTiles) {
      if (tile.isHonor) {
        basePoints += 15
      } else if (tile.rank === 1 || tile.rank === 9) {
        basePoints += 10
      } else {
        basePoints += 5
      }
    }

    // Structure points estimate
    const pairBonus = 10
    const tripletBonus = 30

    const suitRankCounts = new Map<string, number>()
    for (const tile of previewTiles) {
      const key = `${tile.suit}-${tile.rank}`
      suitRankCounts.set(key, (suitRankCounts.get(key) || 0) + 1)
    }

    let structurePoints = 0
    for (const count of suitRankCounts.values()) {
      if (count >= 3) structurePoints += tripletBonus
      else if (count === 2) structurePoints += pairBonus
    }

    const totalPoints = basePoints + structurePoints

    // Base multiplier plus estimates
    let mult = 1.0

    // Check for all simples (Tanyao)
    const hasTerminalsOrHonors = previewTiles.some((t) => t.isHonor || t.rank === 1 || t.rank === 9)
    if (!hasTerminalsOrHonors && previewTiles.length >= 13) {
      mult += 0.3
    }

    // Check for all one suit
    const suits = new Set(previewTiles.filter((t) => !t.isHonor).map((t) => t.suit))
    if (suits.size === 1 && previewTiles.length >= 13) {
      mult += 0.5
    }

    const total = Math.floor(totalPoints * mult)

    return { points: totalPoints, mult, total }
  }, [stagedTileIds, game.handTiles, game.selectedTileIds])

  // Owned decrees from game state
  const ownedDecrees = useMemo(() => {
    return game.state.decreeSystem.getOwnedDecrees()
  }, [game.state.decreeSystem])

  const maxDecreeSlots = useMemo(() => {
    const baseSlots = 5
    const bonusSlots = game.state.flowerSystem.getBonusDecreeSlots()
    return baseSlots + bonusSlots
  }, [game.state.flowerSystem])

  // Collected flowers
  const collectedFlowers = useMemo<FlowerVariant[]>(() => {
    const flowers = game.state.flowerSystem.getFlowers()
    return flowers.map((f) => f.type)
  }, [game.state.flowerSystem])

  // Active season
  const seasonState = useMemo(() => {
    const state = game.state.seasonSystem.getState()
    return {
      activeSeason: state.activeSeason?.type as SeasonVariant | null,
      isCorrupted: state.isCorruptedRound,
    }
  }, [game.state.seasonSystem])

  // Round type based on round number
  const roundType: RoundType = useMemo(() => {
    switch (game.currentRound) {
      case 1:
        return 'Small'
      case 2:
        return 'Large'
      case 3:
        return 'Boss'
      default:
        return 'Small'
    }
  }, [game.currentRound])

  // Boss mandate if applicable
  const bossMandate = useMemo(() => {
    if (roundType === 'Boss') {
      const roundState = game.state.roundManager.getCurrentRound()
      return roundState?.bossMandate?.name
    }
    return undefined
  }, [roundType, game.state.roundManager])

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <TablePattern showOrnaments={true} animated={false} patternScale={1} className="viewport-full">
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-dark-forest)] text-[var(--color-beige-white)]">
          {/* Gold display */}
          <GlowEffect variant="gold" intensity={0.4} pulsing={false}>
            <span data-tutorial="gold" className="text-lg font-bold text-[var(--color-golden-yellow)]">
              ¥{game.gold}
            </span>
          </GlowEffect>

          {/* Act/Round with Round Type indicator */}
          <div data-tutorial="act-round" className="flex items-center gap-2">
            <span className="text-lg">
              {t('gameplay.act')} {game.currentAct}
            </span>
            <RoundTypeIndicator roundType={roundType} mandateName={bossMandate} />
          </div>

          <div className="flex items-center gap-2">
            {/* Exit button */}
            <button
              onClick={() => setShowExitConfirm(true)}
              className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center text-red-400 hover:text-red-300"
              aria-label={t('common.exit', 'Exit')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>

            {/* Settings button */}
            <button
              onClick={handleSettings}
              className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={t('menu.settings')}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Decree bar */}
        <div data-tutorial="decrees" className="flex gap-2 px-4 py-2 overflow-x-auto">
          {ownedDecrees.map((decree) => (
            <DecreeCardCompact key={decree.id} decree={decree} />
          ))}
          {Array.from({ length: Math.max(0, maxDecreeSlots - ownedDecrees.length) }).map((_, i) => (
            <DecreeSlotEmpty key={`empty-${i}`} isLocked={i >= maxDecreeSlots - ownedDecrees.length} />
          ))}
        </div>

        {/* Consumables row */}
        <div className="flex items-center justify-end px-4 py-2 gap-2">
          <ConsumablesBar
            fateSeals={consumables.fateSeals}
            celestialOrbs={consumables.celestialOrbs}
            voidScripts={consumables.voidScripts}
          />
        </div>

        {/* Round target and score display */}
        <div className="flex-shrink-0 mx-4 my-2 p-4 bg-[var(--color-dark-forest)] rounded-lg text-center relative">
          <p className="text-sm text-[var(--color-beige-white)] opacity-70 mb-1">{t('gameplay.target').toUpperCase()}</p>
          <GlowEffect
            variant="gold"
            intensity={game.score >= game.targetScore ? 0.8 : 0.4}
            pulsing={game.score >= game.targetScore}
          >
            <p data-tutorial="score-target" className="text-3xl font-bold text-[var(--color-golden-yellow)]">
              {game.targetScore.toLocaleString()}
            </p>
          </GlowEffect>

          {/* Points x Mult display */}
          <div className="my-3">
            <PointsMultDisplay points={currentPoints || game.score} mult={currentMult} isAnimating={isScoreAnimating} />
          </div>

          <p data-tutorial="current-score" className="text-lg text-[var(--color-beige-white)]">
            {t('gameplay.score').toUpperCase()}:{' '}
            <span className="font-bold text-[var(--color-golden-yellow)]">{game.score.toLocaleString()}</span>
          </p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                game.score >= game.targetScore ? 'bg-green-500' : 'bg-[var(--color-vibrant-orange)]'
              }`}
              style={{ width: `${Math.min(100, (game.score / game.targetScore) * 100)}%` }}
            />
          </div>

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
        <div
          data-tutorial="yaku-display"
          className="flex-1 mx-4 mb-2 bg-[var(--color-dark-forest)] bg-opacity-50 rounded-lg border-2 border-dashed border-[var(--color-metallic-gold)] flex flex-col items-center justify-center p-4 min-h-[100px]"
        >
          {game.selectedTileIds.length > 0 ? (
            <div className="text-center">
              <p className="text-[var(--color-beige-white)] mb-2">{game.selectedTileIds.length} tiles selected</p>
              <p className="text-[var(--color-golden-yellow)] text-sm">Tap "Play Hand" to score</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[var(--color-beige-white)] opacity-50 px-4">Tap tiles to select, or play all</p>
              <p className="text-[var(--color-golden-yellow)] opacity-70 text-sm mt-1">
                Press "Play Hand" to score your hand
              </p>
            </div>
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

        {/* Play Surface with Flora panel on left */}
        <div className="flex-1 flex mx-2 mb-2 min-h-[340px] gap-2">
          {/* Flora panel */}
          <div data-tutorial="flora" className="flex-shrink-0">
            <FloraTrackCompact
              flowers={collectedFlowers}
              activeSeason={seasonState.activeSeason}
              isCorrupted={seasonState.isCorrupted}
              onExpand={() => setIsFloraExpanded(!isFloraExpanded)}
            />
          </div>

          {/* Play Surface */}
          <div data-tutorial="hand" className="flex-1">
            <PlaySurface
              handTiles={game.handTiles}
              tileSize={tileSize}
              selectedIds={new Set(game.selectedTileIds)}
              onTileSelect={handleTileClick}
              onTileDiscard={handleTileDiscard}
              onTilesStaged={handleTilesStaged}
              disabled={false}
              shantenDisplay={shantenDisplay}
              handsRemaining={game.handsRemaining}
              discardsRemaining={game.discardsRemaining}
              scorePreview={scorePreview}
              t={t}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center items-center gap-4 px-4 py-4 bg-[var(--color-dark-forest)]">
          {/* Wall remaining indicator */}
          <span data-tutorial="wall" className="flex items-center gap-1 text-[var(--color-beige-white)] text-sm">
            <span className="text-gray-400">📦</span> {game.wallRemaining}
          </span>
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
          <Button variant="primary" size="sm" onClick={handlePlayHand} disabled={game.handsRemaining <= 0}>
            PLAY HAND
          </Button>
        </div>
      </div>

      {/* Progressive tutorial hint overlay */}
      <ProgressiveHintOverlay
        hint={tutorial.currentHint}
        onDismiss={tutorial.dismissHint}
        onDisableHints={tutorial.disableHints}
        queueCount={tutorial.hintQueue.length}
      />

      {/* Exit confirmation popup */}
      <ConfirmPopup
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={handleExitGame}
        title={t('gameplay.exitGame', 'Exit Game')}
        message={t('gameplay.exitConfirm', 'Are you sure you want to exit? Your current run progress will be lost.')}
        confirmText={t('common.exit', 'Exit')}
        cancelText={t('common.cancel', 'Cancel')}
      />
    </TablePattern>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default GameplayScreen
