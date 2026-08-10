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
import { WallDisplay } from '../gameplay/WallDisplay'
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
  const hasTriggeredBossRound = useRef(false)

  // Local UI state
  const [scorePopups, setScorePopups] = useState<ScorePopupState[]>([])
  const [yakuReveals, setYakuReveals] = useState<YakuRevealState[]>([])
  const [stagedTileIds, setStagedTileIds] = useState<string[]>([])
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showConsumablesPanel, setShowConsumablesPanel] = useState<'fateSeals' | 'celestialOrbs' | 'voidScripts' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const popupIdCounterRef = useRef(0)

  // Points/Mult display state
  const [currentPoints, setCurrentPoints] = useState(0)
  const [currentMult, setCurrentMult] = useState(1)
  const [isScoreAnimating, setIsScoreAnimating] = useState(false)

  // Flora panel expanded state
  const [isFloraExpanded, setIsFloraExpanded] = useState(false)

  // Consumables from game controller
  const consumables = game.consumableCounts

  // ==========================================================================
  // EFFECTS - Game lifecycle
  // ==========================================================================

  useEffect(() => {
    if (!game.isRunActive && game.phase === 'menu') {
      game.startNewRun()
    }
  }, [game])

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
    const result = game.discard(tile.id)
    setActionError(result.success ? null : result.errors?.[0] ?? 'Unable to discard tile')
  }, [game])

  const handleTilesStaged = useCallback((tiles: Tile[]) => {
    setStagedTileIds(tiles.map((t) => t.id))
  }, [])

  const handleSkip = useCallback(() => {
    const result = game.skipRound()
    setActionError(result.success ? null : result.errors?.[0] ?? 'Unable to skip round')
  }, [game])
  const handleSellDecree = useCallback((decreeId: string) => {
    const result = game.sellDecree(decreeId)
    setActionError(result.success ? null : result.errors?.[0] ?? 'Unable to sell Decree')
  }, [game])
  const handleRerollBossMandate = useCallback(() => {
    const result = game.rerollBossMandate()
    setActionError(
      result.success
        ? null
        : result.errors?.[0] ?? 'Unable to reroll Boss Mandate'
    )
  }, [game])
  const handleDeadWallDraw = useCallback(() => {
    const tileId = stagedTileIds[0] ?? game.selectedTileIds[0]
    if (!tileId) return
    const result = game.useDeadWallWrit(tileId)
    setActionError(
      result.success ? null : result.errors?.[0] ?? 'Unable to draw from Dead Wall'
    )
    if (result.success) setStagedTileIds([])
  }, [game, stagedTileIds])
  const handleSettings = useCallback(() => navigateTo(ROUTES.SETTINGS), [navigateTo])

  const handlePlayHand = useCallback(() => {
    const currentHandTiles = game.handTiles
    const currentSelectedIds = game.selectedTileIds

    let tileIds: string[] = []
    if (stagedTileIds.length > 0) {
      tileIds = stagedTileIds
    } else if (currentSelectedIds.length > 0) {
      tileIds = [...currentSelectedIds]
    } else {
      tileIds = currentHandTiles.map((tile) => tile.id)
    }

    if (tileIds.length < 2) {
      setActionError(t('gameplay.selectAtLeastTwo', 'Select at least 2 tiles to play.'))
      return
    }

    const result = game.playHand(tileIds)

    if (result?.success) {
      setActionError(null)
      if (stagedTileIds.length > 0) setStagedTileIds([])
      else if (currentSelectedIds.length > 0) game.clearSelection()
    } else if (result?.errors) {
      setActionError(result.errors[0])
    }
  }, [game, stagedTileIds, t])

  const handleRedraw = useCallback(() => {
    const tileIds = stagedTileIds.length > 0
      ? stagedTileIds
      : game.selectedTileIds

    const result = game.redraw(tileIds)
    if (result.success) {
      setActionError(null)
      setStagedTileIds([])
      game.clearSelection()
    } else {
      setActionError(result.errors?.[0] ?? 'Unable to redraw tiles')
    }
  }, [game, stagedTileIds])

  const handleExitGame = useCallback(() => {
    game.endRun()
    navigateTo(ROUTES.MENU)
  }, [game, navigateTo])

  // Consumable handlers
  const handleShowFateSeals = useCallback(() => {
    if (game.consumableCounts.fateSeals > 0) {
      setShowConsumablesPanel('fateSeals')
    }
  }, [game.consumableCounts.fateSeals])

  const handleShowCelestialOrbs = useCallback(() => {
    if (game.consumableCounts.celestialOrbs > 0) {
      setShowConsumablesPanel('celestialOrbs')
    }
  }, [game.consumableCounts.celestialOrbs])

  const handleShowVoidScripts = useCallback(() => {
    if (game.consumableCounts.voidScripts > 0) {
      setShowConsumablesPanel('voidScripts')
    }
  }, [game.consumableCounts.voidScripts])

  const handleUseFateSeal = useCallback((sealId: string) => {
    const result = game.useFateSeal(sealId)
    if (result.success) {
      setShowConsumablesPanel(null)
    }
  }, [game])

  const handleUseVoidScript = useCallback((scriptId: string) => {
    const result = game.useVoidScript(scriptId)
    if (result.success) {
      setShowConsumablesPanel(null)
    }
  }, [game])

  const handleUseCelestialOrb = useCallback((orbId: string) => {
    const result = game.useCelestialOrb(orbId)
    if (result.success) {
      setActionError(null)
      setShowConsumablesPanel(null)
    } else {
      setActionError(result.errors?.[0] ?? 'Unable to use Celestial Orb')
    }
  }, [game])

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const faceDownTileIds = useMemo(
    () => new Set(game.faceDownTileIds),
    [game.faceDownTileIds]
  )
  const lockedTileIds = useMemo(
    () => new Set(game.lockedTileIds),
    [game.lockedTileIds]
  )
  const debuffedTileIds = useMemo(
    () => new Set(game.debuffedTileIds),
    [game.debuffedTileIds]
  )

  const shantenDisplay = game.handTiles.some((tile) => faceDownTileIds.has(tile.id))
    ? '???'
    : game.handTiles.length >= 13
      ? t('gameplay.tenpai')
      : t('gameplay.shanten', { count: 14 - game.handTiles.length })

  const previewTileIds = stagedTileIds.length > 0
    ? stagedTileIds
    : game.selectedTileIds
  const scorePreviewHidden = previewTileIds.some((tileId) =>
    faceDownTileIds.has(tileId)
  )
  const tanyaoAllowsTerminals = game.state.decreeSystem
    .getActiveDecrees()
    .some(
      (decree) =>
        decree.effect.type === 'rule_modification' &&
        decree.effect.ruleId === 'tanyao_terminals' &&
        !game.state.mandateEffectSystem.isDecreeDisabled(decree.id)
    )

  const scorePreview = useMemo(() => {
    // Only show preview when tiles are explicitly selected or staged
    if (stagedTileIds.length === 0 && game.selectedTileIds.length === 0) {
      return null
    }

    let previewTiles: Tile[] = []
    if (stagedTileIds.length > 0) {
      previewTiles = game.handTiles.filter((t) => stagedTileIds.includes(t.id))
    } else {
      previewTiles = game.handTiles.filter((t) => game.selectedTileIds.includes(t.id))
    }

    if (
      previewTiles.length === 0 ||
      previewTiles.some((tile) => faceDownTileIds.has(tile.id))
    ) return null

    const detectedYaku: YakuDefinition[] = []
    if (checkTanyao(previewTiles, tanyaoAllowsTerminals)) detectedYaku.push(TANYAO)

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
  }, [
    stagedTileIds,
    game.handTiles,
    game.selectedTileIds,
    faceDownTileIds,
    tanyaoAllowsTerminals,
  ])

  const ownedDecrees = game.state.decreeSystem.getOwnedDecrees()
  const displayedDecrees = useMemo(() => {
    if (!game.decreesFaceDown || game.decreeDisplayOrderIds.length === 0) {
      return ownedDecrees
    }

    const remaining = [...ownedDecrees]
    const ordered = game.decreeDisplayOrderIds.flatMap((decreeId) => {
      const index = remaining.findIndex((decree) => decree.id === decreeId)
      return index === -1 ? [] : remaining.splice(index, 1)
    })
    return [...ordered, ...remaining]
  }, [ownedDecrees, game.decreesFaceDown, game.decreeDisplayOrderIds])
  const disabledDecreeIds = new Set(game.disabledDecreeIds)
  const maxDecreeSlots = game.state.decreeSystem.getMaxSlots()
  const collectedFlowers: FlowerVariant[] = game.state.flowerSystem
    .getFlowers()
    .map((flower) => flower.type)

  const currentSeasonState = game.state.seasonSystem.getState()
  const seasonState = {
    activeSeason: currentSeasonState.activeSeason?.type as SeasonVariant | null,
    isCorrupted: currentSeasonState.isCorruptedRound,
  }

  const roundType: RoundType = useMemo(() => {
    return game.currentRound === 1 ? 'Small' : game.currentRound === 2 ? 'Large' : 'Boss'
  }, [game.currentRound])

  const bossMandate = roundType === 'Boss'
    ? game.state.roundManager.getCurrentRound()?.bossMandate?.name
    : undefined
  const mandateRerollsRemaining =
    game.state.charterSystem.getMandateRerollsRemaining()
  const upcomingMandate =
    roundType !== 'Boss' && mandateRerollsRemaining !== 0
      ? game.state.roundManager
          .getCurrentAct()
          ?.rounds.find((round) => round.roundType === 'Boss')
          ?.bossMandate?.name
      : undefined
  const hasDeadWallWrit = displayedDecrees.some(
    (decree) =>
      decree.effect.type === 'rule_modification' &&
      decree.effect.ruleId === 'dead_wall_draw' &&
      !disabledDecreeIds.has(decree.id)
  )
  const deadWallTileId = stagedTileIds[0] ?? game.selectedTileIds[0]

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <TablePattern showOrnaments={true} animated={false} patternScale={1} className="viewport-full">
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        {/* Top bar */}
        <GameplayTopBar
          gold={game.gold}
          currentAct={game.currentAct}
          roundType={roundType}
          mandateName={bossMandate}
          upcomingMandateName={upcomingMandate}
          canRerollMandate={game.canRerollBossMandate()}
          onRerollMandate={handleRerollBossMandate}
          t={t}
          onExit={() => setShowExitConfirm(true)}
          onSettings={handleSettings}
        />

        <div className="flex flex-shrink-0 items-center gap-2 px-3 py-1.5">
          {/* Decree bar */}
          <div data-tutorial="decrees" className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-1">
            {displayedDecrees.map((decree, index) => (
              <DecreeCardCompact
                key={`${decree.id}-${index}`}
                decree={decree}
                faceDown={game.decreesFaceDown}
                disabledByMandate={disabledDecreeIds.has(decree.id)}
                onSell={() => handleSellDecree(decree.id)}
              />
            ))}
            {Array.from({ length: Math.max(0, maxDecreeSlots - ownedDecrees.length) }).map((_, i) => (
              <DecreeSlotEmpty key={`empty-${i}`} isLocked={i >= maxDecreeSlots - ownedDecrees.length} />
            ))}
          </div>

          <div className="flex-shrink-0">
            <ConsumablesBar
              {...consumables}
              onUseFateSeal={handleShowFateSeals}
              onUseCelestialOrb={handleShowCelestialOrbs}
              onUseVoidScript={handleShowVoidScripts}
            />
          </div>
        </div>

        {game.state.mandateEffectSystem.areAllTilesDebuffed() && (
          <div className="mx-4 mb-2 rounded border border-emerald-300/60 bg-emerald-950/80 px-3 py-1.5 text-center text-xs font-semibold text-emerald-100">
            Verdant Leaf: all tiles are debuffed. Sell one Decree above to clear it.
          </div>
        )}

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
          stagedTileCount={stagedTileIds.length}
          handTileCount={game.handTiles.length}
          scorePreview={scorePreview}
          scorePreviewHidden={scorePreviewHidden}
          yakuReveals={yakuReveals}
          onYakuComplete={handleYakuComplete}
        />

        {/* Play Surface with Flora panel and Wall display */}
        <div className="relative mx-2 mb-1 flex min-h-0 flex-1 items-end gap-2">
          <div data-tutorial="flora" className="absolute left-0 top-0 z-10 md:static md:flex-shrink-0">
            <FloraTrackCompact
              flowers={collectedFlowers}
              activeSeason={seasonState.activeSeason}
              isCorrupted={seasonState.isCorrupted}
              onExpand={() => setIsFloraExpanded(!isFloraExpanded)}
            />
          </div>

          <div data-tutorial="hand" className="min-w-0 flex-1">
            <PlaySurface
              handTiles={game.handTiles}
              tileSize={tileSize}
              selectedIds={new Set(game.selectedTileIds)}
              faceDownIds={faceDownTileIds}
              lockedIds={lockedTileIds}
              debuffedIds={debuffedTileIds}
              onTileSelect={handleTileClick}
              onTileDiscard={handleTileDiscard}
              onTilesStaged={handleTilesStaged}
              disabled={false}
              shantenDisplay={shantenDisplay}
              handsRemaining={game.handsRemaining}
              discardsRemaining={game.discardsRemaining}
              t={t}
            />
          </div>

          <div data-tutorial="wall" className="absolute right-0 top-0 z-10 md:static md:w-48 md:flex-shrink-0">
            <div className="md:hidden">
              <WallDisplay wallTiles={game.wallTiles} compact />
            </div>
            <div className="hidden md:block">
              <WallDisplay wallTiles={game.wallTiles} />
            </div>
          </div>
        </div>

        {actionError && (
          <div
            role="alert"
            className="mx-4 mb-2 rounded-lg border border-red-400/60 bg-red-950/70 px-3 py-2 text-center text-sm text-red-100"
          >
            {actionError}
          </div>
        )}

        {/* Action bar */}
        <ActionBar
          wallRemaining={game.wallRemaining}
          handsRemaining={game.handsRemaining}
          discardsRemaining={game.discardsRemaining}
          redrawsRemaining={game.redrawsRemaining}
          selectedTileCount={stagedTileIds.length || game.selectedTileIds.length}
          currentRound={game.currentRound}
          onSkip={handleSkip}
          onRedraw={handleRedraw}
          onPlayHand={handlePlayHand}
          canUseDeadWallWrit={
            (stagedTileIds.length || game.selectedTileIds.length) === 1 &&
            game.canUseDeadWallWrit(deadWallTileId)
          }
          onDeadWallDraw={hasDeadWallWrit ? handleDeadWallDraw : undefined}
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

      {/* Consumables selection panel */}
      {showConsumablesPanel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[var(--color-dark-forest)] border border-[var(--color-forest-green)] rounded-lg p-4 m-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-golden-accent)]">
                {showConsumablesPanel === 'fateSeals' && t('consumables.fateSeals', 'Fate Seals')}
                {showConsumablesPanel === 'celestialOrbs' && t('consumables.celestialOrbs', 'Celestial Orbs')}
                {showConsumablesPanel === 'voidScripts' && t('consumables.voidScripts', 'Void Scripts')}
              </h3>
              <button
                onClick={() => setShowConsumablesPanel(null)}
                className="text-[var(--color-beige-white)] hover:text-white text-xl px-2"
                aria-label={t('common.close', 'Close')}
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {showConsumablesPanel === 'fateSeals' && game.fateSeals.map((seal, index) => (
                <button
                  key={seal.instanceId || index}
                  onClick={() => handleUseFateSeal(seal.instanceId)}
                  className="w-full text-left p-3 bg-[var(--color-forest-green)]/50 hover:bg-[var(--color-forest-green)] rounded-lg border border-purple-500/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎴</span>
                    <div>
                      <div className="font-medium text-[var(--color-beige-white)]">{seal.name}</div>
                      <div className="text-sm text-[var(--color-beige-white)]/70">{seal.description}</div>
                    </div>
                  </div>
                </button>
              ))}

              {showConsumablesPanel === 'celestialOrbs' && game.celestialOrbs.map((orb, index) => (
                <button
                  key={orb.instanceId || index}
                  onClick={() => handleUseCelestialOrb(orb.instanceId)}
                  className="w-full text-left p-3 bg-[var(--color-forest-green)]/50 hover:bg-[var(--color-forest-green)] rounded-lg border border-blue-500/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔮</span>
                    <div>
                      <div className="font-medium text-[var(--color-beige-white)]">{orb.name}</div>
                      <div className="text-sm text-[var(--color-beige-white)]/70">{orb.description}</div>
                      <div className="text-xs text-blue-300">Level: {orb.currentLevel || 1}</div>
                    </div>
                  </div>
                </button>
              ))}

              {showConsumablesPanel === 'voidScripts' && game.voidScripts.map((script, index) => (
                <button
                  key={script.instanceId || index}
                  onClick={() => handleUseVoidScript(script.instanceId)}
                  className="w-full text-left p-3 bg-[var(--color-forest-green)]/50 hover:bg-[var(--color-forest-green)] rounded-lg border border-gray-500/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📜</span>
                    <div>
                      <div className="font-medium text-[var(--color-beige-white)]">{script.name}</div>
                      <div className="text-sm text-[var(--color-beige-white)]/70">{script.description}</div>
                      {script.penalty && (
                        <div className="text-xs text-red-400 mt-1">⚠️ {script.penalty.description}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {((showConsumablesPanel === 'fateSeals' && game.fateSeals.length === 0) ||
                (showConsumablesPanel === 'celestialOrbs' && game.celestialOrbs.length === 0) ||
                (showConsumablesPanel === 'voidScripts' && game.voidScripts.length === 0)) && (
                <div className="text-center text-[var(--color-beige-white)]/50 py-4">
                  {t('consumables.none', 'No consumables available')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </TablePattern>
  )
}

export default GameplayScreen
