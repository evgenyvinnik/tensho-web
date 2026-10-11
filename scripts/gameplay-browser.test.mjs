import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const runner = fileURLToPath(
  new URL('./verify-gameplay-browser.mjs', import.meta.url)
)

async function unusedPort() {
  const server = createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}

for (const browserExit of [0, 7]) {
  test(`browser gate propagates exit ${browserExit} and stops only its preview`, async (t) => {
    const root = realpathSync(
      mkdtempSync(join(tmpdir(), 'tensho-browser-gate-'))
    )
    t.after(() => rmSync(root, { recursive: true, force: true }))
    for (const path of [
      'dist',
      'node_modules/vite/bin',
      'node_modules/@playwright/test',
      'e2e/fixtures/interactions',
    ])
      mkdirSync(join(root, path), { recursive: true })
    writeFileSync(
      join(root, 'dist/index.html'),
      '<!doctype html><title>Fixture</title>'
    )
    for (const name of ['quad', 'complete', 'mutations', 'echo'])
      writeFileSync(join(root, `e2e/fixtures/interactions/${name}.json`), '{}')
    writeFileSync(
      join(root, 'node_modules/vite/bin/vite.js'),
      `
      const http = require('node:http'), fs = require('node:fs');
      const port = Number(process.argv[process.argv.indexOf('--port') + 1]);
      fs.writeFileSync('preview-pid', String(process.pid));
      const server = http.createServer((req,res) => res.end(fs.readFileSync('dist/index.html')));
      server.listen(port, '127.0.0.1', () => console.log('Local: http://127.0.0.1:' + port + '/tensho-web/'));
    `
    )
    writeFileSync(
      join(root, 'node_modules/@playwright/test/cli.js'),
      `
      require('node:fs').writeFileSync('browser-invocation.json', JSON.stringify({
        args: process.argv.slice(2), base: process.env.PLAYWRIGHT_BASE_URL,
        bamboo: process.env.BAMBOO_REPLAY_DIR, echo: process.env.ECHO_REPLAY_PATH,
        mutations: process.env.MUTATIONS_REPLAY_PATH, skip: process.env.SKIP_WEB_SERVER
      }));
      process.exit(${browserExit});
    `
    )
    const port = await unusedPort()
    const child = spawn(process.execPath, [runner], {
      cwd: root,
      env: {
        ...process.env,
        GAMEPLAY_BROWSER_PORT: String(port),
        GAMEPLAY_BROWSER_ARTIFACTS: join(root, 'artifacts'),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let diagnostics = ''
    child.stdout.on('data', (data) => {
      diagnostics += data
    })
    child.stderr.on('data', (data) => {
      diagnostics += data
    })
    const result = await new Promise((resolve, reject) => {
      child.once('error', reject)
      child.once('exit', resolve)
    })
    assert.equal(result, browserExit, diagnostics)
    const invocation = JSON.parse(
      readFileSync(join(root, 'browser-invocation.json'), 'utf8')
    )
    assert.equal(invocation.base, `http://127.0.0.1:${port}/tensho-web/`)
    assert.equal(invocation.skip, '1')
    assert.equal(invocation.bamboo, join(root, 'e2e/fixtures/interactions'))
    assert.equal(
      invocation.echo,
      join(root, 'e2e/fixtures/interactions/echo.json')
    )
    assert.equal(
      invocation.mutations,
      join(root, 'e2e/fixtures/interactions/mutations.json')
    )
    for (const name of [
      'bamboo-summer',
      'flower-mutations',
      'frostbite-retriggers',
      'table-loop-layout',
      'tile-return-guidance',
      'tap-discard',
      'discard-layout',
    ])
      assert.ok(invocation.args.includes(`e2e/${name}.spec.ts`))
    assert.ok(invocation.args.includes('--workers=1'))
    assert.ok(invocation.args.includes('--retries=0'))
    assert.ok(invocation.args.includes('--trace=retain-on-failure'))
    const pid = Number(readFileSync(join(root, 'preview-pid'), 'utf8'))
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
  })
}
