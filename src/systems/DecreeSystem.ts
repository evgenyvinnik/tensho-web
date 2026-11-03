/**
 * Decree System for Tensho Mahjong Roguelike
 *
 * Decrees are rule-modifying effects that persist across rounds within a run.
 * They represent authority-based rule modifications, not random effects.
 *
 * Hierarchy: Heaven (Seasons) > Court (Decrees) > Nature (Flowers) > Table (Tiles) > Grammar (Yaku)
 */

import {
  CopyDecreeEffect,
  Decree,
  DecreeEffect,
  DecreeRarity,
  GateCondition,
  OwnedDecree,
  RetriggerTarget,
  RuleModificationEffect,
  ScalingSource,
  ScoringContext,
  ScoreBreakdown,
  Sticker,
} from './types'
import { DragonType, Tile, TileSuit, WindType } from '../core/Tile'
import { countScoringHonors } from './flowerMutationScoring'
import { Meld, MeldType } from '../core/Meld'
import { LIBRARY_DECREES } from '../config/decreeLibrary'
import { RunRandom, runRandom } from '../game/RunRandom'
import { decreeKey, isDecreeExcluded } from './decreeIdentity'
import { getDecreeStickers, hasDecreeSticker } from './decreeStickers'
import { AUSTERITY_EFFECT, austerityMultiplier } from './austerity'
import {
  isDecreeAvailable,
  type DecreeUnlockResolver,
} from '../config/decreeUnlocks'

/**
 * Every effect a Decree carries: its primary effect plus any extras from
 * multi-part authored Decrees. Effect readers iterate this so a Decree that
 * does two things is never honoured for only one of them.
 */
function allEffectsOf(decree: Decree): DecreeEffect[] {
  const effects = decree.extraEffects
    ? [decree.effect, ...decree.extraEffects]
    : [decree.effect]
  // Interpret known historical rule definitions without rewriting saved
  // inventory. Copies must receive the same rule as the physical source.
  return effects.map((effect) =>
    decree.id === 'closed_hand_austerity' && effect.type === 'conditional'
      ? AUSTERITY_EFFECT
      : decree.id === 'decree-treasure-hunter' &&
          effect.type === 'gold' &&
          effect.trigger === 'OnRoundEnd' &&
          !effect.scaleBy
        ? { ...effect, scaleBy: 'held_suits' as const }
        : effect
  )
}

/**
 * How many units of a scaling source the run currently holds.
 *
 * Seasons count the whole stack, falling back to the active Season, so a
 * "per Season" Decree pays for every Season in play rather than only the
 * topmost one.
 */
function countScalingSource(
  source: ScalingSource,
  context: ScoringContext,
  breakdown: ScoreBreakdown
): number {
  // Every tile count here reads a face; a Stone has no rank or suit.
  const tiles = context.tiles.filter((tile) => !tile.isStone)
  const countTiles = (predicate: (tile: Tile) => boolean): number =>
    tiles.filter(predicate).length
  const meldCount = (type: MeldType): number =>
    context.melds.filter((meld) => meld.type === type).length
  const round = context.round

  switch (source) {
    case 'flower_count':
      return context.flowers.flowers.length
    case 'season_count':
      return Math.max(
        context.season.seasonStack.length,
        context.season.activeSeason ? 1 : 0
      )

    case 'terminal_tiles':
      return countTiles((tile) => tile.isTerminal)
    case 'simple_tiles':
      return countTiles((tile) => countsAsSimple(tile, context))
    case 'green_tiles':
      return countTiles(isGreenTile)
    case 'rank_one_tiles':
      return countTiles((tile) => tile.isSuited && tile.rank === 1)
    case 'rank_five_tiles':
      return countTiles((tile) => tile.isSuited && tile.rank === 5)
    case 'rank_six_tiles':
      return countTiles((tile) => tile.isSuited && tile.rank === 6)
    case 'rank_nine_tiles':
      return countTiles((tile) => tile.isSuited && tile.rank === 9)

    case 'sequences':
      return meldCount(MeldType.Sequence)
    case 'triplets':
      return meldCount(MeldType.Triplet)
    case 'pairs':
      return pairCount(context)
    case 'groups':
      return playGroups(context).length + (context.phantomPairs ?? 0)
    case 'patterns_earlier_this_round':
      return [...(context.patternsPlayedThisRound ?? [])].filter(
        (pattern) => pattern !== 'loose'
      ).length
    case 'groups_earlier_this_round':
      return context.groupsPlayedThisRound ?? 0
    case 'base_chips_per_100':
      return Math.floor(breakdown.basePoints / 100)

    case 'hands_this_round':
      return round.handsPlayed
    case 'hands_this_run':
      return context.handsPlayedThisRun ?? 0
    case 'rounds_this_act':
      return Math.max(0, round.roundNumber - 1)
    case 'rounds_this_run':
      // Every Act has three rounds and none can be skipped, so the rounds
      // finished before this one follow from the Act and round alone.
      return Math.max(0, (round.actNumber - 1) * 3 + round.roundNumber - 1)
    case 'discards_used':
      // REDRAW replaced Discard: count the tiles it sent to the river.
      return round.tilesRedrawn ?? 0
    case 'acts_completed':
      return Math.max(0, round.actNumber - 1)
    case 'acts_beyond_four':
      return Math.max(0, round.actNumber - 4)

    case 'gold_per_5':
      return Math.floor((context.gold ?? 0) / 5)
    case 'gold_per_10':
      return Math.floor((context.gold ?? 0) / 10)

    default:
      return 0
  }
}

/**
 * The green tiles of Ryuuiisou: Souzu 2, 3, 4, 6, 8 and the Green Dragon.
 * These are the only tiles printed entirely in green.
 */
function isGreenTile(tile: Tile): boolean {
  if (tile.suit === TileSuit.Dragon) return tile.rank === DragonType.Green
  if (tile.suit !== TileSuit.Souzu) return false
  return [2, 3, 4, 6, 8].includes(tile.rank)
}

/**
 * Every group the play holds, its designated pair included. A tactical play
 * without a pair carries an empty placeholder, which is not a group.
 */
function playGroups(context: ScoringContext): Meld[] {
  const pair = context.hand?.pair
  return pair && pair.tiles.length === 2
    ? [...context.melds, pair]
    : [...context.melds]
}

/** Pairs in the play, plus any False Eye Mandate adds for Decrees. */
function pairCount(context: ScoringContext): number {
  return (
    playGroups(context).filter((group) => group.type === MeldType.Pair).length +
    (context.phantomPairs ?? 0)
  )
}

/** A 2–8 tile, or a 1 or 9 while Simples Dispensation is in force. */
function countsAsSimple(tile: Tile, context: ScoringContext): boolean {
  return (
    tile.isSimple ||
    (context.terminalsCountAsSimples === true && tile.isTerminal)
  )
}

/** The ranks of a run, sorted; empty for anything that is not a run. */
function runRanks(group: Meld): number[] {
  if (group.type !== MeldType.Sequence && group.type !== MeldType.Straight)
    return []
  return group.tiles.map((tile) => tile.rank).sort((a, b) => a - b)
}

/** The suits a group's natural tiles show; a Wild tile shows none. */
function naturalSuits(group: Meld): string {
  return [
    ...new Set(
      group.tiles.filter((tile) => !tile.isWild).map((tile) => tile.suit)
    ),
  ]
    .sort()
    .join('+')
}

/**
 * Whether a gated effect is allowed to pay out.
 *
 * Composition gates read the faces actually played (a Stone has no rank or
 * suit, so it neither meets nor breaks one), structure gates read the melds
 * found in them, and round gates read the round in progress. A gate the
 * context cannot answer returns false, so an unproven requirement never pays.
 */
function gateAllows(gate: GateCondition, context: ScoringContext): boolean {
  const tiles = context.tiles.filter((tile) => !tile.isStone)
  const suited = tiles.filter((tile) => tile.isSuited)
  const suitsPresent = new Set(suited.map((tile) => tile.suit))

  const allOfSuit = (suit: TileSuit): boolean =>
    tiles.length > 0 && tiles.every((tile) => tile.suit === suit)
  const halfOfSuit = (suit: TileSuit): boolean =>
    tiles.length > 0 &&
    tiles.filter((tile) => tile.suit === suit).length * 2 >= tiles.length
  const meldCount = (type: MeldType): number =>
    context.melds.filter((meld) => meld.type === type).length

  const groups = playGroups(context)
  const sameFace = (type: MeldType) => (group: Meld) => group.type === type

  switch (gate) {
    case 'all_flower_variants': {
      const variants = new Set(
        context.flowers.flowers.map((flower) => flower.type)
      )
      return (
        variants.has('Plum') &&
        variants.has('Orchid') &&
        variants.has('Chrysanthemum') &&
        variants.has('Bamboo')
      )
    }
    case 'identical_natural_faces':
      // Unlike general composition gates, every played tile must have a face.
      // Read the original tiles, never Wild's possible scoring substitutions.
      return (
        context.tiles.length >= 2 &&
        context.tiles.every(
          (tile) =>
            !tile.isStone &&
            !tile.isBonus &&
            tile.suit === context.tiles[0].suit &&
            tile.rank === context.tiles[0].rank
        )
      )
    case 'all_manzu':
      return allOfSuit(TileSuit.Manzu)
    case 'all_pinzu':
      return allOfSuit(TileSuit.Pinzu)
    case 'all_souzu':
      return allOfSuit(TileSuit.Souzu)
    case 'contains_manzu':
      return tiles.some((tile) => tile.suit === TileSuit.Manzu)
    case 'contains_pinzu':
      return tiles.some((tile) => tile.suit === TileSuit.Pinzu)
    case 'contains_souzu':
      return tiles.some((tile) => tile.suit === TileSuit.Souzu)
    case 'contains_wind':
      return tiles.some((tile) => tile.suit === TileSuit.Wind)
    case 'contains_dragon':
      return tiles.some((tile) => tile.suit === TileSuit.Dragon)
    case 'contains_honor':
      return tiles.some((tile) => tile.isHonor)
    case 'half_manzu':
      return halfOfSuit(TileSuit.Manzu)
    case 'half_pinzu':
      return halfOfSuit(TileSuit.Pinzu)
    case 'half_souzu':
      return halfOfSuit(TileSuit.Souzu)
    case 'single_suit':
      return suitsPresent.size === 1
    case 'all_three_suits':
      return suitsPresent.size === 3
    case 'all_honors':
      return tiles.length > 0 && tiles.every((tile) => tile.isHonor)
    case 'three_plus_honors':
      return countScoringHonors(context) >= 3
    case 'four_plus_terminals':
      return tiles.filter((tile) => tile.isTerminal).length >= 4
    case 'no_simples':
      return tiles.length > 0 && !tiles.some((tile) => tile.isSimple)
    case 'all_simples':
      return (
        tiles.length > 0 && tiles.every((tile) => countsAsSimple(tile, context))
      )
    case 'five_tile_flush': {
      // A Stone has no suit, so it breaks a flush; a Wild tile fits any suit.
      const played = context.tiles
      const natural = played.filter((tile) => !tile.isWild)
      return (
        played.length >= 5 &&
        played.every((tile) => tile.isSuited && !tile.isStone) &&
        new Set(natural.map((tile) => tile.suit)).size <= 1
      )
    }
    case 'has_one_and_nine':
      return (
        tiles.some((tile) => tile.isSuited && tile.rank === 1) &&
        tiles.some((tile) => tile.isSuited && tile.rank === 9)
      )
    case 'wind_and_dragon':
      return (
        tiles.some((tile) => tile.suit === TileSuit.Wind) &&
        tiles.some((tile) => tile.suit === TileSuit.Dragon)
      )

    case 'contains_pair':
      return pairCount(context) > 0
    case 'two_plus_pairs':
      return pairCount(context) >= 2
    case 'contains_sequence':
      return meldCount(MeldType.Sequence) > 0
    case 'two_plus_sequences':
      return meldCount(MeldType.Sequence) >= 2
    case 'contains_triplet':
      return meldCount(MeldType.Triplet) > 0
    case 'two_plus_triplets':
      return meldCount(MeldType.Triplet) >= 2
    case 'full_house':
      return meldCount(MeldType.Triplet) > 0 && pairCount(context) > 0
    case 'contains_quad':
      return groups.some(sameFace(MeldType.Quad))
    case 'contains_straight':
      return groups.some(sameFace(MeldType.Straight))
    case 'flowered_quad_or_straight':
      // Grand Succession: held Flowers count, awakened or not.
      return (
        context.flowers.flowers.length >= 2 &&
        groups.some(
          (group) =>
            group.type === MeldType.Quad || group.type === MeldType.Straight
        )
      )
    case 'value_group':
      return groups.some(
        (group) =>
          (group.type === MeldType.Pair ||
            group.type === MeldType.Triplet ||
            group.type === MeldType.Quad) &&
          group.tiles.length > 0 &&
          (group.tiles.every((tile) => tile.suit === TileSuit.Dragon) ||
            group.tiles.every(
              (tile) =>
                tile.suit === TileSuit.Wind && tile.rank === WindType.East
            ))
      )
    case 'ninefold_run':
      return groups.some((group) => {
        const ranks = new Set(runRanks(group))
        return [1, 4, 7].some(
          (low) => ranks.has(low) && ranks.has(low + 1) && ranks.has(low + 2)
        )
      })
    case 'twin_sequences': {
      const sequences = groups.filter(sameFace(MeldType.Sequence))
      return sequences.some((first, i) =>
        sequences
          .slice(i + 1)
          .some(
            (second) =>
              runRanks(first).join() === runRanks(second).join() &&
              naturalSuits(first) !== naturalSuits(second)
          )
      )
    }
    case 'outside_groups':
      return (
        groups.length >= 2 &&
        groups.every((group) =>
          group.tiles.some((tile) => tile.isTerminal || tile.isHonor)
        )
      )
    case 'grand_pattern':
      return groups.some(
        (group) =>
          (group.type === MeldType.Quad && group.tiles.length >= 5) ||
          (group.type === MeldType.Straight && group.tiles.length >= 6)
      )
    case 'six_grouped': {
      const grouped = new Set(
        groups.flatMap((group) => group.tiles.map((tile) => tile.id))
      )
      return (
        context.tiles.length >= 6 &&
        context.tiles.every((tile) => grouped.has(tile.id))
      )
    }

    case 'boss_round':
      return context.round.roundType === 'Boss'
    case 'no_discards_used':
      return (context.round.tilesRedrawn ?? 0) === 0
    case 'first_hand':
      // A complete hand clears the round whatever it scores.
      return (
        context.round.handsPlayed === 0 &&
        (context.completeHand === true ||
          (context.scoreBeforeThresholdBonuses !== undefined &&
            context.round.currentScore + context.scoreBeforeThresholdBonuses >=
              context.round.scoreTarget))
      )
    case 'last_hand_scored_zero':
      return context.lastHandScore === 0
    case 'repeat_pattern':
      // A play of loose tiles names no pattern worth repeating.
      return (
        context.playPatternId !== undefined &&
        context.playPatternId !== 'loose' &&
        (context.patternsPlayedThisRound?.has(context.playPatternId) ?? false)
      )
    case 'every_third_play':
      return (context.round.handsPlayed + 1) % 3 === 0
    case 'first_play_of_round':
      return context.round.handsPlayed === 0
    case 'last_turn':
      return context.turnsRemaining === 1
    case 'double_target':
      return (
        context.scoreBeforeThresholdBonuses !== undefined &&
        context.round.currentScore + context.scoreBeforeThresholdBonuses >=
          context.round.scoreTarget * 2
      )

    default:
      return false
  }
}

/**
 * The played tiles a retrigger effect applies to. Positional targets can pick
 * a Stone; targets that name a kind of tile cannot, since a Stone has no face.
 */
function matchRetriggerTargets(tiles: Tile[], target: RetriggerTarget): Tile[] {
  const faced = tiles.filter((tile) => !tile.isStone)
  switch (target) {
    case 'all':
      return tiles
    case 'first':
      return tiles.slice(0, 1)
    case 'last':
      return tiles.slice(-1)
    case 'dragon':
      return faced.filter((tile) => tile.suit === TileSuit.Dragon)
    case 'wind':
      return faced.filter((tile) => tile.suit === TileSuit.Wind)
    case 'honor':
      return faced.filter((tile) => tile.isHonor)
    case 'terminal':
      return faced.filter((tile) => tile.isTerminal)
    default:
      return []
  }
}

// =============================================================================
// STARTER DECREES
// =============================================================================

/**
 * River Tax (Common) - Gain 2 Gold each REDRAW. Per action, not per tile: one
 * REDRAW can send a whole rack to the river.
 */
export const RIVER_TAX: Decree = {
  id: 'river_tax',
  name: 'River Tax',
  description: 'Gain 2 Gold each time you REDRAW.',
  category: 'Entropy',
  rarity: 'LocalEdict',
  cost: 4,
  effect: {
    type: 'gold',
    trigger: 'OnDiscard',
    description: '+2 Gold per REDRAW',
    amount: 2,
    perTile: false,
  },
}

/**
 * Extended Hand Grant (Rare) - +3 Turns per round. The top of the Turn ladder:
 * Time Lord (+1) is Common and Time Master (+2) Uncommon, mirroring the
 * free-redraw and rack-space ladders. docs/DECREE_RARITY_REVIEW.md.
 */
export const EXTENDED_HAND_GRANT: Decree = {
  id: 'extended_hand_grant',
  name: 'Extended Hand Grant',
  description: '+3 Turns per round.',
  category: 'Entropy',
  rarity: 'ImperialDecree',
  cost: 8,
  effect: {
    type: 'draw',
    trigger: 'Passive',
    description: '+3 Turns per round',
    additionalDraws: 3,
  },
}

/**
 * Tanyao Dispensation (Common) - Terminals allowed in Tanyao. It only acts on
 * complete hands, so it sits with the other complete-hand Yaku payoffs.
 */
export const TANYAO_DISPENSATION: Decree = {
  id: 'tanyao_dispensation',
  name: 'Simples Dispensation',
  description:
    'For your Decrees, 1s and 9s also count as Simples (2–8 tiles). Winds and Dragons still do not.',
  category: 'YakuDoctrine',
  rarity: 'LocalEdict',
  cost: 4,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'Terminals count as Simples for Decrees',
    ruleId: 'tanyao_terminals',
    modification: { allowTerminals: true },
  },
}

/**
 * Moonlit Emblem (Common) - Honor tiles add stacking multiplier. With three or
 * four Honors it pays less than Honor Guard's ×1.5, so it is not an Uncommon.
 */
export const MOONLIT_SEAL: Decree = {
  id: 'moonlit_seal',
  name: 'Moonlit Emblem',
  description:
    'Each Wind or Dragon played adds 0.1 to this Decree’s ×Mult (three give ×1.3).',
  category: 'Scaling',
  rarity: 'LocalEdict',
  cost: 4,
  effect: {
    type: 'scaling',
    trigger: 'OnScored',
    description: '+0.1x Mult per Honor tile',
    baseValue: 0,
    scalingFactor: 0.1,
    scalingCondition: 'honor_tile_count',
    maxValue: 2.0,
  },
}

/**
 * Pure Suit Asceticism (Uncommon) - Dominant suit tiles scale multiplicatively.
 * A six-tile play tops out near ×1.8, Flush Fever's band rather than Inferno's.
 */
export const PURE_SUIT_ASCETICISM: Decree = {
  id: 'pure_suit_asceticism',
  name: 'Pure Suit Asceticism',
  description:
    '×1.1 Mult for each played tile of the play’s most common suit, compounding (five give about ×1.6).',
  category: 'Scaling',
  rarity: 'RegionalMandate',
  cost: 6,
  effect: {
    type: 'multiplicative_score',
    trigger: 'OnScored',
    description: 'x1.1 per dominant suit tile',
    multiplier: 1.1,
    perTileCondition: 'dominant_suit',
  },
}

/**
 * The five original hand-written Decrees, which share portrait art. Runs no
 * longer start from this list: GameOrchestrator draws starting Decrees from
 * the whole shop pool.
 */
export const STARTER_DECREES: Decree[] = [
  RIVER_TAX,
  EXTENDED_HAND_GRANT,
  TANYAO_DISPENSATION,
  MOONLIT_SEAL,
  PURE_SUIT_ASCETICISM,
]

// =============================================================================
// ADDITIONAL DECREES (from ARCHITECTURE.MD)
// =============================================================================

export const BROKEN_STAIR_EDICT: Decree = {
  id: 'broken_stair_edict',
  name: 'Broken Stair Edict',
  description: 'Sequences may skip one number (1-3-4 or 1-2-4 counts).',
  category: 'Structural',
  rarity: 'RegionalMandate',
  cost: 7,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'Sequences may skip one rank',
    ruleId: 'sequence_skip',
    modification: { allowSkip: true, skipAmount: 1 },
  },
}

export const FALSE_EYE_MANDATE: Decree = {
  id: 'false_eye_mandate',
  name: 'False Eye Mandate',
  description: 'Your Decrees count every play as holding one extra pair.',
  category: 'Structural',
  rarity: 'ImperialDecree',
  cost: 8,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'Every play holds one extra pair for Decrees',
    ruleId: 'phantom_pair',
    modification: { pairs: 1 },
  },
}

export const HONOR_TRANSMUTATION: Decree = {
  id: 'honor_transmutation',
  name: 'Honor Transmutation',
  description:
    'Winds and Dragons may count as numbered tiles of your most common suit.',
  category: 'TileIdentity',
  rarity: 'ImperialDecree',
  cost: 9,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'Honors count as suited tiles',
    ruleId: 'honor_as_suited',
    modification: { honorAsSuited: true },
  },
}

export const CELESTIAL_WILDCARD: Decree = {
  id: 'celestial_wildcard',
  name: 'Celestial Wildcard',
  description: 'One tile per play can stand in for any tile you need.',
  category: 'TileIdentity',
  rarity: 'HeavenlyOrdinance',
  cost: 12,
  flowerRequirement: 2,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'One wild tile per hand',
    ruleId: 'wildcard_tile',
    modification: { wildcardCount: 1 },
  },
}

export const YAKUMAN_SUCCESSION: Decree = {
  id: 'yakuman_succession',
  name: 'Grand Succession',
  description:
    'While you hold at least 2 Flowers: ×4 Mult if the play includes four or more of a kind (a Quad) or a Straight (four or more tiles in a row, one suit).',
  category: 'YakuDoctrine',
  rarity: 'HeavenlyOrdinance',
  cost: 12,
  flowerRequirement: 2,
  effect: {
    type: 'multiplicative_score',
    trigger: 'Independent',
    description: 'x4 Mult for a Quad or Straight',
    multiplier: 4,
    requires: 'flowered_quad_or_straight',
  },
}

export const DEAD_WALL_WRIT: Decree = {
  id: 'dead_wall_writ',
  name: 'Dead Wall Writ',
  description:
    'Once per round, swap one selected tile for a tile from the Dead Wall (the reserved tiles at the back of the wall) without spending a Turn.',
  category: 'Entropy',
  rarity: 'RegionalMandate',
  cost: 6,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'Draw from discards once per round',
    ruleId: 'dead_wall_draw',
    modification: { deadWallDraws: 1 },
  },
}

export const SHANTEN_CLEMENCY: Decree = {
  id: 'shanten_clemency',
  name: 'Loose Tile Clemency',
  description:
    'Loose tiles (played tiles in no group) score their full Points instead of half.',
  category: 'Entropy',
  rarity: 'ImperialDecree',
  cost: 9,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'Loose tiles score in full',
    ruleId: 'full_loose_tiles',
    modification: { fullLooseTiles: true },
  },
}

export const CLOSED_HAND_AUSTERITY: Decree = {
  id: 'closed_hand_austerity',
  name: 'Six-Tile Austerity',
  description:
    'Each play of six or more tiles, every one of them in a group, gains ×1.5, growing ×1.2 for every earlier such play this run, up to ×4 before Flower bonuses.',
  category: 'Scaling',
  rarity: 'ImperialDecree',
  cost: 8,
  effect: AUSTERITY_EFFECT,
}

// Common: four Terminals give ×1.2, what Spark pays on every play.
export const TERMINAL_DEVOTION: Decree = {
  id: 'terminal_devotion',
  name: 'Terminal Devotion',
  description:
    'Each Terminal (1 or 9) played adds 0.05 to this Decree’s ×Mult (four give ×1.2).',
  category: 'Scaling',
  rarity: 'LocalEdict',
  cost: 4,
  effect: {
    type: 'scaling',
    trigger: 'OnScored',
    description: '+5% per terminal',
    baseValue: 0,
    scalingFactor: 0.05,
    scalingCondition: 'terminal_count',
  },
}

export const YAKU_REPETITION_CHARTER: Decree = {
  id: 'yaku_repetition_charter',
  name: 'Pattern Repetition Charter',
  description:
    'A play pattern (such as Two Pairs) played in back-to-back rounds gains ×1.2 for each earlier round in its streak, up to ×4 before Flower bonuses. A round without it ends that streak.',
  category: 'Scaling',
  rarity: 'ImperialDecree',
  cost: 9,
  effect: {
    type: 'scaling',
    trigger: 'OnRoundEnd',
    description: 'Repeated patterns compound',
    baseValue: 0,
    scalingFactor: 0.2,
    scalingCondition: 'repeated_yaku',
    maxValue: 3.0,
  },
}

/**
 * All available decrees in the game
 */
/** The hand-written rule-bending Decrees, which drive engine rule changes. */
export const RULE_DECREES: Decree[] = [
  ...STARTER_DECREES,
  BROKEN_STAIR_EDICT,
  FALSE_EYE_MANDATE,
  HONOR_TRANSMUTATION,
  CELESTIAL_WILDCARD,
  YAKUMAN_SUCCESSION,
  DEAD_WALL_WRIT,
  SHANTEN_CLEMENCY,
  CLOSED_HAND_AUSTERITY,
  TERMINAL_DEVOTION,
  YAKU_REPETITION_CHARTER,
]

/**
 * The full pool the shop and reward systems draw from: the rule-bending
 * Decrees above plus every authored Decree the engine can run. Ids are unique,
 * with the hand-written definition winning any collision.
 */
export const ALL_DECREES: Decree[] = [
  ...RULE_DECREES,
  ...LIBRARY_DECREES.filter(
    (decree) => !RULE_DECREES.some((existing) => existing.id === decree.id)
  ),
]

// =============================================================================
// DECREE SYSTEM CLASS
// =============================================================================

/**
 * Manages decree acquisition, effects, and interactions
 */
export class DecreeSystem {
  private ownedDecrees: OwnedDecree[] = []
  private maxSlots: number = 5
  private currentRound: number = 0
  private nextInstanceId: number = 1

  constructor(
    initialSlots: number = 5,
    private readonly random: RunRandom = runRandom
  ) {
    this.maxSlots = initialSlots
  }

  /**
   * Get all owned decrees
   */
  getOwnedDecrees(): OwnedDecree[] {
    return [...this.ownedDecrees]
  }

  /** Prefer an exact physical ID; retain catalog lookup for legacy callers. */
  getOwnedDecree(id: string): OwnedDecree | undefined {
    return (
      this.ownedDecrees.find((d) => d.instanceId === id) ??
      this.ownedDecrees.find((d) => d.id === id)
    )
  }

  private allocateInstanceId(): string {
    let id: string
    do {
      id = `owned-decree-${this.nextInstanceId++}`
    } while (this.ownedDecrees.some((d) => d.instanceId === id))
    return id
  }

  /**
   * Get the number of available decree slots
   */
  getAvailableSlots(): number {
    return Math.max(0, this.getMaxSlots() - this.ownedDecrees.length)
  }

  getMaxSlots(): number {
    return this.maxSlots
  }

  /**
   * Add a decree slot
   */
  addSlot(): void {
    this.maxSlots++
  }

  /** Remove temporary capacity without deleting already-owned Decrees. */
  removeSlots(count: number = 1): void {
    this.maxSlots = Math.max(0, this.maxSlots - Math.max(0, count))
  }

  /**
   * Check if a decree can be acquired
   */
  canAcquireDecree(decree: Decree, flowerCount: number = 0): boolean {
    const effectiveSlots =
      this.getMaxSlots() + (decree.edition === 'Negative' ? 1 : 0)
    if (this.ownedDecrees.length >= effectiveSlots) {
      return false
    }
    if (decree.flowerRequirement && flowerCount < decree.flowerRequirement) {
      return false
    }
    return true
  }

  /**
   * Acquire a new decree
   */
  acquireDecree(decree: Decree, sticker?: Sticker): OwnedDecree | null {
    const effectiveSlots =
      this.getMaxSlots() + (decree.edition === 'Negative' ? 1 : 0)
    if (this.ownedDecrees.length >= effectiveSlots) {
      return null
    }

    if (decree.edition === 'Negative') this.maxSlots++

    const ownedDecree: OwnedDecree = {
      ...decree,
      instanceId: this.allocateInstanceId(),
      acquiredRound: this.currentRound,
      roundsActive: 0,
      sticker:
        (sticker ?? decree.sticker)
          ? { ...(sticker ?? decree.sticker)! }
          : undefined,
      stickers: sticker
        ? undefined
        : decree.stickers?.map((entry) => ({ ...entry })),
      scalingValue: decree.effect.type === 'scaling' ? 0 : undefined,
    }

    if (
      allEffectsOf(ownedDecree).some(
        (e) => e.type === 'copy_decree' && e.source === 'random'
      )
    ) {
      // Acquiring a physical duplicate is a new selection, not a clone of the
      // source item's saved target. Existing siblings keep their own choices.
      ownedDecree.randomCopyTargetId = null
    }
    this.ownedDecrees.push(ownedDecree)
    this.selectRandomCopyTargets(false)
    return ownedDecree
  }

  /** Selection is a committed inventory/round event, never a scoring query. */
  private selectRandomCopyTargets(refresh: boolean): void {
    for (const copier of this.ownedDecrees) {
      if (
        !allEffectsOf(copier).some(
          (e) => e.type === 'copy_decree' && e.source === 'random'
        )
      )
        continue
      // A removed target retains its identity until next round; buying or selling
      // another item must not let the player reroll a previously selected target.
      if (!refresh && copier.randomCopyTargetId != null) continue
      const candidates = this.ownedDecrees.filter(
        (candidate) =>
          candidate !== copier &&
          !candidate.isDebuffed &&
          !allEffectsOf(candidate).some((e) => e.type === 'copy_decree')
      )
      copier.randomCopyTargetId =
        this.random.pick('decreeCopies', candidates)?.instanceId ?? null
    }
  }

  /**
   * Sell a decree for gold
   */
  sellDecree(decreeId: string): number {
    const index = this.ownedDecrees.indexOf(this.getOwnedDecree(decreeId)!)
    if (index === -1) {
      return 0
    }

    const decree = this.ownedDecrees[index]

    // Eternal decrees cannot be sold
    if (hasDecreeSticker(decree, 'Eternal')) {
      return 0
    }

    const sellValue = decree.sellValue ?? Math.floor(decree.cost / 2)
    this.ownedDecrees.splice(index, 1)
    if (decree.edition === 'Negative') this.removeSlots()
    return sellValue
  }

  /**
   * Remove a decree without selling
   */
  removeDecree(decreeId: string): boolean {
    const index = this.ownedDecrees.indexOf(this.getOwnedDecree(decreeId)!)
    if (index === -1) {
      return false
    }

    const decree = this.ownedDecrees[index]
    if (hasDecreeSticker(decree, 'Eternal')) {
      return false
    }

    this.ownedDecrees.splice(index, 1)
    if (decree.edition === 'Negative') this.removeSlots()
    return true
  }

  /** Apply or replace a Decree edition while keeping Negative capacity balanced. */
  applyEdition(decreeId: string, edition: Decree['edition']): boolean {
    const decree = this.getOwnedDecree(decreeId)
    if (!decree || !edition) return false

    if (decree.edition === 'Negative' && edition !== 'Negative') {
      this.removeSlots()
    } else if (decree.edition !== 'Negative' && edition === 'Negative') {
      this.addSlot()
    }
    decree.edition = edition
    return true
  }

  /**
   * Update decree states at the start of a round
   */
  onRoundStart(): void {
    this.currentRound++

    for (const decree of this.ownedDecrees) {
      decree.roundsActive++
    }
    // Normalize already-expired legacy clocks, but do not spend a playable
    // round on entering a shop purchase or advancing past a skipped round.
    this.updatePerishableClocks(0)
    // Pick before GameOrchestrator initializes the round's hands/discards/rack.
    this.selectRandomCopyTargets(true)
  }

  /** Complete one played round, after its scoring and economy have settled. */
  onRoundEnd(): void {
    this.updatePerishableClocks(1)
  }

  private updatePerishableClocks(completedRounds: 0 | 1): void {
    for (const decree of this.ownedDecrees) {
      const perishable = getDecreeStickers(decree).find(
        (entry) => entry.type === 'Perishable'
      )
      if (perishable) {
        if (perishable.roundsRemaining !== undefined) {
          // Expiry is terminal. Legacy saves may contain negative timers;
          // normalize them on the next round, without rejecting those saves.
          perishable.roundsRemaining = Math.max(
            0,
            perishable.roundsRemaining - completedRounds
          )
          if (perishable.roundsRemaining <= 0) {
            decree.isDebuffed = true
          }
        }
      }
    }
  }

  /**
   * Calculate rental costs at end of round
   */
  calculateRentalCosts(): number {
    let totalCost = 0
    for (const decree of this.ownedDecrees) {
      const rental = getDecreeStickers(decree).find(
        (entry) => entry.type === 'Rental'
      )
      if (rental) {
        totalCost += rental.goldPerRound ?? 3
      }
    }
    return totalCost
  }

  /** Gold generated by active Decrees when tiles are discarded. */
  calculateDiscardGold(
    discardCount: number = 1,
    excludedIds?: ReadonlySet<string>
  ): number {
    return this.getActiveDecrees(excludedIds).reduce((total, decree) => {
      for (const effect of this.resolveEffects(
        decree,
        this.ownedDecrees,
        excludedIds
      )) {
        if (effect.type !== 'gold' || effect.trigger !== 'OnDiscard') continue
        total += effect.amount * (effect.perTile ? discardCount : 1)
      }
      return total
    }, 0)
  }

  /** Gold generated by active Decrees at the end of a completed round. */
  calculateRoundEndGold(
    excludedIds?: ReadonlySet<string>,
    heldTiles: readonly Tile[] = [],
    context: { upgradedOrbFamilies?: number } = {}
  ): number {
    const heldSuitCount = new Set(
      heldTiles
        .filter((tile) => !tile.isBonus && !tile.isStone)
        .map((tile) => tile.suit)
    ).size
    return this.getActiveDecrees(excludedIds).reduce((total, decree) => {
      for (const effect of this.resolveEffects(
        decree,
        this.ownedDecrees,
        excludedIds
      )) {
        if (effect.type !== 'gold' || effect.trigger !== 'OnRoundEnd') continue
        total +=
          effect.amount *
          (effect.scaleBy === 'owned_decrees'
            ? this.ownedDecrees.length
            : effect.scaleBy === 'held_suits'
              ? heldSuitCount
              : effect.scaleBy === 'upgraded_orb_families'
                ? Math.max(0, context.upgradedOrbFamilies ?? 0)
                : 1)
      }
      return total
    }, 0)
  }

  /**
   * Get all active (non-debuffed) decrees
   */
  getActiveDecrees(excludedIds?: ReadonlySet<string>): OwnedDecree[] {
    return this.ownedDecrees.filter(
      (d) => !d.isDebuffed && !isDecreeExcluded(d, excludedIds)
    )
  }

  /**
   * Get decrees by trigger type
   */
  getDecreesByTrigger(trigger: string): OwnedDecree[] {
    return this.getActiveDecrees().filter((d) => d.effect.trigger === trigger)
  }

  /**
   * The effects a Decree contributes this scoring pass, with `copy_decree`
   * replaced by whatever it points at.
   *
   * Copies resolve one level deep: a copier that targets another copier gains
   * nothing from it. That keeps two copiers pointed at each other from looping
   * forever, and matches how the effect reads - it copies a Decree's effect,
   * not its copying.
   */
  private resolveEffects(
    decree: OwnedDecree,
    ownedInOrder: OwnedDecree[],
    excludedIds?: ReadonlySet<string>
  ): DecreeEffect[] {
    return this.resolveEffectSources(decree, ownedInOrder, excludedIds).map(
      ({ effect }) => effect
    )
  }

  private resolveEffectSources(
    decree: OwnedDecree,
    ownedInOrder: OwnedDecree[],
    excludedIds?: ReadonlySet<string>
  ): { effect: DecreeEffect; source: OwnedDecree }[] {
    const resolved: { effect: DecreeEffect; source: OwnedDecree }[] = []

    for (const effect of allEffectsOf(decree)) {
      if (effect.type !== 'copy_decree') {
        resolved.push({ effect, source: decree })
        continue
      }

      for (const target of this.copyTargets(
        decree,
        effect.source,
        ownedInOrder
      )) {
        // Preserve physical neighbors: a disabled target must not make a copier
        // jump to another Decree. Callers supply the complete owned order.
        if (target.isDebuffed || isDecreeExcluded(target, excludedIds)) continue
        resolved.push(
          ...allEffectsOf(target)
            .filter((inner) => inner.type !== 'copy_decree')
            .map((inner) => ({ effect: inner, source: target }))
        )
      }
    }

    return resolved
  }

  /** Preserve the physical payer separately from the source of a copied rule. */
  getRuleContributions(
    ruleId: string,
    excludedIds?: ReadonlySet<string>
  ): {
    owner: OwnedDecree
    source: OwnedDecree
    effect: RuleModificationEffect
  }[] {
    return this.getActiveDecrees(excludedIds).flatMap((owner) =>
      this.resolveEffectSources(owner, this.ownedDecrees, excludedIds).flatMap(
        ({ source, effect }) =>
          effect.type === 'rule_modification' && effect.ruleId === ruleId
            ? [{ owner, source, effect }]
            : []
      )
    )
  }

  /** The Decrees a copy effect draws from, in owned order. */
  private copyTargets(
    decree: OwnedDecree,
    source: CopyDecreeEffect['source'],
    ownedInOrder: OwnedDecree[]
  ): OwnedDecree[] {
    const others = ownedInOrder.filter((candidate) => candidate !== decree)
    if (others.length === 0) return []

    switch (source) {
      case 'all':
        return others
      case 'left':
        return [ownedInOrder[0]]
      case 'right': {
        const index = ownedInOrder.indexOf(decree)
        const neighbour = ownedInOrder[index + 1]
        return neighbour ? [neighbour] : []
      }
      case 'random': {
        const target = others.find(
          (candidate) => candidate.instanceId === decree.randomCopyTargetId
        )
        return target ? [target] : []
      }
      default:
        return []
    }
  }

  /**
   * How many extra times each played tile should score, from Decree retriggers.
   *
   * Returns tile id to extra trigger count; a tile absent from the map scores
   * once as usual.
   */
  calculateRetriggers(
    tiles: Tile[],
    excludedIds?: ReadonlySet<string>
  ): Map<string, number> {
    const extra = new Map<string, number>()
    if (tiles.length === 0) return extra

    const active = this.getActiveDecrees(excludedIds)
    const amplifier = this.getRetriggerAmplifier(excludedIds)

    for (const decree of active) {
      for (const effect of this.resolveEffects(
        decree,
        this.ownedDecrees,
        excludedIds
      )) {
        if (effect.type !== 'retrigger') continue

        const times = effect.times * amplifier
        for (const tile of matchRetriggerTargets(tiles, effect.target)) {
          extra.set(tile.id, (extra.get(tile.id) ?? 0) + times)
        }
      }
    }

    return extra
  }

  /** Multiplier applied to every retrigger count (Echo Dimension). */
  private getRetriggerAmplifier(excludedIds?: ReadonlySet<string>): number {
    let factor = 1

    for (const decree of this.getActiveDecrees(excludedIds)) {
      for (const effect of this.resolveEffects(
        decree,
        this.ownedDecrees,
        excludedIds
      )) {
        if (effect.type !== 'rule_modification') continue
        if (effect.ruleId !== 'retrigger_amplifier') continue
        const value = effect.modification.factor
        if (typeof value === 'number' && value > 0) factor *= value
      }
    }

    return factor
  }

  /**
   * Yaku amplification from Decrees: a multiplier applied to the combined yaku
   * multiplier, and a tier bonus that scores each yaku as if it ranked higher.
   */
  getYakuModifiers(
    excludedIds?: ReadonlySet<string>,
    flowerCount = 0
  ): {
    multiplier: number
    tierBonus: number
    ascendAdvanced: boolean
  } {
    let multiplier = 1
    let tierBonus = 0
    let ascendAdvanced = false

    const active = this.getActiveDecrees(excludedIds)
    for (const decree of active) {
      for (const effect of this.resolveEffects(
        decree,
        this.ownedDecrees,
        excludedIds
      )) {
        if (effect.type !== 'yaku_modifier') continue
        if (effect.multiplier) multiplier *= effect.multiplier
        if (effect.tierBonus) tierBonus += effect.tierBonus
        if (effect.ascendAdvanced && flowerCount >= 2) ascendAdvanced = true
      }
    }

    return { multiplier, tierBonus, ascendAdvanced }
  }

  /** Whether any active Decree turns on the named rule. */
  hasActiveRule(ruleId: string): boolean {
    return this.hasRuleModification(ruleId)
  }

  /** Gold multiplier from Decrees (Philosopher's Stone). */
  getGoldMultiplier(excludedIds?: ReadonlySet<string>): number {
    let multiplier = 1

    for (const decree of this.getActiveDecrees(excludedIds)) {
      for (const effect of this.resolveEffects(
        decree,
        this.ownedDecrees,
        excludedIds
      )) {
        if (effect.type !== 'rule_modification') continue
        if (effect.ruleId !== 'gold_multiplier') continue
        const value = effect.modification.factor
        if (typeof value === 'number' && value > 0) multiplier *= value
      }
    }

    return multiplier
  }

  /**
   * The Decrees that can save the run from a lost round, best first.
   *
   * Phoenix-style Decrees are consumed when they save a run; Immortal-style
   * ones persist but exact a permanent score penalty.
   */
  getLossPreventionDecrees(excludedIds?: ReadonlySet<string>): OwnedDecree[] {
    return [
      ...new Set(
        this.getRuleContributions('prevent_loss', excludedIds).map(
          ({ owner }) => owner
        )
      ),
    ]
  }

  /**
   * Apply decree effects during scoring
   */
  applyDecreeEffects(
    context: ScoringContext,
    currentBreakdown: ScoreBreakdown
  ): ScoreBreakdown {
    let breakdown = { ...currentBreakdown }

    const contextDecreeIds = new Set(context.decrees.map(decreeKey))
    const excludedIds = new Set(
      this.ownedDecrees
        .filter((decree) => !contextDecreeIds.has(decreeKey(decree)))
        .map(decreeKey)
    )
    const activeDecrees = this.getActiveDecrees(excludedIds)

    for (const decree of activeDecrees) {
      for (const effect of this.resolveEffects(
        decree,
        this.ownedDecrees,
        excludedIds
      )) {
        breakdown = this.applyDecreeEffect(decree, effect, context, breakdown)
      }
      switch (decree.edition) {
        case 'Foil':
          breakdown.additiveBonus += 50
          break
        case 'Holographic':
          breakdown.decreeMultiplier += 10
          break
        case 'Polychrome':
          breakdown.decreeMultiplier *= 1.5
          break
      }
    }

    return breakdown
  }

  /** Skip the neutral scoring pass entirely when no active rule needs it. */
  hasScoreThresholdEffects(excludedIds?: ReadonlySet<string>): boolean {
    const needsBaseline = (effect: DecreeEffect): boolean => {
      if (effect.type === 'conditional') return needsBaseline(effect.effect)
      return (
        (effect.type === 'additive_score' ||
          effect.type === 'multiplicative_score') &&
        (effect.requires === 'first_hand' ||
          effect.requires === 'double_target')
      )
    }
    return this.getActiveDecrees(excludedIds).some((decree) =>
      this.resolveEffects(decree, this.ownedDecrees, excludedIds).some(
        needsBaseline
      )
    )
  }

  /**
   * Apply one of a decree's effects.
   *
   * The owning decree is passed alongside the effect rather than folded into
   * it, so scaling effects can record their running value on the real owned
   * decree instead of on a copy.
   */
  private applyDecreeEffect(
    decree: OwnedDecree,
    effect: DecreeEffect,
    context: ScoringContext,
    breakdown: ScoreBreakdown
  ): ScoreBreakdown {
    const result = { ...breakdown }

    // Drought silences the Flower's extra empowerment, not the Decree itself
    // or the inventory count used by its authored collection conditions.
    const flowerBonus = context.flowersSuppressed
      ? 1
      : 1 + context.flowers.flowers.length * 0.1

    switch (effect.type) {
      case 'additive_score': {
        if (effect.requires && !gateAllows(effect.requires, context)) break
        // A scaled bonus is paid once per unit it scales with, so an empty
        // collection pays nothing rather than the flat amount.
        const stacks = effect.scaleBy
          ? countScalingSource(effect.scaleBy, context, breakdown)
          : 1
        // Some Decrees cap their own growth; the cap bounds the scaled bonus
        // before Flower empowerment, so the printed ceiling is the one meant.
        const capped = (value: number): number =>
          effect.maxBonus === undefined
            ? value * stacks
            : Math.min(value * stacks, effect.maxBonus)

        if (effect.basePoints) {
          result.additiveBonus += capped(effect.basePoints) * flowerBonus
        }
        if (effect.multiplier) {
          result.decreeMultiplier += capped(effect.multiplier) * flowerBonus
        }
        break
      }

      case 'multiplicative_score':
        if (effect.requires && !gateAllows(effect.requires, context)) break
        if (effect.perTileCondition === 'dominant_suit') {
          const suitedCounts = new Map<string, number>()
          for (const tile of context.tiles.filter(
            (candidate) => candidate.isSuited && !candidate.isStone
          )) {
            suitedCounts.set(tile.suit, (suitedCounts.get(tile.suit) ?? 0) + 1)
          }
          const dominantSuitCount = Math.max(0, ...suitedCounts.values())
          result.decreeMultiplier *= effect.multiplier ** dominantSuitCount
        } else if (effect.scaleBy) {
          // Compounds per unit, matching how dominant-suit scaling already
          // reads: one application of the multiplier for each one.
          const stacks = countScalingSource(effect.scaleBy, context, breakdown)
          result.decreeMultiplier *= effect.multiplier ** stacks
        } else {
          result.decreeMultiplier *= effect.multiplier
        }
        break

      case 'gold':
        // Gold effects are handled separately
        break

      case 'scaling': {
        const scalingValue = this.calculateScalingValue(effect, context)
        if (!context.previewMode) decree.scalingValue = scalingValue
        result.decreeMultiplier *= 1 + scalingValue * flowerBonus
        break
      }

      case 'conditional':
        if (this.checkCondition(effect.condition, context)) {
          return this.applyDecreeEffect(decree, effect.effect, context, result)
        }
        break
    }

    return result
  }

  /**
   * Calculate scaling value for scaling decrees
   */
  private calculateScalingValue(
    effect: DecreeEffect,
    context: ScoringContext
  ): number {
    if (effect.type !== 'scaling') {
      return 0
    }

    let count = 0

    switch (effect.scalingCondition) {
      case 'complete_concealed_hands':
        return context.completeConcealedHand
          ? austerityMultiplier(context.completeConcealedHandsPlayed ?? 0) - 1
          : 0
      case 'honor_tile_count':
        count = countScoringHonors(context)
        break

      case 'terminal_count':
        count = context.tiles.filter((t) => t.isTerminal && !t.isStone).length
        break

      case 'repeated_yaku': {
        // Each current matching family contributes its completed-round streak.
        // Multiple plays in one round do not grow it; round settlement does.
        count = [...context.yakuMultipliers.values()].reduce(
          (total, streak) => total + Math.max(0, streak),
          0
        )
        const growth =
          effect.baseValue + (1 + effect.scalingFactor) ** count - 1
        return effect.maxValue === undefined
          ? growth
          : Math.min(growth, effect.maxValue)
      }

      default:
        count = 0
    }

    const value = effect.baseValue + count * effect.scalingFactor
    return effect.maxValue ? Math.min(value, effect.maxValue) : value
  }

  /**
   * Check if a condition is met
   */
  private checkCondition(
    condition: {
      type: string
      target: string
      operator: string
      value: unknown
    },
    context: ScoringContext
  ): boolean {
    let actualValue: unknown

    switch (condition.type) {
      case 'hand_state':
        if (condition.target === 'isConcealed') {
          actualValue = context.isConcealed
        }
        break

      case 'tile_count':
        actualValue = context.tiles.length
        break

      case 'meld_type':
        actualValue = context.melds.filter(
          (m) => m.type === condition.target
        ).length
        break

      default:
        return false
    }

    switch (condition.operator) {
      case 'eq':
        return actualValue === condition.value
      case 'gte':
        return (actualValue as number) >= (condition.value as number)
      case 'lte':
        return (actualValue as number) <= (condition.value as number)
      case 'contains':
        return (actualValue as unknown[]).includes(condition.value)
      case 'not_contains':
        return !(actualValue as unknown[]).includes(condition.value)
      default:
        return false
    }
  }

  /**
   * Calculate gold generation from decrees
   */
  calculateGoldGeneration(
    context: ScoringContext,
    discardCount: number
  ): number {
    let gold = 0

    for (const decree of this.getActiveDecrees()) {
      if (decree.effect.type === 'gold') {
        const effect = decree.effect
        if (effect.trigger === 'OnDiscard') {
          gold += effect.amount * discardCount
        } else if (effect.trigger === 'OnScored') {
          gold += effect.perTile
            ? effect.amount * context.tiles.length
            : effect.amount
        } else if (effect.trigger === 'OnRoundEnd') {
          gold += effect.amount
        }
      }
    }

    return gold
  }

  /**
   * Extra plays per round. The legacy draw field/API name is kept for saves;
   * GameOrchestrator applies it to handsRemaining, never tile draws/redraws.
   */
  getAdditionalDraws(excludedIds?: ReadonlySet<string>): number {
    let draws = 0

    for (const decree of this.getActiveDecrees(excludedIds)) {
      for (const effect of this.resolveEffects(
        decree,
        this.ownedDecrees,
        excludedIds
      )) {
        if (effect.type === 'draw') {
          draws += effect.additionalDraws
        }
      }
    }

    return draws
  }

  /** Net hand-size change from Decrees, in tiles (may be negative). */
  getHandSizeBonus(excludedIds?: ReadonlySet<string>): number {
    return this.sumRuleDelta('hand_size', excludedIds)
  }

  /** Net change to discards per round from Decrees (may be negative). */
  getAdditionalDiscards(excludedIds?: ReadonlySet<string>): number {
    return this.sumRuleDelta('discard_count', excludedIds)
  }

  /** Total `delta` carried by every active rule modification with this id. */
  private sumRuleDelta(
    ruleId: string,
    excludedIds?: ReadonlySet<string>
  ): number {
    let total = 0

    for (const decree of this.getActiveDecrees(excludedIds)) {
      for (const effect of this.resolveEffects(
        decree,
        this.ownedDecrees,
        excludedIds
      )) {
        if (effect.type !== 'rule_modification' || effect.ruleId !== ruleId)
          continue
        const delta = effect.modification.delta
        if (typeof delta === 'number') total += delta
      }
    }

    return total
  }

  /**
   * Check if a rule modification is active
   */
  hasRuleModification(ruleId: string): boolean {
    return this.getRuleContributions(ruleId).length > 0
  }

  /**
   * Get a specific rule modification
   */
  getRuleModification(ruleId: string): Record<string, unknown> | null {
    return this.getRuleContributions(ruleId)[0]?.effect.modification ?? null
  }

  /**
   * Apply seasonal effects (Frostbite halves decree effects)
   */
  applySeasonalDebuff(_isFrostbite: boolean): void {
    // Frostbite is handled by reducing effectiveness in applyDecreeEffect
    // This is tracked in the ScoringContext
  }

  /**
   * Get decrees by rarity for shop weighting
   */
  static getDecreesByRarity(rarity: DecreeRarity): Decree[] {
    return ALL_DECREES.filter((d) => d.rarity === rarity)
  }

  /** Shared public preflight and generation pool; fallback cannot weaken an Omen. */
  static getShopCandidates(
    excludeIds: string[],
    minimum?: DecreeRarity,
    flowerCount = 0,
    isUnlocked?: DecreeUnlockResolver
  ): Decree[] {
    const order: DecreeRarity[] = [
      'LocalEdict',
      'RegionalMandate',
      'ImperialDecree',
      'HeavenlyOrdinance',
    ]
    return ALL_DECREES.filter(
      (d) =>
        !excludeIds.includes(d.id) &&
        isDecreeAvailable(d.id, isUnlocked) &&
        flowerCount >= (d.flowerRequirement ?? 0) &&
        (!minimum || order.indexOf(d.rarity) >= order.indexOf(minimum))
    )
  }

  /**
   * Get random decree weighted by rarity
   * Common: 70%, Uncommon: 25%, Rare: 5%
   */
  static getRandomDecree(
    excludeIds: string[] = [],
    isUnlocked?: DecreeUnlockResolver
  ): Decree | null {
    const available = ALL_DECREES.filter(
      (d) => !excludeIds.includes(d.id) && isDecreeAvailable(d.id, isUnlocked)
    )
    if (available.length === 0) return null

    const roll = runRandom.next('decrees')
    let targetRarity: DecreeRarity

    if (roll < 0.7) {
      targetRarity = 'LocalEdict'
    } else if (roll < 0.95) {
      targetRarity = 'RegionalMandate'
    } else {
      targetRarity = 'ImperialDecree'
    }

    const candidates = available.filter((d) => d.rarity === targetRarity)

    if (candidates.length === 0) {
      // Fallback to any available decree
      return available[Math.floor(runRandom.next('decrees') * available.length)]
    }

    return candidates[Math.floor(runRandom.next('decrees') * candidates.length)]
  }

  /**
   * Serialize decree system state
   */
  toState(): {
    ownedDecrees: OwnedDecree[]
    maxSlots: number
    currentRound: number
    nextInstanceId?: number
  } {
    return {
      ownedDecrees: structuredClone(this.ownedDecrees),
      maxSlots: this.maxSlots,
      currentRound: this.currentRound,
      nextInstanceId: this.nextInstanceId,
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(
    state: {
      ownedDecrees: OwnedDecree[]
      maxSlots: number
      currentRound: number
      nextInstanceId?: number
    },
    random: RunRandom = runRandom
  ): DecreeSystem {
    const system = new DecreeSystem(state.maxSlots, random)
    system.ownedDecrees = structuredClone(state.ownedDecrees)
    // Old saves have no physical IDs. Assign them deterministically, without
    // consuming the gameplay RNG or collapsing duplicate catalog entries.
    system.nextInstanceId = state.nextInstanceId ?? 1
    for (const decree of system.ownedDecrees) {
      const number = /^owned-decree-(\d+)$/.exec(decree.instanceId ?? '')
      if (number)
        system.nextInstanceId = Math.max(
          system.nextInstanceId,
          Number(number[1]) + 1
        )
    }
    for (const decree of system.ownedDecrees) {
      decree.instanceId ??= system.allocateInstanceId()
    }
    // Loading old snapshots must not roll RNG or change their current hand's
    // effective resources/forecast. Preserve the old physical positional target
    // once; the next round uses the new seeded rule. Null/new IDs remain exact.
    for (const decree of system.ownedDecrees) {
      if (
        decree.randomCopyTargetId !== undefined ||
        !allEffectsOf(decree).some(
          (e) => e.type === 'copy_decree' && e.source === 'random'
        )
      )
        continue
      const others = system.ownedDecrees.filter(
        (candidate) => candidate !== decree
      )
      decree.randomCopyTargetId = others.length
        ? others[system.ownedDecrees.indexOf(decree) % others.length]
            .instanceId!
        : null
    }
    system.currentRound = state.currentRound
    return system
  }
}
