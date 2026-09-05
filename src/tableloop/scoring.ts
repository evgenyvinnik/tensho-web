/**
 * Table Loop — placement scoring and the causal chain (E05).
 *
 * One pipeline serves both the forecast and the committed play, so a preview is
 * exact rather than an estimate. Resolution follows the order the experiments
 * document sets out: score the new group, resolve Decree triggers, award newly
 * completed milestones, then award a first completion bonus.
 *
 * @module tableloop/scoring
 */

import { Tile, TileSuit } from '../core/Tile'
import { MeldType } from '../core/Meld'
import { getTilePoints } from '../rules/ScoringEngine'
import {
  MILESTONES,
  TABLE_COMPLETION_POINTS,
  getMilestone,
} from './content'
import { dragonTypeOf, isTableComplete } from './groupRules'
import { newlyClaimedMilestones } from './milestones'
import {
  PAIR_SLOT_INDEX,
  type BossRuleId,
  type CausalStage,
  type MilestoneId,
  type PlacementScore,
  type PlacedGroup,
  type TableDecreeId,
  type TableSlot,
} from './types'

/** Everything scoring needs that is not the group itself. */
export interface PlacementContext {
  /** The table as it will look after the placement. */
  readonly slots: readonly TableSlot[]
  /** Slot the group is going into. */
  readonly slotIndex: number
  readonly ownedDecrees: readonly TableDecreeId[]
  /** Standing multiplier already earned by milestones this round. */
  readonly tableMult: number
  readonly claimedMilestones: readonly MilestoneId[]
  readonly bossRule: BossRuleId | null
  /** Set when the table was already complete before this placement (revision). */
  readonly completionAlreadyPaid: boolean
}

const GROUP_LABELS: Record<MeldType, string> = {
  [MeldType.Sequence]: 'Sequence',
  [MeldType.Triplet]: 'Triplet',
  [MeldType.Quad]: 'Quad',
  [MeldType.Pair]: 'Pair',
}

/** The characters printed on the tiles themselves. */
const SUIT_GLYPH: Partial<Record<TileSuit, string>> = {
  [TileSuit.Manzu]: '萬',
  [TileSuit.Pinzu]: '筒',
  [TileSuit.Souzu]: '索',
}
const WIND_GLYPHS = ['東', '南', '西', '北']
const DRAGON_GLYPHS = ['白', '發', '中']

/**
 * Identify a group by the faces of its tiles, e.g. "3·4·5 索" or "中·中".
 *
 * Deliberately not `Tile.displayName`: that reads "Red Dragon", which would put
 * an English phrase inside every translated line of the causal chain. The tile
 * characters are what is printed on the tile in every language.
 */
export function describeGroup(tiles: readonly Tile[]): string {
  const sorted = [...tiles].sort(Tile.compare)
  const suit = sorted[0]?.suit

  const glyph = suit ? SUIT_GLYPH[suit] : undefined
  if (glyph) {
    return `${sorted.map((tile) => tile.rank).join('·')} ${glyph}`
  }
  if (suit === TileSuit.Wind) {
    return sorted.map((tile) => WIND_GLYPHS[tile.rank - 1] ?? '?').join('·')
  }
  if (suit === TileSuit.Dragon) {
    return sorted.map((tile) => DRAGON_GLYPHS[tile.rank - 1] ?? '?').join('·')
  }
  return sorted.map((tile) => tile.displayName).join(' · ')
}

/**
 * Tile points for a group, after the active boss rule.
 *
 * Frost Magistrate halves Honor tile points. Structure points are untouched, so
 * an Honor build keeps its shape rewards and its milestones.
 */
export function groupTilePoints(
  tiles: readonly Tile[],
  bossRule: BossRuleId | null
): number {
  return tiles.reduce((sum, tile) => {
    const base = getTilePoints(tile)
    if (bossRule === 'frost_magistrate' && tile.isHonor) {
      return sum + Math.floor(base / 2)
    }
    return sum + base
  }, 0)
}

/**
 * Structure points for a committed group.
 *
 * Deliberately higher than the classic loop's 10/20/30/50. There, a play mixes
 * a group with loose tiles and the structure bonus is a garnish; here a
 * placement is a whole turn and only complete groups can be played at all, so
 * the shape has to carry the round. Section 1.1 of the experiments document
 * asks for exactly this: a baseline where recognising a pattern is worth
 * learning.
 *
 * The simulation in `scripts/tableloop-sim.mts` is the check. With the classic
 * values, clearing a round and finishing the table were almost the same event,
 * which is the "only the finishing bonus matters" failure the document lists.
 */
const TABLE_STRUCTURE_POINTS: Record<MeldType, number> = {
  [MeldType.Pair]: 15,
  [MeldType.Sequence]: 40,
  [MeldType.Triplet]: 45,
  [MeldType.Quad]: 80,
}

function structurePointsFor(type: MeldType): number {
  return TABLE_STRUCTURE_POINTS[type]
}

/** Slots directly left and right of `index` on the single row of five. */
export function neighborSlots(index: number): number[] {
  return [index - 1, index + 1].filter(
    (candidate) => candidate >= 0 && candidate <= PAIR_SLOT_INDEX
  )
}

/**
 * Score a placement and describe how it resolved.
 *
 * `slots` must already contain the placed group; that keeps milestone
 * evaluation and neighbour lookups reading one authoritative table instead of
 * a projection the caller assembled separately.
 */
export function scorePlacement(
  group: PlacedGroup,
  context: PlacementContext
): PlacementScore {
  const owned = new Set(context.ownedDecrees)
  const stages: CausalStage[] = []
  const tiles = group.tiles
  const tileIds = tiles.map((tile) => tile.id)

  // --- 1. The new group ------------------------------------------------------
  const tilePoints = groupTilePoints(tiles, context.bossRule)
  const structurePoints = structurePointsFor(group.type)
  let points = tilePoints + structurePoints
  let mult = 1

  stages.push({
    kind: 'group',
    label: `${GROUP_LABELS[group.type]} placed — ${describeGroup(tiles)}`,
    labelKey: `tableLoop.stage.group.${group.type}`,
    labelVars: { tiles: describeGroup(tiles) },
    points,
    runningPoints: points,
    runningMult: mult,
    highlightTileIds: tileIds,
    highlightSlots: [context.slotIndex],
  })

  if (context.bossRule === 'frost_magistrate' && tiles.some((t) => t.isHonor)) {
    stages.push({
      kind: 'boss',
      label: 'Frost Magistrate — Honor tiles score half',
      labelKey: 'tableLoop.stage.frostMagistrate',
      runningPoints: points,
      runningMult: mult,
      highlightTileIds: tiles.filter((t) => t.isHonor).map((t) => t.id),
    })
  }

  // --- 2. The table answers --------------------------------------------------
  if (context.tableMult > 0) {
    mult += context.tableMult
    stages.push({
      kind: 'table',
      label: `Table momentum +${context.tableMult.toFixed(1)} Mult`,
      labelKey: 'tableLoop.stage.momentum',
      labelVars: { mult: context.tableMult.toFixed(1) },
      mult: context.tableMult,
      runningPoints: points,
      runningMult: mult,
    })
  }

  // --- 3. Decrees ------------------------------------------------------------
  let repeats = 1

  if (owned.has('terminal_gate') && tiles.some((tile) => tile.isTerminal)) {
    points += 40
    stages.push({
      kind: 'decree',
      label: 'Terminal Gate +40',
      labelKey: 'tableLoop.stage.terminalGate',
      labelVars: { bonus: 40 },
      points: 40,
      runningPoints: points,
      runningMult: mult,
      highlightTileIds: tiles.filter((tile) => tile.isTerminal).map((t) => t.id),
    })
  }

  if (owned.has('patient_pair') && group.type === MeldType.Pair) {
    const melds = context.slots.filter(
      (slot) => slot.index !== PAIR_SLOT_INDEX && slot.group !== null
    ).length
    if (melds > 0) {
      const bonus = melds * 30
      points += bonus
      stages.push({
        kind: 'decree',
        label: `Patient Pair +${bonus} (${melds} melds waiting)`,
        labelKey: 'tableLoop.stage.patientPair',
        labelVars: { bonus, melds },
        points: bonus,
        runningPoints: points,
        runningMult: mult,
        highlightSlots: context.slots
          .filter((slot) => slot.index !== PAIR_SLOT_INDEX && slot.group)
          .map((slot) => slot.index),
      })
    }
  }

  if (
    owned.has('honor_court') &&
    tiles.every((tile) => tile.suit === TileSuit.Wind || tile.suit === TileSuit.Dragon)
  ) {
    const bonus = Number((0.3 * tiles.length).toFixed(2))
    mult += bonus
    stages.push({
      kind: 'decree',
      label: `Honor Court +${bonus.toFixed(1)} Mult`,
      labelKey: 'tableLoop.stage.honorCourt',
      labelVars: { mult: bonus.toFixed(1) },
      mult: bonus,
      runningPoints: points,
      runningMult: mult,
      highlightTileIds: tileIds,
    })
  }

  if (owned.has('dragon_lantern')) {
    const litNeighbors = neighborSlots(context.slotIndex).filter((index) => {
      const slot = context.slots[index]
      if (!slot?.group) return false
      if (slot.group.placementOrder >= group.placementOrder) return false
      return dragonTypeOf(slot.group.tiles) !== null
    })
    if (litNeighbors.length > 0) {
      const bonus = 0.5 * litNeighbors.length
      mult += bonus
      stages.push({
        kind: 'decree',
        label: `Dragon Lantern +${bonus.toFixed(1)} Mult from the lit slot`,
        labelKey: 'tableLoop.stage.dragonLantern',
        labelVars: { mult: bonus.toFixed(1) },
        mult: bonus,
        runningPoints: points,
        runningMult: mult,
        highlightSlots: litNeighbors,
      })
    }
  }

  if (
    owned.has('echoing_bamboo') &&
    group.type === MeldType.Sequence &&
    tiles.every((tile) => tile.suit === TileSuit.Souzu)
  ) {
    repeats = 2
    stages.push({
      kind: 'decree',
      label: 'Echoing Bamboo — this sequence scores twice',
      labelKey: 'tableLoop.stage.echoingBamboo',
      runningPoints: points,
      runningMult: mult,
      highlightTileIds: tileIds,
    })
  }

  const groupTotal = Math.floor(points * mult) * repeats

  // --- 4. Milestones ---------------------------------------------------------
  const claimed = newlyClaimedMilestones(context.slots, context.claimedMilestones)
  const twinFlame = owned.has('twin_flame')
  let milestoneTotal = 0
  let earnedMult = 0

  for (const id of claimed) {
    const definition = getMilestone(id)
    const award = twinFlame ? definition.points * 2 : definition.points
    milestoneTotal += award
    earnedMult += definition.mult
    stages.push({
      kind: 'milestone',
      label: `${definition.name} +${award}, +${definition.mult.toFixed(1)} Mult for the round`,
      labelKey: 'tableLoop.stage.milestone',
      labelVars: {
        name: definition.name,
        points: award,
        mult: definition.mult.toFixed(1),
      },
      labelVarKeys: { name: `tableLoop.milestones.${id}.name` },
      points: award,
      mult: definition.mult,
      runningPoints: points,
      runningMult: mult + earnedMult,
      highlightSlots: context.slots
        .filter((slot) => slot.group !== null)
        .map((slot) => slot.index),
    })
  }

  // --- 5. Completing the table ----------------------------------------------
  let completionTotal = 0
  const completesTable =
    !context.completionAlreadyPaid && isTableComplete(context.slots)
  if (completesTable) {
    const completionMult = 1 + context.tableMult + earnedMult
    completionTotal = Math.floor(TABLE_COMPLETION_POINTS * completionMult)
    stages.push({
      kind: 'completion',
      label: `Table complete — ${TABLE_COMPLETION_POINTS} × ${completionMult.toFixed(1)}`,
      labelKey: 'tableLoop.stage.completion',
      labelVars: {
        base: TABLE_COMPLETION_POINTS,
        mult: completionMult.toFixed(1),
      },
      points: completionTotal,
      runningPoints: points,
      runningMult: completionMult,
      highlightSlots: context.slots.map((slot) => slot.index),
    })
  }

  const total = groupTotal + milestoneTotal + completionTotal

  stages.push({
    kind: 'total',
    label: 'Lands on the target',
    labelKey: 'tableLoop.stage.total',
    points: total,
    runningPoints: points,
    runningMult: mult,
  })

  const gold = owned.has('jade_ledger') ? 2 : 0

  return { points, mult, total, stages, claimedMilestones: claimed, gold }
}

/** Standing multiplier a set of claimed milestones is worth. */
export function multFromMilestones(ids: readonly MilestoneId[]): number {
  return ids.reduce((sum, id) => sum + getMilestone(id).mult, 0)
}

/** Every milestone definition, for the progress track. */
export const ALL_MILESTONES = MILESTONES
