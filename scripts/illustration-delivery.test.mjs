import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { illustrationCopies } from './lib/illustration-delivery.mjs'

test('optimizer preserves authored Script repairs instead of rebuilding their legacy backgrounds', () => {
  const root = mkdtempSync(join(tmpdir(), 'tensho-art-optimizer-'))
  const put = (path, bytes, options) => {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), bytes, options)
  }
  try {
    for (const path of [
      'scripts/optimize-illustrations.mjs',
      'scripts/lib/illustration-delivery.mjs',
      'scripts/illustration-sources.json',
      'docs/script-alpha-repair-manifest.json',
    ])
      put(path, readFileSync(resolve(path)))
    // The conversion stub writes a conspicuous marker. If the optimizer ever
    // rebuilds a repaired image, its byte-for-byte preservation check fails.
    put(
      'bin/cwebp',
      `#!${process.execPath}\nrequire('node:fs').writeFileSync(process.argv[process.argv.indexOf('-o') + 1], 'converted')\n`,
      { mode: 0o755 }
    )
    const originals = new Map()
    const png = Buffer.alloc(24)
    png.writeUInt32BE(1024, 16)
    png.writeUInt32BE(1024, 20)
    for (const { source, copies } of illustrationCopies) {
      put(`public/${source}`, png)
      for (const copy of copies) {
        mkdirSync(dirname(join(root, 'public', copy.path)), { recursive: true })
        if (copy.preserveAuthored) {
          const bytes = readFileSync(resolve('public', copy.path))
          originals.set(copy.path, bytes)
          copyFileSync(
            resolve('public', copy.path),
            join(root, 'public', copy.path)
          )
        }
      }
    }
    const run = () =>
      execFileSync(process.execPath, ['scripts/optimize-illustrations.mjs'], {
        cwd: root,
        env: { ...process.env, PATH: join(root, 'bin') },
        encoding: 'utf8',
        stdio: 'pipe',
      })
    assert.equal(originals.size, 21)
    const output = run()
    assert.equal(output.match(/Preserved authored repair:/g)?.length, 21)
    for (const { copies } of illustrationCopies) {
      for (const copy of copies) {
        const bytes = readFileSync(join(root, 'public', copy.path))
        if (copy.preserveAuthored)
          assert.deepEqual(bytes, originals.get(copy.path))
        else assert.equal(bytes.toString(), 'converted')
      }
    }
    // Missing/corrupt replacements must fail closed, never fall back to PNGs.
    const first = [...originals.keys()][0]
    put(`public/${first}`, Buffer.alloc(32))
    assert.throws(run, /AssertionError/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
