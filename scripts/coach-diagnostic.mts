/**
 * Opening-move diagnostic for the beginner coach.
 *
 * Section 1.4 of `docs/GAMEPLAY_EXPERIMENTS.md` reports a diagnostic over
 * starting seeds 1-100: the coach of the day suggested a shape on 99 of them,
 * with a median score of 36, and 85 of those 99 fell short of the round's
 * target divided by its remaining plays. Section 8 asks for that diagnostic to
 * be repeated after any change to the coach or the scoring rules.
 *
 * This is the repeat. It measures the same two things for the shape-teaching
 * suggestion and for the score-aware advice, using the authoritative
 * `previewScore` for both, so the comparison is like for like.
 *
 * It is an opening-move measurement, not a win rate and not an enjoyment
 * metric. An early low-scoring play may still preserve a better hand.
 *
 *   bun scripts/coach-diagnostic.mts [seeds]
 */

import { GameOrchestrator } from '../src/game/GameOrchestrator.ts'
import {
  buildCoachAdvice,
  findBeginnerSuggestion,
} from '../src/gameplay/beginnerCoach.ts'

const SEEDS = Number(process.argv[2] ?? 100)

interface Row {
  seed: number
  /** Score of the shape the teaching suggestion points at, if it scores. */
  shapeScore: number | null
  suggestsRedraw: boolean
  /** Best score the score-aware coach found. */
  bestScore: number | null
  /** Points this hand must find to stay on pace. */
  requiredPerHand: number
}

function measure(seed: number): Row {
  const orchestrator = new GameOrchestrator()
  orchestrator.startNewRun(seed, 1)
  const state = orchestrator.getState()

  const concealed = new Set(state.faceDownTileIds)
  const suggestion = findBeginnerSuggestion(state.handTiles, concealed)
  const scoreSelection = (tileIds: string[]) =>
    orchestrator.previewScore(tileIds)?.finalScore ?? null

  const advice = buildCoachAdvice({
    tiles: state.handTiles,
    concealedIds: concealed,
    scoreSelection,
    remainingToTarget: Math.max(0, state.targetScore - state.score),
    handsRemaining: state.handsRemaining,
  })

  const suggestsRedraw = suggestion?.kind === 'redraw'
  const shapeScore =
    suggestion && !suggestsRedraw ? scoreSelection(suggestion.tileIds) : null

  return {
    seed,
    shapeScore,
    suggestsRedraw: Boolean(suggestsRedraw),
    bestScore: advice?.best.score ?? null,
    requiredPerHand: advice?.requiredPerHand ?? 0,
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

const rows: Row[] = []
for (let seed = 1; seed <= SEEDS; seed += 1) rows.push(measure(seed))

const scoringShapes = rows.filter((row) => row.shapeScore !== null)
const shapeScores = scoringShapes.map((row) => row.shapeScore!)
const bestScores = rows
  .filter((row) => row.bestScore !== null)
  .map((row) => row.bestScore!)

const shapeBehindPace = scoringShapes.filter(
  (row) => row.shapeScore! < row.requiredPerHand
).length
const bestBehindPace = rows.filter(
  (row) => row.bestScore !== null && row.bestScore < row.requiredPerHand
).length
const bestBeatsShape = scoringShapes.filter(
  (row) => (row.bestScore ?? 0) > row.shapeScore!
).length
const uplift = scoringShapes.map(
  (row) => (row.bestScore ?? 0) - row.shapeScore!
)

const pad = (label: string) => label.padEnd(52, ' ')
console.log(`Opening-move diagnostic — seeds 1..${SEEDS}\n`)
console.log(pad('Opening seeds examined'), rows.length)
console.log(pad('Teaching suggestion points at a scoring shape'), scoringShapes.length)
console.log(pad('Teaching suggestion is a redraw'), rows.filter((r) => r.suggestsRedraw).length)
console.log(pad('Median score of the taught shape'), median(shapeScores))
console.log(pad('Taught shape below target / remaining plays'), `${shapeBehindPace} of ${scoringShapes.length}`)
console.log()
console.log(pad('Median score the score-aware coach finds'), median(bestScores))
console.log(pad('Coach best below target / remaining plays'), `${bestBehindPace} of ${bestScores.length}`)
console.log(pad('Coach finds more than the taught shape'), `${bestBeatsShape} of ${scoringShapes.length}`)
console.log(pad('Median points the coach adds over the shape'), median(uplift))
console.log()
console.log(
  'An opening-move measurement only. It does not establish a win rate, and an\n' +
    'early low-scoring play may still preserve a better hand.'
)
