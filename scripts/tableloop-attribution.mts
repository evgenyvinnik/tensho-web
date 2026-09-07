/**
 * Where a round's score actually comes from.
 *
 * Three of the open design decisions in section 10 are the same question asked
 * from different sides:
 *
 *   Q2  Should patterns pay fixed points, an additive multiplier, a
 *       multiplicative bonus, or a deliberately small combination?
 *   Q3  How large must shape rewards be before recognition feels valuable
 *       while loose-tile strategies remain possible?
 *   Q7  Is the completing-table reward exciting enough without making all
 *       partial progress irrelevant?
 *
 * The causal chain built for E05 already carries the answer: every resolution
 * reports its stages, and each stage says what it added. This walks them and
 * adds up who paid.
 *
 *   bun scripts/tableloop-attribution.mts [runs]
 */

import { TableLoopEngine } from '../src/tableloop/TableLoopEngine.ts'
import { enumerateRackGroups } from '../src/tableloop/groupRules.ts'
import type { CausalStage, TableDecreeId } from '../src/tableloop/types.ts'

const RUNS = Number(process.argv[2] ?? 300)

interface Attribution {
  /** Tile and structure points, before any multiplier. */
  base: number
  /** Flat points added by Decrees. */
  decreePoints: number
  /** What every multiplier turned that base into, above the base itself. */
  multUplift: number
  /** Milestone rewards, paid once each. */
  milestone: number
  /** The one-time bonus for finishing the table. */
  completion: number
  /** Credited back when a revision replaced a group already paid for. */
  revisionCredit: number
  total: number
}

const EMPTY = (): Attribution => ({
  base: 0,
  decreePoints: 0,
  multUplift: 0,
  milestone: 0,
  completion: 0,
  revisionCredit: 0,
  total: 0,
})

/**
 * Split one resolution between its causes.
 *
 * The group's own line and any Decree that added flat points make up the base;
 * whatever the total exceeds that base by is what the multipliers did. Stages
 * that pay outright — milestones and the completion bonus — are read directly.
 */
function attribute(stages: readonly CausalStage[], into: Attribution): void {
  let base = 0
  let decreePoints = 0
  let milestone = 0
  let completion = 0
  let credit = 0
  let total = 0

  for (const stage of stages) {
    const points = stage.points ?? 0
    switch (stage.kind) {
      case 'group':
        base += points
        break
      case 'decree':
        decreePoints += points
        break
      case 'milestone':
        milestone += points
        break
      case 'completion':
        completion += points
        break
      case 'table':
        // Either a replaced group's credit or a broken pattern; both are
        // negative points or pure multiplier changes.
        credit += Math.min(0, points)
        break
      case 'total':
        total = points
        break
    }
  }

  const paidOutright = milestone + completion
  const beforeMult = base + decreePoints
  into.base += base
  into.decreePoints += decreePoints
  into.milestone += milestone
  into.completion += completion
  into.revisionCredit += credit
  into.multUplift += Math.max(0, total - paidOutright - beforeMult - credit)
  into.total += total
}

function bestMove(engine: TableLoopEngine) {
  const state = engine.getState()
  const options = { allowGap: state.gapBridgesRemaining > 0 }
  let best: { tileIds: string[]; slot: number; total: number } | null = null
  for (const group of enumerateRackGroups(state.rack, options)) {
    const tileIds = group.map((tile) => tile.id)
    for (const slot of state.slots) {
      const forecast = engine.previewPlacement(tileIds, slot.index)
      if (!forecast) continue
      if (!best || forecast.total > best.total) {
        best = { tileIds, slot: slot.index, total: forecast.total }
      }
    }
  }
  return best
}

function playRun(seed: number, starter: TableDecreeId, into: Attribution): void {
  const engine = new TableLoopEngine(seed)
  engine.chooseStarter(starter)

  for (let guard = 0; guard < 400; guard += 1) {
    const state = engine.getState()
    if (state.phase === 'runFailed' || state.phase === 'runComplete') break
    if (state.phase === 'roundCleared') {
      engine.nextRound()
      continue
    }
    if (state.phase !== 'playing') break

    const move = bestMove(engine)
    if (!move || move.total <= 0) {
      const loose = state.rack.slice(0, 3).map((tile) => tile.id)
      if (!engine.redraw(loose).success) break
      continue
    }
    const occupied = state.slots[move.slot].group !== null
    const result = occupied
      ? engine.revise(move.tileIds, move.slot)
      : engine.place(move.tileIds, move.slot)
    if (result.score) attribute(result.score.stages, into)
  }
}

const totals = EMPTY()
for (let seed = 1; seed <= RUNS; seed += 1) {
  playRun(seed, (['echoing_bamboo', 'patient_pair', 'watch_fire'] as const)[seed % 3], totals)
}

const share = (value: number) =>
  `${((value / totals.total) * 100).toFixed(1)}%`.padStart(8)

console.log(`Where the score comes from — ${RUNS} runs\n`)
console.log(`  Group base (tiles + structure) ${share(totals.base)}`)
console.log(`  Decree flat points             ${share(totals.decreePoints)}`)
console.log(`  Everything the multipliers add ${share(totals.multUplift)}`)
console.log(`  Milestone rewards              ${share(totals.milestone)}`)
console.log(`  Completing the table           ${share(totals.completion)}`)
console.log(`  Revision credit                ${share(totals.revisionCredit)}`)
console.log(`\n  Points paid outright vs earned through multipliers: ${(
  ((totals.base + totals.decreePoints + totals.milestone + totals.completion) /
    totals.total) *
  100
).toFixed(0)}% / ${((totals.multUplift / totals.total) * 100).toFixed(0)}%`)
