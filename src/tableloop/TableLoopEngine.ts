/**
 * Table Loop — the authoritative engine for the persistent-table prototype.
 *
 * Answers experiments E01–E05 as one playable loop: groups you place stay on
 * the table, milestones pay before the table is finished, the run opens with a
 * build choice, a small shop sells effects that interact, and every resolution
 * is returned as a readable chain of stages.
 *
 * Every method returns a fresh state. Nothing here reads or writes the classic
 * `GameOrchestrator`: the two loops disagree about where a tile lives, and
 * sharing state would force one of them to lie about it.
 *
 * @module tableloop/TableLoopEngine
 */

import { Tile, createStandardTileSet } from '../core/Tile'
import {
  DRAFT_ROW_SIZE,
  MAX_REDRAW_TILES,
  RACK_SIZE,
  STARTER_DECREE_IDS,
  TABLE_DECREES,
  TABLE_ROUNDS,
  getTableDecree,
} from './content'
import {
  classifyGroup,
  createEmptySlots,
  hasLegalPlacement,
  isTableComplete,
  slotAccepts,
} from './groupRules'
import { multFromMilestones, scorePlacement } from './scoring'
import {
  type CausalStage,
  type PlacedGroup,
  type PlacementScore,
  type TableActionResult,
  type TableDecreeId,
  type TableLoopState,
  type TableSlot,
} from './types'

/** Number of shop offers, and of opening build choices. */
const OFFER_COUNT = 3

// =============================================================================
// SEEDED RANDOMNESS
// =============================================================================

/**
 * Deterministic 32-bit generator.
 *
 * A run is reproducible from its seed so a confusing hand can be replayed
 * during playtests, which the plan in section 8 depends on.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0 || 1
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// =============================================================================
// HELPERS
// =============================================================================

function refuse(
  state: TableLoopState,
  key: string,
  text: string
): TableActionResult {
  return {
    success: false,
    state: { ...state, lastError: text, lastErrorKey: key },
    errorKey: key,
    error: text,
  }
}

function nextPlacementOrder(slots: readonly TableSlot[]): number {
  return (
    slots.reduce(
      (highest, slot) => Math.max(highest, slot.group?.placementOrder ?? 0),
      0
    ) + 1
  )
}

/** Gold paid for clearing a round, including unspent-resource rebates. */
export function clearReward(state: TableLoopState): number {
  return (
    state.round.reward +
    state.redrawsRemaining * 2 +
    state.placementActionsRemaining
  )
}

// =============================================================================
// ENGINE
// =============================================================================

export class TableLoopEngine {
  private state: TableLoopState

  constructor(seed: number = Date.now(), draftEnabled: boolean = false) {
    this.state = TableLoopEngine.createRun(seed, draftEnabled)
  }

  getState(): TableLoopState {
    return this.state
  }

  /**
   * Resume from a state snapshot.
   *
   * The engine holds no state outside `TableLoopState`, so a saved run — or a
   * hand-built situation in a test — resumes exactly.
   */
  static fromState(state: TableLoopState): TableLoopEngine {
    const engine = new TableLoopEngine(state.seed)
    engine.state = state
    return engine
  }

  /**
   * A fresh run, paused on the opening build choice (E03).
   *
   * The wall is not dealt yet: the chosen Decree should be able to influence
   * the very first rack, so dealing waits until the choice is made.
   */
  static createRun(seed: number, draftEnabled: boolean = false): TableLoopState {
    const random = createRandom(seed)
    const collection = createStandardTileSet(true)
    const starterChoices = shuffle(STARTER_DECREE_IDS, random).slice(0, OFFER_COUNT)

    return {
      phase: 'choosingStart',
      seed,
      roundIndex: 0,
      round: TABLE_ROUNDS[0],
      score: 0,
      runScore: 0,
      gold: 0,
      placementActionsRemaining: TABLE_ROUNDS[0].placementActions,
      redrawsRemaining: TABLE_ROUNDS[0].redraws,
      rack: [],
      slots: createEmptySlots(),
      river: [],
      wall: [],
      collection,
      ownedDecrees: [],
      starterChoices,
      shopOffers: [],
      claimedMilestones: [],
      tableMult: 0,
      tableCompleted: false,
      riverRecoveriesRemaining: 0,
      draftEnabled,
      draftRow: [],
      pendingDraftPick: false,
      lastResolution: [],
      lastError: null,
      lastErrorKey: null,
    }
  }

  /** Take one of the three opening Decrees and deal the first round. */
  chooseStarter(id: TableDecreeId): TableActionResult {
    if (this.state.phase !== 'choosingStart') {
      return refuse(
        this.state,
        'tableLoop.reject.notChoosing',
        'The opening choice has already been made.'
      )
    }
    if (!this.state.starterChoices.includes(id)) {
      return refuse(
        this.state,
        'tableLoop.reject.notOffered',
        'That Decree was not offered.'
      )
    }

    const withDecree: TableLoopState = {
      ...this.state,
      ownedDecrees: [id],
      starterChoices: [],
    }
    this.state = TableLoopEngine.beginRound(withDecree, 0)
    return { success: true, state: this.state }
  }

  // ---------------------------------------------------------------------------
  // ROUND LIFECYCLE
  // ---------------------------------------------------------------------------

  /**
   * Clear the table, rebuild the wall from the run's collection, and deal.
   *
   * Round-local state — claimed milestones, standing multiplier, river, table
   * — is reset explicitly here rather than being left for a caller to
   * remember.
   */
  private static beginRound(
    state: TableLoopState,
    roundIndex: number
  ): TableLoopState {
    const round = TABLE_ROUNDS[roundIndex]
    const random = createRandom(state.seed + roundIndex * 7919)
    const wall = shuffle(state.collection, random)
    const rack = wall.slice(0, RACK_SIZE)
    const draftRow = state.draftEnabled
      ? wall.slice(RACK_SIZE, RACK_SIZE + DRAFT_ROW_SIZE)
      : []
    const owned = new Set(state.ownedDecrees)

    return {
      ...state,
      phase: 'playing',
      roundIndex,
      round,
      score: 0,
      placementActionsRemaining: round.placementActions,
      redrawsRemaining: Math.max(
        0,
        round.redraws - (owned.has('jade_ledger') ? 1 : 0)
      ),
      rack,
      wall: wall.slice(RACK_SIZE + draftRow.length),
      draftRow,
      pendingDraftPick: false,
      slots: createEmptySlots(),
      river: [],
      claimedMilestones: [],
      tableMult: 0,
      tableCompleted: false,
      riverRecoveriesRemaining: owned.has('river_merchant') ? 1 : 0,
      lastResolution: [],
      lastError: null,
      lastErrorKey: null,
    }
  }

  /**
   * End the round and settle it against the target.
   *
   * `reason` distinguishes the three ways a round stops so the UI can say which
   * one happened instead of inferring it from the numbers.
   */
  private static settleRound(
    state: TableLoopState,
    reason: 'target' | 'completed' | 'exhausted'
  ): TableLoopState {
    const cleared = state.score >= state.round.target
    const runScore = state.runScore + state.score

    if (!cleared) {
      return { ...state, phase: 'runFailed', runScore }
    }

    const reward = clearReward(state)
    const isLastRound = state.roundIndex >= TABLE_ROUNDS.length - 1
    const summary: CausalStage[] = [
      {
        kind: 'total',
        label:
          reason === 'completed'
            ? 'Table finished'
            : reason === 'target'
              ? 'Round secured'
              : 'Resources spent',
        labelKey: `tableLoop.roundEnd.${reason}`,
        points: state.score,
      },
    ]

    return {
      ...state,
      phase: isLastRound ? 'runComplete' : 'roundCleared',
      runScore,
      gold: state.gold + reward,
      lastResolution: summary,
    }
  }

  /**
   * Stop the round when nothing further can be done.
   *
   * A round is over when the placement budget is gone, when the table is full,
   * or when no rack group fits an open slot and no redraw or river recovery
   * could change that.
   */
  private static endIfResourcesSpent(state: TableLoopState): TableLoopState {
    if (state.phase !== 'playing') return state
    if (state.placementActionsRemaining <= 0) {
      return TableLoopEngine.settleRound(state, 'exhausted')
    }
    if (hasLegalPlacement(state.rack, state.slots)) return state
    // An unclaimed offer is still a tile the rack has not seen.
    if (state.pendingDraftPick) return state
    // A recovery exchange can still change the rack while an action remains.
    if (state.wall.length > 0) return state
    if (state.riverRecoveriesRemaining > 0 && state.river.length > 0) return state
    return TableLoopEngine.settleRound(state, 'exhausted')
  }

  /**
   * Draw back up to the rack size while the wall lasts.
   *
   * `reserve` holds back that many slots so a draft offer can fill them (E06).
   */
  private static refillRack(
    state: TableLoopState,
    reserve: number = 0
  ): TableLoopState {
    const needed = Math.max(0, RACK_SIZE - reserve - state.rack.length)
    if (needed === 0 || state.wall.length === 0) return state
    const drawn = state.wall.slice(0, needed)
    return {
      ...state,
      rack: [...state.rack, ...drawn],
      wall: state.wall.slice(drawn.length),
    }
  }

  /**
   * Fill an unclaimed draft slot from the wall.
   *
   * Called before any other action so a forgotten offer never stalls the round,
   * and so the rack a placement is validated against is the real one.
   */
  private static resolvePendingDraft(state: TableLoopState): TableLoopState {
    if (!state.pendingDraftPick) return state
    return TableLoopEngine.refillRack({ ...state, pendingDraftPick: false })
  }

  // ---------------------------------------------------------------------------
  // PLACEMENT
  // ---------------------------------------------------------------------------

  /**
   * Forecast a placement without spending anything.
   *
   * Runs the committed pipeline against a projected table, so the number shown
   * is the number that will land.
   */
  previewPlacement(
    tileIds: readonly string[],
    slotIndex: number
  ): PlacementScore | null {
    const occupied = this.state.slots[slotIndex]?.group != null
    const projected = this.project(tileIds, slotIndex, { allowOccupied: occupied })
    return projected ? projected.score : null
  }

  /**
   * Build the post-placement table and score it, or return null when the
   * placement is illegal. Shared by `previewPlacement` and `place`.
   */
  private project(
    tileIds: readonly string[],
    slotIndex: number,
    options: { readonly allowOccupied?: boolean } = {}
  ): {
    readonly tiles: Tile[]
    readonly slots: TableSlot[]
    readonly group: PlacedGroup
    readonly displaced: readonly Tile[]
    readonly score: PlacementScore
  } | null {
    const state = this.state
    const slot = state.slots[slotIndex]
    if (!slot) return null
    if (slot.group !== null && !options.allowOccupied) return null
    if (slot.group === null && options.allowOccupied) return null

    const tiles = tileIds
      .map((id) => state.rack.find((tile) => tile.id === id))
      .filter((tile): tile is Tile => tile !== undefined)
    if (tiles.length !== tileIds.length) return null

    const classification = classifyGroup(tiles)
    if (!classification.ok) return null
    if (!slotAccepts(slot.kind, classification.type)) return null

    const group: PlacedGroup = {
      type: classification.type,
      tiles,
      placementOrder: nextPlacementOrder(state.slots),
    }
    const displaced = slot.group ? [...slot.group.tiles] : []
    const slots = state.slots.map((candidate) =>
      candidate.index === slotIndex ? { ...candidate, group } : candidate
    )

    const score = scorePlacement(group, {
      slots,
      slotIndex,
      ownedDecrees: state.ownedDecrees,
      tableMult: state.tableMult,
      claimedMilestones: state.claimedMilestones,
      bossRule: state.round.bossRule,
      completionAlreadyPaid: state.tableCompleted,
    })

    return { tiles, slots, group, displaced, score }
  }

  /** Commit a group from the rack into an empty compatible slot. */
  place(tileIds: readonly string[], slotIndex: number): TableActionResult {
    return this.commit(tileIds, slotIndex, false)
  }

  /**
   * Replace an occupied slot with another group of the same slot kind.
   *
   * Costs a placement action like an ordinary placement, and the displaced
   * tiles go to the river. Milestones already claimed stay claimed.
   */
  revise(tileIds: readonly string[], slotIndex: number): TableActionResult {
    return this.commit(tileIds, slotIndex, true)
  }

  private commit(
    tileIds: readonly string[],
    slotIndex: number,
    isRevision: boolean
  ): TableActionResult {
    // A forgotten draft offer resolves from the wall, so the rack this
    // placement is checked against is the rack the player can actually see.
    this.state = TableLoopEngine.resolvePendingDraft(this.state)
    const state = this.state
    if (state.phase !== 'playing') {
      return refuse(state, 'tableLoop.reject.notPlaying', 'The round is over.')
    }
    if (state.placementActionsRemaining <= 0) {
      return refuse(
        state,
        'tableLoop.reject.noActions',
        'No placement actions remain.'
      )
    }

    const slot = state.slots[slotIndex]
    if (!slot) {
      return refuse(state, 'tableLoop.reject.noSlot', 'That slot does not exist.')
    }
    if (!isRevision && slot.group !== null) {
      return refuse(
        state,
        'tableLoop.reject.slotTaken',
        'That slot already holds a group.'
      )
    }
    if (isRevision && slot.group === null) {
      return refuse(
        state,
        'tableLoop.reject.slotEmpty',
        'There is nothing in that slot to revise.'
      )
    }

    const tiles = tileIds
      .map((id) => state.rack.find((tile) => tile.id === id))
      .filter((tile): tile is Tile => tile !== undefined)
    if (tiles.length !== tileIds.length) {
      return refuse(
        state,
        'tableLoop.reject.notInRack',
        'Those tiles are not in your rack.'
      )
    }

    const classification = classifyGroup(tiles)
    if (!classification.ok) {
      return refuse(
        state,
        classification.rejection.key,
        classification.rejection.text
      )
    }
    if (!slotAccepts(slot.kind, classification.type)) {
      return refuse(
        state,
        slot.kind === 'pair'
          ? 'tableLoop.reject.pairSlotOnly'
          : 'tableLoop.reject.meldSlotOnly',
        slot.kind === 'pair'
          ? 'The pair slot only takes a pair.'
          : 'A meld slot takes a sequence, triplet or quad.'
      )
    }

    const projected = this.project(tileIds, slotIndex, {
      allowOccupied: isRevision,
    })
    if (!projected) {
      return refuse(
        state,
        'tableLoop.reject.illegalPlacement',
        'That group cannot go there.'
      )
    }

    const usedIds = new Set(tileIds)
    const earnedMult = multFromMilestones(projected.score.claimedMilestones)
    const completed = isTableComplete(projected.slots)

    let next: TableLoopState = {
      ...state,
      rack: state.rack.filter((tile) => !usedIds.has(tile.id)),
      slots: projected.slots,
      river: [...state.river, ...projected.displaced],
      score: state.score + projected.score.total,
      gold: state.gold + projected.score.gold,
      placementActionsRemaining: state.placementActionsRemaining - 1,
      claimedMilestones: [
        ...state.claimedMilestones,
        ...projected.score.claimedMilestones,
      ],
      tableMult: state.tableMult + earnedMult,
      tableCompleted: state.tableCompleted || completed,
      lastResolution: projected.score.stages,
      lastError: null,
      lastErrorKey: null,
    }

    // With the draft row on, one of this placement's replacements is the
    // player's to choose (E06); the rest come from the wall. The offer only
    // stands if the refill actually left a slot for it.
    const offersDraft = next.draftEnabled && next.draftRow.length > 0
    next = TableLoopEngine.refillRack(next, offersDraft ? 1 : 0)
    next = {
      ...next,
      pendingDraftPick: offersDraft && next.rack.length < RACK_SIZE,
    }

    // Finishing the table is a scoring route that ends the round, not a
    // separate confirmation step.
    next = completed && !state.tableCompleted
      ? TableLoopEngine.settleRound(next, 'completed')
      : TableLoopEngine.endIfResourcesSpent(next)

    this.state = next
    return { success: true, state: next, score: projected.score }
  }

  // ---------------------------------------------------------------------------
  // RACK MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Exchange one to three rack tiles for fresh draws.
   *
   * Ordinarily this costs one exchange allowance. When those are gone it
   * becomes a recovery play that costs a placement action instead — the spare
   * action the prototype rules set aside for exactly this. Without it a rack
   * that cannot form a group for the remaining slots simply ends the round with
   * actions still on the table, which reads as an arbitrary stop rather than a
   * decision.
   */
  redraw(tileIds: readonly string[]): TableActionResult {
    this.state = TableLoopEngine.resolvePendingDraft(this.state)
    const state = this.state
    if (state.phase !== 'playing') {
      return refuse(state, 'tableLoop.reject.notPlaying', 'The round is over.')
    }
    const usesAction = state.redrawsRemaining <= 0
    if (usesAction && state.placementActionsRemaining <= 0) {
      return refuse(state, 'tableLoop.reject.noRedraws', 'No exchanges remain.')
    }
    if (tileIds.length === 0 || tileIds.length > MAX_REDRAW_TILES) {
      return refuse(
        state,
        'tableLoop.reject.redrawSize',
        `Exchange one to ${MAX_REDRAW_TILES} tiles.`
      )
    }
    if (state.wall.length === 0) {
      return refuse(state, 'tableLoop.reject.wallEmpty', 'The wall is empty.')
    }

    const unique = new Set(tileIds)
    const removed = state.rack.filter((tile) => unique.has(tile.id))
    if (removed.length !== unique.size) {
      return refuse(
        state,
        'tableLoop.reject.notInRack',
        'Those tiles are not in your rack.'
      )
    }

    let next: TableLoopState = {
      ...state,
      rack: state.rack.filter((tile) => !unique.has(tile.id)),
      river: [...state.river, ...removed],
      redrawsRemaining: usesAction
        ? state.redrawsRemaining
        : state.redrawsRemaining - 1,
      placementActionsRemaining: usesAction
        ? state.placementActionsRemaining - 1
        : state.placementActionsRemaining,
      lastError: null,
      lastErrorKey: null,
    }
    next = TableLoopEngine.refillRack(next)
    next = TableLoopEngine.endIfResourcesSpent(next)

    this.state = next
    return { success: true, state: next }
  }

  /**
   * Take one tile back out of the river (Whispering Merchant).
   *
   * Costs no placement action, but the recovery allowance is once per round and
   * the rack must have space, so a discard is still a real commitment.
   */
  recoverFromRiver(tileId: string): TableActionResult {
    this.state = TableLoopEngine.resolvePendingDraft(this.state)
    const state = this.state
    if (state.phase !== 'playing') {
      return refuse(state, 'tableLoop.reject.notPlaying', 'The round is over.')
    }
    if (state.riverRecoveriesRemaining <= 0) {
      return refuse(
        state,
        'tableLoop.reject.noRecoveries',
        'No river recoveries remain this round.'
      )
    }
    if (state.rack.length >= RACK_SIZE) {
      return refuse(
        state,
        'tableLoop.reject.rackFull',
        'Your rack is full; place or exchange first.'
      )
    }
    const index = state.river.findIndex((tile) => tile.id === tileId)
    if (index === -1) {
      return refuse(
        state,
        'tableLoop.reject.notInRiver',
        'That tile is not in the river.'
      )
    }

    const tile = state.river[index]
    const next: TableLoopState = {
      ...state,
      rack: [...state.rack, tile],
      river: state.river.filter((_, i) => i !== index),
      riverRecoveriesRemaining: state.riverRecoveriesRemaining - 1,
      lastError: null,
      lastErrorKey: null,
    }
    this.state = next
    return { success: true, state: next }
  }

  // ---------------------------------------------------------------------------
  // DRAFT ROW (E06)
  // ---------------------------------------------------------------------------

  /**
   * Take one face-up offer into the rack.
   *
   * Only the claimed offer is replaced, so the two the player passed on stay
   * where they are and remain a visible plan for the next placement.
   */
  claimDraft(tileId: string): TableActionResult {
    const state = this.state
    if (state.phase !== 'playing') {
      return refuse(state, 'tableLoop.reject.notPlaying', 'The round is over.')
    }
    if (!state.pendingDraftPick) {
      return refuse(
        state,
        'tableLoop.reject.noDraftPick',
        'Place a group to earn a pick from the offers.'
      )
    }
    const index = state.draftRow.findIndex((tile) => tile.id === tileId)
    if (index === -1) {
      return refuse(
        state,
        'tableLoop.reject.notInDraft',
        'That tile is not one of the offers.'
      )
    }

    const claimed = state.draftRow[index]
    const replacement = state.wall.slice(0, 1)
    const next: TableLoopState = {
      ...state,
      rack: [...state.rack, claimed],
      draftRow: [
        ...state.draftRow.slice(0, index),
        ...replacement,
        ...state.draftRow.slice(index + 1),
      ],
      wall: state.wall.slice(replacement.length),
      pendingDraftPick: false,
      lastError: null,
      lastErrorKey: null,
    }

    this.state = TableLoopEngine.endIfResourcesSpent(next)
    return { success: true, state: this.state }
  }

  /** Decline the offers and take the replacement off the wall instead. */
  passDraft(): TableActionResult {
    const state = this.state
    if (!state.pendingDraftPick) {
      return refuse(
        state,
        'tableLoop.reject.noDraftPick',
        'There is no offer waiting.'
      )
    }
    const next = TableLoopEngine.resolvePendingDraft({
      ...state,
      lastError: null,
      lastErrorKey: null,
    })
    this.state = TableLoopEngine.endIfResourcesSpent(next)
    return { success: true, state: this.state }
  }

  // ---------------------------------------------------------------------------
  // ROUND RESOLUTION
  // ---------------------------------------------------------------------------

  /**
   * True when the next exchange would be paid for with a placement action
   * rather than an exchange allowance.
   */
  exchangeCostsAction(): boolean {
    return this.state.redrawsRemaining <= 0
  }

  /** True once the player may secure the clear without finishing the table. */
  canFinish(): boolean {
    return (
      this.state.phase === 'playing' &&
      this.state.score >= this.state.round.target
    )
  }

  /** Bank the round at the target instead of chasing the completion bonus. */
  finishRound(): TableActionResult {
    if (!this.canFinish()) {
      return refuse(
        this.state,
        'tableLoop.reject.targetNotMet',
        'Reach the target before finishing the round.'
      )
    }
    this.state = TableLoopEngine.settleRound(this.state, 'target')
    return { success: true, state: this.state }
  }

  // ---------------------------------------------------------------------------
  // SHOP (E04)
  // ---------------------------------------------------------------------------

  /**
   * Open the shop between rounds with three offers the player does not own.
   *
   * The pool is small on purpose: every offer should change which draw the
   * player hopes for, and two directions should stay open.
   */
  openShop(): TableActionResult {
    const state = this.state
    if (state.phase !== 'roundCleared') {
      return refuse(
        state,
        'tableLoop.reject.notBetweenRounds',
        'The shop opens between rounds.'
      )
    }
    const owned = new Set(state.ownedDecrees)
    const random = createRandom(state.seed + 104729 * (state.roundIndex + 1))
    const offers = shuffle(
      TABLE_DECREES.filter((decree) => !owned.has(decree.id)).map((d) => d.id),
      random
    ).slice(0, OFFER_COUNT)

    this.state = { ...state, phase: 'shop', shopOffers: offers }
    return { success: true, state: this.state }
  }

  buyDecree(id: TableDecreeId): TableActionResult {
    const state = this.state
    if (state.phase !== 'shop') {
      return refuse(state, 'tableLoop.reject.shopClosed', 'The shop is closed.')
    }
    if (!state.shopOffers.includes(id)) {
      return refuse(
        state,
        'tableLoop.reject.notOffered',
        'That Decree is not on offer.'
      )
    }
    const definition = getTableDecree(id)
    if (state.gold < definition.cost) {
      return refuse(
        state,
        'tableLoop.reject.tooExpensive',
        'You cannot afford that.'
      )
    }

    this.state = {
      ...state,
      gold: state.gold - definition.cost,
      ownedDecrees: [...state.ownedDecrees, id],
      shopOffers: state.shopOffers.filter((offer) => offer !== id),
      lastError: null,
      lastErrorKey: null,
    }
    return { success: true, state: this.state }
  }

  /** Leave the shop and deal the next round. */
  nextRound(): TableActionResult {
    const state = this.state
    if (state.phase !== 'shop' && state.phase !== 'roundCleared') {
      return refuse(
        state,
        'tableLoop.reject.notBetweenRounds',
        'There is no round waiting.'
      )
    }
    const nextIndex = state.roundIndex + 1
    if (nextIndex >= TABLE_ROUNDS.length) {
      this.state = { ...state, phase: 'runComplete' }
      return { success: true, state: this.state }
    }
    this.state = TableLoopEngine.beginRound({ ...state, shopOffers: [] }, nextIndex)
    return { success: true, state: this.state }
  }

  /** Start over from the opening choice, keeping nothing. */
  restart(
    seed: number = Date.now(),
    draftEnabled: boolean = this.state.draftEnabled
  ): TableActionResult {
    this.state = TableLoopEngine.createRun(seed, draftEnabled)
    return { success: true, state: this.state }
  }
}

// =============================================================================
// STATE QUERIES
// =============================================================================

/** Slot indices that would accept the given selection right now. */
export function placeableSlots(
  state: TableLoopState,
  tiles: readonly Tile[]
): number[] {
  const classification = classifyGroup(tiles)
  if (!classification.ok) return []
  return state.slots
    .filter((slot) => slot.group === null && slotAccepts(slot.kind, classification.type))
    .map((slot) => slot.index)
}

/** Slot indices whose current group could be replaced by the selection. */
export function revisableSlots(
  state: TableLoopState,
  tiles: readonly Tile[]
): number[] {
  const classification = classifyGroup(tiles)
  if (!classification.ok) return []
  return state.slots
    .filter((slot) => slot.group !== null && slotAccepts(slot.kind, classification.type))
    .map((slot) => slot.index)
}

/**
 * Every tile the run is tracking, for the conservation invariant.
 *
 * A physical tile must appear exactly once. The test suite asserts this after
 * every action, because a duplicated tile is the failure mode that would make
 * the whole loop untrustworthy.
 */
export function allTrackedTileIds(state: TableLoopState): string[] {
  return [
    ...state.wall.map((tile) => tile.id),
    ...state.rack.map((tile) => tile.id),
    ...state.draftRow.map((tile) => tile.id),
    ...state.river.map((tile) => tile.id),
    ...state.slots.flatMap((slot) => slot.group?.tiles.map((tile) => tile.id) ?? []),
  ]
}
