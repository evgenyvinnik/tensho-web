import { expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import {
  matrixOptions,
  validateMatrixCell,
  summarizeMatrixCell,
} from '../../scripts/lib/classic-balance-matrix'

const expected = { table: 'green_felt', stake: 1, runs: 2, seed: 7 }
function cell() {
  return {
    schema: 2,
    policy: 'resources+consumables',
    shopping: true,
    consumables: true,
    table: 'green_felt',
    stake: 1,
    runs: 2,
    firstSeed: 7,
    outcomes: { loss: 1, noAdvice: 1 },
    limitations: ['Heuristic, not human play'],
    results: [7, 8].map((seed, index) => ({
      seed,
      act: index ? 4 : 1,
      rounds: index ? 9 : 0,
      runScore: 100,
      hands: 4,
      completeHands: 0,
      consumablesUsed: 1,
      purchases: 2,
      outcome: index ? 'noAdvice' : 'loss',
    })),
  }
}

it('defaults to all 64 combinations with the same bounded seed range', () => {
  const options = matrixOptions([])
  expect(options.tables).toHaveLength(8)
  expect(options.stakes).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  expect(options.runs).toBe(20)
  expect(options.seed).toBe(1)
})

it.each([
  '--runs=0',
  '--runs=10001',
  '--runs=1.5',
  '--seed=0',
  '--seed=4294967295',
  '--tables=missing',
  '--tables=green_felt,green_felt',
  '--stakes=0',
  '--stakes=1,1',
  '--stakes=1.5',
  '--runs=1000',
  '--unknown',
  '--shop',
  '--shopping=unknown',
  '--planning=unknown',
])('rejects invalid or excessive experiments: %s', (arg) => {
  expect(() => matrixOptions([arg])).toThrow()
})

it('rejects duplicate flags and preserves explicit subset order', () => {
  expect(() => matrixOptions(['--runs=1', '--runs=2'])).toThrow(/duplicate/)
  expect(
    matrixOptions([
      '--runs=1',
      '--tables=night_market,green_felt',
      '--stakes=8,1',
      '--seed=4294967295',
    ])
  ).toMatchObject({
    tables: ['night_market', 'green_felt'],
    stakes: [8, 1],
    seed: 4294967295,
  })
})

it('keeps diagnostic stops visible instead of counting them as losses', () => {
  const result = validateMatrixCell(cell(), expected)
  expect(summarizeMatrixCell(result)).toMatchObject({
    wins: 0,
    losses: 1,
    diagnosticStops: 1,
    medianAct: 4,
    meanRounds: 4.5,
    reachedAct4: 1,
    reachedAct8: 0,
    completeHands: 0,
    consumablesUsed: 2,
    purchases: 4,
  })
})

it('does not silently label one shopping strategy as another', () => {
  const value = { ...cell(), shoppingPolicy: 'observed-build' }
  expect(matrixOptions(['--shopping=observed-build']).shopping).toBe(
    'observed-build'
  )
  expect(() => validateMatrixCell(value, expected)).toThrow()
  expect(
    validateMatrixCell(value, { ...expected, shopping: 'observed-build' })
  ).toEqual(value)
  expect(() =>
    validateMatrixCell(cell(), { ...expected, shopping: 'observed-build' })
  ).toThrow()
})

it('refuses to label structural planning as the unchanged control policy', () => {
  expect(matrixOptions([]).planning).toBe('off')
  expect(matrixOptions(['--planning=structural']).planning).toBe('structural')
  const value = { ...cell(), policy: 'resources-and-hand-plan+consumables' }
  expect(() => validateMatrixCell(value, expected)).toThrow()
  expect(
    validateMatrixCell(value, { ...expected, planning: 'structural' })
  ).toEqual(value)
  expect(() =>
    validateMatrixCell(cell(), { ...expected, planning: 'structural' })
  ).toThrow()
})

it.each([
  (value: ReturnType<typeof cell>) => {
    value.table = 'temple_stone'
  },
  (value: ReturnType<typeof cell>) => {
    value.policy = 'best-immediate'
  },
  (value: ReturnType<typeof cell>) => {
    value.results.pop()
  },
  (value: ReturnType<typeof cell>) => {
    value.results[1].seed = 7
  },
  (value: ReturnType<typeof cell>) => {
    value.outcomes.loss = 2
  },
  (value: ReturnType<typeof cell>) => {
    value.results[0].runScore = NaN
  },
])('rejects mismatched or malformed reports', (change) => {
  const value = cell()
  change(value)
  expect(() => validateMatrixCell(value, expected)).toThrow()
})

it('runs a real matched matrix and reproduces each cell with the original command', () => {
  const result = spawnSync(
    'bun',
    [
      'scripts/classic-balance-matrix.mts',
      '--runs=1',
      '--seed=7',
      '--tables=green_felt,temple_stone',
      '--stakes=1,8',
    ],
    { encoding: 'utf8', timeout: 20000, maxBuffer: 4 * 1024 * 1024 }
  )
  expect(result.error).toBeUndefined()
  expect(result.status, result.stderr).toBe(0)
  const report = JSON.parse(result.stdout)
  expect(report.totalRuns).toBe(4)
  expect(report.healthy).toBe(true)
  expect(report.source.sha256).toMatch(/^[0-9a-f]{64}$/)
  expect(
    report.cells.map((c: { table: string; stake: number }) => [
      c.table,
      c.stake,
    ])
  ).toEqual([
    ['green_felt', 1],
    ['green_felt', 8],
    ['temple_stone', 1],
    ['temple_stone', 8],
  ])
  const single = spawnSync(
    'bun',
    [
      'scripts/classic-balance.mts',
      '1',
      '--seed=7',
      '--table=temple_stone',
      '--stake=8',
      '--shop',
      '--resources',
      '--consumables',
      '--json',
    ],
    { encoding: 'utf8', timeout: 20000 }
  )
  expect(single.error).toBeUndefined()
  expect(single.status, single.stderr).toBe(0)
  expect(report.cells[3]).toEqual(JSON.parse(single.stdout))
}, 45000)
