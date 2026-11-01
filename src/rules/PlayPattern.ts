/**
 * Play patterns: Tensho's poker-style names for what a play scored.
 *
 * Tensho is not standard Mahjong. A play is read as the groups it contains —
 * a Pair, Two Pairs, a Sequence and a Pair, Two Sequences, a four-, five- or
 * six-tile Straight, a Triplet, a Quad, Five or Six of a Kind — and the
 * pattern decides its bonus Mult. One formula covers every pattern, so the
 * guide can teach it in a line:
 *
 *   Pattern Mult = (groups − 1) + Σ group bonus
 *   group bonus:  Pair 0 · Sequence 0 · Triplet 1 · 4-Straight 1
 *                 Quad 2 · 5-Straight 2 · Three Dragons 2 · Four Winds 2
 *                 6-Straight 3 · Five of a Kind 3 · Six of a Kind 4
 *
 * Five and Six of a Kind are Quads of five or six identical tiles. The Wall
 * holds four of each, so they need bought or copied tiles, or Wild ones.
 *
 * Two groups are secret hands: Three Dragons (one White, one Green, one Red)
 * and Four Winds (one of each Wind). The guide leaves them out until the
 * player has played one, and a play holding one is named after it.
 *
 * A complete Mahjong hand earns a flat Mahjong bonus instead, on top of its
 * Yaku. Each physical tile belongs to at most one group (an awakened Plum may
 * share one tile between two sequences; that still reads as two sequences).
 *
 * Honor tiles add their own effect independent of the pattern: every Dragon
 * that scores adds +2 Mult, and +4 inside a group (see `dragonMultFor` in
 * ScoringEngine).
 *
 * Pure and deterministic: the same groups always give the same pattern, and
 * the classifier never decides which grouping a selection has — the parser
 * does, and its answer is final for preview and payment alike.
 */

import { Meld, MeldType } from '../core/Meld'

/** Canonical pattern ids. Combined patterns list their groups largest first. */
export type PlayPatternId =
  | 'loose'
  | 'pair'
  | 'sequence'
  | 'triplet'
  | 'quad'
  | 'five_of_a_kind'
  | 'six_of_a_kind'
  | 'straight4'
  | 'straight5'
  | 'straight6'
  | 'two_pairs'
  | 'three_pairs'
  | 'two_sequences'
  | 'two_triplets'
  | 'sequence_pair'
  | 'triplet_pair'
  | 'triplet_sequence'
  | 'quad_pair'
  | 'straight_pair'
  | 'mahjong'
  /** Secret hands: a play holding one is named after it. */
  | 'three_dragons'
  | 'four_winds'
  /** Groups the named list does not cover (only reachable through Decrees). */
  | 'combination'

/** Every pattern id; the record makes a new id fail to compile until listed. */
const PATTERN_ID_SET: Record<PlayPatternId, true> = {
  loose: true,
  pair: true,
  sequence: true,
  triplet: true,
  quad: true,
  five_of_a_kind: true,
  six_of_a_kind: true,
  straight4: true,
  straight5: true,
  straight6: true,
  two_pairs: true,
  three_pairs: true,
  two_sequences: true,
  two_triplets: true,
  sequence_pair: true,
  triplet_pair: true,
  triplet_sequence: true,
  quad_pair: true,
  straight_pair: true,
  mahjong: true,
  three_dragons: true,
  four_winds: true,
  combination: true,
}

export const PLAY_PATTERN_IDS = Object.keys(PATTERN_ID_SET) as PlayPatternId[]

export interface PlayPattern {
  id: PlayPatternId
  /** Additive Mult the pattern contributes. */
  mult: number
  /** Group kinds in display order, for an exact explanation. */
  groups: GroupKind[]
}

/**
 * A group as the pattern sees it: straights and quads are split by length,
 * honors by suit.
 */
export type GroupKind =
  | 'pair'
  | 'sequence'
  | 'triplet'
  | 'quad'
  | 'five_of_a_kind'
  | 'six_of_a_kind'
  | 'straight4'
  | 'straight5'
  | 'straight6'
  | 'three_dragons'
  | 'four_winds'

/** Mult each group adds by itself. */
export const GROUP_MULT: Record<GroupKind, number> = {
  pair: 0,
  sequence: 0,
  triplet: 1,
  straight4: 1,
  quad: 2,
  straight5: 2,
  straight6: 3,
  three_dragons: 2,
  four_winds: 2,
  five_of_a_kind: 3,
  six_of_a_kind: 4,
}

/** Every group after the first adds this much Mult. */
export const EXTRA_GROUP_MULT = 1

/** A complete Mahjong hand's flat bonus Mult, in place of the group formula. */
export const MAHJONG_PATTERN_MULT = 4

/** Every Dragon tile that scores adds this Mult, grouped or not. */
export const DRAGON_MULT = 2

/** A Dragon scoring inside a pair or bigger group adds this Mult instead. */
export const DRAGON_GROUP_MULT = 4

export function groupKind(meld: Meld): GroupKind {
  return groupKindFor(meld.type, meld.tiles.length)
}

/** The kind of a group of this type and size. */
export function groupKindFor(type: MeldType, size: number): GroupKind {
  if (type === MeldType.Straight)
    return size >= 6 ? 'straight6' : size >= 5 ? 'straight5' : 'straight4'
  if (type === MeldType.Honors)
    return size >= 4 ? 'four_winds' : 'three_dragons'
  if (type === MeldType.Quad && size >= 6) return 'six_of_a_kind'
  if (type === MeldType.Quad && size === 5) return 'five_of_a_kind'
  return type
}

/** Secret hands, which the guide shows only once they have been played. */
export const SECRET_PATTERNS = ['three_dragons', 'four_winds'] as const

export type SecretPatternId = (typeof SECRET_PATTERNS)[number]

export function isSecretPattern(id: PlayPatternId): id is SecretPatternId {
  return (SECRET_PATTERNS as readonly PlayPatternId[]).includes(id)
}

const KIND_ORDER: GroupKind[] = [
  'four_winds',
  'three_dragons',
  'six_of_a_kind',
  'five_of_a_kind',
  'straight6',
  'quad',
  'straight5',
  'straight4',
  'triplet',
  'sequence',
  'pair',
]

/** Named patterns, keyed by their sorted group kinds. */
const NAMED: Record<string, PlayPatternId> = {
  pair: 'pair',
  sequence: 'sequence',
  triplet: 'triplet',
  quad: 'quad',
  five_of_a_kind: 'five_of_a_kind',
  six_of_a_kind: 'six_of_a_kind',
  straight4: 'straight4',
  straight5: 'straight5',
  straight6: 'straight6',
  'pair+pair': 'two_pairs',
  'pair+pair+pair': 'three_pairs',
  'sequence+sequence': 'two_sequences',
  'triplet+triplet': 'two_triplets',
  'sequence+pair': 'sequence_pair',
  'triplet+pair': 'triplet_pair',
  'triplet+sequence': 'triplet_sequence',
  'quad+pair': 'quad_pair',
  'straight4+pair': 'straight_pair',
}

/** Classify the scored groups of a tactical play. */
export function classifyPlay(groups: readonly Meld[]): PlayPattern {
  const kinds = groups
    .map(groupKind)
    .sort((a, b) => KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b))
  if (kinds.length === 0) return { id: 'loose', mult: 0, groups: [] }
  const mult =
    (kinds.length - 1) * EXTRA_GROUP_MULT +
    kinds.reduce((sum, kind) => sum + GROUP_MULT[kind], 0)
  // A secret group sorts first, and names the play whatever joins it.
  const secret = SECRET_PATTERNS.find((id) => id === kinds[0])
  const id = secret ?? NAMED[kinds.join('+')] ?? 'combination'
  return { id, mult, groups: kinds }
}

/** A complete Mahjong hand: its groups for the record, a flat bonus Mult. */
export function classifyMahjong(groups: readonly Meld[]): PlayPattern {
  return {
    id: 'mahjong',
    mult: MAHJONG_PATTERN_MULT,
    groups: groups.map(groupKind),
  }
}

/** Every pattern the guide teaches, in ascending order of typical value. */
export const TAUGHT_PATTERNS: readonly PlayPatternId[] = [
  'pair',
  'sequence',
  'two_pairs',
  'triplet',
  'straight4',
  'sequence_pair',
  'two_sequences',
  'triplet_pair',
  'straight5',
  'quad',
  'straight6',
  'five_of_a_kind',
  'six_of_a_kind',
  'mahjong',
]
