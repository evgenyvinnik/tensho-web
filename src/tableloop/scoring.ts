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
import { isTableComplete } from './groupRules'
import { newlyClaimedMilestones, satisfiedMilestones } from './milestones'
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
  /** Standing multiplier the table is carrying before this placement. */
  readonly tableMult: number
  readonly claimedMilestones: readonly MilestoneId[]
  /**
   * The table as it looked before this placement, so a revision that breaks a
   * pattern can be reported. Optional: an ordinary placement never breaks one.
   */
  readonly previousSlots?: readonly TableSlot[]
  readonly bossRule: BossRuleId | null
  /** Set when the table was already complete before this placement (revision). */
  readonly completionAlreadyPaid: boolean
  /**
   * The group this placement is turning out of its slot, if any.
   *
   * A revision pays the difference rather than the whole group again. Without
   * that, a slot can be re-scored indefinitely: measured, a greedy policy spent
   * two thirds of its placements cycling the pair slot, because replacing a
   * pair with another pair paid full price every time. Section 9 asks for
   * exactly this to be prevented.
   */
  readonly displacedGroup?: PlacedGroup
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

/** Points the Patient Pair adds for each meld already waiting on the table. */
const PATIENT_PAIR_BONUS = 30

/** Multiplier Watch Fire pays a set outright, and again to each lit neighbour. */
const WATCH_FIRE_MULT = 0.5

/** Group types that light a slot: a set, as opposed to a run or a pair. */
const LIGHTING_TYPES: ReadonlySet<MeldType> = new Set([
  MeldType.Triplet,
  MeldType.Quad,
])

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
      const bonus = melds * PATIENT_PAIR_BONUS
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

  if (owned.has('watch_fire')) {
    // The base: a set is worth more for being a set.
    if (LIGHTING_TYPES.has(group.type)) {
      mult += WATCH_FIRE_MULT
      stages.push({
        kind: 'decree',
        label: `Watch Fire +${WATCH_FIRE_MULT.toFixed(1)} Mult for the set`,
        labelKey: 'tableLoop.stage.watchFireSet',
        labelVars: { mult: WATCH_FIRE_MULT.toFixed(1) },
        mult: WATCH_FIRE_MULT,
        runningPoints: points,
        runningMult: mult,
        highlightTileIds: tileIds,
      })
    }

    // The upside: sitting beside one already on the table.
    const litNeighbors = neighborSlots(context.slotIndex).filter((index) => {
      const slot = context.slots[index]
      if (!slot?.group) return false
      if (slot.group.placementOrder >= group.placementOrder) return false
      return LIGHTING_TYPES.has(slot.group.type)
    })
    if (litNeighbors.length > 0) {
      const bonus = WATCH_FIRE_MULT * litNeighbors.length
      mult += bonus
      stages.push({
        kind: 'decree',
        label: `Watch Fire +${bonus.toFixed(1)} Mult from the lit slot`,
        labelKey: 'tableLoop.stage.watchFire',
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

  let groupTotal = Math.floor(points * mult) * repeats

  // --- 3b. What the slot was already worth ------------------------------------
  if (context.displacedGroup) {
    const displaced = context.displacedGroup
    const displacedValue = Math.floor(
      (groupTilePoints(displaced.tiles, context.bossRule) +
        structurePointsFor(displaced.type)) *
        mult
    )
    const credited = Math.min(groupTotal, displacedValue)
    if (credited > 0) {
      groupTotal -= credited
      stages.push({
        kind: 'table',
        label: `Replaces ${describeGroup(displaced.tiles)} — ${credited} already paid`,
        labelKey: 'tableLoop.stage.replaces',
        labelVars: { tiles: describeGroup(displaced.tiles), points: credited },
        points: -credited,
        runningPoints: points,
        runningMult: mult,
        highlightSlots: [context.slotIndex],
      })
    }
  }

  // --- 4. Milestones ---------------------------------------------------------
  const claimed = newlyClaimedMilestones(context.slots, context.claimedMilestones)
  const twinFlame = owned.has('twin_flame')
  let milestoneTotal = 0
  let earnedMult = 0
  let multLost = 0

  for (const id of claimed) {
    const definition = getMilestone(id)
    const award = twinFlame ? definition.points * 2 : definition.points
    milestoneTotal += award
    earnedMult += definition.mult
    stages.push({
      kind: 'milestone',
      label: `${definition.name} +${award}, +${definition.mult.toFixed(1)} Mult while it stands`,
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

  // --- 4b. Anything this placement broke -------------------------------------
  // A milestone's multiplier belongs to the pattern, not to the ledger. Replacing
  // one of the groups that formed it gives the multiplier back, which is what
  // makes a revision a decision rather than a free second placement. The points
  // it already paid are kept, and it stays claimed so it cannot be sold twice.
  if (context.previousSlots) {
    const claimedSet = new Set(context.claimedMilestones)
    const before = satisfiedMilestones(context.previousSlots).filter((id) =>
      claimedSet.has(id)
    )
    const after = new Set(satisfiedMilestones(context.slots))
    for (const id of before) {
      if (after.has(id)) continue
      const definition = getMilestone(id)
      earnedMult -= definition.mult
      multLost += definition.mult
      stages.push({
        kind: 'table',
        label: `${definition.name} broken — ${definition.mult.toFixed(1)} Mult lost`,
        labelKey: 'tableLoop.stage.milestoneBroken',
        labelVars: { name: definition.name, mult: definition.mult.toFixed(1) },
        labelVarKeys: { name: `tableLoop.milestones.${id}.name` },
        mult: -definition.mult,
        runningPoints: points,
        runningMult: mult + earnedMult,
        highlightSlots: [context.slotIndex],
      })
    }
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

  return {
    points,
    mult,
    total,
    multLost,
    stages,
    claimedMilestones: claimed,
    gold,
  }
}

/** Standing multiplier a set of claimed milestones is worth. */
export function multFromMilestones(ids: readonly MilestoneId[]): number {
  return ids.reduce((sum, id) => sum + getMilestone(id).mult, 0)
}

/**
 * The multiplier the table is currently carrying.
 *
 * A milestone pays its points once, but its multiplier lasts only while the
 * table still shows the pattern. Section 10 asks whether revision should be
 * available to everyone; measuring it showed a policy spending half its actions
 * on revisions because replacing a group cost nothing but the action. Tying the
 * multiplier to the pattern gives that choice a price.
 */
export function standingMult(
  slots: readonly TableSlot[],
  claimed: readonly MilestoneId[]
): number {
  const claimedSet = new Set(claimed)
  return satisfiedMilestones(slots)
    .filter((id) => claimedSet.has(id))
    .reduce((sum, id) => sum + getMilestone(id).mult, 0)
}

/** Every milestone definition, for the progress track. */
export const ALL_MILESTONES = MILESTONES
