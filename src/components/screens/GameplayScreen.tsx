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
import { TablePattern } from '../ui/TablePattern'
import { PlaySurface } from '../gameplay/PlaySurface'
import { ProgressiveHintOverlay } from '../ui/ProgressiveHint'
import { ConfirmPopup } from '../ui/Popup'
import { getProgressiveHints } from '../../config/progressiveTutorialHints'
import { Tile } from '../../core/Tile'
import { FlowerVariant, SeasonVariant } from '../../systems/types'
import { checkTanyao, TANYAO, HONITSU, CHINITSU, HONROUTOU, TOITOI, YakuDefinition } from '../../rules/YakuDetector'

// Extracted gameplay components
import { DecreeCardCompact, DecreeSlotEmpty } from '../gameplay/DecreeBar'
import { FloraTrackCompact } from '../gameplay/FloraTrackCompact'
import { ConsumablesBar } from '../gameplay/ConsumablesBar'
import { GameplayTopBar } from '../gameplay/GameplayTopBar'
import { ScorePanel } from '../gameplay/ScorePanel'
import { ActionBar } from '../gameplay/ActionBar'
import { PlayArea } from '../gameplay/PlayArea'
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

  useEffect(() => {
    console.log('[GameplayScreen] Mount check - isRunActive:', game.isRunActive, 'phase:', game.phase)
    if (!game.isRunActive && game.phase === 'menu') {
      console.log('[GameplayScreen] Starting new run...')
      game.startNewRun()
    }
  }, [game.isRunActive, game.phase, game.startNewRun])

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

  useEffect(() => {
    if (game.isRunActive && !hasTriggeredGameStart.current) {
      hasTriggeredGameStart.current = true
      const timer = setTimeout(() => tutorial.triggerHints('gameStart'), 800)
      return () => clearTimeout(timer)
    }
  }, [game.isRunActive, tutorial])

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

  useEffect(() => {
    if (game.currentRound === 3 && !hasTriggeredBossRound.current) {
      hasTriggeredBossRound.current = true
      tutorial.triggerHints('bossRound')
    }
  }, [game.currentRound, tutorial])

  // ==========================================================================
  // EVENT HANDLERS - Game events
  // ==========================================================================

  useGameEvent('tileDrawn', useCallback(() => {
    if (!hasTriggeredFirstDiscard.current) {
      hasTriggeredFirstDiscard.current = true
      setTimeout(() => tutorial.triggerHints('firstDiscard'), 500)
    }
  }, [tutorial]))

  useGameEvent('handPlayed', useCallback(() => {
    if (!hasTriggeredFirstHand.current) {
      hasTriggeredFirstHand.current = true
      setTimeout(() => tutorial.triggerHints('firstHandPlayed'), 1000)
    }
  }, [tutorial]))

  useGameEvent('roundEnd', useCallback(() => {
    if (!hasTriggeredRoundComplete.current) {
      hasTriggeredRoundComplete.current = true
      tutorial.triggerHints('roundComplete')
    }
  }, [tutorial]))

  useGameEvent('flowerCollected', useCallback(() => {
    tutorial.triggerHints('flowerDrawn')
  }, [tutorial]))

  useGameEvent('scoreUpdate', useCallback((data) => {
    popupIdCounterRef.current += 1
    setScorePopups((popups) => [
      ...popups,
      {
        id: popupIdCounterRef.current,
        score: data.delta,
        variant: data.delta >= 1000 ? 'critical' : data.delta >= 500 ? 'bonus' : 'default',
      },
    ])
  }, []))

  useGameEvent('yakuScored', useCallback((data) => {
    const tier = data.multiplier >= 4 ? 4 : data.multiplier >= 2 ? 3 : data.multiplier >= 1.5 ? 2 : 1
    setYakuReveals((reveals) => [
      ...reveals,
      { id: data.yakuId, japaneseName: data.yakuName, multiplier: data.multiplier, tier: tier as 1 | 2 | 3 | 4 },
    ])
  }, []))

  useGameEvent('handPlayed', useCallback((data) => {
    setCurrentPoints(data.score / (currentMult || 1))
    setIsScoreAnimating(true)
    setTimeout(() => setIsScoreAnimating(false), 1500)
  }, [currentMult]))

  useGameEvent('yakuScored', useCallback((data) => {
    setCurrentMult((prev) => prev * data.multiplier)
  }, []))

  useGameEvent('roundStart', useCallback(() => {
    setCurrentPoints(0)
    setCurrentMult(1)
  }, []))

  // ==========================================================================
  // CALLBACKS - UI interaction handlers
  // ==========================================================================

  const handlePopupComplete = useCallback((id: number) => {
    setScorePopups((popups) => popups.filter((p) => p.id !== id))
  }, [])

  const handleYakuComplete = useCallback((id: string) => {
    setYakuReveals((reveals) => reveals.filter((r) => r.id !== id))
  }, [])

  const handleTileClick = useCallback((tile: Tile) => {
    game.toggleTileSelection(tile.id)
  }, [game])

  const handleTileDiscard = useCallback((tile: Tile) => {
    game.discard(tile.id)
  }, [game])

  const handleTilesStaged = useCallback((tiles: Tile[]) => {
    setStagedTileIds(tiles.map((t) => t.id))
  }, [])

  const handleDraw = useCallback(() => game.draw(), [game])
  const handleSkip = useCallback(() => game.skipRound(), [game])
  const handleSettings = useCallback(() => navigateTo(ROUTES.SETTINGS), [navigateTo])

  const handlePlayHand = useCallback(() => {
    console.log('[PlayHand] Button clicked! isRunActive:', game.isRunActive, 'phase:', game.phase)

    const currentHandTiles = game.handTiles
    const currentSelectedIds = game.selectedTileIds

    let tileIds: string[] = []
    if (stagedTileIds.length > 0) {
      tileIds = stagedTileIds
    } else if (currentSelectedIds.length > 0) {
      tileIds = [...currentSelectedIds]
    } else {
      tileIds = currentHandTiles.map((t) => t.id)
    }

    if (tileIds.length === 0) return

    console.log('[PlayHand] Playing', tileIds.length, 'tiles')
    const result = game.playHand(tileIds)
    console.log('[PlayHand] Result:', result)

    if (result?.success) {
      if (stagedTileIds.length > 0) setStagedTileIds([])
      else if (currentSelectedIds.length > 0) game.clearSelection()
    } else if (result?.errors) {
      console.error('[PlayHand] Errors:', result.errors)
    }
  }, [game, stagedTileIds, game.handTiles, game.selectedTileIds, game.handsRemaining, game.isRunActive, game.phase])

  const handleExitGame = useCallback(() => {
    game.endRun()
    navigateTo(ROUTES.MENU)
  }, [game, navigateTo])

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const shantenDisplay = game.handTiles.length >= 13
    ? t('gameplay.tenpai')
    : t('gameplay.shanten', { count: 14 - game.handTiles.length })

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

    const detectedYaku: YakuDefinition[] = []
    if (checkTanyao(previewTiles)) detectedYaku.push(TANYAO)

    const suits = new Set(previewTiles.filter((t) => !t.isHonor).map((t) => t.suit))
    const hasHonors = previewTiles.some((t) => t.isHonor)
    const allHonorsOrTerminals = previewTiles.every((t) => t.isHonor || t.rank === 1 || t.rank === 9)

    if (suits.size === 1 && !hasHonors && previewTiles.length >= 2) detectedYaku.push(CHINITSU)
    else if (suits.size === 1 && hasHonors && previewTiles.length >= 2) detectedYaku.push(HONITSU)
    if (allHonorsOrTerminals && previewTiles.length >= 2) detectedYaku.push(HONROUTOU)

    let basePoints = 0
    for (const tile of previewTiles) {
      basePoints += tile.isHonor ? 15 : (tile.rank === 1 || tile.rank === 9) ? 10 : 5
    }

    const suitRankCounts = new Map<string, number>()
    for (const tile of previewTiles) {
      const key = `${tile.suit}-${tile.rank}`
      suitRankCounts.set(key, (suitRankCounts.get(key) || 0) + 1)
    }

    let structurePoints = 0
    for (const count of suitRankCounts.values()) {
      structurePoints += count >= 3 ? 30 : count === 2 ? 10 : 0
    }

    let mult = 1.0
    for (const yaku of detectedYaku) mult *= yaku.multiplier

    const allPairsOrTriplets = [...suitRankCounts.values()].every((count) => count >= 2)
    if (allPairsOrTriplets && previewTiles.length >= 4 && !detectedYaku.some((y) => y.id === TOITOI.id)) {
      detectedYaku.push(TOITOI)
      mult *= TOITOI.multiplier
    }

    return { points: basePoints + structurePoints, mult, total: Math.floor((basePoints + structurePoints) * mult), yaku: detectedYaku }
  }, [stagedTileIds, game.handTiles, game.selectedTileIds])

  const ownedDecrees = useMemo(() => game.state.decreeSystem.getOwnedDecrees(), [game.state.decreeSystem])
  const maxDecreeSlots = useMemo(() => 5 + game.state.flowerSystem.getBonusDecreeSlots(), [game.state.flowerSystem])
  const collectedFlowers = useMemo<FlowerVariant[]>(() => game.state.flowerSystem.getFlowers().map((f) => f.type), [game.state.flowerSystem])

  const seasonState = useMemo(() => {
    const state = game.state.seasonSystem.getState()
    return { activeSeason: state.activeSeason?.type as SeasonVariant | null, isCorrupted: state.isCorruptedRound }
  }, [game.state.seasonSystem])

  const roundType: RoundType = useMemo(() => {
    return game.currentRound === 1 ? 'Small' : game.currentRound === 2 ? 'Large' : 'Boss'
  }, [game.currentRound])

  const bossMandate = useMemo(() => {
    if (roundType === 'Boss') return game.state.roundManager.getCurrentRound()?.bossMandate?.name
    return undefined
  }, [roundType, game.state.roundManager])

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <TablePattern showOrnaments={true} animated={false} patternScale={1} className="viewport-full">
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <GameplayTopBar
          gold={game.gold}
          currentAct={game.currentAct}
          roundType={roundType}
          mandateName={bossMandate}
          t={t}
          onExit={() => setShowExitConfirm(true)}
          onSettings={handleSettings}
        />

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
          <ConsumablesBar {...consumables} />
        </div>

        {/* Score panel */}
        <ScorePanel
          targetScore={game.targetScore}
          currentScore={game.score}
          currentPoints={currentPoints}
          currentMult={currentMult}
          isScoreAnimating={isScoreAnimating}
          scorePopups={scorePopups}
          onPopupComplete={handlePopupComplete}
          t={t}
        />

        {/* Play area */}
        <PlayArea
          selectedTileCount={game.selectedTileIds.length}
          yakuReveals={yakuReveals}
          onYakuComplete={handleYakuComplete}
        />

        {/* Play Surface with Flora panel */}
        <div className="flex-1 flex mx-2 mb-2 min-h-[340px] gap-2">
          <div data-tutorial="flora" className="flex-shrink-0">
            <FloraTrackCompact
              flowers={collectedFlowers}
              activeSeason={seasonState.activeSeason}
              isCorrupted={seasonState.isCorrupted}
              onExpand={() => setIsFloraExpanded(!isFloraExpanded)}
            />
          </div>

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

        {/* Action bar */}
        <ActionBar
          wallRemaining={game.wallRemaining}
          handTileCount={game.handTiles.length}
          handsRemaining={game.handsRemaining}
          currentRound={game.currentRound}
          onSkip={handleSkip}
          onDraw={handleDraw}
          onPlayHand={handlePlayHand}
          t={t}
        />
      </div>

      {/* Tutorial overlay */}
      <ProgressiveHintOverlay
        hint={tutorial.currentHint}
        onDismiss={tutorial.dismissHint}
        onDisableHints={tutorial.disableHints}
        queueCount={tutorial.hintQueue.length}
      />

      {/* Exit confirmation */}
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

export default GameplayScreen
