/**
 * Measurements for two of the open design decisions in section 10 of
 * `docs/GAMEPLAY_EXPERIMENTS.md`.
 *
 *   Q4  Should table revision be available to everyone or become a Decree
 *       identity?
 *   Q6  Does keeping the pair until the end create satisfying anticipation, or
 *       an obvious mandatory order?
 *
 * It also compares the three opening Decrees under one policy, because section
 * 8 asks whether upgrades change play and prefers a few distinct builds over
 * many weakly differentiated ones.
 *
 * Both are answered by running the same seeds under policies that differ in
 * exactly one habit and comparing what they score. A policy is not a player:
 * these say whether a habit is *forced*, not whether it is enjoyable.
 *
 *   bun scripts/tableloop-questions.mts [runs]
 */

import { TableLoopEngine } from '../src/tableloop/TableLoopEngine.ts'
import { enumerateRackGroups } from '../src/tableloop/groupRules.ts'
import { MeldType } from '../src/core/Meld.ts'
import { PAIR_SLOT_INDEX, type TableDecreeId, type TableLoopState } from '../src/tableloop/types.ts'

const RUNS = Number(process.argv[2] ?? 300)

interface Move {
  tileIds: string[]
  slot: number
  /** Whether the group being placed is a triplet or quad. */
  isSet: boolean
  total: number
  /** Standing multiplier this move would give up. */
  multLost: number
  /**
   * What the move is worth once the forfeited multiplier is priced in. The
   * exchange rate is a stated heuristic, not a derived truth: one point of
   * standing multiplier is treated as worth about one more placement.
   */
  value: number
  isRevision: boolean
  isPair: boolean
}

/** Rough worth of one point of standing multiplier, in points. */
const MULT_WORTH = 120

/** Every placement and revision the rack currently allows, priced. */
function legalMoves(engine: TableLoopEngine): Move[] {
  const state = engine.getState()
  const moves: Move[] = []

  for (const group of enumerateRackGroups(state.rack)) {
    const tileIds = group.map((tile) => tile.id)
    const identical = group.every(
      (tile) => tile.suit === group[0].suit && tile.rank === group[0].rank
    )
    for (const slot of state.slots) {
      const forecast = engine.previewPlacement(tileIds, slot.index)
      if (!forecast) continue
      moves.push({
        tileIds,
        slot: slot.index,
        total: forecast.total,
        isSet: identical && group.length >= 3,
        multLost: forecast.multLost,
        value: forecast.total - forecast.multLost * MULT_WORTH,
        isRevision: slot.group !== null,
        isPair: slot.index === PAIR_SLOT_INDEX,
      })
    }
  }
  return moves
}

function looseTiles(state: TableLoopState): string[] {
  return [...state.rack]
    .map((tile) => ({
      id: tile.id,
      friends: state.rack.filter(
        (other) =>
          other.id !== tile.id &&
          other.suit === tile.suit &&
          Math.abs(other.rank - tile.rank) <= (tile.isSuited ? 2 : 0)
      ).length,
    }))
    .sort((left, right) => left.friends - right.friends)
    .slice(0, 3)
    .map((entry) => entry.id)
}

interface Policy {
  readonly name: string
  /** Filter and rank the moves this policy is willing to make. */
  readonly choose: (moves: Move[], state: TableLoopState) => Move | null
}

const byValue = (moves: Move[]): Move | null =>
  moves.length === 0
    ? null
    : moves.reduce((best, move) => (move.value > best.value ? move : best))

/** The baseline: best empty-slot placement, never revise. */
const PLACE_ONLY: Policy = {
  name: 'place only',
  choose: (moves) => byValue(moves.filter((move) => !move.isRevision)),
}

/** Also willing to replace a committed group when it pays clearly better. */
const WITH_REVISION: Policy = {
  name: 'place or revise',
  choose: (moves) => {
    const placements = moves.filter((move) => !move.isRevision)
    const best = byValue(placements)
    const revision = byValue(moves.filter((move) => move.isRevision))
    if (!revision) return best
    // Revising costs the same action but destroys a group, so it needs a
    // margin rather than a tie — and it is only taken at all when it is still
    // worth something after the forfeited multiplier is priced in.
    if (revision.value <= 0) return best
    if (!best || revision.value > best.value * 1.25) return revision
    return best
  },
}

/**
 * Looks one placement ahead for a neighbour bonus.
 *
 * The greedy policies cannot measure a Decree that rewards placement order:
 * they will happily place *beside* a lit slot, because the forecast already
 * includes that, but they will never place a set early in a middle slot to
 * create one. Without this, such a Decree measures as weak no matter what its
 * trigger or reward is — a limit of the instrument, not a finding about the
 * design.
 */
const PLANS_AHEAD: Policy = {
  name: 'plans a neighbour bonus',
  choose: (moves, state) => {
    const open = moves.filter((move) => !move.isRevision)
    const best = byValue(open)
    if (!best) return byValue(moves)

    // Among moves worth nearly as much, prefer laying a set where a later
    // group can sit beside it.
    const nearBest = open.filter((move) => move.value >= best.value * 0.85)
    const setups = nearBest.filter(
      (move) =>
        move.isSet &&
        [move.slot - 1, move.slot + 1].some(
          (neighbour) =>
            neighbour >= 0 &&
            neighbour <= PAIR_SLOT_INDEX &&
            state.slots[neighbour]?.group === null
        )
    )
    return byValue(setups) ?? best
  },
}

/** Commit the pair the moment one is available. */
const PAIR_FIRST: Policy = {
  name: 'pair first',
  choose: (moves) => {
    const open = moves.filter((move) => !move.isRevision)
    const pair = byValue(open.filter((move) => move.isPair))
    return pair ?? byValue(open)
  },
}

/** Hold the pair back until every meld slot is filled. */
const PAIR_LAST: Policy = {
  name: 'pair last',
  choose: (moves, state) => {
    const open = moves.filter((move) => !move.isRevision)
    const meldSlotsOpen = state.slots.some(
      (slot) => slot.index !== PAIR_SLOT_INDEX && slot.group === null
    )
    const allowed = meldSlotsOpen ? open.filter((move) => !move.isPair) : open
    return byValue(allowed) ?? byValue(open)
  },
}

interface RunResult {
  roundsCleared: number
  runScore: number
  revisions: number
  /** Revisions taken while an ordinary placement was also available. */
  revisionsByChoice: number
  placements: number
}

function playRun(
  seed: number,
  policy: Policy,
  starter: TableDecreeId | null
): RunResult {
  const engine = new TableLoopEngine(seed)
  const choices = engine.getState().starterChoices
  engine.chooseStarter(starter ?? choices[seed % choices.length])

  let roundsCleared = 0
  let revisions = 0
  let revisionsByChoice = 0
  let placements = 0

  for (let guard = 0; guard < 400; guard += 1) {
    const state = engine.getState()

    if (state.phase === 'playing') {
      const moves = legalMoves(engine)
      const move = policy.choose(moves, state)
      if (move) {
        if (move.isRevision) {
          if (moves.some((candidate) => !candidate.isRevision)) {
            revisionsByChoice += 1
          }
          engine.revise(move.tileIds, move.slot)
          revisions += 1
        } else {
          engine.place(move.tileIds, move.slot)
        }
        placements += 1
        continue
      }
      if (!engine.redraw(looseTiles(state)).success) break
      continue
    }

    if (state.phase === 'roundCleared') {
      roundsCleared += 1
      engine.nextRound()
      continue
    }
    if (state.phase === 'runComplete') {
      roundsCleared += 1
      break
    }
    if (state.phase === 'runFailed') break
    break
  }

  return {
    roundsCleared,
    runScore: engine.getState().runScore,
    revisions,
    revisionsByChoice,
    placements,
  }
}

function summarise(
  label: string,
  policy: Policy,
  starter: TableDecreeId | null
): void {
  const results: RunResult[] = []
  for (let seed = 1; seed <= RUNS; seed += 1) {
    results.push(playRun(seed, policy, starter))
  }

  const cleared = results.reduce((sum, run) => sum + run.roundsCleared, 0)
  const finished = results.filter((run) => run.roundsCleared >= 3).length
  const scores = results.map((run) => run.runScore).sort((a, b) => a - b)
  const revisions = results.reduce((sum, run) => sum + run.revisions, 0)
  const byChoice = results.reduce((sum, run) => sum + run.revisionsByChoice, 0)
  const placements = results.reduce((sum, run) => sum + run.placements, 0)

  console.log(
    [
      `  ${label.padEnd(30, ' ')}`,
      `rounds cleared/run ${(cleared / results.length).toFixed(2)}`,
      `full runs ${((finished / results.length) * 100).toFixed(0)}%`,
      `median run score ${scores[Math.floor(scores.length / 2)]}`,
      revisions > 0
        ? `revisions ${((revisions / placements) * 100).toFixed(1)}% of actions`
        : '',
      revisions > 0
        ? `of those, ${((byChoice / revisions) * 100).toFixed(1)}% had an alternative`
        : '',
    ]
      .filter(Boolean)
      .join('  ·  ')
  )
}

console.log(`Section 10 measurements — ${RUNS} seeds each\n`)

console.log('Q4  Should revision be available to everyone?')
summarise('never revises', PLACE_ONLY, null)
summarise('revises when clearly better', WITH_REVISION, null)

console.log('\nQ6  Does holding the pair back create a mandatory order?')
for (const [label, starter] of [
  ['no relevant Decree', 'echoing_bamboo'],
  ['with Patient Pair', 'patient_pair'],
] as const) {
  console.log(`  ${label}:`)
  summarise('  places the pair first', PAIR_FIRST, starter)
  summarise('  holds the pair back', PAIR_LAST, starter)
}

console.log('\nThe three opening Decrees, under one policy')
for (const starter of [
  'echoing_bamboo',
  'patient_pair',
  'watch_fire',
] as const) {
  summarise(starter, WITH_REVISION, starter)
}

console.log('\nThe same three, given a policy that plans one placement ahead')
for (const starter of [
  'echoing_bamboo',
  'patient_pair',
  'watch_fire',
] as const) {
  summarise(starter, PLANS_AHEAD, starter)
}

console.log(
  '\nA policy is not a player. These say whether a habit is forced, not whether\n' +
    'it is enjoyable.'
)
