import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const workflow = readFileSync(
  new URL('../.github/workflows/deploy-pages.yml', import.meta.url),
  'utf8'
)

// Execute the actual checked-in workflow bodies, not a second implementation.
// Only the known GitHub ref expression is expanded for the pre-fix regression.
function step(name) {
  const marker = `      - name: ${name}\n`
  assert.ok(workflow.includes(marker), `Missing workflow step: ${name}`)
  const block = workflow.split(marker)[1].split('\n      - name:')[0]
  const body = block.split('        run: |\n')[1]
  assert.ok(body, `${name} must have a block run script`)
  return body
    .split('\n')
    .map((line) => line.replace(/^          /, ''))
    .join('\n')
    .replaceAll('${{ github.ref }}', '${GITHUB_REF}')
}

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'tensho-release-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Release fixture',
    GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
    GIT_COMMITTER_NAME: 'Release fixture',
    GIT_COMMITTER_EMAIL: 'fixture@example.invalid',
    GIT_TERMINAL_PROMPT: '0',
    GITHUB_REF: 'refs/heads/main',
    GITHUB_REF_NAME: 'main',
    GITHUB_OUTPUT: join(root, 'output'),
  }
  const run = (cwd, command, args, extra = {}) =>
    spawnSync(command, args, {
      cwd,
      env: { ...env, ...extra },
      encoding: 'utf8',
      timeout: 15000,
    })
  const git = (cwd, ...args) => {
    const result = run(cwd, 'git', args)
    assert.equal(result.status, 0, result.stderr || result.error?.message)
    return result.stdout.trim()
  }
  const remote = join(root, 'remote.git')
  const publisher = join(root, 'publisher')
  git(root, 'init', '--bare', '--initial-branch=main', remote)
  git(root, 'clone', remote, publisher)
  writeFileSync(
    join(publisher, 'package.json'),
    JSON.stringify({ name: 'fixture', version: '1.0.260908-1' }, null, 2) + '\n'
  )
  writeFileSync(join(publisher, 'app.txt'), 'initial application\n')
  git(publisher, 'add', '.')
  git(publisher, 'commit', '-m', 'Initial fixture')
  git(publisher, 'push', 'origin', 'main')
  const original = git(publisher, 'rev-parse', 'HEAD')
  const bin = join(root, 'bin')
  mkdirSync(bin)
  writeFileSync(join(bin, 'date'), '#!/bin/sh\nprintf "%s\\n" 260909\n', {
    mode: 0o755,
  })
  env.PATH = `${bin}:${process.env.PATH}`
  const execute = (name, extra = {}) =>
    run(publisher, 'bash', ['-eo', 'pipefail', '-c', step(name)], extra)
  const calculate = () => {
    const result = execute('Calculate deployment version')
    assert.equal(result.status, 0, result.stderr)
    return readFileSync(env.GITHUB_OUTPUT, 'utf8').match(/^version=(.+)$/m)[1]
  }
  const prepare = () => {
    const version = calculate()
    const result = execute('Update package version', { VERSION: version })
    assert.equal(result.status, 0, result.stderr)
    return version
  }
  const concurrentCommit = (filename, content) => {
    const other = join(root, 'other')
    git(root, 'clone', remote, other)
    writeFileSync(join(other, filename), content)
    git(other, 'add', filename)
    git(other, 'commit', '-m', 'Concurrent user change')
    git(other, 'push', 'origin', 'main')
    return git(other, 'rev-parse', 'HEAD')
  }
  return {
    root,
    remote,
    publisher,
    original,
    env,
    run,
    git,
    execute,
    calculate,
    prepare,
    concurrentCommit,
  }
}

test('a new UTC date starts at build 1', (t) => {
  const f = fixture(t)
  assert.equal(f.calculate(), '1.0.260909-1')
})

test('versioning uses the highest valid suffix, not tag count', (t) => {
  const f = fixture(t)
  for (const tag of [
    'v1.0.260909-1',
    'v1.0.260909-3',
    'v1.0.260909-10',
    'v1.0.260908-999',
    'v1.0.260909-preview',
  ]) {
    f.git(f.publisher, 'tag', tag)
  }
  assert.equal(f.calculate(), '1.0.260909-11')
})

test('normal publication keeps package version, branch and tag aligned', (t) => {
  const f = fixture(t)
  const version = f.prepare()
  const result = f.execute('Commit and tag deployment version', {
    VERSION: version,
  })
  assert.equal(result.status, 0, result.stderr)
  const head = f.git(f.publisher, 'rev-parse', 'HEAD')
  assert.equal(f.git(f.remote, 'rev-parse', 'refs/heads/main'), head)
  assert.equal(f.git(f.remote, 'rev-parse', `refs/tags/v${version}`), head)
  assert.equal(
    JSON.parse(f.git(f.remote, 'show', `${head}:package.json`)).version,
    version
  )
  const repeat = f.execute('Commit and tag deployment version', {
    VERSION: version,
  })
  assert.equal(repeat.status, 0, repeat.stderr)
  assert.equal(f.git(f.publisher, 'rev-parse', 'HEAD'), head)
})

test('a concurrent main update is included in both the version tag and the build checkout', (t) => {
  const f = fixture(t)
  const version = f.prepare()
  const incoming = f.concurrentCommit('app.txt', 'concurrent application\n')
  const result = f.execute('Commit and tag deployment version', {
    VERSION: version,
  })
  assert.equal(result.status, 0, result.stderr)
  const head = f.git(f.publisher, 'rev-parse', 'HEAD')
  assert.equal(f.git(f.remote, 'rev-parse', `refs/tags/v${version}`), head)
  assert.equal(f.git(f.remote, 'rev-parse', 'refs/heads/main'), head)
  f.git(f.publisher, 'merge-base', '--is-ancestor', incoming, head)
  assert.equal(
    readFileSync(join(f.publisher, 'app.txt'), 'utf8'),
    'concurrent application\n'
  )
})

test('a rejected version tag cannot leave only the version-bump branch published', (t) => {
  const f = fixture(t)
  const version = f.prepare()
  writeFileSync(
    join(f.remote, 'hooks', 'pre-receive'),
    '#!/bin/sh\nwhile read old new ref; do\n  case "$ref" in refs/tags/*) echo "fixture rejects tags" >&2; exit 1;; esac\ndone\n',
    { mode: 0o755 }
  )
  const result = f.execute('Commit and tag deployment version', {
    VERSION: version,
  })
  assert.notEqual(result.status, 0)
  assert.equal(f.git(f.remote, 'rev-parse', 'refs/heads/main'), f.original)
  assert.notEqual(
    f.run(f.remote, 'git', ['rev-parse', '--verify', `refs/tags/v${version}`])
      .status,
    0
  )
})

test('a conflicting upstream package change fails without overwriting the user commit', (t) => {
  const f = fixture(t)
  const version = f.prepare()
  const incoming = f.concurrentCommit(
    'package.json',
    JSON.stringify({ name: 'fixture', version: '2.0.0' }, null, 2) + '\n'
  )
  const result = f.execute('Commit and tag deployment version', {
    VERSION: version,
  })
  assert.notEqual(result.status, 0)
  assert.equal(f.git(f.remote, 'rev-parse', 'refs/heads/main'), incoming)
  assert.notEqual(
    f.run(f.remote, 'git', ['rev-parse', '--verify', `refs/tags/v${version}`])
      .status,
    0
  )
})

test('an existing conflicting remote version tag is never overwritten or partially published', (t) => {
  const f = fixture(t)
  const version = f.prepare()
  f.git(f.remote, 'tag', `v${version}`, f.original)
  const result = f.execute('Commit and tag deployment version', {
    VERSION: version,
  })
  assert.notEqual(result.status, 0)
  assert.equal(f.git(f.remote, 'rev-parse', 'refs/heads/main'), f.original)
  assert.equal(
    f.git(f.remote, 'rev-parse', `refs/tags/v${version}`),
    f.original
  )
})

test('publication rejects a non-main ref before committing or pushing', (t) => {
  const f = fixture(t)
  const version = f.prepare()
  const result = f.execute('Commit and tag deployment version', {
    VERSION: version,
    GITHUB_REF: 'refs/heads/other',
  })
  assert.notEqual(result.status, 0)
  assert.equal(f.git(f.publisher, 'rev-parse', 'HEAD'), f.original)
  assert.equal(f.git(f.remote, 'rev-parse', 'refs/heads/main'), f.original)
})

test('publication rejects a version that differs from package.json', (t) => {
  const f = fixture(t)
  f.prepare()
  const result = f.execute('Commit and tag deployment version', {
    VERSION: '1.0.260909-2',
  })
  assert.notEqual(result.status, 0)
  assert.equal(f.git(f.publisher, 'rev-parse', 'HEAD'), f.original)
})

test('release.json records the actual rebased checkout and remote tag', (t) => {
  const f = fixture(t)
  const version = f.prepare()
  f.concurrentCommit('app.txt', 'built after rebase\n')
  const publish = f.execute('Commit and tag deployment version', {
    VERSION: version,
  })
  assert.equal(publish.status, 0, publish.stderr)
  mkdirSync(join(f.publisher, 'dist'))
  const record = f.execute('Record release provenance', { VERSION: version })
  assert.equal(record.status, 0, record.stderr)
  const commit = f.git(f.publisher, 'rev-parse', 'HEAD')
  assert.deepEqual(
    JSON.parse(readFileSync(join(f.publisher, 'dist/release.json'), 'utf8')),
    {
      schemaVersion: 1,
      version,
      commit,
      tag: `v${version}`,
    }
  )
  assert.match(
    readFileSync(f.env.GITHUB_OUTPUT, 'utf8'),
    new RegExp(`^commit=${commit}$`, 'm')
  )
})

test('provenance fails closed if the published tag is missing or points elsewhere', (t) => {
  const f = fixture(t)
  const version = f.prepare()
  mkdirSync(join(f.publisher, 'dist'))
  const missing = f.execute('Record release provenance', { VERSION: version })
  assert.notEqual(missing.status, 0)
  f.git(f.publisher, 'add', 'package.json')
  f.git(f.publisher, 'commit', '-m', 'Local version not published')
  f.git(f.remote, 'tag', `v${version}`, f.original)
  const different = f.execute('Record release provenance', { VERSION: version })
  assert.notEqual(different.status, 0)
  assert.match(different.stderr, /Remote version tag does not match/)
})

test('workflow gates the built artifact and preserves Pages base and SPA fallback', () => {
  const build = workflow.indexOf('      - name: Build project site')
  assert.ok(
    workflow.indexOf('      - name: Verify release workflow') <
      workflow.indexOf('      - name: Calculate deployment version')
  )
  assert.ok(workflow.indexOf('      - name: Verify application tests') < build)
  assert.ok(
    workflow.indexOf('      - name: Commit and tag deployment version') < build
  )
  assert.ok(workflow.indexOf('      - name: Record release provenance') > build)
  assert.ok(
    workflow.indexOf('      - name: Record release provenance') <
      workflow.indexOf('      - name: Upload Pages artifact')
  )
  assert.match(workflow, /VITE_BASE_PATH: \/tensho-web\//)
  assert.ok(
    workflow.includes('VITE_APP_VERSION: ${{ steps.version.outputs.version }}')
  )
  assert.match(workflow, /cp dist\/index\.html dist\/404\.html/)
  assert.match(workflow, /cancel-in-progress: false/)
})

test('runtime setup uses the repository Bun pin and Node 22 before release checks', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  )
  assert.equal(manifest.packageManager, 'bun@1.3.3')
  assert.equal(
    readFileSync(new URL('../.nvmrc', import.meta.url), 'utf8').trim(),
    '22'
  )
  assert.match(workflow, /bun-version-file: package\.json/)
  assert.doesNotMatch(workflow, /bun-version: 1\.1\.38/)
  assert.match(workflow, /node-version-file: \.nvmrc/)
  assert.ok(
    workflow.indexOf('      - name: Set up Node') <
      workflow.indexOf('      - name: Verify release workflow')
  )
})
