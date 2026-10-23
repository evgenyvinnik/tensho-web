/** Verify the actual generated worker, not just Vite's configuration.
 * Run after production build: node scripts/verify-asset-delivery.mjs [dist]
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { illustrationCopies } from './lib/illustration-delivery.mjs'

const root = resolve(process.argv[2] ?? 'dist')
const worker = readFileSync(resolve(root, 'sw.js'), 'utf8')
// Workbox emits literal URL/revision entries. Fail closed if its format changes.
const cached = new Set(
  [...worker.matchAll(/\{url:"([^"\n]+)",revision:/g)].map((m) =>
    decodeURI(m[1])
  )
)
assert.ok(cached.size > 300, 'Unrecognized or incomplete Workbox precache')
const originals = new Set(illustrationCopies.map(({ source }) => source))
let sourceBytes = 0
let deliveryBytes = 0
for (const { source, copies } of illustrationCopies) {
  assert.ok(!cached.has(source), `Original still precached: ${source}`)
  sourceBytes += statSync(resolve(root, source)).size // Retained for old clients.
  for (const { path, maxDimension } of copies) {
    assert.ok(cached.has(path), `Offline delivery copy missing: ${path}`)
    const body = readFileSync(resolve(root, path))
    assert.equal(body.toString('ascii', 8, 12), 'WEBP', path)
    assert.ok(
      body.length <=
        (maxDimension === 256
          ? 32_000
          : maxDimension === 512
            ? 120_000
            : 350_000),
      `Oversized delivery asset: ${path}`
    )
    deliveryBytes += body.length
  }
}
// All remaining artwork, tiles, audio and fonts remain usable offline, including
// future PNGs. An over-large new image cannot disappear via Workbox's size limit.
for (const file of readdirSync(resolve(root, 'assets'), { recursive: true })) {
  const path = `assets/${file}`
  if (
    /\.(?:png|webp|svg|mp3|wav|ttf|woff2?)$/i.test(file) &&
    !originals.has(path)
  ) {
    assert.ok(cached.has(path), `Offline asset missing: ${path}`)
  }
}
// Opening a screen streams one script, never a burst: Chromium compiles each
// streamed script on its own thread-pool task, and a burst that fills the pool
// can freeze the page for good (see src/components/screens/routedScreens.ts).
// Besides the entry, only the routed-screens chunk and the locales are lazy.
const entry = readFileSync(resolve(root, 'index.html'), 'utf8').match(
  /<script type="module"[^>]*\/assets\/([^"/]+\.js)"/
)?.[1]
assert.ok(entry, 'Entry script not found in index.html')
const locales = new Set(
  readdirSync(resolve('src/i18n/locales')).map((file) =>
    file.replace(/\.json$/, '')
  )
)
const lazyScripts = readdirSync(resolve(root, 'assets')).filter(
  (file) => file.endsWith('.js') && file !== entry
)
const screenChunks = lazyScripts.filter((file) =>
  /^routedScreens-[\w-]+\.js$/.test(file)
)
assert.equal(screenChunks.length, 1, 'Routed screens must ship as one chunk')
const strayChunks = lazyScripts.filter(
  (file) =>
    !screenChunks.includes(file) &&
    !locales.has(file.match(/^(.+)-[\w-]{8}\.js$/)?.[1] ?? file)
)
assert.deepEqual(strayChunks, [], 'Screens must not split into extra chunks')
const precacheBytes = [...cached].reduce(
  (sum, path) => sum + statSync(resolve(root, path)).size,
  0
)
// Complete authored portraits replace four reusable frames: 174 identities
// across four editions. Budget this catalog separately so its addition cannot
// hide a regression in the existing offline payload.
const decreeEditionBytes = [...cached]
  .filter((path) =>
    /^assets\/illustrations\/decree-editions\/[^/]+\/(?:foil|holographic|polychrome|negative)\.webp$/.test(
      path
    )
  )
  .reduce((sum, path) => sum + statSync(resolve(root, path)).size, 0)
assert.ok(
  precacheBytes - decreeEditionBytes < 40 * 1024 * 1024,
  `Core offline payload exceeds 40 MiB: ${precacheBytes - decreeEditionBytes}`
)
assert.ok(
  decreeEditionBytes < 20 * 1024 * 1024,
  `Decree edition portraits exceed 20 MiB: ${decreeEditionBytes}`
)
assert.ok(deliveryBytes < sourceBytes / 8, 'Illustration delivery regression')
console.log(
  JSON.stringify(
    {
      entries: cached.size,
      precacheBytes,
      decreeEditionBytes,
      sourceBytes,
      deliveryBytes,
      savedBytes: sourceBytes - deliveryBytes,
    },
    null,
    2
  )
)
