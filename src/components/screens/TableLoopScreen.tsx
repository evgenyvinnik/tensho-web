/**
 * TableLoopScreen
 *
 * The playable prototype for experiments E01–E05 of
 * `docs/GAMEPLAY_EXPERIMENTS.md`: a three-round run where every group you play
 * stays on the table, patterns pay before the table is finished, the run opens
 * with a build choice, a small shop sells effects that interact, and each score
 * resolves as a readable chain.
 *
 * It runs beside the classic loop rather than replacing it, so the two can be
 * played back to back during a session — which is what the playtest plan in
 * section 8 asks for.
 *
 * @module components/screens/TableLoopScreen
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAppNavigation, ROUTES } from '../../router'
import { useTableLoopStore } from '../../stores/tableLoopStore'
import { useTableStyleStore } from '../../stores/tableStyleStore'
import {
  getDefaultTableStyle,
  getTableStyleById,
} from '../../config/tableStyleDefinitions'
import { getTableStyleIllustration } from '../../utils/assets'
import { feltPalette } from '../../utils/feltPalette'
import { useHandTileSize } from '../../hooks/useHandTileSize'
import { TablePattern } from '../ui/TablePattern'
import { Button } from '../ui/Button'
import { GoldIcon } from '../ui/GoldIcon'
import { RiverRow } from '../tableloop/RiverRow'
import { DraftRow } from '../tableloop/DraftRow'
import { PracticeGuide } from '../tableloop/PracticeGuide'
import { ResolutionFlourish } from '../tableloop/ResolutionFlourish'
import { RackRow } from '../tableloop/RackRow'
import { SelectionStrip } from '../tableloop/SelectionStrip'
import { TableSlots } from '../tableloop/TableSlots'
import { MilestoneTrack } from '../tableloop/MilestoneTrack'
import { CausalChain } from '../tableloop/CausalChain'
import { TableDecreeArt } from '../tableloop/TableDecreeArt'
import { TableDecreeInventory } from '../tableloop/TableDecreeInventory'
import { TableSaveConflict } from '../tableloop/TableSaveConflict'
import { placeableSlots, revisableSlots } from '../../tableloop/TableLoopEngine'
import { classifyGroup } from '../../tableloop/groupRules'
import { practiceStep } from '../../tableloop/practice'
import {
  MAX_REDRAW_TILES,
  TABLE_ROUNDS,
  getTableDecree,
} from '../../tableloop/content'
import type { TableDecreeId } from '../../tableloop/types'

// =============================================================================
// SHARED PIECES
// =============================================================================

/** The classic table's button looks: orange to go on, green to step aside. */
const PRIMARY_ACTION =
  'min-h-12 rounded-xl border-2 border-[var(--color-golden-yellow)] bg-[var(--color-vibrant-orange)] px-4 py-3 text-base font-bold text-[var(--color-beige-white)] shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-dark-forest)] disabled:cursor-not-allowed disabled:opacity-45'
const SECONDARY_ACTION =
  'min-h-11 rounded-xl border-2 border-[var(--color-metallic-gold)]/70 bg-[var(--color-forest-green)] px-4 py-2.5 text-sm font-semibold text-[var(--color-beige-white)] transition hover:border-[var(--color-golden-yellow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)] disabled:cursor-not-allowed disabled:opacity-45'

function SaveNotice() {
  const { t } = useTranslation()
  const status = useTableLoopStore((store) => store.saveStatus)
  if (status === 'saved' || status === 'saving') return null
  return (
    <div
      role="status"
      className="mx-3 rounded-lg border border-amber-300/40 bg-amber-950/60 px-3 py-2 text-xs leading-relaxed text-amber-100"
    >
      {status === 'invalid'
        ? t(
            'tableLoop.save.invalid',
            'The previous save could not be restored. Start a new run to replace it.'
          )
        : t(
            'tableLoop.save.unavailable',
            'Progress cannot be saved on this device. Keep this tab open to continue your run.'
          )}
      {status === 'unavailable' && (
        <button
          type="button"
          className="ml-2 min-h-11 rounded border border-amber-300/50 px-3"
          onClick={() => void useTableLoopStore.getState().retrySave()}
        >
          {t('classicSave.retry')}
        </button>
      )}
    </div>
  )
}

function DecreeCard({
  id,
  onChoose,
  actionLabel,
  disabled,
  showCost,
}: {
  id: TableDecreeId
  onChoose: (id: TableDecreeId) => void
  actionLabel: string
  disabled?: boolean
  showCost?: boolean
}) {
  const { t } = useTranslation()
  const definition = getTableDecree(id)

  return (
    <button
      data-testid={`table-decree-${id}`}
      disabled={disabled}
      onClick={() => onChoose(id)}
      className={`group flex w-full items-center gap-3 rounded-xl border-2 bg-black/25 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)] ${
        disabled
          ? 'border-[var(--color-metallic-gold)]/15 opacity-50'
          : 'border-[var(--color-metallic-gold)]/50 hover:border-[var(--color-golden-yellow)] hover:bg-[var(--color-golden-yellow)]/10'
      }`}
    >
      <TableDecreeArt
        id={id}
        className="h-20 w-16 sm:h-24 sm:w-20 motion-safe:transition-transform motion-safe:group-hover:scale-105"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-bold text-[var(--color-golden-yellow)]">
            {t(`tableLoop.decrees.${id}.name`, definition.name)}
          </span>
          {showCost && (
            <span className="text-xs font-bold tabular-nums text-emerald-300">
              ¥{definition.cost}
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm leading-snug text-[var(--color-beige-white)]/85">
          {t(`tableLoop.decrees.${id}.description`, definition.description)}
        </span>
        <span className="mt-1.5 block text-[10px] uppercase tracking-widest text-[var(--color-beige-white)]/65">
          {actionLabel}
        </span>
      </span>
    </button>
  )
}

/**
 * The same cloth, artwork and frame as the classic table, coloured by the
 * table style the player last chose, so both modes read as one game.
 */
function TableFelt({ children }: { children: ReactNode }) {
  const styleId = useTableStyleStore((store) => store.currentStyleId)
  const style = getTableStyleById(styleId) ?? getDefaultTableStyle()
  const felt = useMemo(() => feltPalette(style.feltColor), [style.feltColor])

  return (
    <TablePattern
      showOrnaments={true}
      animated={false}
      patternScale={1}
      artwork={getTableStyleIllustration(style.id)}
      artworkOpacity={0.68}
      className="viewport-full"
      colors={felt}
    >
      <div
        data-felt={style.feltColor}
        className="mx-auto flex h-full min-h-0 w-full max-w-[1280px] flex-col overflow-hidden border-x border-white/5 bg-black/5 text-[var(--color-beige-white)] shadow-2xl"
        style={
          {
            '--color-dark-forest': felt.surface,
            '--color-forest-green': felt.surfaceRaised,
            '--table-theme': style.themeColor,
            '--table-accent': style.accentColor,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </TablePattern>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <TableFelt>
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain px-3 py-6">
        <SaveNotice />
        <div className="my-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[var(--color-metallic-gold)]/45 bg-[var(--color-dark-forest)]/92 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.45)] sm:p-5">
          <div className="text-center">
            <h1 className="text-xl font-black text-[var(--color-golden-yellow)] sm:text-2xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--color-beige-white)]/75">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex w-full flex-col gap-2">{children}</div>
        </div>
      </div>
    </TableFelt>
  )
}

// =============================================================================
// SCREEN
// =============================================================================

export function TableLoopScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const store = useTableLoopStore()
  const { state, selectedTileIds } = store
  const [highlightedSlots, setHighlightedSlots] = useState<readonly number[]>(
    []
  )

  // `?seed=` replays an exact run and `?draft=1` selects the offers variant.
  // The playtest plan in section 8 of the experiments document depends on
  // handing someone the same deal that confused a previous player, and on
  // running the variant and the base loop against each other.
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSeed = Number(searchParams.get('seed'))
  const requestedDraft = searchParams.get('draft') === '1'
  const requestedPractice = searchParams.get('practice') === '1'
  const applied = useRef<string | null>(null)
  const { restart } = store
  useEffect(() => {
    const hasSeed = Number.isSafeInteger(requestedSeed) && requestedSeed !== 0
    if (!hasSeed && !requestedDraft && !requestedPractice) return
    const key = `${hasSeed ? requestedSeed : 'auto'}:${requestedDraft}:${requestedPractice}`
    if (applied.current === key) return
    applied.current = key
    const current = useTableLoopStore.getState().state
    if (
      (!hasSeed || current.seed === requestedSeed) &&
      current.draftEnabled === requestedDraft &&
      current.practice === requestedPractice
    )
      return
    restart(hasSeed ? requestedSeed : undefined, {
      draftEnabled: requestedDraft,
      practice: requestedPractice,
    })
  }, [requestedSeed, requestedDraft, requestedPractice, restart])

  const guideStep = practiceStep(state)

  const handleInspect = useCallback(
    (tileIds: string[]) => {
      store.clearSelection()
      for (const tileId of tileIds) store.toggleTile(tileId)
    },
    [store]
  )

  const selectedTiles = useMemo(
    () => state.rack.filter((tile) => selectedTileIds.includes(tile.id)),
    [state.rack, selectedTileIds]
  )

  const placeable = useMemo(
    () => (selectedTiles.length ? placeableSlots(state, selectedTiles) : []),
    [state, selectedTiles]
  )
  const revisable = useMemo(
    () => (selectedTiles.length ? revisableSlots(state, selectedTiles) : []),
    [state, selectedTiles]
  )

  const { forecasts, multCosts } = useMemo(() => {
    const totals = new Map<number, number>()
    const costs = new Map<number, number>()
    for (const slot of [...placeable, ...revisable]) {
      const forecast = store.engine.previewPlacement(selectedTileIds, slot)
      if (!forecast) continue
      totals.set(slot, forecast.total)
      if (forecast.multLost > 0) costs.set(slot, forecast.multLost)
    }
    return { forecasts: totals, multCosts: costs }
  }, [store.engine, selectedTileIds, placeable, revisable])

  const selection = useMemo(() => {
    if (selectedTiles.length === 0) return { type: null, usedGap: false }
    const classified = classifyGroup(selectedTiles, {
      allowGap: state.gapBridgesRemaining > 0,
    })
    return classified.ok
      ? { type: classified.type, usedGap: Boolean(classified.usedGap) }
      : { type: null, usedGap: false }
  }, [selectedTiles, state.gapBridgesRemaining])

  const bestForecast = forecasts.size ? Math.max(...forecasts.values()) : null
  const bestSlot =
    bestForecast === null
      ? null
      : [...forecasts.entries()].find(
          ([, total]) => total === bestForecast
        )?.[0]
  const bestMultCost =
    bestSlot === undefined || bestSlot === null
      ? 0
      : (multCosts.get(bestSlot) ?? 0)

  // The chain re-emits its highlight on every render, so this must be a no-op
  // when nothing changed; storing a fresh array each time would re-render the
  // screen forever.
  const handleHighlight = useCallback((slots: readonly number[]) => {
    setHighlightedSlots((current) =>
      current.length === slots.length &&
      current.every((value, index) => value === slots[index])
        ? current
        : slots
    )
  }, [])

  // Size the rack to the space it actually has, as the classic rack does.
  // Table tiles stay a step smaller, and each slot shrinks further to fit.
  const rackAreaRef = useRef<HTMLDivElement>(null)
  const rackTileSize = useHandTileSize(
    rackAreaRef,
    state.rack.length,
    0,
    16,
    state.phase === 'playing'
  )
  const slotTileSize =
    rackTileSize === 'xlarge' || rackTileSize === 'large'
      ? 'medium'
      : rackTileSize === 'regular'
        ? 'compact'
        : 'small'

  // On a phone the board is a short scroll box. When the next step is inside
  // it (the first slot the selection fits, or an offer to take), bring that
  // into view, so "tap a highlighted slot" never points off-screen.
  const boardRef = useRef<HTMLDivElement>(null)
  const nextTarget = state.pendingDraftPick
    ? 'draft-row'
    : placeable.length + revisable.length > 0
      ? `table-slot-${Math.min(...placeable, ...revisable)}`
      : null
  useEffect(() => {
    if (!nextTarget) return
    const target = boardRef.current?.querySelector<HTMLElement>(
      `[data-testid="${nextTarget}"]`
    )
    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches
    target?.scrollIntoView?.({
      block: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [nextTarget])

  // ---------------------------------------------------------------------------
  // PHASES OUTSIDE PLAY
  // ---------------------------------------------------------------------------

  if (store.saveStatus === 'conflict') {
    return (
      <TableSaveConflict
        onLoaded={() => setSearchParams({}, { replace: true })}
        onMenu={() => navigateTo(ROUTES.MENU)}
      />
    )
  }

  if (state.phase === 'choosingStart') {
    return (
      <Panel
        title={t('tableLoop.start.title', 'Choose how you will play')}
        subtitle={t(
          'tableLoop.start.subtitle',
          'One Decree, chosen before the first tile. It should change which tiles you want.'
        )}
      >
        {state.starterChoices.map((id) => (
          <DecreeCard
            key={id}
            id={id}
            onChoose={store.chooseStarter}
            actionLabel={t('tableLoop.start.take', 'Begin with this')}
          />
        ))}

        <button
          type="button"
          data-testid="draft-toggle"
          role="switch"
          aria-checked={state.draftEnabled}
          onClick={() => {
            const params = new URLSearchParams(searchParams)
            if (state.draftEnabled) params.delete('draft')
            else params.set('draft', '1')
            setSearchParams(params, { replace: true })
            store.restart(state.seed, { draftEnabled: !state.draftEnabled })
          }}
          className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-metallic-gold)]/30 px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]"
        >
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-[var(--color-beige-white)]">
              {t('tableLoop.draft.variant', 'Variant: offers row')}
            </span>
            <span className="mt-0.5 block text-[10px] leading-snug text-[var(--color-beige-white)]/55">
              {t(
                'tableLoop.draft.variantHint',
                'Three face-up tiles. Each group you place lets one replacement come from them instead of the wall.'
              )}
            </span>
          </span>
          <span
            className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
              state.draftEnabled
                ? 'border-emerald-400 text-emerald-300'
                : 'border-[var(--color-metallic-gold)]/35 text-[var(--color-beige-white)]/45'
            }`}
          >
            {state.draftEnabled
              ? t('tableLoop.draft.on', 'On')
              : t('tableLoop.draft.off', 'Off')}
          </span>
        </button>

        <button
          type="button"
          data-testid="practice-start"
          onClick={() => {
            setSearchParams({ practice: '1' }, { replace: true })
            store.restart(state.seed, { practice: true, draftEnabled: false })
          }}
          className="mt-1 rounded-xl border border-sky-400/50 px-3 py-2 text-xs font-semibold text-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]"
        >
          {t(
            'tableLoop.practice.begin',
            'New here? Play the practice deal first'
          )}
        </button>

        <button
          onClick={() => navigateTo(ROUTES.MENU)}
          className="mt-2 text-xs uppercase tracking-widest text-[var(--color-beige-white)]/50"
        >
          {t('common.back', 'Back')}
        </button>
      </Panel>
    )
  }

  // How the round stopped, so the panel can say which of the three endings it
  // was rather than leaving the player to infer it from the numbers.
  const endingStage = state.lastResolution.find((stage) =>
    stage.labelKey?.startsWith('tableLoop.roundEnd.')
  )
  const endingLabel = endingStage
    ? t(endingStage.labelKey!, endingStage.label)
    : undefined

  if (state.phase === 'roundCleared') {
    return (
      <Panel
        title={endingLabel ?? t('tableLoop.cleared.title', 'Round cleared')}
        subtitle={t(
          'tableLoop.cleared.subtitle',
          '{{score}} against a target of {{target}}. Purse: ¥{{gold}}.',
          { score: state.score, target: state.round.target, gold: state.gold }
        )}
      >
        <button onClick={store.openShop} className={PRIMARY_ACTION}>
          {t('tableLoop.cleared.shop', 'Visit the tea house')}
        </button>
        <button onClick={store.nextRound} className={SECONDARY_ACTION}>
          {t('tableLoop.cleared.skipShop', 'Straight to the next round')}
        </button>
      </Panel>
    )
  }

  if (state.phase === 'shop') {
    return (
      <Panel
        title={t('tableLoop.shop.title', 'Tea house')}
        subtitle={t('tableLoop.shop.subtitle', 'Purse: ¥{{gold}}', {
          gold: state.gold,
        })}
      >
        {state.shopOffers.length === 0 ? (
          <p className="text-center text-sm text-[var(--color-beige-white)]/60">
            {t('tableLoop.shop.empty', 'Nothing left on the shelf.')}
          </p>
        ) : (
          state.shopOffers.map((id) => (
            <DecreeCard
              key={id}
              id={id}
              showCost
              disabled={state.gold < getTableDecree(id).cost}
              onChoose={store.buyDecree}
              actionLabel={t('tableLoop.shop.buy', 'Buy')}
            />
          ))
        )}
        <button onClick={store.nextRound} className={`mt-2 ${PRIMARY_ACTION}`}>
          {t('tableLoop.shop.leave', 'Next round')}
        </button>
      </Panel>
    )
  }

  if (state.phase === 'runComplete' || state.phase === 'runFailed') {
    const won = state.phase === 'runComplete'
    return (
      <Panel
        title={
          won
            ? t('tableLoop.end.won', 'Three rounds, cleared')
            : t('tableLoop.end.lost', 'The table ran out')
        }
        subtitle={t('tableLoop.end.summary', 'Run score {{score}}', {
          score: state.runScore,
        })}
      >
        <button
          onClick={() => {
            setSearchParams({}, { replace: true })
            store.restart()
          }}
          className={PRIMARY_ACTION}
        >
          {t('tableLoop.end.again', 'Another run')}
        </button>
        <button
          onClick={() => navigateTo(ROUTES.MENU)}
          className={SECONDARY_ACTION}
        >
          {t('common.mainMenu', 'Main menu')}
        </button>
      </Panel>
    )
  }

  // ---------------------------------------------------------------------------
  // PLAYING
  // ---------------------------------------------------------------------------

  const remaining = Math.max(0, state.round.target - state.score)
  const progress = Math.min(100, (state.score / state.round.target) * 100)
  // Once the exchange allowance is spent, an exchange becomes a recovery play
  // paid for with a placement action.
  const exchangeCostsAction = state.redrawsRemaining <= 0
  const canRedraw =
    (state.redrawsRemaining > 0 || state.placementActionsRemaining > 0) &&
    selectedTileIds.length > 0 &&
    selectedTileIds.length <= MAX_REDRAW_TILES &&
    state.wall.length > 0

  return (
    <TableFelt>
      <ResolutionFlourish stages={state.lastResolution} />
      <SaveNotice />

      {/* Top bar: the way out, the round, and the purse — as on the classic
          table. */}
      <header
        data-frame-corner-row="top"
        className="gameplay-frame-corner-row flex flex-shrink-0 items-center justify-between gap-2 rounded-sm bg-[var(--color-dark-forest)] px-1 py-1 sm:px-4"
      >
        <button
          type="button"
          onClick={() => navigateTo(ROUTES.MENU)}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold text-[var(--color-beige-white)]/85 hover:bg-[var(--color-forest-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)] sm:text-sm"
        >
          <span aria-hidden="true" className="text-base leading-none">
            ‹
          </span>
          <span className="max-[359px]:sr-only">
            {t('common.mainMenu', 'Main menu')}
          </span>
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-bold text-[var(--color-golden-yellow)] sm:text-base">
            {t(`tableLoop.rounds.${state.round.index}`, state.round.name)}
          </p>
          <div className="mt-0.5 flex items-center justify-center gap-1.5">
            <span className="whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-[var(--color-beige-white)]/55">
              {state.practice
                ? t('tableLoop.practice.label', 'Practice deal')
                : t('tableLoop.hud.round', 'Round {{current}} of {{total}}', {
                    current: state.roundIndex + 1,
                    total: TABLE_ROUNDS.length,
                  })}
            </span>
            {!state.practice && (
              <span
                aria-hidden="true"
                className="flex gap-0.5 max-[359px]:hidden"
              >
                {TABLE_ROUNDS.map((_, index) => (
                  <span
                    key={index}
                    className={`h-1 w-3 rounded-full ${
                      index <= state.roundIndex
                        ? 'bg-[var(--color-golden-yellow)]'
                        : 'bg-white/15'
                    }`}
                  />
                ))}
              </span>
            )}
          </div>
        </div>
        <p
          className="inline-flex shrink-0 items-center gap-1 px-1 text-lg font-bold tabular-nums text-[var(--color-golden-yellow)]"
          aria-label={t('tableLoop.hud.gold', '{{gold}} gold', {
            gold: state.gold,
          })}
        >
          <GoldIcon className="h-6 w-6" />¥{state.gold}
        </p>
      </header>

      {/* Score, target and what is left to spend, on one panel. */}
      <div className="game-score-panel relative mx-2 my-1 flex-shrink-0 rounded-xl border border-white/5 bg-[var(--color-dark-forest)]/95 px-3 py-1.5 shadow-lg">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center gap-x-4 gap-y-1"
        >
          <div className="flex min-w-[min(100%,16rem)] flex-[1_1_18rem] items-center gap-3">
            <div className="shrink-0">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--color-beige-white)]/55">
                {t('gameplay.score', 'Score')}
              </p>
              <p className="text-lg font-black leading-tight tabular-nums sm:text-xl">
                <strong className="text-[var(--color-golden-yellow)]">
                  {state.score.toLocaleString()}
                </strong>
                <span className="ml-1 text-sm font-semibold text-[var(--color-beige-white)]/45">
                  / {state.round.target.toLocaleString()}
                </span>
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/45">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    remaining === 0
                      ? 'bg-green-500'
                      : 'bg-[var(--color-vibrant-orange)]'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold tabular-nums">
            <span className="rounded-full border border-[var(--color-metallic-gold)]/40 bg-black/25 px-2 py-0.5">
              {t(
                'tableLoop.hud.resources',
                '{{actions}} actions · {{redraws}} exchanges',
                {
                  actions: state.placementActionsRemaining,
                  redraws: state.redrawsRemaining,
                }
              )}
              {state.gapBridgesRemaining > 0 && (
                <span className="ml-1.5 text-sky-300">
                  {t('tableLoop.hud.bridges', '· {{count}} bridge', {
                    count: state.gapBridgesRemaining,
                  })}
                </span>
              )}
            </span>
          </div>
        </div>

        {state.round.bossRule && (
          <p
            data-testid="boss-banner"
            className="mt-1.5 rounded-md border border-rose-400/50 bg-rose-950/50 px-2 py-1 text-[11px] leading-snug text-rose-100"
          >
            {t(
              `tableLoop.boss.${state.round.bossRule}`,
              'Frost Magistrate — Honor tiles score half their points this round.'
            )}
          </p>
        )}
      </div>

      {/* The board scrolls on a short screen; the rack and actions stay put. */}
      <div
        ref={boardRef}
        data-table-loop-board
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [&>*]:shrink-0"
      >
        <TableDecreeInventory ids={state.ownedDecrees} />

        {guideStep && (
          <PracticeGuide
            state={state}
            step={guideStep}
            onInspect={handleInspect}
            onTakeDecree={store.takePracticeDecree}
            onStartRealRun={() => {
              setSearchParams({}, { replace: true })
              store.restart(undefined, { practice: false })
            }}
          />
        )}

        {/* The persistent table, framed like the classic staging zone. */}
        <section
          aria-label={t('tableLoop.table.label', 'Table')}
          className="relative mx-2 my-1 flex flex-[1_0_auto] flex-col justify-center gap-1 rounded-xl border-2 py-2"
          style={{
            background:
              'linear-gradient(145deg, color-mix(in srgb, var(--table-theme) 19%, transparent), color-mix(in srgb, var(--table-accent) 12%, transparent) 48%, rgba(8, 28, 21, 0.62))',
            borderColor:
              'color-mix(in srgb, var(--table-theme) 60%, transparent)',
            boxShadow:
              'inset 0 0 24px color-mix(in srgb, var(--table-theme) 18%, transparent)',
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1 block h-1 w-16 -translate-x-1/2 rounded-full"
            style={{
              backgroundColor: 'var(--table-theme)',
              boxShadow: '0 0 14px var(--table-theme)',
            }}
          />
          <TableSlots
            slots={state.slots}
            placeable={placeable}
            revisable={revisable}
            highlighted={highlightedSlots}
            forecasts={forecasts}
            multCosts={multCosts}
            maxTileSize={slotTileSize}
            onPlace={store.place}
            onRevise={store.revise}
          />

          <MilestoneTrack
            slots={state.slots}
            claimed={state.claimedMilestones}
            tableMult={state.tableMult}
          />

          {state.lastResolution.length > 0 && (
            <CausalChain
              stages={state.lastResolution}
              onHighlight={handleHighlight}
            />
          )}

          {state.lastError && (
            <p
              role="alert"
              className="mx-3 mt-1 rounded-md border border-red-400/50 bg-red-950/60 px-2 py-1 text-[11px] text-red-100"
            >
              {state.lastErrorKey
                ? t(state.lastErrorKey, state.lastError)
                : state.lastError}
            </p>
          )}
        </section>

        {/* Offers (E06) */}
        <DraftRow
          tiles={state.draftRow}
          claimable={state.pendingDraftPick}
          onClaim={store.claimDraft}
          onPass={store.passDraft}
        />

        <RiverRow
          tiles={state.river}
          selectedTile={selectedTiles.length === 1 ? selectedTiles[0] : null}
          merchantOwned={state.ownedDecrees.includes('river_merchant')}
          swapsRemaining={state.riverRecoveriesRemaining}
          onSwap={store.swapWithRiver}
        />
      </div>

      {/* What you have picked, the rack, and the actions. */}
      <div
        ref={rackAreaRef}
        className="flex-shrink-0 border-t border-white/5 bg-[var(--color-dark-forest)]/70 pt-1.5"
      >
        <SelectionStrip
          tiles={selectedTiles}
          groupType={selection.type}
          usedGap={selection.usedGap}
          bestForecast={bestForecast}
          multCost={bestMultCost}
          onClear={store.clearSelection}
        />

        {/* Above the rack, so a longer hint grows into the board instead of
            moving the tiles under the player's finger. */}
        <p
          data-table-loop-hint
          className="px-3 pb-1 text-center text-[11px] leading-snug text-[var(--color-beige-white)]/65"
        >
          {state.pendingDraftPick
            ? t(
                'tableLoop.hint.draft',
                'Take an offer, or draw from the wall. Doing anything else takes the wall tile.'
              )
            : selectedTileIds.length === 0
              ? t(
                  'tableLoop.hint.select',
                  'Tap tiles to build a run, a set or a pair, then choose a slot.'
                )
              : placeable.length + revisable.length > 0
                ? t(
                    'tableLoop.hint.choose',
                    'Tap a highlighted slot to commit it.'
                  )
                : t(
                    'tableLoop.hint.noSlot',
                    'No slot takes that group. Exchange the tiles or pick a different shape.'
                  )}
        </p>

        <RackRow
          tiles={state.rack}
          selectedIds={selectedTileIds}
          onToggle={store.toggleTile}
          tileSize={rackTileSize}
        />

        <footer
          data-frame-corner-row="bottom"
          className="gameplay-frame-corner-row flex items-center justify-center gap-1.5 rounded-sm border-t border-white/5 bg-[var(--color-dark-forest)] px-2 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.2)] safe-area-bottom sm:gap-3 sm:px-4"
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => store.clearSelection()}
            disabled={selectedTileIds.length === 0}
            className="!min-w-0 flex-1 !px-2 text-xs sm:max-w-[180px] sm:text-sm"
          >
            {t('tableLoop.action.clear', 'Clear')}
          </Button>
          <Button
            data-testid="table-loop-exchange"
            variant="secondary"
            size="sm"
            onClick={() => store.redraw()}
            disabled={!canRedraw}
            className="!min-w-0 flex-1 !px-2 text-xs sm:max-w-[220px] sm:text-sm"
          >
            {exchangeCostsAction
              ? t('tableLoop.action.recover', 'Exchange (1 action)')
              : t('tableLoop.action.exchange', 'Exchange ({{left}})', {
                  left: state.redrawsRemaining,
                })}
          </Button>
          <Button
            data-testid="table-loop-finish"
            variant="primary"
            size="sm"
            onClick={() => store.finishRound()}
            disabled={state.score < state.round.target}
            className={`!min-w-0 flex-[1.4] !px-2 text-xs sm:max-w-[260px] sm:text-sm ${
              state.score >= state.round.target
                ? 'shadow-[0_0_22px_rgba(74,222,128,0.45)]'
                : ''
            }`}
          >
            {state.score >= state.round.target
              ? t('tableLoop.action.finish', 'Finish round')
              : t('tableLoop.action.needMore', '{{remaining}} to go', {
                  remaining: remaining.toLocaleString(),
                })}
          </Button>
        </footer>
      </div>
    </TableFelt>
  )
}

export default TableLoopScreen
