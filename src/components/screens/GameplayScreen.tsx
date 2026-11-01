/**
 * GameplayScreen Component for Tensho Mahjong Roguelike
 *
 * The table, top to bottom:
 *
 *   RunHeader      Gold · Act and round · score / target · ? Exit Settings
 *   Decrees        owned Decree scrolls and empty slots
 *   Hand score     the selection's pattern and points × Mult = total
 *   Collection     every Flower, Season, Orb, Seal and Script
 *   Rack           your tiles, grouped into the shapes they form
 *   ActionBar      Turns left · Wall · REDRAW · Play hand
 *
 * Everything shown is read from the engine; the screen never computes a score
 * of its own. A committed play celebrates once, from the engine's event.
 *
 * @module components/screens/GameplayScreen
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation, ROUTES } from '../../router'
import { useGameController, useGameEvent } from '../../game/useGameController'
import { TablePattern } from '../ui/TablePattern'
import { ConfirmPopup } from '../ui/Popup'
import { Tile } from '../../core/Tile'
import { useItemText } from '../../i18n/useItemText'
import { ClassicSaveNotice } from '../gameplay/ClassicSaveNotice'
import { DecreeCapacityNotice } from '../gameplay/DecreeCapacityNotice'
import { initializeClassicPersistence } from '../../game/classicPersistenceApp'
import { useSettingsStore } from '../../stores/settingsStore'
import { feltPalette } from '../../utils/feltPalette'
import { DecreeCardCompact, DecreeSlotEmpty } from '../gameplay/DecreeBar'
import { decreeKey, isDecreeExcluded } from '../../systems/decreeIdentity'
import { ConsumableDialog } from '../gameplay/ConsumableDialog'
import { MadeSealPrompt, type UsedSeal } from '../shop/MadeSealPrompt'
import { SealUsedToast } from '../shop/SealUsedToast'
import { useHeaderHeight } from '../../hooks/useHeaderHeight'
import { getTableStyleIllustration } from '../../utils/assets'
import {
  getDefaultTableStyle,
  getTableStyleById,
} from '../../config/tableStyleDefinitions'
import { RunHeader } from '../gameplay/RunHeader'
import { ActionBar } from '../gameplay/ActionBar'
import { HandRack } from '../gameplay/HandRack'
import { CollectibleRail } from '../gameplay/CollectibleRail'
import {
  HandScorePreview,
  type HandScoreValue,
} from '../gameplay/HandScorePreview'
import { PlayToast, type PlayToastData } from '../gameplay/PlayToast'
import { SecretPatternReveal } from '../gameplay/SecretPatternReveal'
import type { SecretPatternId } from '../../rules/PlayPattern'
import { WallDraw } from '../gameplay/WallDraw'
import { YakuReveal } from '../effects/YakuReveal'
import { DecreeReveal } from '../effects/DecreeReveal'
import { useFloraRevealQueue } from '../../game/floraRevealQueue'
import { useOmenStore } from '../../stores/omenStore'
import { WallDisplay } from '../gameplay/WallDisplay'
import { BeginnerGuide } from '../gameplay/BeginnerGuide'
import { scoreSignificance } from '../effects/DoomFire'
import { useCelebrationHold } from '../../game/celebrationHold'
import {
  MAX_TACTICAL_PLAY_TILES,
  MIN_TACTICAL_PLAY_TILES,
} from '../../game/playRules'
import type { VoidScript } from '../../systems/VoidScriptSystem'
import { useRewardedAd } from '../../hooks/useRewardedAd'
import { SimulatedAdOverlay } from '../gameplay/SimulatedAdOverlay'
import type { RoundType, YakuRevealState } from '../gameplay/gameplayTypes'
import type { MandateDefinition } from '../../config/mandateDefinitions'

/** The help guide opens by itself once, on the first table ever shown. */
export const HAND_GUIDE_SEEN_KEY = 'tensho_hand_guide_seen'

function readGuideSeen(): boolean {
  try {
    return window.localStorage.getItem(HAND_GUIDE_SEEN_KEY) === 'true'
  } catch {
    return true
  }
}

function markGuideSeen(): void {
  try {
    window.localStorage.setItem(HAND_GUIDE_SEEN_KEY, 'true')
  } catch {
    /* A private window may refuse storage; the guide simply shows again. */
  }
}

export function GameplayScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const game = useGameController()
  // The service only: every checkpoint (each tap) changes the save status,
  // and ClassicSaveNotice shows it without re-rendering the whole table.
  const persistence = initializeClassicPersistence()
  const showTileHints = useSettingsStore((state) => state.showTileHints)
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  // Omens change outside game events (a reward, a cancelled Script), so the
  // Script cost shown before use follows the Omen store itself.
  const scriptDownsideProtected = useOmenStore(() =>
    game.state.omenSystem.hasVoidScriptDownsideProtection()
  )
  const itemText = useItemText()
  const currentTableStyle =
    getTableStyleById(game.state.tableStyleId) ?? getDefaultTableStyle()
  const felt = useMemo(
    () => feltPalette(currentTableStyle.feltColor),
    [currentTableStyle.feltColor]
  )

  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showGuide, setShowGuide] = useState(() => !readGuideSeen())
  const wallDrawPending = useFloraRevealQueue((state) => state.queue.length > 0)
  // Hand hints wait for the round's deal to land before they fade in.
  const dealPending = useFloraRevealQueue((state) =>
    state.queue.some((entry) => entry.kind === 'deal')
  )
  const [actionError, setActionError] = useState<string | null>(null)
  const [targeting, setTargeting] = useState<VoidScript | null>(null)
  // A Seal the run makes here (a redrawn Purple tile) is used at once.
  const [sealUsed, setSealUsed] = useState<{
    key: number
    used: UsedSeal[]
  } | null>(null)
  const announceSeals = useCallback((used: UsedSeal[]) => {
    setSealUsed((shown) => ({
      key: Date.now(),
      used: [...(shown?.used ?? []), ...used],
    }))
  }, [])
  const handleSealToastDone = useCallback(() => setSealUsed(null), [])
  const headerHeight = useHeaderHeight('[data-run-header]')
  const [toast, setToast] = useState<PlayToastData | null>(null)
  const [lastPlay, setLastPlay] = useState<HandScoreValue | null>(null)
  const [yakuReveals, setYakuReveals] = useState<YakuRevealState[]>([])
  const [secretReveal, setSecretReveal] = useState<SecretPatternId | null>(null)
  const clearSecretReveal = useCallback(() => setSecretReveal(null), [])
  const toastCounter = useRef(0)
  const playButtonRef = useRef<HTMLButtonElement>(null)
  const wallTriggerRef = useRef<HTMLButtonElement>(null)

  // A selection left in the engine from another screen is cleared on entry.
  useEffect(() => {
    if (game.selectedTileIds.length > 0) game.clearSelection()
    // Mount only: later selections belong to this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const celebrating = useCelebrationHold((state) => state.holding)
  const holdCelebration = useCelebrationHold((state) => state.hold)
  const releaseCelebration = useCelebrationHold((state) => state.release)
  useEffect(() => {
    // The play that ends a round is celebrated before the table is left.
    if (celebrating) return
    if (game.phase === 'shop') navigateTo(ROUTES.SHOP)
    else if (game.phase === 'gameOver') navigateTo(ROUTES.GAME_OVER)
  }, [game.phase, navigateTo, celebrating])
  useEffect(() => releaseCelebration, [releaseCelebration])
  const finishCelebration = useCallback(() => {
    setToast(null)
    releaseCelebration()
  }, [releaseCelebration])
  // The table is only for show once the round has ended.
  const tableClosed = game.phase !== 'gameplay'

  // One celebration per committed play, from the engine's own event.
  useGameEvent(
    'handPlayed',
    useCallback(
      (data) => {
        const target = game.state.targetScore
        setLastPlay({
          pattern: data.pattern,
          points: data.equation.points,
          mult: data.equation.multiplier,
          adjustment: data.equation.adjustment,
          total: data.equation.total,
          blocked: data.blocked,
        })
        setToast({
          id: ++toastCounter.current,
          pattern: data.pattern,
          score: data.score,
          blocked: data.blocked,
          intensity: scoreSignificance(data.score, target),
        })
        holdCelebration()
      },
      [game.state, holdCelebration]
    )
  )
  useGameEvent(
    'roundStart',
    useCallback(() => setLastPlay(null), [])
  )
  useGameEvent(
    'yakumanScored',
    useCallback((data) => {
      setYakuReveals((reveals) => [
        ...reveals,
        {
          id: data.yakuId,
          japaneseName: data.yakuName,
          multiplier: data.multiplier ?? 4,
          tier: 4,
        },
      ])
    }, [])
  )
  useGameEvent(
    'secretPatternDiscovered',
    useCallback(({ pattern }) => setSecretReveal(pattern), [])
  )

  const selectedIds = game.selectedTileIds
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
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

  const handleToggle = useCallback(
    (tile: Tile) => {
      setActionError(null)
      game.toggleTileSelection(tile.id)
    },
    [game]
  )

  // The authoritative preview for exactly the selected tiles.
  const previewHidden = selectedIds.some((id) => faceDownTileIds.has(id))
  const breakdown =
    selectedIds.length > 0 && !previewHidden
      ? game.previewScore(selectedIds)
      : null
  // The settled equation, exactly as the play will pay it.
  const preview: HandScoreValue | null = breakdown
    ? {
        pattern: breakdown.pattern.id,
        points: breakdown.equation.points,
        mult: breakdown.equation.multiplier,
        adjustment: breakdown.equation.adjustment,
        total: breakdown.equation.total,
        blocked: breakdown.blockedByMandate,
      }
    : null

  const playAllowed =
    selectedIds.length > 0 &&
    game.canPerformAction({ type: 'play', tileIds: selectedIds })
  const redrawAllowed =
    selectedIds.length > 0 &&
    game.canPerformAction({ type: 'redraw', tileIds: selectedIds })

  const fixedHand =
    game.state.roundManager.checkMandateEffect('fixed_hand_size')
  const lockedMissing = game.lockedTileIds.some((id) => !selectedSet.has(id))
  const playReason = playAllowed
    ? undefined
    : lockedMissing
      ? t('tiles.lockedMustPlay', 'Locked tile: must be played')
      : fixedHand.active && selectedIds.length !== Number(fixedHand.value)
        ? t('gameplay.reasonExact', {
            count: Number(fixedHand.value),
          })
        : selectedIds.length < MIN_TACTICAL_PLAY_TILES
          ? t('gameplay.reasonMinimum', { count: MIN_TACTICAL_PLAY_TILES })
          : selectedIds.length > MAX_TACTICAL_PLAY_TILES
            ? // Too many to play is not too many to REDRAW: say so.
              t(
                redrawAllowed
                  ? 'gameplay.reasonMaximumRedraw'
                  : 'gameplay.reasonMaximum',
                { count: MAX_TACTICAL_PLAY_TILES }
              )
            : t('gameplay.reasonUnavailable', 'This play is not allowed now')
  const redrawReason = redrawAllowed
    ? undefined
    : game.state.roundManager.checkMandateEffect('no_discards').active
      ? t('mandateConsequence.no_discards')
      : game.redrawsRemaining <= 0 && game.handsRemaining < 2
        ? t('gameplay.reasonLastTurn', 'Your last Turn must be a Play')
        : t('gameplay.reasonNoReplacements', 'Not enough tiles left to draw')

  const handlePlayHand = useCallback(() => {
    if (selectedIds.length === 0) return
    const result = game.playHand([...selectedIds])
    if (result.success) setActionError(null)
    else setActionError(result.errors?.[0] ?? playReason ?? null)
  }, [game, selectedIds, playReason])

  const handleRedraw = useCallback(() => {
    if (selectedIds.length === 0) return
    const result = game.redraw([...selectedIds])
    if (result.success) {
      setActionError(null)
      game.clearSelection()
    } else setActionError(result.errors?.[0] ?? redrawReason ?? null)
  }, [game, selectedIds, redrawReason])

  const handleBuyTurn = useCallback(() => {
    const result = game.buyTurn()
    setActionError(result.success ? null : (result.errors?.[0] ?? null))
  }, [game])

  // Short of Gold for the emergency Turn: offer a rewarded ad, once per Act,
  // if ads are configured and one is ready. Each new last Turn is a new
  // opportunity.
  const offer = game.emergencyTurnOffer
  const rewardedAd = useRewardedAd(
    'emergency-turn',
    offer?.adAvailable
      ? `${game.currentAct}-${game.currentRound}-${game.state.handsAllowance}`
      : null
  )
  const { watch: watchAd } = rewardedAd
  const handleWatchAd = useCallback(async () => {
    const outcome = await watchAd()
    if (outcome === 'rewarded') {
      const result = game.takeAdTurn()
      setActionError(result.success ? null : (result.errors?.[0] ?? null))
    } else
      setActionError(
        t(
          outcome === 'dismissed'
            ? 'gameplay.emergencyTurn.adIncomplete'
            : 'gameplay.emergencyTurn.adUnavailable'
        )
      )
  }, [game, watchAd, t])

  // REDRAW takes any number of tiles, so one tap picks every tile it can take
  // (a locked tile must be played); a second tap puts them all back.
  const redrawableIds = game.handTiles
    .map((tile) => tile.id)
    .filter((id) => !lockedTileIds.has(id))
  const allPicked =
    redrawableIds.length > 0 && redrawableIds.every((id) => selectedSet.has(id))
  const toggleSelectAll = () => {
    setActionError(null)
    if (allPicked) game.clearSelection()
    else
      for (const id of redrawableIds)
        if (!selectedSet.has(id)) game.selectTile(id)
  }

  const handleExitGame = useCallback(async () => {
    if (await persistence.retrySave()) navigateTo(ROUTES.MENU)
  }, [persistence, navigateTo])

  const ownedDecrees = game.state.decreeSystem.getOwnedDecrees()
  const disabledDecreeIds = new Set(game.disabledDecreeIds)
  const hiddenDecreeIds = new Set(game.hiddenDecreeIds)
  const maxDecreeSlots = game.state.decreeSystem.getMaxSlots()

  const roundType: RoundType =
    game.currentRound === 1
      ? 'Small'
      : game.currentRound === 2
        ? 'Large'
        : 'Boss'
  const bossMandate =
    roundType === 'Boss'
      ? game.state.roundManager.getCurrentRound()?.bossMandate
      : undefined
  const mandateRerollsRemaining =
    game.state.charterSystem.getMandateRerollsRemaining()
  const upcomingMandate =
    roundType !== 'Boss' && mandateRerollsRemaining !== 0
      ? game.state.roundManager
          .getCurrentAct()
          ?.rounds.find((round) => round.roundType === 'Boss')?.bossMandate
      : undefined

  // Dead Wall Writ's once-per-round draw lives in its Decree's panel.
  const deadWallTileId = selectedIds.length === 1 ? selectedIds[0] : undefined
  const deadWallAction = {
    label: t('gameplay.deadWallDraw', 'Draw from the Dead Wall'),
    hint: t(
      'gameplay.deadWallHint',
      'Select exactly one tile, then swap it for a Dead Wall tile (once per round).'
    ),
    allowed: !!deadWallTileId && game.canUseDeadWallWrit(deadWallTileId),
    onRun: () => {
      if (!deadWallTileId) return
      const result = game.useDeadWallWrit(deadWallTileId)
      setActionError(result.success ? null : (result.errors?.[0] ?? null))
    },
  }

  return (
    <TablePattern
      showOrnaments={true}
      animated={false}
      patternScale={1}
      artwork={getTableStyleIllustration(currentTableStyle.id)}
      artworkOpacity={0.68}
      className="viewport-full"
      colors={felt}
    >
      <div
        data-felt={currentTableStyle.feltColor}
        data-table-style-id={currentTableStyle.id}
        className="mx-auto flex h-full min-h-0 w-full max-w-[1280px] flex-col overflow-hidden border-x border-white/5 bg-black/5 shadow-2xl"
        style={
          {
            '--color-dark-forest': felt.surface,
            '--color-forest-green': felt.surfaceRaised,
          } as CSSProperties
        }
      >
        <RunHeader
          gold={game.gold}
          stake={game.state.stake}
          currentAct={game.currentAct}
          hasEnteredEndless={game.hasEnteredEndless}
          roundType={roundType}
          score={game.score}
          target={game.targetScore}
          mandate={
            bossMandate
              ? {
                  id: bossMandate.id,
                  effect: bossMandate.effect as MandateDefinition['effect'],
                  name: itemText.name('mandates', bossMandate),
                  description: itemText.description('mandates', bossMandate),
                  lockedPattern:
                    game.state.mandateEffectSystem.getLockedPattern(),
                }
              : undefined
          }
          reroll={
            upcomingMandate
              ? {
                  upcomingName: itemText.name('mandates', upcomingMandate),
                  allowed: game.canRerollBossMandate(),
                  onReroll: () => {
                    const result = game.rerollBossMandate()
                    setActionError(
                      result.success ? null : (result.errors?.[0] ?? null)
                    )
                  },
                }
              : undefined
          }
          onHelp={() => setShowGuide(true)}
          onExit={() => setShowExitConfirm(true)}
          onSettings={() => navigateTo(ROUTES.SETTINGS)}
          status={<ClassicSaveNotice inline />}
        />

        <ClassicSaveNotice errorsOnly />

        {/* The board scrolls on short screens; the rack and actions stay. */}
        <div
          data-gameplay-scroll
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        >
          <div className="gameplay-collection grid shrink-0 grid-cols-1 items-center gap-1 px-1 pt-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-3">
            {/* Decrees */}
            <div
              data-tutorial="decrees"
              className="scroll-rail flex min-w-0 items-center justify-center gap-1.5 overflow-x-auto px-1 py-1 lg:justify-start"
            >
              {ownedDecrees.map((decree, index) => (
                <DecreeCardCompact
                  key={decree.instanceId ?? `${decree.id}-${index}`}
                  decree={decree}
                  ownedDecrees={ownedDecrees}
                  yakuHistory={game.state}
                  completeConcealedHandsPlayed={
                    game.state.completeConcealedHandsPlayed
                  }
                  disabledDecreeIds={disabledDecreeIds}
                  faceDown={isDecreeExcluded(decree, hiddenDecreeIds)}
                  disabledByMandate={isDecreeExcluded(
                    decree,
                    disabledDecreeIds
                  )}
                  onSell={() => {
                    const result = game.sellDecree(decreeKey(decree))
                    setActionError(
                      result.success ? null : (result.errors?.[0] ?? null)
                    )
                  }}
                  action={
                    decree.effect.type === 'rule_modification' &&
                    decree.effect.ruleId === 'dead_wall_draw'
                      ? deadWallAction
                      : undefined
                  }
                />
              ))}
              {Array.from({
                length: Math.max(0, maxDecreeSlots - ownedDecrees.length),
              }).map((_, i) => (
                <DecreeSlotEmpty key={`empty-${i}`} />
              ))}
            </div>

            {/* The hand score sits between Decrees and the collection. */}
            <div className="flex flex-col items-center gap-1 px-2">
              <HandScorePreview
                preview={preview}
                hidden={previewHidden}
                lastPlay={lastPlay}
                fire={
                  toast
                    ? { intensity: toast.intensity, burst: toast.id }
                    : undefined
                }
                reducedMotion={reducedMotion}
              />
            </div>

            {/* Flowers, Seasons, Omens and held consumables; upgrades are in the Tea House. */}
            <div className="gameplay-collection-items -mx-1 min-w-0 lg:mx-0">
              <CollectibleRail
                flora={game.flora}
                celestialOrbs={game.celestialOrbs}
                voidScripts={game.voidScripts}
                levelOf={(family) =>
                  game.state.celestialOrbSystem.getYakuLevel(family)
                }
                validateUse={game.validateConsumableAction}
                onUse={game.processAction}
                onChooseTargets={setTargeting}
                scriptDownsideProtected={scriptDownsideProtected}
                observatoryActive={game.state.charterSystem.hasCharter(
                  'observatory'
                )}
                omenSystem={game.state.omenSystem}
              />
            </div>
          </div>

          <DecreeCapacityNotice
            owned={ownedDecrees.length}
            slots={maxDecreeSlots}
          />
          {game.state.mandateEffectSystem.areAllTilesDebuffed() && (
            <p className="mx-4 mb-1 rounded border border-emerald-300/60 bg-emerald-950/80 px-3 py-1.5 text-center text-xs font-semibold text-emerald-100">
              {t('mandateConsequence.debuff_until_sell')}
            </p>
          )}

          {/* Fills the free table so the felt can sit in its middle. */}
          <div
            data-gameplay-surface
            className="relative flex min-w-0 flex-[1_0_auto] flex-col"
          >
            <PlayToast
              toast={toast}
              onDone={finishCelebration}
              reducedMotion={reducedMotion}
            />
            {(yakuReveals.length > 0 || secretReveal) && (
              <div className="pointer-events-none absolute inset-x-0 top-14 z-40 flex flex-col items-center gap-2">
                {/* Below the play's toast, which keeps its score in view. */}
                {secretReveal && (
                  <div className="mt-8">
                    <SecretPatternReveal
                      pattern={secretReveal}
                      onDone={clearSecretReveal}
                      reducedMotion={reducedMotion}
                    />
                  </div>
                )}
                {yakuReveals.map((yaku) => (
                  <YakuReveal
                    key={yaku.id}
                    japaneseName={yaku.japaneseName}
                    multiplier={yaku.multiplier}
                    tier={yaku.tier}
                    onComplete={() =>
                      setYakuReveals((reveals) =>
                        reveals.filter((r) => r.id !== yaku.id)
                      )
                    }
                  />
                ))}
              </div>
            )}
            <div className="flex flex-1 flex-col px-1 pb-1">
              <HandRack
                tiles={game.handTiles}
                selectedIds={selectedSet}
                faceDownIds={faceDownTileIds}
                lockedIds={lockedTileIds}
                debuffedIds={debuffedTileIds}
                onToggle={handleToggle}
                groupRules={showTileHints ? game.partialHandRules : null}
                hintsHeld={dealPending}
                disabled={tableClosed}
                rackHeader={
                  <>
                    {redrawableIds.length > 1 && !tableClosed && (
                      <div className="flex justify-end px-1 pb-1">
                        <button
                          type="button"
                          data-select-all
                          onClick={toggleSelectAll}
                          className="min-h-11 min-w-11 rounded-full border border-white/25 bg-black/40 px-3 text-xs font-bold uppercase tracking-wide text-[var(--color-beige-white)] hover:bg-black/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                        >
                          {allPicked
                            ? t('gameplay.clearAll', 'Clear all')
                            : t('gameplay.selectAll', 'Select all')}
                        </button>
                      </div>
                    )}
                    {actionError && (
                      <p
                        role="alert"
                        className="mx-3 my-1 rounded-lg border border-red-400/60 bg-red-950/70 px-3 py-1.5 text-center text-sm text-red-100"
                      >
                        {actionError}
                      </p>
                    )}
                  </>
                }
              />
            </div>
          </div>
        </div>

        <ActionBar
          playButtonRef={playButtonRef}
          wall={
            <div data-tutorial="wall" className="shrink-0">
              <WallDisplay
                wallTiles={game.wallTiles}
                triggerRef={wallTriggerRef}
              />
            </div>
          }
          turnsLeft={game.handsRemaining}
          freeRedraws={game.redrawsRemaining}
          selectedCount={selectedIds.length}
          playAllowed={playAllowed && !tableClosed}
          redrawAllowed={redrawAllowed && !tableClosed}
          playReason={playReason}
          redrawReason={redrawReason}
          onRedraw={handleRedraw}
          onPlayHand={handlePlayHand}
          emergencyTurn={tableClosed ? null : game.emergencyTurnOffer}
          onBuyTurn={handleBuyTurn}
          adTurn={tableClosed ? null : rewardedAd}
          onWatchAd={handleWatchAd}
          willClear={
            preview !== null &&
            preview.total >= Math.max(0, game.targetScore - game.score)
          }
        />
      </div>

      {/* One thing at a time: the deal, then the guide, then Decrees. */}
      <WallDraw flora={game.flora} paused={toast !== null || tableClosed} />
      <SimulatedAdOverlay />
      <BeginnerGuide
        isOpen={showGuide && !wallDrawPending}
        onClose={() => {
          markGuideSeen()
          setShowGuide(false)
        }}
      />
      <DecreeReveal paused={toast !== null || showGuide || wallDrawPending} />

      <ConfirmPopup
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={handleExitGame}
        title={t('classicSave.leaveTitle')}
        message={t('classicSave.leaveBody')}
        confirmText={t('classicSave.saveLeave')}
        cancelText={t('common.cancel', 'Cancel')}
      />

      <MadeSealPrompt
        seals={game.fateSeals}
        wall={game.state.wallTemplate}
        paused={
          toast !== null || showGuide || wallDrawPending || targeting !== null
        }
        settle={game.settleHeldFateSeal}
        onUsed={announceSeals}
      />
      {sealUsed && (
        <SealUsedToast
          key={sealUsed.key}
          seals={sealUsed.used.map((entry) => entry.seal)}
          changes={sealUsed.used.flatMap((entry) => entry.changes)}
          top={headerHeight + 8}
          onDone={handleSealToastDone}
        />
      )}

      {targeting && (
        <ConsumableDialog
          key={targeting.instanceId}
          title={itemText.name('scripts', targeting)}
          items={[targeting]}
          initialItemId={targeting.instanceId}
          tiles={game.handTiles}
          concealedIds={faceDownTileIds}
          scriptDownsideProtected={scriptDownsideProtected}
          observatoryActive={game.state.charterSystem.hasCharter('observatory')}
          canUse={game.canPerformAction}
          validateUse={game.validateConsumableAction}
          onUse={game.processAction}
          onClose={() => setTargeting(null)}
          fallbackFocusRef={wallTriggerRef}
        />
      )}
    </TablePattern>
  )
}

export default GameplayScreen
