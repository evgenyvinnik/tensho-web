import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'

function run(args: string[]) {
  return spawnSync('bun', ['scripts/classic-balance.mts', ...args], {
    encoding: 'utf8',
    timeout: 20000,
    maxBuffer: 4 * 1024 * 1024,
  })
}

interface Report {
  schema: number
  policy: string
  shopping: boolean
  consumables: boolean
  table: string
  stake: number
  firstSeed: number
  runs: number
  outcomes: Record<string, number>
  results: Array<{
    seed: number
    redraws: number
    redrawnTiles: number
    discards: number
    completeHands: number
    oneAwayAttempts: number
    outcome: string
    purchases: number
    unusedConsumables: number
    consumablesUsed: number
    consumableUsesById: Record<string, number>
    consumableUsesByReason: Record<string, number>
    unusedConsumablesById: Record<string, number>
    unusedConsumablesByReason: Record<string, number>
  }>
  limitations: string[]
}

function report(args: string[]): Report {
  const result = run([...args, '--json'])
  expect(result.error).toBeUndefined()
  expect(result.status, result.stderr).toBe(0)
  return JSON.parse(result.stdout) as Report
}

describe('Classic balance command contract', () => {
  it.each([
    '--unknown',
    '--resources=true',
    '--consumables=true',
    '--table=missing',
    '--stake=0',
    '--stake=2.5',
    '--seed=0',
    '--seed=4294967295',
    '0',
  ])(
    'rejects invalid input instead of silently running a different experiment: %s',
    (arg) => {
      const result = run(['2', arg, '--json'])
      expect(result.status).not.toBe(0)
      expect(result.stderr).toMatch(/Unknown|Stake|Seed|run count/)
    }
  )

  it('keeps the no-resource baseline explicit and reports each requested seed', () => {
    const result = report(['3', '--seed=7', '--shop'])
    expect(result.schema).toBe(2)
    expect(result.policy).toBe('best-immediate')
    expect(result.shopping).toBe(true)
    expect(result.consumables).toBe(false)
    expect(result.results.every((run) => run.consumablesUsed === 0)).toBe(true)
    expect(result.results.map((run) => run.seed)).toEqual([7, 8, 9])
    expect(
      result.results.every(
        (run) =>
          run.redraws === 0 && run.discards === 0 && run.oneAwayAttempts === 0
      )
    ).toBe(true)
    expect(result.limitations).toContain(
      'No consumable use. Unused inventory is reported, not treated as an implemented policy.'
    )
  })

  it('uses real resources and keeps totals coherent in the paired policy', () => {
    const result = report(['5', '--shop', '--resources'])
    expect(result.policy).toBe('resources')
    expect(
      result.results.some((run) => run.redraws > 0 && run.discards > 0)
    ).toBe(true)
    expect(
      result.results.every(
        (run) =>
          run.redrawnTiles >= run.redraws && run.redrawnTiles <= run.redraws * 3
      )
    ).toBe(true)
    expect(
      result.results.every((run) => ['win', 'loss'].includes(run.outcome))
    ).toBe(true)
    expect(Object.values(result.outcomes).reduce((sum, n) => sum + n, 0)).toBe(
      5
    )
  })

  // Two independently bounded 20-second subprocesses; this is a
  // determinism contract, not a five-second performance benchmark.
  it('repeats the full seeded one-away experiment including purchases and resource counts', () => {
    const args = ['5', '--seed=11', '--shop', '--chase-hands']
    const first = report(args)
    expect(first.policy).toBe('resources-and-one-away')
    expect(report(args)).toEqual(first)
  }, 45000)

  it('reports actual consumable use and final inventory reasons with coherent totals', () => {
    const result = report(['5', '--shop', '--resources', '--consumables'])
    expect(result.policy).toBe('resources+consumables')
    expect(result.consumables).toBe(true)
    expect(result.results.some((run) => run.consumablesUsed > 0)).toBe(true)
    const sum = (counts: Record<string, number>) =>
      Object.values(counts).reduce((a, b) => a + b, 0)
    for (const run of result.results) {
      expect(sum(run.consumableUsesById)).toBe(run.consumablesUsed)
      expect(sum(run.consumableUsesByReason)).toBe(run.consumablesUsed)
      expect(sum(run.unusedConsumablesById)).toBe(run.unusedConsumables)
      expect(sum(run.unusedConsumablesByReason)).toBe(run.unusedConsumables)
      expect(['win', 'loss']).toContain(run.outcome)
    }
  })

  // Same two bounded subprocesses as the resource-only reproducibility test.
  it('repeats consumable choices and outcomes with the same seed and does not implicitly enable resources', () => {
    const args = ['5', '--shop', '--consumables']
    const first = report(args)
    expect(first.policy).toBe('best-immediate+consumables')
    expect(
      first.results.every((run) => run.redraws === 0 && run.discards === 0)
    ).toBe(true)
    expect(report(args)).toEqual(first)
  }, 45000)

  it.each(TABLE_STYLE_DEFINITIONS)(
    'reports $id and its requested Stake without silently substituting defaults',
    (table) => {
      const result = report([
        '1',
        `--table=${table.id}`,
        '--stake=8',
        '--resources',
      ])
      expect(result.table).toBe(table.id)
      expect(result.stake).toBe(8)
      expect(result.runs).toBe(1)
      expect(result.results).toHaveLength(1)
      expect(['win', 'loss']).toContain(result.results[0].outcome)
    }
  )
})
