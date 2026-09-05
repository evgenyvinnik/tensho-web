/**
 * Table Loop — shared types for the persistent-table prototype.
 *
 * This is the playable answer to experiments E01–E05 in
 * `docs/GAMEPLAY_EXPERIMENTS.md`: groups you play stay on the table, pattern
 * milestones pay out before the table is finished, the run opens with a build
 * choice, the shop is small and interacting, and every score resolves as a
 * readable chain of stages.
 *
 * It deliberately does not reuse `OrchestratorState`. The classic loop cycles
 * tiles out of a hand; this loop commits them to slots. Sharing state would
 * force one of the two to lie about where a tile lives.
 *
 * @module tableloop/types
 */

import { Tile } from '../core/Tile'
import { MeldType } from '../core/Meld'

// =============================================================================
// TABLE
// =============================================================================

/** Meld slots take sequences, triplets and quads. The pair slot takes pairs. */
export type SlotKind = 'meld' | 'pair'

/** Index of the pair slot. Meld slots are 0..3. */
export const PAIR_SLOT_INDEX = 4

/** Total slots on the table: four melds plus one pair. */
export const SLOT_COUNT = 5

/**
 * A group committed to a slot.
 *
 * Tiles are stored as instances because scoring, milestones and the causal
 * chain all need suit and rank. `tileIds` exists so tile conservation can be
 * asserted cheaply.
 */
export interface PlacedGroup {
  readonly type: MeldType
  readonly tiles: readonly Tile[]
  /** 1-based order in which this group reached the table this round. */
  readonly placementOrder: number
}

export interface TableSlot {
  readonly index: number
  readonly kind: SlotKind
  readonly group: PlacedGroup | null
}

// =============================================================================
// MILESTONES (E02)
// =============================================================================

export type MilestoneId =
  | 'twin_sequence'
  | 'pure_suit'
  | 'three_suit_sequence'
  | 'dragon_duet'
  | 'dragon_court'
  | 'four_sequences'

/**
 * A pattern that pays once per round, the first time the table shows it.
 *
 * `mult` raises the table's standing multiplier for the rest of the round, so
 * recognising a shape changes what every later placement is worth rather than
 * paying a one-off trickle.
 */
export interface MilestoneDefinition {
  readonly id: MilestoneId
  /** Fallback English label; the UI resolves `tableLoop.milestones.<id>.name`. */
  readonly name: string
  readonly description: string
  readonly points: number
  readonly mult: number
}

// =============================================================================
// DECREES (E03 / E04)
// =============================================================================

export type TableDecreeId =
  | 'echoing_bamboo'
  | 'patient_pair'
  | 'dragon_lantern'
  | 'twin_flame'
  | 'river_merchant'
  | 'jade_ledger'
  | 'honor_court'
  | 'terminal_gate'

export interface TableDecreeDefinition {
  readonly id: TableDecreeId
  readonly name: string
  readonly description: string
  /** Offered as one of the three opening build choices. */
  readonly isStarter: boolean
  readonly cost: number
}

// =============================================================================
// CAUSAL CHAIN (E05)
// =============================================================================

export type CausalStageKind =
  | 'group'
  | 'table'
  | 'decree'
  | 'milestone'
  | 'boss'
  | 'completion'
  | 'total'

/**
 * One readable step of a resolution.
 *
 * The engine emits these in resolution order so the UI can animate exactly what
 * happened without re-deriving it, and so a player who skips the animation
 * still sees the same list.
 */
export interface CausalStage {
  readonly kind: CausalStageKind
  /** English fallback text. */
  readonly label: string
  /** i18n key the UI prefers over `label`. */
  readonly labelKey?: string
  /** Interpolation values for `labelKey`. */
  readonly labelVars?: Readonly<Record<string, string | number>>
  /**
   * Interpolation values that are themselves translatable, given as i18n keys.
   * The renderer resolves each one before interpolating, using the matching
   * entry in `labelVars` as the English fallback. Without this a milestone name
   * would arrive in the chain in English regardless of the interface language.
   */
  readonly labelVarKeys?: Readonly<Record<string, string>>
  /** Points this stage added to the running base. */
  readonly points?: number
  /** Multiplier this stage added. */
  readonly mult?: number
  /** Running base points after this stage. */
  readonly runningPoints?: number
  /** Running multiplier after this stage. */
  readonly runningMult?: number
  /** Tiles or slots the UI should highlight while showing this stage. */
  readonly highlightTileIds?: readonly string[]
  readonly highlightSlots?: readonly number[]
}

export interface PlacementScore {
  readonly points: number
  readonly mult: number
  readonly total: number
  readonly stages: readonly CausalStage[]
  /** Milestones newly claimed by this placement. */
  readonly claimedMilestones: readonly MilestoneId[]
  /** Gold this placement earned. */
  readonly gold: number
}

// =============================================================================
// ROUNDS
// =============================================================================

export type BossRuleId = 'frost_magistrate'

export interface TableRoundDefinition {
  readonly index: number
  readonly name: string
  readonly target: number
  readonly placementActions: number
  readonly redraws: number
  readonly bossRule: BossRuleId | null
  /** Base gold paid for clearing. */
  readonly reward: number
}

// =============================================================================
// RUN STATE
// =============================================================================

export type TableLoopPhase =
  | 'choosingStart'
  | 'playing'
  | 'roundCleared'
  | 'shop'
  | 'runComplete'
  | 'runFailed'

export interface TableLoopState {
  readonly phase: TableLoopPhase
  readonly seed: number

  /** 0-based index into `TABLE_ROUNDS`. */
  readonly roundIndex: number
  readonly round: TableRoundDefinition
  readonly score: number
  readonly runScore: number
  readonly gold: number

  readonly placementActionsRemaining: number
  readonly redrawsRemaining: number

  readonly rack: readonly Tile[]
  readonly slots: readonly TableSlot[]
  readonly river: readonly Tile[]
  /** Tiles not yet drawn this round. */
  readonly wall: readonly Tile[]
  /** The run's persistent tile collection; the wall is rebuilt from it. */
  readonly collection: readonly Tile[]

  readonly ownedDecrees: readonly TableDecreeId[]
  /** The three opening choices, present only during `choosingStart`. */
  readonly starterChoices: readonly TableDecreeId[]
  readonly shopOffers: readonly TableDecreeId[]

  readonly claimedMilestones: readonly MilestoneId[]
  /** Standing multiplier earned by milestones this round. */
  readonly tableMult: number
  readonly tableCompleted: boolean

  /** River recoveries left this round (Whispering Merchant). */
  readonly riverRecoveriesRemaining: number

  /**
   * Whether this run uses the draft row (E06). Off by default: the experiments
   * document asks for it to be compared against the base loop rather than
   * folded into it.
   */
  readonly draftEnabled: boolean
  /** Face-up tiles a placement may draw one replacement from. */
  readonly draftRow: readonly Tile[]
  /**
   * True while a placement's last replacement is still unclaimed. The rack sits
   * one tile short until the player takes an offer or draws from the wall; any
   * other action resolves it from the wall.
   */
  readonly pendingDraftPick: boolean

  /** The most recent resolution, for the causal-chain display. */
  readonly lastResolution: readonly CausalStage[]
  /** Human-readable reason the last action was refused. */
  readonly lastError: string | null
  readonly lastErrorKey: string | null
}

export interface TableActionResult {
  readonly success: boolean
  readonly state: TableLoopState
  /** Present when the action scored. */
  readonly score?: PlacementScore
  readonly errorKey?: string
  readonly error?: string
}
