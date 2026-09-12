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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAppNavigation, ROUTES } from '../../router'
import { useTableLoopStore } from '../../stores/tableLoopStore'
import { TileImage } from '../tiles/TileImage'
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

function SaveNotice() {
  const { t } = useTranslation()
  const status = useTableLoopStore((store) => store.saveStatus)
  if (status === 'saved') return null
  return (
    <p
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
    </p>
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
      className={`group flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)] ${
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

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 overflow-y-auto bg-[var(--color-dark-forest)] px-4 py-6">
      <SaveNotice />
      <div className="w-full max-w-md text-center">
        <h1 className="text-xl font-black text-[var(--color-golden-yellow)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--color-beige-white)]/70">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex w-full max-w-md flex-col gap-2">{children}</div>
    </div>
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

  // ---------------------------------------------------------------------------
  // PHASES OUTSIDE PLAY
  // ---------------------------------------------------------------------------

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
        <button
          onClick={store.openShop}
          className="rounded-xl border-2 border-[var(--color-golden-yellow)] px-4 py-3 text-sm font-bold text-[var(--color-golden-yellow)]"
        >
          {t('tableLoop.cleared.shop', 'Visit the tea house')}
        </button>
        <button
          onClick={store.nextRound}
          className="rounded-xl border border-[var(--color-metallic-gold)]/40 px-4 py-2.5 text-sm text-[var(--color-beige-white)]/80"
        >
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
        <button
          onClick={store.nextRound}
          className="mt-2 rounded-xl border-2 border-[var(--color-golden-yellow)] px-4 py-3 text-sm font-bold text-[var(--color-golden-yellow)]"
        >
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
          className="rounded-xl border-2 border-[var(--color-golden-yellow)] px-4 py-3 text-sm font-bold text-[var(--color-golden-yellow)]"
        >
          {t('tableLoop.end.again', 'Another run')}
        </button>
        <button
          onClick={() => navigateTo(ROUTES.MENU)}
          className="rounded-xl border border-[var(--color-metallic-gold)]/40 px-4 py-2.5 text-sm text-[var(--color-beige-white)]/80"
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
  const canRecover =
    state.riverRecoveriesRemaining > 0 && state.river.length > 0

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col bg-[var(--color-dark-forest)] text-[var(--color-beige-white)]">
      <ResolutionFlourish stages={state.lastResolution} />
      <SaveNotice />

      {/* Header */}
      <header className="flex-shrink-0 px-3 pt-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.MENU)}
            className="min-h-11 shrink-0 rounded-lg border border-[var(--color-metallic-gold)]/35 px-2 text-xs text-[var(--color-beige-white)] focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]"
          >
            {t('common.mainMenu', 'Main menu')}
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--color-golden-yellow)]">
              {t(`tableLoop.rounds.${state.round.index}`, state.round.name)}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-beige-white)]/45">
              {state.practice
                ? t('tableLoop.practice.label', 'Practice deal')
                : t('tableLoop.hud.round', 'Round {{current}} of {{total}}', {
                    current: state.roundIndex + 1,
                    total: TABLE_ROUNDS.length,
                  })}
            </p>
          </div>
          <p className="flex-shrink-0 text-sm font-bold tabular-nums text-emerald-300">
            ¥{state.gold}
          </p>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="mt-1 flex items-baseline gap-2 text-sm tabular-nums"
        >
          <strong className="text-[var(--color-golden-yellow)]">
            {state.score.toLocaleString()}
          </strong>
          <span className="text-[var(--color-beige-white)]/40">
            / {state.round.target.toLocaleString()}
          </span>
          <span className="ml-auto text-[11px] text-[var(--color-beige-white)]/55">
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
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full bg-[var(--color-golden-yellow)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {state.round.bossRule && (
          <p
            data-testid="boss-banner"
            className="mt-1.5 rounded-md border border-rose-400/50 bg-rose-950/40 px-2 py-1 text-[11px] leading-snug text-rose-100"
          >
            {t(
              `tableLoop.boss.${state.round.bossRule}`,
              'Frost Magistrate — Honor tiles score half their points this round.'
            )}
          </p>
        )}
      </header>

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

      {/* The persistent table */}
      <TableSlots
        slots={state.slots}
        placeable={placeable}
        revisable={revisable}
        highlighted={highlightedSlots}
        forecasts={forecasts}
        multCosts={multCosts}
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
          className="mx-3 mt-1 rounded-md border border-red-400/50 bg-red-950/50 px-2 py-1 text-[11px] text-red-100"
        >
          {state.lastErrorKey
            ? t(state.lastErrorKey, state.lastError)
            : state.lastError}
        </p>
      )}

      <div className="flex-1" />

      {/* Offers (E06) */}
      <DraftRow
        tiles={state.draftRow}
        claimable={state.pendingDraftPick}
        onClaim={store.claimDraft}
        onPass={store.passDraft}
      />

      {/* River */}
      {state.river.length > 0 && (
        <div className="px-3 pb-1">
          <p className="mb-0.5 text-[10px] uppercase tracking-widest text-[var(--color-beige-white)]/40">
            {canRecover
              ? t('tableLoop.river.recover', 'River — tap to take one back')
              : t('tableLoop.river.title', 'River')}
          </p>
          <div className="flex gap-0.5 overflow-x-auto pb-1">
            {state.river.map((tile) => (
              <button
                key={tile.id}
                disabled={!canRecover}
                onClick={() => store.recoverFromRiver(tile.id)}
                className={canRecover ? 'opacity-90' : 'opacity-40'}
              >
                <TileImage tile={tile} size="small" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* What you have picked, and what it forms */}
      <SelectionStrip
        tiles={selectedTiles}
        groupType={selection.type}
        usedGap={selection.usedGap}
        bestForecast={bestForecast}
        multCost={bestMultCost}
        onClear={store.clearSelection}
      />

      <RackRow
        tiles={state.rack}
        selectedIds={selectedTileIds}
        onToggle={store.toggleTile}
      />

      {/* Actions */}
      <footer className="flex-shrink-0 gap-2 px-3 pb-3 pt-1">
        <p className="mb-1 text-center text-[11px] leading-snug text-[var(--color-beige-white)]/55">
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
        <div className="flex gap-2">
          <button
            onClick={store.clearSelection}
            disabled={selectedTileIds.length === 0}
            className="flex-1 rounded-lg border border-[var(--color-metallic-gold)]/35 py-2 text-xs uppercase tracking-wider text-[var(--color-beige-white)]/75 disabled:opacity-35"
          >
            {t('tableLoop.action.clear', 'Clear')}
          </button>
          <button
            data-testid="table-loop-exchange"
            onClick={store.redraw}
            disabled={!canRedraw}
            className="flex-1 rounded-lg border border-sky-400/50 py-2 text-xs uppercase tracking-wider text-sky-200 disabled:opacity-35"
          >
            {exchangeCostsAction
              ? t('tableLoop.action.recover', 'Exchange (1 action)')
              : t('tableLoop.action.exchange', 'Exchange ({{left}})', {
                  left: state.redrawsRemaining,
                })}
          </button>
          <button
            data-testid="table-loop-finish"
            onClick={store.finishRound}
            disabled={state.score < state.round.target}
            className="flex-1 rounded-lg border-2 border-[var(--color-golden-yellow)] py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-golden-yellow)] disabled:opacity-35"
          >
            {state.score >= state.round.target
              ? t('tableLoop.action.finish', 'Finish round')
              : t('tableLoop.action.needMore', '{{remaining}} to go', {
                  remaining: remaining.toLocaleString(),
                })}
          </button>
        </div>
      </footer>
    </div>
  )
}

export default TableLoopScreen
