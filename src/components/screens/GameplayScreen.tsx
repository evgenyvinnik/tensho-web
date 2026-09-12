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
import { calculateShanten } from '../../rules/ShantenCalculator'
import { useItemText } from '../../i18n/useItemText'

// Extracted gameplay components
import { DecreeCardCompact, DecreeSlotEmpty } from '../gameplay/DecreeBar'
import { FloraTrackCompact } from '../gameplay/FloraTrackCompact'
import { ConsumablesBar } from '../gameplay/ConsumablesBar'
import { ConsumableDialog } from '../gameplay/ConsumableDialog'
import { getTableStyleIllustration } from '../../utils/assets'
import {
  getDefaultTableStyle,
  getTableStyleById,
} from '../../config/tableStyleDefinitions'
import { GameplayTopBar } from '../gameplay/GameplayTopBar'
import { ScorePanel } from '../gameplay/ScorePanel'
import { ActionBar } from '../gameplay/ActionBar'
import { PlayArea } from '../gameplay/PlayArea'
import { WallDisplay } from '../gameplay/WallDisplay'
import { BeginnerGuide } from '../gameplay/BeginnerGuide'
import {
  buildCoachAdvice,
  findBeginnerSuggestion,
  selectionMatchesSuggestion,
} from '../../gameplay/beginnerCoach'
import {
  RoundType,
  ScorePopupState,
  YakuRevealState,
} from '../gameplay/gameplayTypes'

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
  const itemText = useItemText()
  const currentTableStyle =
    getTableStyleById(game.state.tableStyleId) ?? getDefaultTableStyle()

  const beginnerSuggestion = useMemo(
    () => findBeginnerSuggestion(game.handTiles, new Set(game.faceDownTileIds)),
    [game.handTiles, game.faceDownTileIds]
  )

  // Responsive tile size
  const tileSize = useResponsiveTileSize()

  // Progressive tutorial hints
  const progressiveHints = useMemo(
    () => getProgressiveHints(t, beginnerSuggestion?.kind),
    [t, beginnerSuggestion?.kind]
  )
  const tutorial = useProgressiveTutorial(progressiveHints)

  // Tutorial trigger refs
  const hasTriggeredGameStart = useRef(false)
  const hasTriggeredFirstDiscard = useRef(false)
  const hasTriggeredFirstHand = useRef(false)
  const hasTriggeredBossRound = useRef(false)

  // Local UI state
  const [scorePopups, setScorePopups] = useState<ScorePopupState[]>([])
  const [yakuReveals, setYakuReveals] = useState<YakuRevealState[]>([])
  const [stagedTileIds, setStagedTileIds] = useState<string[]>([])
  const [stageAllRequestId, setStageAllRequestId] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showBeginnerGuide, setShowBeginnerGuide] = useState(false)
  const [hasCompletedFirstPlay, setHasCompletedFirstPlay] = useState(false)
  const [forceBeginnerCoach, setForceBeginnerCoach] = useState(false)
  // Hides the two-option coach for the rest of the session once the player
  // says they no longer need it. Manual hints stay available.
  const [coachDismissed, setCoachDismissed] = useState(false)
  const [showConsumablesPanel, setShowConsumablesPanel] = useState<
    'fateSeals' | 'celestialOrbs' | 'voidScripts' | null
  >(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const popupIdCounterRef = useRef(0)
  const isExitingRef = useRef(false)

  // Points/Mult display state
  const [currentPoints, setCurrentPoints] = useState(0)
  const [currentMult, setCurrentMult] = useState(1)
  const [isScoreAnimating, setIsScoreAnimating] = useState(false)

  // Consumables from game controller
  const consumables = game.consumableCounts

  // ==========================================================================
  // EFFECTS - Game lifecycle
  // ==========================================================================

  useEffect(() => {
    if (!isExitingRef.current && !game.isRunActive && game.phase === 'menu') {
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
    if (
      game.isRunActive &&
      beginnerSuggestion &&
      !hasTriggeredGameStart.current
    ) {
      const timer = setTimeout(() => {
        if (!hasTriggeredGameStart.current) {
          hasTriggeredGameStart.current = true
          tutorial.triggerHints('gameStart')
        }
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [beginnerSuggestion, game.isRunActive, tutorial])

  useEffect(() => {
    if (!game.isRunActive) {
      hasTriggeredGameStart.current = false
      hasTriggeredFirstDiscard.current = false
      hasTriggeredFirstHand.current = false
      hasTriggeredBossRound.current = false
      setHasCompletedFirstPlay(false)
      setForceBeginnerCoach(false)
    }
  }, [game.isRunActive])

  useEffect(() => {
    if (game.currentRound === 3 && !hasTriggeredBossRound.current) {
      hasTriggeredBossRound.current = true
      tutorial.triggerHints('bossRound')
    }
  }, [game.currentRound, tutorial])

  // ==========================================================================
  // EVENT HANDLERS - Game events
  // ==========================================================================

  useGameEvent(
    'tileDiscarded',
    useCallback(() => {
      if (!hasTriggeredFirstDiscard.current) {
        hasTriggeredFirstDiscard.current = true
        setTimeout(() => tutorial.triggerHints('firstDiscard'), 500)
      }
    }, [tutorial])
  )

  useGameEvent(
    'handPlayed',
    useCallback(() => {
      setHasCompletedFirstPlay(true)
      setForceBeginnerCoach(false)
      if (!hasTriggeredFirstHand.current) {
        hasTriggeredFirstHand.current = true
        setTimeout(() => tutorial.triggerHints('firstHandPlayed'), 1000)
      }
    }, [tutorial])
  )

  useGameEvent(
    'flowerCollected',
    useCallback(() => {
      tutorial.triggerHints('flowerDrawn')
    }, [tutorial])
  )

  useGameEvent(
    'scoreUpdate',
    useCallback((data) => {
      popupIdCounterRef.current += 1
      setScorePopups((popups) => [
        ...popups,
        {
          id: popupIdCounterRef.current,
          score: data.delta,
          variant:
            data.delta >= 1000
              ? 'critical'
              : data.delta >= 500
                ? 'bonus'
                : 'default',
        },
      ])
    }, [])
  )

  useGameEvent(
    'yakuScored',
    useCallback((data) => {
      const tier =
        data.multiplier >= 4
          ? 4
          : data.multiplier >= 2
            ? 3
            : data.multiplier >= 1.5
              ? 2
              : 1
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

  useGameEvent(
    'handPlayed',
    useCallback(
      (data) => {
        setCurrentPoints(data.score / (currentMult || 1))
        setIsScoreAnimating(true)
        setTimeout(() => setIsScoreAnimating(false), 1500)
      },
      [currentMult]
    )
  )

  useGameEvent(
    'yakuScored',
    useCallback((data) => {
      setCurrentMult((prev) => prev * data.multiplier)
    }, [])
  )

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
      const result = game.discard(tile.id)
      setActionError(
        result.success ? null : (result.errors?.[0] ?? 'Unable to discard tile')
      )
    },
    [game]
  )

  const handleTilesStaged = useCallback((tiles: Tile[]) => {
    setStagedTileIds(tiles.map((t) => t.id))
  }, [])

  const handleSkip = useCallback(() => {
    const result = game.skipRound()
    setActionError(
      result.success ? null : (result.errors?.[0] ?? 'Unable to skip round')
    )
  }, [game])
  const handleSellDecree = useCallback(
    (decreeId: string) => {
      const result = game.sellDecree(decreeId)
      setActionError(
        result.success ? null : (result.errors?.[0] ?? 'Unable to sell Decree')
      )
    },
    [game]
  )
  const handleRerollBossMandate = useCallback(() => {
    const result = game.rerollBossMandate()
    setActionError(
      result.success
        ? null
        : (result.errors?.[0] ?? 'Unable to reroll Boss Mandate')
    )
  }, [game])
  const handleDeadWallDraw = useCallback(() => {
    const tileId = stagedTileIds[0] ?? game.selectedTileIds[0]
    if (!tileId) return
    const result = game.useDeadWallWrit(tileId)
    setActionError(
      result.success
        ? null
        : (result.errors?.[0] ?? 'Unable to draw from Dead Wall')
    )
    if (result.success) setStagedTileIds([])
  }, [game, stagedTileIds])
  const handleSettings = useCallback(
    () => navigateTo(ROUTES.SETTINGS),
    [navigateTo]
  )
  const handleOpenBeginnerGuide = useCallback(() => {
    setForceBeginnerCoach(true)
    setShowBeginnerGuide(true)
  }, [])

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
      if (!game.isCompleteHand(tileIds)) {
        setActionError(
          t(
            'gameplay.completeOrSelectTactical',
            t(
              'gameplay.tacticalHintLong',
              'Select {{min}}–{{max}} tiles for a tactical play, or complete the hand before declaring it.',
              { min: 2, max: 5 }
            )
          )
        )
        return
      }

      setActionError(null)
      game.selectAllTiles()
      setStageAllRequestId((requestId) => requestId + 1)
      return
    }

    if (tileIds.length < 2) {
      setActionError(
        t('gameplay.selectAtLeastTwo', 'Select at least 2 tiles to play.')
      )
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
    const tileIds =
      stagedTileIds.length > 0 ? stagedTileIds : game.selectedTileIds

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
    // endRun publishes the reset before navigation necessarily unmounts us.
    // Do not mistake that intermediate menu state for a fresh /play visit.
    isExitingRef.current = true
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

  const shantenDisplay = useMemo(() => {
    if (game.handTiles.some((tile) => faceDownTileIds.has(tile.id)))
      return '???'
    const result = calculateShanten(game.handTiles, game.state.melds)
    if (result.shanten < 0) {
      return t('gameplay.completeHand', 'Complete hand')
    }
    if (result.shanten === 0) return t('gameplay.tenpai', 'Tenpai')
    return t('gameplay.shanten', { count: result.shanten })
  }, [game.handTiles, game.state.melds, faceDownTileIds, t])

  const previewTileIds =
    stagedTileIds.length > 0
      ? stagedTileIds
      : game.selectedTileIds.length > 0
        ? game.selectedTileIds
        : game.handTiles.map((tile) => tile.id)
  const activePreviewTileIds =
    stagedTileIds.length > 0 ? stagedTileIds : game.selectedTileIds
  const beginnerCoachActive = Boolean(
    beginnerSuggestion &&
    (forceBeginnerCoach || (!hasCompletedFirstPlay && !tutorial.isDisabled))
  )
  const beginnerHighlightedIds = useMemo(
    () =>
      new Set(
        beginnerCoachActive && beginnerSuggestion
          ? beginnerSuggestion.tileIds
          : []
      ),
    [beginnerCoachActive, beginnerSuggestion]
  )
  const beginnerSelectionMatches = Boolean(
    beginnerSuggestion &&
    selectionMatchesSuggestion(beginnerSuggestion, activePreviewTileIds)
  )
  const beginnerPatternLabel =
    beginnerSuggestion?.kind && beginnerSuggestion.kind !== 'redraw'
      ? t(`melds.${beginnerSuggestion.kind}`, beginnerSuggestion.kind)
      : null
  const beginnerPreviewLabel = beginnerSelectionMatches
    ? beginnerSuggestion?.kind === 'redraw'
      ? t('gameplay.beginnerRedrawForecast', 'Ready to Redraw')
      : t(
          'gameplay.beginnerPatternForecast',
          '{{pattern}} · +{{points}} shape points',
          {
            pattern: beginnerPatternLabel,
            points: beginnerSuggestion?.structurePoints ?? 0,
          }
        )
    : beginnerCoachActive && beginnerSuggestion
      ? beginnerSuggestion.kind === 'redraw'
        ? t('gameplay.beginnerChooseRedraw', 'Choose the glowing tiles')
        : t('gameplay.beginnerFindPattern', 'Find the glowing {{pattern}}', {
            pattern: beginnerPatternLabel,
          })
      : null
  // The coach prices real selections with the game's own preview, so its two
  // recommendations cannot drift from what a play actually pays.
  const coachAdvice = useMemo(() => {
    if (!beginnerCoachActive || coachDismissed) return null
    return buildCoachAdvice({
      tiles: game.handTiles,
      concealedIds: faceDownTileIds,
      requiredTileIds: game.lockedTileIds,
      scoreSelection: (tileIds) =>
        game.previewScore(tileIds)?.finalScore ?? null,
      remainingToTarget: Math.max(0, game.targetScore - game.score),
      handsRemaining: game.handsRemaining,
    })
  }, [beginnerCoachActive, coachDismissed, game, faceDownTileIds])

  const handleCoachChoose = useCallback(
    (tileIds: string[]) => {
      setStagedTileIds([])
      game.clearSelection()
      for (const tileId of tileIds) game.selectTile(tileId)
    },
    [game]
  )

  const scorePreviewHidden = previewTileIds.some((tileId) =>
    faceDownTileIds.has(tileId)
  )
  const scorePreview = useMemo(() => {
    const previewIds =
      stagedTileIds.length > 0
        ? stagedTileIds
        : game.selectedTileIds.length > 0
          ? game.selectedTileIds
          : game.handTiles.map((tile) => tile.id)
    const previewTiles = game.handTiles.filter((tile) =>
      previewIds.includes(tile.id)
    )

    if (
      previewTiles.length === 0 ||
      previewTiles.some((tile) => faceDownTileIds.has(tile.id))
    )
      return null

    // Preview runs the real scoring pipeline, so what is shown is what is paid.
    const breakdown = game.previewScore(previewTiles.map((tile) => tile.id))
    if (!breakdown) return null

    const points = breakdown.basePoints + breakdown.additiveBonus
    const mult =
      points > 0 ? breakdown.finalScore / points : breakdown.yakuMultiplier

    return {
      points,
      mult,
      total: breakdown.finalScore,
      yaku: breakdown.detectedYaku.map((detected) => detected.definition),
    }
  }, [stagedTileIds, game, faceDownTileIds])

  const isCompleteHandSelection =
    previewTileIds.length > 5 &&
    !scorePreviewHidden &&
    game.isCompleteHand(previewTileIds)

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

  const roundType: RoundType = useMemo(() => {
    return game.currentRound === 1
      ? 'Small'
      : game.currentRound === 2
        ? 'Large'
        : 'Boss'
  }, [game.currentRound])

  const bossMandate =
    roundType === 'Boss'
      ? game.state.roundManager.getCurrentRound()?.bossMandate?.name
      : undefined
  const fixedHandMandate =
    game.state.roundManager.checkMandateEffect('fixed_hand_size')
  const requiredPlaySize = fixedHandMandate.active
    ? Number(fixedHandMandate.value)
    : undefined
  const mandateRerollsRemaining =
    game.state.charterSystem.getMandateRerollsRemaining()
  const upcomingMandate =
    roundType !== 'Boss' && mandateRerollsRemaining !== 0
      ? game.state.roundManager
          .getCurrentAct()
          ?.rounds.find((round) => round.roundType === 'Boss')?.bossMandate
          ?.name
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
    <TablePattern
      showOrnaments={true}
      animated={false}
      patternScale={1}
      artwork={getTableStyleIllustration(currentTableStyle.id)}
      artworkOpacity={0.68}
      className="viewport-full"
    >
      <div
        data-gameplay-scroll
        className="mx-auto flex h-full min-h-0 w-full max-w-[1280px] scroll-pb-24 scroll-pt-3 flex-col overflow-y-auto overscroll-contain border-x border-white/5 bg-black/5 shadow-2xl [&>*]:shrink-0"
      >
        {/* Top bar */}
        <GameplayTopBar
          gold={game.gold}
          stake={game.state.stake}
          currentAct={game.currentAct}
          hasEnteredEndless={game.hasEnteredEndless}
          roundType={roundType}
          mandateName={bossMandate}
          upcomingMandateName={upcomingMandate}
          canRerollMandate={game.canRerollBossMandate()}
          onRerollMandate={handleRerollBossMandate}
          t={t}
          onExit={() => setShowExitConfirm(true)}
          onSettings={handleSettings}
        />

        <div className="gameplay-inventory-row flex flex-shrink-0 items-center gap-2 px-3 py-1.5">
          <div
            data-gameplay-table-identity
            data-table-style-id={currentTableStyle.id}
            role="img"
            aria-label={t('gameplay.activeTable', 'Active table: {{name}}', {
              name: itemText.name('tableStyles', {
                ...currentTableStyle,
                name: currentTableStyle.displayName,
              }),
            })}
            title={itemText.name('tableStyles', {
              ...currentTableStyle,
              name: currentTableStyle.displayName,
            })}
            className="gameplay-table-chip relative flex h-16 w-16 shrink-0 items-end overflow-hidden rounded-xl border-2 bg-black/45 shadow-lg sm:w-36"
            style={{
              borderColor: currentTableStyle.themeColor,
              boxShadow: `0 0 18px ${currentTableStyle.themeColor}45`,
            }}
          >
            <img
              src={getTableStyleIllustration(currentTableStyle.id)}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1"
              style={{ backgroundColor: currentTableStyle.themeColor }}
            />
            <span className="relative hidden min-w-0 px-2 pb-1.5 text-left sm:block">
              <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-[var(--color-metallic-gold)]">
                {t('gameplay.activeTableLabel', 'Table')}
              </span>
              <span className="block truncate text-xs font-bold text-white drop-shadow">
                {itemText.name('tableStyles', {
                  ...currentTableStyle,
                  name: currentTableStyle.displayName,
                })}
              </span>
            </span>
          </div>

          {/* Decree bar */}
          <div
            data-tutorial="decrees"
            className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-1"
          >
            {displayedDecrees.map((decree, index) => (
              <DecreeCardCompact
                key={`${decree.id}-${index}`}
                decree={decree}
                faceDown={game.decreesFaceDown}
                disabledByMandate={disabledDecreeIds.has(decree.id)}
                onSell={() => handleSellDecree(decree.id)}
              />
            ))}
            {Array.from({
              length: Math.max(0, maxDecreeSlots - ownedDecrees.length),
            }).map((_, i) => (
              <DecreeSlotEmpty
                key={`empty-${i}`}
                isLocked={i >= maxDecreeSlots - ownedDecrees.length}
              />
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
            Verdant Leaf: all tiles are debuffed. Sell one Decree above to clear
            it.
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
          previewLabel={
            stagedTileIds.length > 5 && isCompleteHandSelection
              ? `${previewTileIds.length} staged tiles · confirm declaration`
              : beginnerPreviewLabel
                ? beginnerPreviewLabel
                : stagedTileIds.length > 0 || game.selectedTileIds.length > 0
                  ? `${previewTileIds.length} selected tiles`
                  : isCompleteHandSelection
                    ? `Complete ${previewTileIds.length}-tile hand · stage to declare`
                    : t(
                        'gameplay.chooseTacticalGroup',
                        'Choose a tactical group'
                      )
          }
          remainingToTarget={Math.max(0, game.targetScore - game.score)}
          handsRemaining={game.handsRemaining}
          coachAdvice={coachAdvice}
          onCoachChoose={handleCoachChoose}
          onCoachDismiss={() => setCoachDismissed(true)}
          yakuReveals={yakuReveals}
          onYakuComplete={handleYakuComplete}
          tableThemeColor={currentTableStyle.themeColor}
          tableAccentColor={currentTableStyle.accentColor}
        />

        {/* Play Surface with Flora panel and Wall display */}
        <div
          data-gameplay-surface
          className="relative mx-2 mb-1 grid flex-1 grid-cols-2 content-start items-start gap-2 md:grid-cols-[auto_minmax(0,1fr)_auto]"
        >
          <div data-tutorial="flora" className="order-1 min-w-0">
            <FloraTrackCompact flora={game.flora} />
          </div>

          <div
            data-tutorial="hand"
            className="order-3 col-span-2 min-w-0 md:order-2 md:col-span-1"
          >
            <PlaySurface
              handTiles={game.handTiles}
              tileSize={tileSize}
              selectedIds={new Set(game.selectedTileIds)}
              highlightedIds={beginnerHighlightedIds}
              faceDownIds={faceDownTileIds}
              lockedIds={lockedTileIds}
              debuffedIds={debuffedTileIds}
              onTileSelect={handleTileClick}
              onTileDiscard={handleTileDiscard}
              onTilesStaged={handleTilesStaged}
              stageAllRequestId={stageAllRequestId}
              disabled={false}
              shantenDisplay={shantenDisplay}
              handsRemaining={game.handsRemaining}
              discardsRemaining={game.discardsRemaining}
              tableThemeColor={currentTableStyle.themeColor}
              tableAccentColor={currentTableStyle.accentColor}
              beginnerSuggestion={
                beginnerCoachActive ? beginnerSuggestion : null
              }
              onOpenBeginnerGuide={handleOpenBeginnerGuide}
              t={t}
            />
          </div>

          <div
            data-tutorial="wall"
            className="order-2 min-w-0 justify-self-end md:order-3 md:w-48"
          >
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
          redrawAllowed={game.canPerformAction({
            type: 'redraw',
            tileIds: stagedTileIds.length
              ? stagedTileIds
              : game.selectedTileIds,
          })}
          selectedTileCount={
            stagedTileIds.length || game.selectedTileIds.length
          }
          handTileCount={game.handTiles.length}
          isCompleteHandSelection={isCompleteHandSelection}
          playAllowed={game.canPerformAction({
            type: 'play',
            tileIds: previewTileIds,
          })}
          playRestriction={
            game.lockedTileIds.some((id) => !previewTileIds.includes(id))
              ? t('tiles.lockedMustPlay', 'Locked tile: must be played')
              : undefined
          }
          requiredPlaySize={requiredPlaySize}
          currentRound={game.currentRound}
          onSkip={handleSkip}
          onRedraw={handleRedraw}
          onPlayHand={handlePlayHand}
          projectedScore={scorePreview?.total}
          willClear={
            scorePreview !== null &&
            scorePreview.total >= Math.max(0, game.targetScore - game.score)
          }
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

      <BeginnerGuide
        isOpen={showBeginnerGuide}
        onClose={() => setShowBeginnerGuide(false)}
      />

      {/* Exit confirmation */}
      <ConfirmPopup
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={handleExitGame}
        title={t('gameplay.exitGame', 'Exit Game')}
        message={t(
          'gameplay.exitConfirm',
          'Are you sure you want to exit? Your current run progress will be lost.'
        )}
        confirmText={t('common.exit', 'Exit')}
        cancelText={t('common.cancel', 'Cancel')}
      />

      {showConsumablesPanel && (
        <ConsumableDialog
          key={showConsumablesPanel}
          title={t(`consumableUse.${showConsumablesPanel}`)}
          items={game[showConsumablesPanel]}
          tiles={game.handTiles}
          concealedIds={faceDownTileIds}
          lastCopyableConsumable={game.state.fateSealSystem.getLastUsedConsumable()}
          scriptDownsideProtected={game.state.omenSystem.hasVoidScriptDownsideProtection()}
          canUse={game.canPerformAction}
          validateUse={game.validateConsumableAction}
          onUse={game.processAction}
          onClose={() => setShowConsumablesPanel(null)}
        />
      )}
    </TablePattern>
  )
}

export default GameplayScreen
