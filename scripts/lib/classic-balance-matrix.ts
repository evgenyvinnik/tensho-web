import { TABLE_STYLE_DEFINITIONS } from '../../src/config/tableStyleDefinitions'
import { STAKE_DEFINITIONS } from '../../src/config/stakeDefinitions'

export function matrixOptions(args: string[]) {
  const options = new Map<string, string>()
  for (const arg of args) {
    const match = /^--(runs|seed|tables|stakes|shopping|output)=(.+)$/.exec(arg)
    if (!match || options.has(match[1]))
      throw new Error(`Unknown, incomplete or duplicate option: ${arg}`)
    options.set(match[1], match[2])
  }
  const runs = Number(options.get('runs') ?? 20)
  const seed = Number(options.get('seed') ?? 1)
  if (!Number.isInteger(runs) || runs < 1 || runs > 10000)
    throw new Error('Runs must be an integer from 1 to 10000')
  if (!Number.isSafeInteger(seed) || seed < 1 || seed + runs - 1 > 0xffffffff)
    throw new Error('Seed range must fit positive 32-bit integers')
  const tableIds = TABLE_STYLE_DEFINITIONS.map((t) => t.id)
  const stakeIds = STAKE_DEFINITIONS.map((s) => String(s.tier))
  function subset(key: string, allowed: string[]) {
    const raw = options.get(key) ?? 'all'
    const values = raw === 'all' ? allowed : raw.split(',')
    if (
      new Set(values).size !== values.length ||
      values.some((v) => !allowed.includes(v))
    )
      throw new Error(`Invalid or duplicate ${key}: ${raw}`)
    return values
  }
  const tables = subset('tables', tableIds)
  const stakes = subset('stakes', stakeIds).map(Number)
  const shopping = options.get('shopping') ?? 'cheapest-first'
  if (!['cheapest-first', 'observed-build'].includes(shopping))
    throw new Error(`Invalid shopping policy: ${shopping}`)
  if (runs * tables.length * stakes.length > 10000)
    throw new Error(
      'Matrix exceeds 10000 total runs; select fewer cells or seeds'
    )
  return { runs, seed, tables, stakes, shopping, output: options.get('output') }
}

export interface MatrixRun {
  seed: number
  act: number
  rounds: number
  runScore: number
  hands: number
  completeHands: number
  consumablesUsed: number
  purchases: number
  outcome: string
}

export interface MatrixCell {
  schema: number
  policy: string
  shopping: boolean
  shoppingPolicy?: string
  consumables: boolean
  table: string
  stake: number
  firstSeed: number
  runs: number
  outcomes: Record<string, number>
  results: MatrixRun[]
  limitations: string[]
}

/** Refuse missing/duplicated seeds or a silently different child experiment. */
export function validateMatrixCell(
  value: unknown,
  expected: {
    table: string
    stake: number
    runs: number
    seed: number
    shopping?: string
  }
): MatrixCell {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid matrix cell')
  const cell = value as MatrixCell
  if (
    cell.schema !== 2 ||
    cell.policy !== 'resources+consumables' ||
    cell.shopping !== true ||
    (cell.shoppingPolicy ?? 'cheapest-first') !==
      (expected.shopping ?? 'cheapest-first') ||
    cell.consumables !== true ||
    cell.table !== expected.table ||
    cell.stake !== expected.stake ||
    cell.runs !== expected.runs ||
    cell.firstSeed !== expected.seed ||
    !Array.isArray(cell.results) ||
    cell.results.length !== expected.runs ||
    !Array.isArray(cell.limitations) ||
    cell.limitations.some((l) => typeof l !== 'string')
  )
    throw new Error('Matrix cell configuration mismatch')
  const outcomes: Record<string, number> = {}
  cell.results.forEach((run, index) => {
    if (
      !run ||
      run.seed !== expected.seed + index ||
      typeof run.outcome !== 'string' ||
      !run.outcome
    )
      throw new Error('Invalid matrix seed or outcome')
    for (const key of [
      'act',
      'rounds',
      'runScore',
      'hands',
      'completeHands',
      'consumablesUsed',
      'purchases',
    ] as const) {
      if (!Number.isFinite(run[key]) || run[key] < 0)
        throw new Error(`Invalid matrix measure: ${key}`)
    }
    outcomes[run.outcome] = (outcomes[run.outcome] ?? 0) + 1
  })
  if (
    !cell.outcomes ||
    Object.keys(cell.outcomes).length !== Object.keys(outcomes).length ||
    Object.entries(outcomes).some(
      ([key, count]) => cell.outcomes[key] !== count
    )
  )
    throw new Error('Matrix outcome totals mismatch')
  return cell
}

export function summarizeMatrixCell(cell: MatrixCell) {
  const sum = (
    key: 'rounds' | 'hands' | 'completeHands' | 'consumablesUsed' | 'purchases'
  ) => cell.results.reduce((total, run) => total + run[key], 0)
  const acts = cell.results.map((run) => run.act).sort((a, b) => a - b)
  return {
    table: cell.table,
    stake: cell.stake,
    runs: cell.runs,
    wins: cell.outcomes.win ?? 0,
    losses: cell.outcomes.loss ?? 0,
    diagnosticStops:
      cell.runs - (cell.outcomes.win ?? 0) - (cell.outcomes.loss ?? 0),
    medianAct: acts[Math.floor(acts.length / 2)],
    maxAct: acts[acts.length - 1],
    reachedAct4: acts.filter((act) => act >= 4).length,
    reachedAct8: acts.filter((act) => act >= 8).length,
    meanRounds: sum('rounds') / cell.runs,
    hands: sum('hands'),
    completeHands: sum('completeHands'),
    consumablesUsed: sum('consumablesUsed'),
    purchases: sum('purchases'),
  }
}
