/** Serial, matched-seed table/Stake comparison; never changes player progression. */
import { spawnSync, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, relative } from 'node:path'
import {
  matrixOptions,
  validateMatrixCell,
  summarizeMatrixCell,
  type MatrixCell,
} from './lib/classic-balance-matrix.ts'

const options = matrixOptions(process.argv.slice(2))
const root = fileURLToPath(new URL('..', import.meta.url))
const output = options.output ? resolve(options.output) : null
const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
function fingerprint() {
  function files(dir: string): string[] {
    return readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap(
      (entry) => {
        const path = `${dir}/${entry.name}`
        return entry.isDirectory()
          ? files(path)
          : /\.(ts|tsx|mts)$/.test(path) && !/\.(test|spec)\./.test(path)
            ? [path]
            : []
      }
    )
  }
  const paths = [
    ...files('src'),
    ...files('scripts'),
    'package.json',
    'bun.lock',
  ].sort()
  const hash = createHash('sha256')
  for (const path of paths)
    hash
      .update(path)
      .update('\0')
      .update(readFileSync(resolve(root, path)))
      .update('\0')
  return {
    sha256: hash.digest('hex'),
    files: paths.length,
    algorithm:
      'Sorted non-test .ts/.tsx/.mts under src and scripts plus package.json and bun.lock; SHA-256 of each relative path, NUL, raw file bytes, NUL.',
  }
}
// A requested file is a new artifact, never an implicit overwrite.
if (output && existsSync(output))
  throw new Error(`Output already exists: ${output}`)
const source = {
  commit: git('rev-parse', 'HEAD'),
  dirtyPaths: git('status', '--porcelain').split('\n').filter(Boolean),
  ...fingerprint(),
}
const cells: MatrixCell[] = []
const commands: string[] = []
for (const table of options.tables)
  for (const stake of options.stakes) {
    const args = [
      'scripts/classic-balance.mts',
      String(options.runs),
      '--shop',
      ...(options.shopping === 'observed-build' ? ['--build-shop'] : []),
      '--resources',
      '--consumables',
      `--seed=${options.seed}`,
      `--table=${table}`,
      `--stake=${stake}`,
      '--json',
    ]
    console.error(
      `[${cells.length + 1}/${options.tables.length * options.stakes.length}] ${table}, Stake ${stake}, seeds ${options.seed}–${options.seed + options.runs - 1}`
    )
    const result = spawnSync('bun', args, {
      cwd: root,
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 64 * 1024 * 1024,
    })
    if (result.error || result.status !== 0)
      throw new Error(
        `Cell failed (${table}/${stake}): ${result.error?.message ?? result.stderr}`
      )
    cells.push(
      validateMatrixCell(JSON.parse(result.stdout), {
        table,
        stake,
        runs: options.runs,
        seed: options.seed,
        shopping: options.shopping,
      })
    )
    commands.push(`bun ${args.join(' ')}`)
  }
if (fingerprint().sha256 !== source.sha256)
  throw new Error(
    'Source changed during measurement; refusing mixed-source report'
  )
const summaries = cells.map(summarizeMatrixCell)
const healthy = summaries.every((cell) => cell.diagnosticStops === 0)
const report = {
  schema: 1,
  measuredAt: new Date().toISOString(),
  runtime: execFileSync('bun', ['--version'], { encoding: 'utf8' }).trim(),
  source,
  policy: 'resources+consumables',
  shopping: options.shopping,
  seeds: { first: options.seed, last: options.seed + options.runs - 1 },
  tables: options.tables,
  stakes: options.stakes,
  totalRuns: cells.length * options.runs,
  healthy,
  limitations: [
    'Matched initial seeds, not independent human participants. Different table rules and actions can change later random trajectories.',
    'No difficulty tuning, optimal-strategy or human-enjoyment claim. Policy limitations from every child run are retained.',
    'Profile unlocks are bypassed explicitly for measurement; player save data is not read or written.',
  ],
  commands,
  summaries,
  cells,
}
const json = JSON.stringify(report, null, 2) + '\n'
if (output) {
  writeFileSync(output, json, { flag: 'wx' })
  console.error(
    `Saved ${relative(root, output)} (${report.totalRuns} runs; diagnostic stops: ${summaries.reduce((n, s) => n + s.diagnosticStops, 0)})`
  )
} else process.stdout.write(json)
if (!healthy) process.exitCode = 2
