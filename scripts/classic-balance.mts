/**
 * Balance harness for the classic loop.
 *
 * The implementation-status document has "build a strategy-aware balance
 * harness" as outstanding work, and section 1.1 of
 * `docs/GAMEPLAY_EXPERIMENTS.md` proposes changing the scoring baseline so that
 * recognising a pattern is worth learning. Changing that baseline without a
 * measurement would be changing eight Acts of targets and 164 Decrees on a
 * hunch.
 *
 * The baseline plays the highest-scoring selection found by the coach. Optional
 * resource and one-away policies use only visible information and real actions.
 * An opt-in consumable policy adds visible-target and public-reward use.
 * Optional --build-shop ranks Decrees using past visible tactical plays. These are controlled
 * policy comparisons, not human difficulty, optimal play, or enjoyment measures.
 *
 *   bun scripts/classic-balance.mts [runs] [--shop] [--resources] [--chase-hands]
 *     [--consumables] [--build-shop] [--table=green_felt] [--stake=1] [--seed=1] [--json]
 */

import { GameOrchestrator } from '../src/game/GameOrchestrator.ts'
import { eventBus } from '../src/game/EventBus.ts'
import { buildCoachAdvice } from '../src/gameplay/beginnerCoach.ts'
import { chooseBlindSelection } from '../src/gameplay/blindSelection.ts'
import { chooseClassicResourceAction } from './lib/classic-resource-policy.ts'
import { chooseClassicConsumableAction } from './lib/classic-consumable-policy.ts'
import { getTableStyleById } from '../src/config/tableStyleDefinitions.ts'
import { STAKE_DEFINITIONS } from '../src/config/stakeDefinitions.ts'
import { chooseClassicHandAction } from './lib/classic-hand-policy.ts'
import type { ScoreBreakdown } from '../src/rules/ScoringEngine.ts'
import {
  buyObservedDecrees,
  observeShopPlay,
  type ObservedPlay,
} from './lib/classic-shop-policy.ts'

const ARGS = process.argv.slice(2)
const BUILD_SHOP = ARGS.includes('--build-shop')
const BUYS = BUILD_SHOP || ARGS.includes('--shop')
const SHOP_POLICY = BUILD_SHOP
  ? 'observed-build'
  : BUYS
    ? 'cheapest-first'
    : 'off'
const CHASES = ARGS.includes('--chase-hands')
const BATCH_PLANS = ARGS.includes('--plan-batches')
const PLANS = ARGS.includes('--plan-hands') || BATCH_PLANS
if (
  [ARGS.includes('--plan-hands'), BATCH_PLANS, CHASES].filter(Boolean).length >
  1
)
  throw new Error(
    'Choose one hand policy: --plan-hands, --plan-batches or --chase-hands'
  )
const RESOURCES = PLANS || CHASES || ARGS.includes('--resources')
const CONSUMABLES = ARGS.includes('--consumables')
const JSON_OUTPUT = ARGS.includes('--json')
const BASE_POLICY = BATCH_PLANS
  ? 'resources-and-batch-hand-plan'
  : PLANS
    ? 'resources-and-hand-plan'
    : CHASES
      ? 'resources-and-one-away'
      : RESOURCES
        ? 'resources'
        : 'best-immediate'
const POLICY = `${BASE_POLICY}${CONSUMABLES ? '+consumables' : ''}`
const value = (name: string, fallback: string) =>
  ARGS.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ??
  fallback
const TABLE = value('table', 'green_felt')
const STAKE = Number(value('stake', '1'))
const FIRST_SEED = Number(value('seed', '1'))
const positional = ARGS.filter((arg) => !arg.startsWith('--'))
const RUNS = Number(positional[0] ?? 200)
for (const arg of ARGS.filter((arg) => arg.startsWith('--'))) {
  if (
    ![
      '--shop',
      '--build-shop',
      '--resources',
      '--chase-hands',
      '--plan-hands',
      '--plan-batches',
      '--consumables',
      '--json',
    ].includes(arg) &&
    !/^--(?:table|stake|seed)=.+$/.test(arg)
  )
    throw new Error(`Unknown or incomplete option: ${arg}`)
}
if (positional.length > 1) throw new Error('Expected at most one run count')
if (!Number.isInteger(RUNS) || RUNS < 1 || RUNS > 10000) {
  throw new Error('Run count must be an integer from 1 to 10000')
}
if (!getTableStyleById(TABLE)) throw new Error(`Unknown table: ${TABLE}`)
if (!STAKE_DEFINITIONS.some((stake) => stake.tier === STAKE))
  throw new Error('Stake must be an integer from 1 to 8')
if (
  !Number.isSafeInteger(FIRST_SEED) ||
  FIRST_SEED < 1 ||
  FIRST_SEED + RUNS - 1 > 0xffffffff
)
  throw new Error('Seed range must fit positive 32-bit integers')

interface RunResult {
  seed: number
  /** Highest Act the run reached. */
  act: number
  /** Rounds cleared across the run. */
  rounds: number
  /** Total score across every round. */
  runScore: number
  hands: number
  blindHands: number
  completeHands: number
  /** Actual complete concealed plays, excluding Clemency's virtual completion. */
  completeConcealedHands: number
  yakuTriggers: Record<string, number>
  redraws: number
  redrawnTiles: number
  discards: number
  oneAwayAttempts: number
  handPlanAttempts: number
  handPlanDistances: Record<string, number>
  unusedConsumables: number
  consumablesUsed: number
  consumableUsesById: Record<string, number>
  consumableUsesByReason: Record<string, number>
  unusedConsumablesById: Record<string, number>
  /** Last observed policy reason for each item remaining at run end. */
  unusedConsumablesByReason: Record<string, number>
  purchases: number
  goldSpent: number
  packsClaimed: number
  packsSkipped: number
  buildShopPurchases: number
  decreesSold: number
  rescuedRoundsByDecree: Record<string, number>
  finalDecreeIds: string[]
  outcome: string
  stopDetail?: {
    seed: number
    act: number
    round: number
    handSize: number
    visibleTiles: number
    lockedTiles: number
    mandate: string | undefined
  }
}

function playRun(seed: number): RunResult {
  const orchestrator = new GameOrchestrator()
  orchestrator.startNewRun(seed, STAKE, TABLE)

  let rounds = 0
  let hands = 0
  let blindHands = 0
  let completeHands = 0
  const yakuTriggers: Record<string, number> = {}
  let redraws = 0
  let redrawnTiles = 0
  let discards = 0
  let oneAwayAttempts = 0
  let handPlanAttempts = 0
  const handPlanDistances: Record<string, number> = {}
  let highestAct = 1
  let purchases = 0
  let goldSpent = 0
  let packsClaimed = 0
  let packsSkipped = 0
  let outcome = 'guardLimit'
  let buildShopPurchases = 0
  let decreesSold = 0
  const shopSamples: ObservedPlay[] = []
  let consumablesUsed = 0
  const consumableUsesById: Record<string, number> = {}
  const consumableUsesByReason: Record<string, number> = {}
  const lastHoldReason = new Map<string, string>()
  const rescuedRoundsByDecree: Record<string, number> = {}
  const stopRescueTracking = eventBus.on(
    'decreeTriggered',
    ({ decreeId, effect }) => {
      if (effect === 'loss prevented')
        rescuedRoundsByDecree[decreeId] =
          (rescuedRoundsByDecree[decreeId] ?? 0) + 1
    }
  )

  for (
    let guard = 0;
    guard < (RESOURCES || CONSUMABLES ? 1000 : 400);
    guard += 1
  ) {
    const state = orchestrator.getState()
    highestAct = Math.max(highestAct, state.currentAct)

    if (state.phase === 'gameOver') {
      outcome = state.hasWonRun ? 'win' : 'loss'
      if (state.hasWonRun) rounds += 1
      break
    }

    if (state.phase === 'shop') {
      // Opening is part of a real visit even when the policy buys nothing:
      // consume visit Omens and generate the same kind of offers as the UI.
      if (!orchestrator.shop.open()) {
        outcome = 'shopOpenFailed'
        break
      }
      if (BUYS) {
        const settled = buyWhatWeCan(orchestrator, shopSamples)
        packsClaimed += settled.claimed
        packsSkipped += settled.skipped
        buildShopPurchases += settled.buildPurchases
        decreesSold += settled.sold
      }
      purchases += orchestrator.shop.visitTotals.itemsPurchased
      goldSpent += orchestrator.shop.visitTotals.goldSpent
      rounds += 1
      orchestrator.exitShop()
      if (orchestrator.getState().phase === 'shop') {
        outcome = 'shopExitFailed'
        break
      }
      continue
    }

    if (state.phase !== 'gameplay') {
      outcome = `unexpected:${state.phase}`
      break
    }

    const advice = buildCoachAdvice({
      partialRules: orchestrator.getPartialHandRules(),
      tiles: [...state.handTiles],
      concealedIds: state.faceDownTileIds,
      requiredTileIds: state.mandateEffectSystem.getLockedTileIds(),
      completeHandTileIds: orchestrator.findCompleteHandSelection(),
      scoreSelection: (tileIds) =>
        orchestrator.previewScore(tileIds)?.finalScore ?? null,
      remainingToTarget: Math.max(0, state.targetScore - state.score),
      handsRemaining: state.handsRemaining,
    })
    if (CONSUMABLES) {
      const decision = chooseClassicConsumableAction({
        visibleTiles: state.handTiles.filter(
          (tile) => !state.faceDownTileIds.has(tile.id)
        ),
        items: [
          ...state.fateSeals,
          ...state.celestialOrbs,
          ...state.voidScripts,
        ],
        lockedTileIds: state.mandateEffectSystem.getLockedTileIds(),
        advice,
        remainingToTarget: Math.max(0, state.targetScore - state.score),
        gold: state.gold,
        decreeCount: state.decreeSystem.getOwnedDecrees().length,
        scriptDownsideProtected:
          state.omenSystem.hasVoidScriptDownsideProtection(),
        lastCopyable: state.fateSealSystem.getLastUsedConsumable(),
        canPerform: (action) => orchestrator.canPerformAction(action),
      })
      for (const item of decision.held)
        lastHoldReason.set(item.instanceId, item.reason)
      if (decision.choice) {
        const { action, itemId, reason } = decision.choice
        const result = orchestrator.processAction(action)
        if (!result.success) {
          outcome = `invalidConsumable:${itemId}:${result.errors?.join(',')}`
          break
        }
        consumablesUsed++
        consumableUsesById[itemId] = (consumableUsesById[itemId] ?? 0) + 1
        consumableUsesByReason[reason] =
          (consumableUsesByReason[reason] ?? 0) + 1
        // Recompute legality, score advice, targets, resources and inventory
        // from the settled effect; never play stale pre-consumable advice.
        continue
      }
    }
    const resourceContext = {
      visibleTiles: state.handTiles.filter(
        (tile) => !state.faceDownTileIds.has(tile.id)
      ),
      handTileCount: state.handTiles.length,
      lockedTileIds: state.mandateEffectSystem.getLockedTileIds(),
      requiredPlaySize: state.mandateEffectSystem.getRequiredHandSize(),
      advice,
      remainingToTarget: Math.max(0, state.targetScore - state.score),
      chaseCompleteHands: CHASES,
      canPerform: (
        action: Parameters<typeof orchestrator.canPerformAction>[0]
      ) => orchestrator.canPerformAction(action),
    }
    const cycle = RESOURCES
      ? ((PLANS
          ? chooseClassicHandAction(resourceContext, {
              batchRedraws: BATCH_PLANS,
            })
          : null) ?? chooseClassicResourceAction(resourceContext))
      : null
    if (cycle) {
      const result = orchestrator.processAction(cycle.action)
      if (!result.success) {
        outcome = `invalidAction:${cycle.action.type}:${result.errors?.join(',')}`
        break
      }
      if (cycle.action.type === 'redraw') {
        redraws++
        redrawnTiles += cycle.action.tileIds.length
      } else discards++
      if (cycle.reason === 'one-away') oneAwayAttempts++
      if (cycle.reason === 'hand-plan') {
        handPlanAttempts++
        handPlanDistances[cycle.shanten] =
          (handPlanDistances[cycle.shanten] ?? 0) + 1
      }
      continue
    }
    // The House and Fish can conceal every tile. A player can still commit
    // a blind tactical selection; do not peek at identities or stop the run.
    const selection =
      advice?.best.tileIds ??
      (state.faceDownTileIds.size > 0
        ? chooseBlindSelection(
            state.handTiles.map((tile) => tile.id),
            state.mandateEffectSystem.getLockedTileIds(),
            (tileIds) =>
              orchestrator.canPerformAction({ type: 'play', tileIds })
          )
        : null)
    if (!selection) {
      outcome = 'noAdvice'
      break
    }

    const observed = BUILD_SHOP
      ? observeShopPlay(
          state.handTiles,
          state.faceDownTileIds,
          selection,
          {
            ...state.roundManager.getCurrentRound()!,
            handsPlayed: state.handsAllowance - state.handsRemaining,
            currentScore: state.score,
            discardsRemaining: state.discardsRemaining,
          },
          state.handsPlayedThisRun,
          state.lastHandScore
        )
      : null
    const result = orchestrator.processAction({
      type: 'play',
      tileIds: selection,
    })
    if (!result.success) {
      outcome = `invalidAction:${result.errors?.join(',')}`
      break
    }
    hands += 1
    if (observed) {
      shopSamples.push(observed)
      if (shopSamples.length > 6) shopSamples.shift()
    }
    if (!advice) blindHands += 1
    if (selection.length > 5) completeHands++
    for (const effect of result.effects) {
      if (effect.type !== 'score_added' || !('breakdown' in effect)) continue
      for (const yaku of (effect.breakdown as ScoreBreakdown).detectedYaku) {
        yakuTriggers[yaku.definition.id] =
          (yakuTriggers[yaku.definition.id] ?? 0) + 1
      }
    }
  }

  stopRescueTracking()
  const final = orchestrator.getState()
  const unusedConsumablesById: Record<string, number> = {}
  const unusedConsumablesByReason: Record<string, number> = {}
  for (const item of [
    ...final.fateSeals,
    ...final.celestialOrbs,
    ...final.voidScripts,
  ]) {
    unusedConsumablesById[item.id] = (unusedConsumablesById[item.id] ?? 0) + 1
    const reason = CONSUMABLES
      ? (lastHoldReason.get(item.instanceId) ?? 'not-observed')
      : 'policy-disabled'
    unusedConsumablesByReason[reason] =
      (unusedConsumablesByReason[reason] ?? 0) + 1
  }
  return {
    seed,
    act: highestAct,
    rounds,
    runScore: final.runScore,
    hands,
    blindHands,
    completeHands,
    completeConcealedHands: final.completeConcealedHandsPlayed ?? 0,
    yakuTriggers,
    redraws,
    redrawnTiles,
    discards,
    oneAwayAttempts,
    handPlanAttempts,
    handPlanDistances,
    consumablesUsed,
    consumableUsesById,
    consumableUsesByReason,
    unusedConsumablesById,
    unusedConsumablesByReason,
    unusedConsumables:
      final.fateSeals.length +
      final.celestialOrbs.length +
      final.voidScripts.length,
    purchases,
    goldSpent,
    packsClaimed,
    packsSkipped,
    buildShopPurchases,
    decreesSold,
    rescuedRoundsByDecree,
    finalDecreeIds: final.decreeSystem
      .getOwnedDecrees()
      .map((decree) => decree.id),
    outcome,
    stopDetail:
      outcome !== 'win' && outcome !== 'loss'
        ? {
            seed,
            act: final.currentAct,
            round: final.currentRound,
            handSize: final.handTiles.length,
            visibleTiles: final.handTiles.filter(
              (tile) => !final.faceDownTileIds.has(tile.id)
            ).length,
            lockedTiles: final.mandateEffectSystem.getLockedTileIds().length,
            mandate: final.mandateEffectSystem.getActiveMandate()?.id,
          }
        : undefined,
  }
}

/** Spend gold on the cheapest offers, so the "with shopping" variant differs. */
function buyWhatWeCan(
  orchestrator: GameOrchestrator,
  samples: ObservedPlay[]
): {
  claimed: number
  skipped: number
  buildPurchases: number
  sold: number
} {
  const shop = orchestrator.shop
  const state = shop.state
  const offers = [
    ...state.itemOfferings,
    ...state.packOfferings,
    ...(state.charterOffering ? [state.charterOffering] : []),
  ].sort((a, b) => a.finalCost - b.finalCost)
  let claimed = 0
  let skipped = 0
  let buildPurchases = 0
  let sold = 0
  if (BUILD_SHOP) {
    const bought = buyObservedDecrees(orchestrator, samples, offers)
    buildPurchases += bought.purchases
    sold += bought.sold
  }
  for (const offer of offers) {
    if (BUILD_SHOP && offer.itemType === 'Decree') continue
    if (!shop.purchase(offer.id).success) continue
    const pack = shop.pendingPack
    if (!pack) continue
    // Deterministic, deliberately naive choice policy. Validation and grants
    // are the real shop path, not duplicated inventory or pricing logic.
    let selection: number[] | null = null
    for (let i = 0; i < pack.contents.length && !selection; i++) {
      if (pack.maxSelections > 1) {
        for (let j = i + 1; j < pack.contents.length; j++) {
          if (shop.validatePackSelection([i, j]).success) {
            selection = [i, j]
            break
          }
        }
      }
      if (!selection && shop.validatePackSelection([i]).success) selection = [i]
    }
    if (selection) {
      if (!shop.confirmPack(selection).success)
        throw new Error('Valid pack claim failed')
      claimed++
    } else {
      if (!shop.skipPack().success) throw new Error('Pack skip failed')
      skipped++
    }
  }
  return { claimed, skipped, buildPurchases, sold }
}

function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0
}

const results: RunResult[] = []
for (let seed = FIRST_SEED; seed < FIRST_SEED + RUNS; seed += 1)
  results.push(playRun(seed))

const acts = results.map((run) => run.act)
const rounds = results.map((run) => run.rounds)
const scores = results.map((run) => run.runScore)

const reached = (act: number) =>
  (
    (results.filter((run) => run.act >= act).length / results.length) *
    100
  ).toFixed(0)

const outcomes = results.reduce<Record<string, number>>((counts, run) => {
  counts[run.outcome] = (counts[run.outcome] ?? 0) + 1
  return counts
}, {})
const limitations = [
  'Heuristic candidate search, not exhaustive or optimal play.',
  'completeHands is the historical count of plays larger than five tiles, including assisted completions. completeConcealedHands records actual complete concealed hands without Shanten Clemency.',
  'Table and Stake entry are selected directly. No persistent player profile is loaded; Decree, Charter and consumable unlock resolvers remain at engine defaults.',
  RESOURCES
    ? 'Cycles low-connectivity spare tiles when behind the required score pace.'
    : 'No discards or redraws.',
  BATCH_PLANS
    ? 'Ordinary 14-tile batch planning retains the best single-exchange shanten while replacing up to three tiles per redraw. It prefers larger equally distant retained shapes, then distinct improving types, then lower removed base points. Replans after real draws; no wall counts, draw probabilities, altered grammar or enlarged-rack planning.'
    : PLANS
      ? 'Ordinary 14-tile hand planning minimizes retained shanten, then maximizes distinct improving types. Single exchanges replan after real draws; type breadth is not draw probability. No wall counts, altered Decree grammar, future Yaku value or enlarged-rack subset planning.'
      : CHASES
        ? 'One-away search uses ordinary 14-tile structures only; it does not price future Yaku or know whether a completion tile remains.'
        : 'No deliberate complete-hand pursuit.',
  'Concealed racks without visible advice use an unscored position-only fallback.',
  BUILD_SHOP
    ? 'Observed-build shopping compares modelled Decree inventories on the last six visible tactical plays over a two-round horizon; it can sell eligible copies. Rack/discard/economy weights are heuristic; unpriced rule powers are neither bought nor sold. Other items remain cheapest-first and pack choices first-valid. No future wall, broader Yaku planning, complete-hand modelling or optimality claim.'
    : 'Shopping buys cheapest-first and takes the first valid pack selection; no synergy optimization.',
  CONSUMABLES
    ? 'Conservative consumable policy: permanent upgrades, public rewards and visible-target heuristics. Unpriced Script penalties/global sacrifices are held, not assumed harmless; no hypothetical effect execution or build synergy optimization.'
    : 'No consumable use. Unused inventory is reported, not treated as an implemented policy.',
  'These results describe this policy, not human difficulty or enjoyment.',
]
if (JSON_OUTPUT) {
  console.log(
    JSON.stringify(
      {
        schema: 2,
        policy: POLICY,
        shopping: BUYS,
        shoppingPolicy: SHOP_POLICY,
        consumables: CONSUMABLES,
        table: TABLE,
        stake: STAKE,
        firstSeed: FIRST_SEED,
        runs: RUNS,
        outcomes,
        results,
        limitations,
      },
      null,
      2
    )
  )
} else {
  console.log(
    `Classic loop — ${RUNS} runs from seed ${FIRST_SEED}, ${POLICY}, shopping ${SHOP_POLICY}, ${TABLE}, Stake ${STAKE}\n`
  )
  console.log(
    `  Act reached    median ${quantile(acts, 0.5)}   p90 ${quantile(acts, 0.9)}   max ${Math.max(...acts)}`
  )
  console.log(
    `  Rounds cleared median ${quantile(rounds, 0.5)}   mean ${(rounds.reduce((a, b) => a + b, 0) / rounds.length).toFixed(2)}`
  )
  console.log(`  Run score      median ${quantile(scores, 0.5)}`)
  console.log(
    `  Reached Act    ${[2, 3, 4, 5, 6, 7, 8].map((act) => `${act}: ${reached(act)}%`).join('   ')}`
  )
  console.log(
    `  Purchases      ${results.reduce((sum, run) => sum + run.purchases, 0)}; gold spent ${results.reduce((sum, run) => sum + run.goldSpent, 0)}`
  )
  console.log(
    `  Blind hands    ${results.reduce((sum, run) => sum + run.blindHands, 0)} (position-only, no score preview)`
  )
  console.log(
    `  Resources      ${results.reduce((sum, run) => sum + run.redraws, 0)} redraws (${results.reduce((sum, run) => sum + run.redrawnTiles, 0)} tiles), ${results.reduce((sum, run) => sum + run.discards, 0)} discards`
  )
  console.log(
    `  Complete hands ${results.reduce((sum, run) => sum + run.completeHands, 0)}; one-away attempts ${results.reduce((sum, run) => sum + run.oneAwayAttempts, 0)}`
  )
  console.log(
    `  Items used     ${results.reduce((sum, run) => sum + run.consumablesUsed, 0)} consumables (per-item uses and hold reasons in --json)`
  )
  console.log(
    `  Unused items   ${results.reduce((sum, run) => sum + run.unusedConsumables, 0)} consumables at run end`
  )
  console.log(
    `  Packs          claimed ${results.reduce((sum, run) => sum + run.packsClaimed, 0)}; skipped ${results.reduce((sum, run) => sum + run.packsSkipped, 0)}`
  )
  console.log('  Outcomes       ' + JSON.stringify(outcomes))
  const stops = results.flatMap((run) =>
    run.stopDetail ? [run.stopDetail] : []
  )
  if (stops.length) console.log('  No-advice stops ' + JSON.stringify(stops))
  console.log('\n' + limitations.join('\n'))
}
