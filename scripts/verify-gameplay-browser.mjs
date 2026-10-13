import { spawn } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { stripVTControlCharacters } from 'node:util'

const port = Number(process.env.GAMEPLAY_BROWSER_PORT ?? 4179)
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('GAMEPLAY_BROWSER_PORT must be a TCP port')
if (!existsSync('dist/index.html'))
  throw new Error(
    'Build the Pages-path production app before browser verification'
  )

const artifacts = resolve(
  process.env.GAMEPLAY_BROWSER_ARTIFACTS ??
    `${process.env.RUNNER_TEMP ?? tmpdir()}/tensho-browser-${process.pid}`
)
mkdirSync(artifacts, { recursive: true })
const fixture = (name) => resolve(`e2e/fixtures/interactions/${name}.json`)
for (const name of ['quad', 'complete', 'mutations', 'echo'])
  JSON.parse(readFileSync(fixture(name), 'utf8'))

const base = `http://127.0.0.1:${port}/tensho-web/`
const html = readFileSync('dist/index.html', 'utf8')
const serverLog = createWriteStream(resolve(artifacts, 'preview.log'))
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ],
  {
    env: { ...process.env, VITE_BASE_PATH: '/tensho-web/' },
    stdio: ['ignore', 'pipe', 'pipe'],
  }
)
server.stdout.pipe(serverLog, { end: false })
server.stderr.pipe(serverLog, { end: false })
let startupOutput = ''
server.stdout.on('data', (chunk) => {
  startupOutput = (startupOutput + chunk.toString()).slice(-8192)
})
let serverError
server.on('error', (error) => {
  serverError = error
})
let browser
let interrupted = false
const interrupt = () => {
  interrupted = true
  browser?.kill('SIGINT')
  server.kill('SIGTERM')
}
process.once('SIGINT', interrupt)
process.once('SIGTERM', interrupt)

try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    if (interrupted) throw new Error('Browser verification interrupted')
    if (serverError || server.exitCode !== null || server.signalCode !== null)
      throw new Error(
        `Preview exited before readiness: ${serverError ?? server.exitCode ?? server.signalCode}`
      )
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(1000) })
      // Refuse to test an unrelated server that already occupies this port.
      ready =
        stripVTControlCharacters(startupOutput).includes(base) &&
        response.ok &&
        (await response.text()) === html
    } catch {
      /* The owned preview may still be starting. */
    }
    if (ready) break
    await delay(500)
  }
  if (!ready)
    throw new Error('Production preview did not serve the built index')
  if (server.exitCode !== null)
    throw new Error('Owned preview exited during readiness')

  browser = spawn(
    process.execPath,
    [
      'node_modules/@playwright/test/cli.js',
      'test',
      'e2e/two-actions.spec.ts',
      'e2e/dragon-hints.spec.ts',
      'e2e/tile-return-guidance.spec.ts',
      'e2e/flower-mutations.spec.ts',
      'e2e/bamboo-summer.spec.ts',
      'e2e/frostbite-retriggers.spec.ts',
      '--workers=1',
      '--retries=0',
      '--trace=retain-on-failure',
      `--output=${resolve(artifacts, 'results')}`,
    ],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        SKIP_WEB_SERVER: '1',
        PLAYWRIGHT_BASE_URL: base,
        PLAYWRIGHT_HTML_OUTPUT_DIR: resolve(artifacts, 'report'),
        BAMBOO_REPLAY_DIR: resolve('e2e/fixtures/interactions'),
        MUTATIONS_REPLAY_PATH: fixture('mutations'),
        ECHO_REPLAY_PATH: fixture('echo'),
      },
    }
  )
  const code = await new Promise((resolveExit, reject) => {
    browser.once('error', reject)
    browser.once('exit', (exitCode) => resolveExit(exitCode ?? 1))
  })
  process.exitCode = interrupted ? 130 : code
} catch (error) {
  console.error(error)
  process.exitCode = interrupted ? 130 : 1
} finally {
  // This handle belongs to the preview started above; never kill by a pattern.
  server.kill('SIGTERM')
  for (
    let attempt = 0;
    attempt < 50 && server.exitCode === null && server.signalCode === null;
    attempt++
  )
    await delay(100)
  if (server.exitCode === null && server.signalCode === null)
    server.kill('SIGKILL')
  serverLog.end()
}
