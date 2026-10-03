/** Analysis-only observed-play model. Never an exact future-score forecast. */
import { Tile } from '../../src/core/Tile'
import type { GameOrchestrator } from '../../src/game/GameOrchestrator'
import { DecreeSystem } from '../../src/systems/DecreeSystem'
import { decreeKey } from '../../src/systems/decreeIdentity'
import { hasDecreeSticker } from '../../src/systems/decreeStickers'
import type {
  Decree,
  DecreeEffect,
  FlowerCollection,
  RoundState,
  ScoringContext,
} from '../../src/systems/types'
import type { TeaHouseOffering } from '../../src/systems/TeaHouseSystem'
import {
  parsePartialHand,
  toPartialParsedHand,
} from '../../src/rules/PartialHandParser'
import {
  calculateScore,
  createScoringContext,
} from '../../src/rules/ScoringEngine'

export interface ObservedPlay {
  tiles: Tile[]
  round: RoundState
  handsPlayedThisRun: number
  lastHandScore?: number
}

/** Only tactical groups that were fully visible before commitment enter memory. */
export function observeShopPlay(
  tiles: readonly Tile[],
  concealedIds: ReadonlySet<string>,
  tileIds: readonly string[],
  round: RoundState,
  handsPlayedThisRun: number,
  lastHandScore?: number
): ObservedPlay | null {
  if (
    tileIds.length < 2 ||
    tileIds.length > 5 ||
    new Set(tileIds).size !== tileIds.length ||
    tileIds.some((id) => concealedIds.has(id))
  )
    return null
  const selected = tileIds.map((id) => tiles.find((tile) => tile.id === id))
  if (selected.some((tile) => !tile)) return null
  return {
    tiles: selected.map((tile) => tile!.clone(tile!.id)),
    round: { ...round },
    handsPlayedThisRun,
    lastHandScore,
  }
}

export interface ShopPolicyContext {
  decrees: ReturnType<DecreeSystem['toState']>
  offers: readonly TeaHouseOffering[]
  samples: readonly ObservedPlay[]
  flowers: FlowerCollection
  gold: number
  /** Current allowance excluding Decree extra plays. */
  basePlays: number
}

/** Two repeated observed-play rounds; no new tiles, wall, random draws or effect execution. */
function buildValue(c: ShopPolicyContext, system: DecreeSystem, gold: number) {
  let score = 0
  let savings = gold
  for (let horizon = 0; horizon < 2; horizon++) {
    system.onRoundStart()
    const owned = system.getOwnedDecrees()
    let mean = 0
    for (const sample of c.samples) {
      const tiles = sample.tiles
      const parse = parsePartialHand(tiles)
      const hand = toPartialParsedHand(parse, tiles)
      const base = calculateScore(
        createScoringContext(tiles, hand, {
          partialMelds: parse.groups,
          previewMode: true,
          extraRetriggers: system.calculateRetriggers(tiles),
        })
      )
      const context: ScoringContext = {
        previewMode: true,
        hand,
        tiles,
        melds: hand.melds,
        decrees: owned,
        flowers: c.flowers,
        // Season effects are not projected into a future round.
        season: {
          activeSeason: null,
          seasonStack: [],
          isCorruptedRound: false,
          effectMultiplier: 1,
        },
        round: sample.round,
        yakuMultipliers: new Map(),
        isConcealed: true,
        winningTile: tiles[tiles.length - 1],
        detectedYakuIds: new Set(),
        gold: savings,
        handsPlayedThisRun: sample.handsPlayedThisRun,
        lastHandScore: sample.lastHandScore,
      }
      const withDecrees = system.applyDecreeEffects(context, {
        basePoints: base.basePoints,
        tilePoints: base.tilePoints,
        structurePoints: base.structurePoints,
        additiveBonus: 0,
        yakuMultiplier: 1,
        decreeMultiplier: 1,
        flowerMultiplier: 1,
        seasonMultiplier: 1,
        finalScore: 0,
        bonusGold: 0,
      })
      mean +=
        (base.subtotal + withDecrees.additiveBonus) *
        withDecrees.decreeMultiplier *
        base.modifierMultiplier
    }
    mean /= c.samples.length
    // Explicit heuristic weights, not engine formulas: rack/discard flexibility
    // gets a modest premium, and net savings are worth 5% per gold (bounded).
    const flexibility = Math.max(
      0.5,
      1 +
        system.getHandSizeBonus() * 0.05 +
        system.getAdditionalDiscards() * 0.02
    )
    savings +=
      system.calculateRoundEndGold() * system.getGoldMultiplier() -
      system.calculateRentalCosts()
    const economy = Math.max(
      0.1,
      1 + Math.max(-10, Math.min(20, savings)) * 0.05
    )
    score +=
      mean *
      Math.max(1, c.basePlays + system.getAdditionalDraws()) *
      flexibility *
      economy
    system.onRoundEnd()
  }
  return score
}

export interface BuildShopChoice {
  offerId: string
  sellInstanceId?: string
  reason: 'observed-build-gain' | 'observed-build-replacement'
  relativeGain: number
}

function modeledEffect(effect: DecreeEffect): boolean {
  if (effect.type === 'conditional') return modeledEffect(effect.effect)
  if (effect.type === 'gold') return effect.trigger === 'OnRoundEnd'
  if (effect.type === 'rule_modification')
    return [
      'hand_size',
      'discard_count',
      'retrigger_amplifier',
      'gold_multiplier',
    ].includes(effect.ruleId)
  return [
    'additive_score',
    'multiplicative_score',
    'scaling',
    'draw',
    'retrigger',
    'copy_decree',
  ].includes(effect.type)
}
const modeledDecree = (decree: Decree) =>
  [decree.effect, ...(decree.extraEffects ?? [])].every(modeledEffect)
const copiesEffect = (effect: DecreeEffect): boolean =>
  effect.type === 'copy_decree' ||
  (effect.type === 'conditional' && copiesEffect(effect.effect))
const copiesDecree = (decree: Decree) =>
  [decree.effect, ...(decree.extraEffects ?? [])].some(copiesEffect)

/** Compare complete ordered inventories; physical IDs and slot rules stay canonical. */
export function chooseBuildShopPurchase(
  c: ShopPolicyContext
): BuildShopChoice | null {
  if (!c.samples.length) return null
  const baseline = buildValue(c, DecreeSystem.fromState(c.decrees), c.gold)
  if (!(baseline > 0) || !Number.isFinite(baseline)) return null
  let best: BuildShopChoice | null = null
  const knownCopyTargets = c.decrees.ownedDecrees.every(
    (d) => d.isDebuffed || modeledDecree(d)
  )
  for (const offer of c.offers) {
    if (
      offer.itemType !== 'Decree' ||
      offer.isPurchased ||
      offer.isLocked ||
      !Number.isFinite(offer.finalCost) ||
      offer.finalCost < 0
    )
      continue
    // Never turn a rule-changing power into a pretend numerical forecast.
    // They may still be retained in the current build; their unmodelled effects
    // are a documented limit. Full-hand/Yaku powers cannot earn credit from
    // tactical samples alone.
    const incoming = offer.item as Decree
    if (
      !modeledDecree(incoming) ||
      (copiesDecree(incoming) && !knownCopyTargets)
    )
      continue
    const candidates = [
      undefined,
      ...c.decrees.ownedDecrees
        .filter(
          (d) =>
            !hasDecreeSticker(d, 'Eternal') &&
            (d.isDebuffed ||
              (modeledDecree(d) && (!copiesDecree(d) || knownCopyTargets)))
        )
        .map(decreeKey),
    ]
    for (const sellInstanceId of candidates) {
      const system = DecreeSystem.fromState(c.decrees)
      const sellGold = sellInstanceId ? system.sellDecree(sellInstanceId) : 0
      if (
        c.gold + sellGold < offer.finalCost ||
        !system.canAcquireDecree(incoming, c.flowers.flowers.length) ||
        !system.acquireDecree(incoming)
      )
        continue
      const value = buildValue(c, system, c.gold + sellGold - offer.finalCost)
      const relativeGain = value / baseline - 1
      // A small margin prevents near-equal churn, particularly from rounding.
      if (
        Number.isFinite(relativeGain) &&
        relativeGain > 0.05 &&
        (!best || relativeGain > best.relativeGain)
      ) {
        best = {
          offerId: offer.id,
          sellInstanceId,
          relativeGain,
          reason: sellInstanceId
            ? 'observed-build-replacement'
            : 'observed-build-gain',
        }
      }
    }
  }
  return best
}

/** Execute only canonical sales/purchases; refresh ownership after each one. */
export function buyObservedDecrees(
  game: GameOrchestrator,
  samples: readonly ObservedPlay[],
  offers: readonly TeaHouseOffering[]
) {
  const charter = game.getState().charterSystem.calculateEffects()
  // The previous round's allowance may include an expired/sold Decree. Only
  // configuration and current Charters define the non-Decree base here.
  const basePlays = Math.max(
    1,
    game.captureRun().config.handsPerRound +
      charter.additionalHands -
      charter.handsPenalty
  )
  let purchases = 0
  let sold = 0
  for (let guard = 0; guard < offers.length; guard++) {
    const state = game.getState()
    const choice = chooseBuildShopPurchase({
      decrees: state.decreeSystem.toState(),
      offers,
      samples,
      flowers: state.flowerSystem.getCollection(),
      gold: state.gold,
      basePlays,
    })
    if (!choice) break
    if (choice.sellInstanceId) {
      if (!game.sellDecree(choice.sellInstanceId).success)
        throw new Error('Planned Decree sale failed')
      sold++
    }
    if (!game.shop.purchase(choice.offerId).success)
      throw new Error('Planned build purchase failed')
    purchases++
  }
  return { purchases, sold }
}
