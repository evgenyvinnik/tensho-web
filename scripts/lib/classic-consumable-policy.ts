/** Experimental policy, not a hint system or a hypothetical effect executor. */
import { Tile } from '../../src/core/Tile'
import { convertSuitedTile } from '../../src/core/tileTransformations'
import {
  EnhancementType,
  EditionType,
  SealType,
} from '../../src/core/TileModifier'
import type { PlayerAction } from '../../src/game/ActionProcessor'
import type { CoachAdvice } from '../../src/gameplay/beginnerCoach'
import { consumableTargetRange } from '../../src/gameplay/consumableTargeting'
import type { FateSeal } from '../../src/systems/FateSealSystem'
import type { CelestialOrb } from '../../src/systems/CelestialOrbSystem'
import type { VoidScript } from '../../src/systems/VoidScriptSystem'
import type { BaseConsumable } from '../../src/systems/ConsumableSystem'

type Item = FateSeal | CelestialOrb | VoidScript
type Action = Extract<
  PlayerAction,
  { type: 'useSeal' | 'useOrb' | 'useScript' }
>
export interface ConsumablePolicyContext {
  /** Caller removes concealed tiles before crossing this boundary. */
  visibleTiles: readonly Tile[]
  items: readonly Item[]
  lockedTileIds: readonly string[]
  advice: CoachAdvice | null
  remainingToTarget: number
  gold: number
  decreeCount: number
  scriptDownsideProtected: boolean
  lastCopyable: BaseConsumable | null
  canPerform: (action: Action) => boolean
}

export interface ConsumableChoice {
  action: Action
  itemId: string
  reason: string
}

/** Plain public identities only; no random draws, future wall or score oracle. */
function connectivity(tile: Tile, others: readonly Tile[]): number {
  return others.reduce((sum, other) => {
    if (tile.id === other.id || tile.suit !== other.suit) return sum
    const distance = Math.abs(tile.rank - other.rank)
    return (
      sum +
      (distance === 0
        ? 6
        : tile.isSuited && distance === 1
          ? 3
          : tile.isSuited && distance === 2
            ? 1
            : 0)
    )
  }, 0)
}

function targetPlan(
  item: FateSeal | VoidScript,
  c: ConsumablePolicyContext
): { targets: string[]; reason: string } | string {
  const { min, max } = consumableTargetRange(item.effect)
  if (!max) return { targets: [], reason: 'public-reward' }
  const played = new Set(c.advice?.best.tileIds ?? [])
  const tiles = c.visibleTiles.filter(
    (t) => !t.isBonus && !c.lockedTileIds.includes(t.id)
  )
  const scored = tiles.filter((t) => played.has(t.id))
  const held = tiles.filter((t) => !played.has(t.id))
  const byConnection = (pool: readonly Tile[]) =>
    [...pool].sort((a, b) => connectivity(b, tiles) - connectivity(a, tiles))
  const targets = (pool: readonly Tile[], reason: string) =>
    pool.length < min
      ? 'no-suitable-visible-targets'
      : { targets: pool.slice(0, max).map((t) => t.id), reason }

  if (item.type === 'FateSeal') {
    const effect = item.effect
    if (effect.type === 'enhance_tiles' || effect.type === 'convert_to_wild') {
      const mark = effect.enhancement
      const pool =
        mark === EnhancementType.Steel || mark === EnhancementType.Gold
          ? held
          : mark === EnhancementType.Stone
            ? held
            : scored
      const ranked = byConnection(pool)
      if (mark === EnhancementType.Stone) ranked.reverse()
      return targets(
        ranked.filter((t) => t.modifiers.enhancement === EnhancementType.None),
        'add-mark'
      )
    }
    if (
      effect.type === 'rank_modification' ||
      effect.type === 'convert_suit' ||
      effect.type === 'copy_tile'
    ) {
      // Improve a spare's visible connections without breaking today's priced
      // selection. This is a structural heuristic, never a score forecast.
      let best: { ids: string[]; gain: number } | null = null
      for (const target of held) {
        if (target.hasModifiers) continue
        const replacements: Tile[] = []
        if (effect.type === 'copy_tile')
          replacements.push(
            ...byConnection(tiles).filter((t) => t.id !== target.id)
          )
        else if (target.isSuited) {
          if (effect.type === 'convert_suit' && effect.targetSuit) {
            replacements.push(convertSuitedTile(target, effect.targetSuit))
          } else if (effect.type === 'rank_modification') {
            const rank = target.rank + (effect.rankChange ?? 1)
            if (rank >= 1 && rank <= 9)
              replacements.push(new Tile(target.suit, rank, target.id))
          }
        }
        for (const source of replacements) {
          const replacement = new Tile(source.suit, source.rank, target.id)
          const gain =
            connectivity(replacement, tiles) - connectivity(target, tiles)
          if (gain > 0 && (!best || gain > best.gain))
            best = {
              ids:
                effect.type === 'copy_tile'
                  ? [target.id, source.id]
                  : [target.id],
              gain,
            }
        }
      }
      return best
        ? { targets: best.ids, reason: 'visible-connections' }
        : 'no-visible-structural-gain'
    }
    return 'destructive-effect-not-priced'
  }
  if (item.effect.type === 'apply_seal_to_tile') {
    const seal = item.effect.sealType
    const pool =
      seal === SealType.Blue || seal === SealType.Purple ? held : scored
    return targets(
      byConnection(pool).filter((t) => t.modifiers.seal === SealType.None),
      'add-seal'
    )
  }
  if (item.effect.type === 'apply_edition')
    return targets(
      byConnection(scored).filter(
        (t) => t.modifiers.edition === EditionType.Base
      ),
      'add-edition'
    )
  if (item.effect.type === 'duplicate_tile')
    return targets(byConnection(scored), 'duplicate-scoring-tile')
  return 'target-effect-not-priced'
}

function plan(
  item: Item,
  c: ConsumablePolicyContext
): ConsumableChoice | string {
  if (c.advice && c.advice.best.score >= c.remainingToTarget)
    return 'take-known-clear'
  if (item.type === 'CelestialOrb')
    return {
      action: { type: 'useOrb', orbId: item.instanceId },
      itemId: item.id,
      reason: 'permanent-upgrade',
    }
  if (item.type === 'FateSeal' && item.effect.type === 'duplicate_consumable') {
    if (!c.lastCopyable || c.lastCopyable.type === 'VoidScript')
      return 'no-copy-source'
    // Self-copy is legal, but consumes an allowance without changing this plan.
    if (c.lastCopyable.id === item.id) return 'self-copy-no-benefit'
  }
  if (item.type === 'VoidScript') {
    const penalty = item.penalty.type
    const affordable =
      c.scriptDownsideProtected ||
      penalty === 'none' ||
      (penalty === 'lose_gold' && c.gold === 0) ||
      (penalty === 'destroy_decrees' && c.decreeCount === 1)
    if (!affordable) return 'script-penalty-not-priced'
    // Omen protection cancels the penalty, not the primary effect's sacrifices
    // or unknown global conversion. Do not treat protection as a free forecast.
    if (
      [
        'destroy_and_create',
        'destroy_for_gold',
        'suit_conversion',
        'rank_conversion',
      ].includes(item.effect.type)
    )
      return 'global-or-destructive-effect-not-priced'
  }
  const selected = targetPlan(item, c)
  if (typeof selected === 'string') return selected
  return {
    action:
      item.type === 'FateSeal'
        ? {
            type: 'useSeal',
            sealId: item.instanceId,
            targets: selected.targets,
          }
        : {
            type: 'useScript',
            scriptId: item.instanceId,
            targets: selected.targets,
          },
    itemId: item.id,
    reason: selected.reason,
  }
}

export function chooseClassicConsumableAction(c: ConsumablePolicyContext): {
  choice: ConsumableChoice | null
  held: Array<{ instanceId: string; itemId: string; reason: string }>
} {
  const held: Array<{ instanceId: string; itemId: string; reason: string }> = []
  let choice: ConsumableChoice | null = null
  // Fixed public priority: permanent levels, Seals, then Scripts. Inventory order
  // breaks ties; no rarity/price sorting pretends to optimize a build.
  const items = [...c.items].sort(
    (a, b) =>
      Number(a.type !== 'CelestialOrb') - Number(b.type !== 'CelestialOrb') ||
      Number(a.type === 'VoidScript') - Number(b.type === 'VoidScript')
  )
  for (const item of items) {
    const proposal = plan(item, c)
    const reason =
      typeof proposal === 'string'
        ? proposal
        : !c.canPerform(proposal.action)
          ? 'currently-illegal'
          : choice
            ? 'another-item-first'
            : null
    if (reason)
      held.push({ instanceId: item.instanceId, itemId: item.id, reason })
    else choice = proposal as ConsumableChoice
  }
  return { choice, held }
}
