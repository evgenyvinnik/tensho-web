/**
 * Table Loop — what counts as a placeable group, and where it may go.
 *
 * The classic loop lets a player cycle any two to five tiles and pays for
 * whatever structure they happen to contain. This loop only accepts complete
 * groups, which is the structural answer to the diagnosis in section 1.1 of
 * the experiments document: three unrelated Honors is not a move here, so
 * recognising a shape is the only way to score at all.
 *
 * @module tableloop/groupRules
 */

import { Tile, TileSuit, DragonType } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import { PAIR_SLOT_INDEX, SLOT_COUNT, type SlotKind, type TableSlot } from './types'

/** Why a selection cannot be placed, as an i18n key plus English fallback. */
export interface GroupRejection {
  readonly key: string
  readonly text: string
}

export type GroupClassification =
  | { readonly ok: true; readonly type: MeldType }
  | { readonly ok: false; readonly rejection: GroupRejection }

/**
 * Classify a selection as a placeable group.
 *
 * Bonus tiles (Flowers and Seasons) never form a group, so they are rejected
 * up front rather than silently ignored.
 */
export function classifyGroup(tiles: readonly Tile[]): GroupClassification {
  if (tiles.length < 2) {
    return {
      ok: false,
      rejection: {
        key: 'tableLoop.reject.tooFew',
        text: 'Select at least two tiles that form a group.',
      },
    }
  }
  if (tiles.length > 4) {
    return {
      ok: false,
      rejection: {
        key: 'tableLoop.reject.tooMany',
        text: 'A group is at most four tiles.',
      },
    }
  }
  if (tiles.some((tile) => tile.isBonus)) {
    return {
      ok: false,
      rejection: {
        key: 'tableLoop.reject.bonusTile',
        text: 'Flowers and Seasons cannot be placed as a group.',
      },
    }
  }

  const meld = Meld.tryCreate([...tiles])
  if (!meld) {
    return {
      ok: false,
      rejection: {
        key: 'tableLoop.reject.notAGroup',
        text: 'These tiles do not form a sequence, triplet, quad or pair.',
      },
    }
  }
  return { ok: true, type: meld.type }
}

/** Meld slots hold sequences, triplets and quads; the pair slot holds pairs. */
export function slotKindFor(index: number): SlotKind {
  return index === PAIR_SLOT_INDEX ? 'pair' : 'meld'
}

export function slotAccepts(kind: SlotKind, type: MeldType): boolean {
  return kind === 'pair' ? type === MeldType.Pair : type !== MeldType.Pair
}

/** Build an empty table: four meld slots then the pair slot. */
export function createEmptySlots(): TableSlot[] {
  return Array.from({ length: SLOT_COUNT }, (_, index) => ({
    index,
    kind: slotKindFor(index),
    group: null,
  }))
}

/** True once every slot holds a group. */
export function isTableComplete(slots: readonly TableSlot[]): boolean {
  return slots.every((slot) => slot.group !== null)
}

/** Slot indices that are empty and would accept `type`. */
export function compatibleEmptySlots(
  slots: readonly TableSlot[],
  type: MeldType
): number[] {
  return slots
    .filter((slot) => slot.group === null && slotAccepts(slot.kind, type))
    .map((slot) => slot.index)
}

/**
 * Every distinct group that could be built from the rack right now.
 *
 * Used to decide exhaustion (no legal action remains) and to power the coach.
 * Selections are deduplicated by group identity, not by tile identity, so two
 * interchangeable copies of the same triplet are reported once.
 */
export function enumerateRackGroups(rack: readonly Tile[]): Tile[][] {
  const tiles = rack.filter((tile) => !tile.isBonus)
  const byKey = new Map<string, Tile[]>()

  const remember = (group: Tile[]) => {
    const key = group
      .map((tile) => tile.typeKey)
      .sort()
      .join('|')
    if (!byKey.has(key)) byKey.set(key, group)
  }

  // Identical tiles: pairs, triplets and quads.
  const buckets = new Map<string, Tile[]>()
  for (const tile of tiles) {
    const bucket = buckets.get(tile.typeKey)
    if (bucket) bucket.push(tile)
    else buckets.set(tile.typeKey, [tile])
  }
  for (const bucket of buckets.values()) {
    if (bucket.length >= 2) remember(bucket.slice(0, 2))
    if (bucket.length >= 3) remember(bucket.slice(0, 3))
    if (bucket.length >= 4) remember(bucket.slice(0, 4))
  }

  // Sequences: one run per suit and starting rank.
  for (const suit of [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]) {
    for (let start = 1; start <= 7; start += 1) {
      const run: Tile[] = []
      for (let offset = 0; offset < 3; offset += 1) {
        const match = tiles.find(
          (tile) =>
            tile.suit === suit &&
            tile.rank === start + offset &&
            !run.includes(tile)
        )
        if (!match) break
        run.push(match)
      }
      if (run.length === 3) remember(run)
    }
  }

  return [...byKey.values()]
}

/**
 * True when at least one rack group fits at least one empty slot.
 *
 * A table with only the pair slot open needs a pair; a rack full of sequences
 * is then a dead end for *placement*, though a revision may still be legal.
 */
export function hasLegalPlacement(
  rack: readonly Tile[],
  slots: readonly TableSlot[]
): boolean {
  return fitsAnySlot(rack, slots, (slot) => slot.group === null)
}

/**
 * True when at least one rack group could replace a committed one.
 *
 * The round is over when no *action* remains, not when no empty slot does. A
 * table with every slot filled and an upgrade sitting in the rack is still a
 * position with something to do in it.
 */
export function hasLegalRevision(
  rack: readonly Tile[],
  slots: readonly TableSlot[]
): boolean {
  return fitsAnySlot(rack, slots, (slot) => slot.group !== null)
}

function fitsAnySlot(
  rack: readonly Tile[],
  slots: readonly TableSlot[],
  wanted: (slot: TableSlot) => boolean
): boolean {
  const kinds = new Set(slots.filter(wanted).map((slot) => slot.kind))
  if (kinds.size === 0) return false

  return enumerateRackGroups(rack).some((group) => {
    const classification = classifyGroup(group)
    if (!classification.ok) return false
    return [...kinds].some((kind) => slotAccepts(kind, classification.type))
  })
}

/** The Dragon a group is made of, or null when it is not a Dragon group. */
export function dragonTypeOf(tiles: readonly Tile[]): DragonType | null {
  if (tiles.length === 0) return null
  if (!tiles.every((tile) => tile.suit === TileSuit.Dragon)) return null
  const rank = tiles[0].rank
  if (!tiles.every((tile) => tile.rank === rank)) return null
  const dragons = [DragonType.White, DragonType.Green, DragonType.Red]
  return dragons[rank - 1] ?? null
}
