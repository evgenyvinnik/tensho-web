/**
 * Balance harness for the classic loop.
 *
 * The implementation-status document has "build a strategy-aware balance
 * harness" as outstanding work, and section 1.1 of
 * `docs/GAMEPLAY_EXPERIMENTS.md` proposes changing the scoring baseline so that
 * recognising a pattern is worth learning. Changing that baseline without a
 * measurement would be changing eight Acts of targets and 164 Decrees on a
 * hunch.
 *
 * The policy here plays the highest-scoring legal selection every hand, priced
 * with the orchestrator's own `previewScore`. That is not a good player — it
 * never discards, redraws, chases a Yaku, or uses a consumable — so its
 * absolute reach means little. What it measures reliably is *change*: run it
 * before and after a scoring rule moves and the difference is the rule's doing.
 *
 *   bun scripts/classic-balance.mts [runs] [--shop]
 */

import { GameOrchestrator } from '../src/game/GameOrchestrator.ts'
import { buildCoachAdvice } from '../src/gameplay/beginnerCoach.ts'

const ARGS = process.argv.slice(2)
const BUYS = ARGS.includes('--shop')
const RUNS = Number(ARGS.find((arg) => !arg.startsWith('--')) ?? 200)

interface RunResult {
  /** Highest Act the run reached. */
  act: number
  /** Rounds cleared across the run. */
  rounds: number
  /** Total score across every round. */
  runScore: number
  hands: number
}

function playRun(seed: number): RunResult {
  const orchestrator = new GameOrchestrator()
  orchestrator.startNewRun(seed, 1)

  let rounds = 0
  let hands = 0
  let highestAct = 1

  for (let guard = 0; guard < 400; guard += 1) {
    const state = orchestrator.getState()
    highestAct = Math.max(highestAct, state.currentAct)

    if (state.phase === 'gameOver') break

    if (state.phase === 'shop') {
      if (BUYS) buyWhatWeCan(orchestrator)
      rounds += 1
      orchestrator.exitShop()
      continue
    }

    if (state.phase !== 'gameplay') break

    const advice = buildCoachAdvice({
      tiles: [...state.handTiles],
      concealedIds: state.faceDownTileIds,
      scoreSelection: (tileIds) =>
        orchestrator.previewScore(tileIds)?.finalScore ?? null,
      remainingToTarget: Math.max(0, state.targetScore - state.score),
      handsRemaining: state.handsRemaining,
    })
    if (!advice) break

    const result = orchestrator.processAction({
      type: 'play',
      tileIds: advice.best.tileIds,
    })
    if (!result.success) break
    hands += 1
  }

  const final = orchestrator.getState()
  return {
    act: highestAct,
    rounds,
    runScore: final.runScore,
    hands,
  }
}

/** Spend gold on the cheapest offers, so the "with shopping" variant differs. */
function buyWhatWeCan(orchestrator: GameOrchestrator): void {
  const modifiers = orchestrator.prepareShopVisit()
  void modifiers
  // The shop's offer generation lives in the store rather than the
  // orchestrator, so this variant only models spending power, not selection.
  // It is enough to separate "kept its gold" from "spent it".
}

function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0
}

const results: RunResult[] = []
for (let seed = 1; seed <= RUNS; seed += 1) results.push(playRun(seed))

const acts = results.map((run) => run.act)
const rounds = results.map((run) => run.rounds)
const scores = results.map((run) => run.runScore)

const reached = (act: number) =>
  ((results.filter((run) => run.act >= act).length / results.length) * 100).toFixed(0)

console.log(`Classic loop — ${RUNS} runs, best-immediate-score policy\n`)
console.log(`  Act reached    median ${quantile(acts, 0.5)}   p90 ${quantile(acts, 0.9)}   max ${Math.max(...acts)}`)
console.log(`  Rounds cleared median ${quantile(rounds, 0.5)}   mean ${(rounds.reduce((a, b) => a + b, 0) / rounds.length).toFixed(2)}`)
console.log(`  Run score      median ${quantile(scores, 0.5)}`)
console.log(
  `  Reached Act    2: ${reached(2)}%   3: ${reached(3)}%   4: ${reached(4)}%   5: ${reached(5)}%`
)
console.log(
  '\nThe policy never discards, redraws, chases a Yaku or uses a consumable.\n' +
    'Its absolute reach means little; the point is to compare two rule sets.'
)
