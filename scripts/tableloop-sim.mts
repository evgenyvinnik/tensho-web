/**
 * Table Loop target tuning.
 *
 * The experiments document is explicit that the persistent-table loop needs its
 * own targets and that keeping the classic curve would be arbitrary. This
 * script plays many seeded runs with a greedy policy and reports what a
 * competent-but-not-clever player actually scores, so the numbers in
 * `src/tableloop/content.ts` can be argued for.
 *
 * It is a measurement tool, not a claim about enjoyment.
 *
 *   bun scripts/tableloop-sim.mts [runs] [--draft]
 *
 * `--draft` turns on the E06 offers row so the variant can be compared against
 * the base loop, which is what Phase C of the plan asks for.
 */

import { TableLoopEngine } from '../src/tableloop/TableLoopEngine.ts'
import { enumerateRackGroups } from '../src/tableloop/groupRules.ts'
import { TABLE_DECREES, TABLE_ROUNDS } from '../src/tableloop/content.ts'
import type { TableLoopState } from '../src/tableloop/types.ts'

const ARGS = process.argv.slice(2)
const DRAFT = ARGS.includes('--draft')
const RUNS = Number(ARGS.find((arg) => !arg.startsWith('--')) ?? 400)

/** Best empty-slot placement the rack offers, by forecast total. */
function bestPlacement(engine: TableLoopEngine) {
  const state = engine.getState()
  let best: { tileIds: string[]; slot: number; total: number } | null = null

  for (const group of enumerateRackGroups(state.rack)) {
    const tileIds = group.map((tile) => tile.id)
    for (const slot of state.slots) {
      if (slot.group !== null) continue
      const forecast = engine.previewPlacement(tileIds, slot.index)
      if (!forecast) continue
      if (!best || forecast.total > best.total) {
        best = { tileIds, slot: slot.index, total: forecast.total }
      }
    }
  }
  return best
}

/** Tiles with no rank neighbour and no duplicate in the rack. */
function looseTiles(state: TableLoopState): string[] {
  const scored = state.rack.map((tile) => {
    const friends = state.rack.filter(
      (other) =>
        other.id !== tile.id &&
        other.suit === tile.suit &&
        Math.abs(other.rank - tile.rank) <= (tile.isSuited ? 2 : 0)
    ).length
    return { id: tile.id, friends }
  })
  return scored
    .sort((left, right) => left.friends - right.friends)
    .slice(0, 3)
    .map((entry) => entry.id)
}

interface RoundOutcome {
  round: number
  score: number
  cleared: boolean
  placements: number
  completed: boolean
  /** Placement actions still unspent when the round stopped. */
  actionsLeft: number
  redrawsLeft: number
  exchanges: number
}

/** With the offers row on, take the tile that most improves the rack. */
function bestOffer(engine: TableLoopEngine): string | null {
  const state = engine.getState()
  if (!state.pendingDraftPick) return null

  let best: { id: string; groups: number } | null = null
  for (const offer of state.draftRow) {
    const groups = enumerateRackGroups([...state.rack, offer]).length
    if (!best || groups > best.groups) best = { id: offer.id, groups }
  }
  const baseline = enumerateRackGroups(state.rack).length
  return best && best.groups > baseline ? best.id : null
}

function playRun(seed: number): RoundOutcome[] {
  const engine = new TableLoopEngine(seed, { draftEnabled: DRAFT })
  const start = engine.getState().starterChoices[seed % 3]
  engine.chooseStarter(start)

  const outcomes: RoundOutcome[] = []
  let placements = 0
  let exchanges = 0
  let lastPlaying = engine.getState()

  for (let guard = 0; guard < 400; guard += 1) {
    const state = engine.getState()

    if (state.phase === 'playing') {
      lastPlaying = state

      if (state.pendingDraftPick) {
        const offer = bestOffer(engine)
        if (offer) engine.claimDraft(offer)
        else engine.passDraft()
        continue
      }

      const placement = bestPlacement(engine)
      if (placement) {
        engine.place(placement.tileIds, placement.slot)
        placements += 1
        continue
      }
      const exchanged = engine.redraw(looseTiles(state))
      if (!exchanged.success) break
      exchanges += 1
      continue
    }

    if (state.phase === 'roundCleared' || state.phase === 'runComplete' || state.phase === 'runFailed') {
      outcomes.push({
        round: state.roundIndex,
        score: state.score,
        cleared: state.score >= state.round.target,
        placements,
        completed: state.tableCompleted,
        actionsLeft: lastPlaying.placementActionsRemaining,
        redrawsLeft: lastPlaying.redrawsRemaining,
        exchanges,
      })
      placements = 0
      exchanges = 0
    }

    if (state.phase === 'runComplete' || state.phase === 'runFailed') break

    if (state.phase === 'roundCleared') {
      engine.openShop()
      continue
    }

    if (state.phase === 'shop') {
      // Buy the cheapest affordable offer, then move on.
      const affordable = engine
        .getState()
        .shopOffers.map((id) => TABLE_DECREES.find((decree) => decree.id === id)!)
        .filter((decree) => decree.cost <= engine.getState().gold)
        .sort((a, b) => a.cost - b.cost)[0]
      if (affordable) engine.buyDecree(affordable.id)
      engine.nextRound()
      continue
    }

    break
  }

  return outcomes
}

function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.floor(q * sorted.length))
  return sorted[index] ?? 0
}

const byRound = new Map<number, RoundOutcome[]>()
for (let seed = 1; seed <= RUNS; seed += 1) {
  for (const outcome of playRun(seed)) {
    const bucket = byRound.get(outcome.round) ?? []
    bucket.push(outcome)
    byRound.set(outcome.round, bucket)
  }
}

console.log(
  `Table Loop simulation — ${RUNS} runs, greedy policy${DRAFT ? ', offers row on' : ''}\n`
)
for (const round of TABLE_ROUNDS) {
  const outcomes = byRound.get(round.index) ?? []
  if (outcomes.length === 0) {
    console.log(`Round ${round.index + 1} (${round.name}): never reached`)
    continue
  }
  const scores = outcomes.map((outcome) => outcome.score)
  const cleared = outcomes.filter((outcome) => outcome.cleared).length
  const completed = outcomes.filter((outcome) => outcome.completed).length
  const placements =
    outcomes.reduce((sum, outcome) => sum + outcome.placements, 0) / outcomes.length

  console.log(
    [
      `Round ${round.index + 1} (${round.name}) target ${round.target}`,
      `  reached by ${outcomes.length} runs`,
      `  score  p10 ${quantile(scores, 0.1)}  median ${quantile(scores, 0.5)}  p90 ${quantile(scores, 0.9)}`,
      `  cleared ${((cleared / outcomes.length) * 100).toFixed(0)}%   table finished ${((completed / outcomes.length) * 100).toFixed(0)}%`,
      `  placements per round ${placements.toFixed(1)}   exchanges ${(outcomes.reduce((sum, o) => sum + o.exchanges, 0) / outcomes.length).toFixed(1)}`,
      `  unspent at stop: actions ${(outcomes.reduce((sum, o) => sum + o.actionsLeft, 0) / outcomes.length).toFixed(1)}  exchanges ${(outcomes.reduce((sum, o) => sum + o.redrawsLeft, 0) / outcomes.length).toFixed(1)}`,
    ].join('\n')
  )
}
