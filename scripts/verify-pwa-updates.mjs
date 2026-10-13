/** Real two-release upgrade test. Build two production folders with different
 * VITE_APP_VERSION values (pwa-before / pwa-after), both under /tensho-web/.
 * Updates install silently: never during a run, only at a safe boundary such
 * as the menu, after the run is saved, and not while another tab is open.
 * Usage: node scripts/verify-pwa-updates.mjs /abs/before /abs/after /abs/artifacts
 * Optional TENSHO_PWA_CASE selects labels by substring for diagnosis; a filtered
 * pass is not a full-suite pass. Unmatched filters fail instead of skipping all.
 * Does not touch an installed user browser or the live deployment. */
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { chromium, expect } from '@playwright/test'
import { illustrationCopies } from './lib/illustration-delivery.mjs'

const [before, after, artifacts] = process.argv
  .slice(2)
  .map((path) => resolve(path))
assert.ok(
  before && after && artifacts,
  'Provide before, after and artifact directories'
)
await mkdir(artifacts, { recursive: true })
for (const dir of [before, after]) await stat(resolve(dir, 'sw.js'))
const base = '/tensho-web/'
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
}
let releaseDir = before
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    if (!url.pathname.startsWith(base)) {
      res.writeHead(404).end()
      return
    }
    let path = resolve(
      releaseDir,
      decodeURIComponent(url.pathname.slice(base.length))
    )
    if (path !== releaseDir && !path.startsWith(releaseDir + sep)) {
      res.writeHead(403).end()
      return
    }
    if (!extname(path)) path = resolve(releaseDir, 'index.html')
    const body = await readFile(path)
    res
      .writeHead(200, {
        'Content-Type': mime[extname(path)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      })
      .end(body)
  } catch {
    res.writeHead(404).end()
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const root = origin + base
const browser = await chromium.launch()
const classicKey = 'tensho-classic-run-v1'
const caseFilter = process.env.TENSHO_PWA_CASE ?? ''
let matchedCases = 0
const readSave = (page, key) =>
  page.evaluate(
    (key) => JSON.parse((window.pwaProbeStorage ?? localStorage).getItem(key)),
    key
  )
const act = async (locator, mobile) =>
  mobile ? locator.tap() : locator.click()

try {
  for (const mobile of [false, true]) {
    for (const failure of ['saved', 'write-failure']) {
      const failSave = failure !== 'saved'
      releaseDir = before
      const label = `classic-${mobile ? 'touch' : 'desktop'}-${failure}`
      if (caseFilter && !label.includes(caseFilter)) continue
      matchedCases++
      const context = await browser.newContext({
        viewport: mobile
          ? { width: 320, height: 568 }
          : { width: 1280, height: 800 },
        isMobile: mobile,
        hasTouch: mobile,
        reducedMotion: 'reduce',
      })
      // Record API timing without duplicating the complete 70 MB offline
      // cache in every trace. Explicit UI screenshots are retained below.
      await context.tracing.start({ screenshots: false, snapshots: false })
      const page = await context.newPage()
      const errors = []
      const startedAt = performance.now()
      const pendingRequests = new Map()
      const diagnostics = []
      const record = (event) => {
        diagnostics.push({ elapsedMs: performance.now() - startedAt, ...event })
        if (diagnostics.length > 500) diagnostics.shift()
      }
      page.on('request', (request) => {
        pendingRequests.set(request, {
          url: request.url(),
          type: request.resourceType(),
          startedMs: performance.now() - startedAt,
        })
      })
      page.on('requestfinished', (request) => {
        record({ event: 'requestfinished', ...pendingRequests.get(request) })
        pendingRequests.delete(request)
      })
      page.on('requestfailed', (request) => {
        record({
          event: 'requestfailed',
          ...pendingRequests.get(request),
          failure: request.failure(),
        })
        pendingRequests.delete(request)
      })
      page.on('response', (response) => {
        if (response.status() >= 400)
          record({
            event: 'http-error',
            url: response.url(),
            status: response.status(),
          })
      })
      page.on('console', (message) => {
        if (['warning', 'error'].includes(message.type()))
          record({ event: 'console', type: message.type(), text: message.text() })
      })
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('dialog', (dialog) => {
        errors.push(`Unexpected native dialog: ${dialog.type()}`)
        void dialog.dismiss()
      })
      // Updates are silent: no screen may ever offer or announce one.
      const expectNoUpdateUi = () =>
        expect(page.getByText(/update available/i)).toHaveCount(0)
      const stillBefore = async () => {
        // Give a would-be activation time to reload the document.
        await page.waitForTimeout(1500)
        await expect(page.locator('body')).toContainText('pwa-before')
      }
      try {
        await page.goto(root + 'en/')
        await expect(page.locator('body')).toContainText('pwa-before')
        // Installation is a complete ~70 MB precache, not a click timeout.
        await expect
          .poll(
            () =>
              page.evaluate(
                async () =>
                  (await navigator.serviceWorker.getRegistration())?.active
                    ?.state
              ),
            { timeout: 90_000 }
          )
          .toBe('activated')
        await page.reload()
        await page.waitForFunction(() =>
          Boolean(navigator.serviceWorker.controller)
        )
        console.log(JSON.stringify({ label, stage: 'installed-and-controlled' }))
        await page.getByRole('button', { name: 'New Run', exact: true }).click()
        await expect(
          page.locator('[data-classic-save-status="saved"]')
        ).toBeVisible()
        // The "?" guide opens by itself on a first run.
        await page.getByRole('button', { name: /^Let.s play$/ }).click()
        const previous = await readSave(page, classicKey)
        if (failSave)
          await page.evaluate((key) => {
            const original = Storage.prototype.setItem
            window.restoreStorage = () => {
              Storage.prototype.setItem = original
            }
            Storage.prototype.setItem = function (name, value) {
              if (name === key)
                throw new DOMException('Test quota failure', 'QuotaExceededError')
              return original.call(this, name, value)
            }
          }, classicKey)
        for (let i = 0; i < 2; i++)
          await act(
            page.locator('[data-play-zone="hand"] [data-play-tile]').last(),
            mobile
          )
        await page.locator('[data-game-action="play"]').click()
        if (failSave)
          await expect(
            page.locator('[data-classic-save-status="unavailable"]')
          ).toBeVisible()
        else
          await expect
            .poll(
              async () =>
                (await readSave(page, classicKey)).snapshot.state
                  .handsPlayedThisRun
            )
            .toBe(1)
        if (failSave) assert.deepEqual(await readSave(page, classicKey), previous)
        const savedBefore = await readSave(page, classicKey)

        releaseDir = after
        await page.evaluate(async () => {
          const r = await navigator.serviceWorker.getRegistration()
          await r.update()
        })
        await expect
          .poll(
            () =>
              page.evaluate(async () =>
                Boolean(
                  (await navigator.serviceWorker.getRegistration())?.waiting
                )
              ),
            { timeout: 90_000 }
          )
          .toBe(true)
        console.log(JSON.stringify({ label, stage: 'update-waiting' }))
        // A waiting update never interrupts or announces itself during play.
        await stillBefore()
        await expectNoUpdateUi()

        // Another open window keeps the old release in use: activation waits.
        const sibling = await context.newPage()
        await sibling.goto(root + 'en/settings')
        await expect(sibling.locator('body')).toContainText('pwa-before')
        if (failSave) await page.evaluate(() => window.restoreStorage())
        // Leaving the table is a safe boundary: the run is saved first.
        await page.getByRole('button', { name: 'Exit', exact: true }).click()
        await page
          .getByRole('button', { name: 'Save and leave', exact: true })
          .click()
        await expect(
          page.getByRole('button', { name: 'Resume run' })
        ).toBeVisible()
        await stillBefore()
        await expect(sibling.locator('body')).toContainText('pwa-before')
        await expectNoUpdateUi()
        const durable = await readSave(page, classicKey)
        assert.equal(durable.snapshot.state.handsPlayedThisRun, 1)
        if (!failSave) {
          const { tileIdCounter: originalCounter, ...original } =
            savedBefore.snapshot
          const { tileIdCounter: currentCounter, ...current } = durable.snapshot
          assert.ok(
            Number.isSafeInteger(currentCounter) &&
              currentCounter >= originalCounter
          )
          assert.deepEqual(current, original)
        }
        await page.screenshot({
          path: resolve(artifacts, `${label}-postponed.png`),
        })
        await sibling.close()
        // The next safe boundary applies it: open Settings from the menu.
        await page.getByRole('button', { name: 'Settings', exact: true }).click()
        await expect(page.locator('body')).toContainText('pwa-after', {
          timeout: 30_000,
        })
        assert.deepEqual(
          (await readSave(page, classicKey)).snapshot,
          durable.snapshot
        )
        // Previously unvisited lazy screens must still work completely offline.
        await context.setOffline(true)
        // Decode every replacement, including artwork never visited before
        // upgrading. HTTP 200 alone could be an incorrect HTML fallback.
        const offlineImages = await page.evaluate(async (paths) => {
          return Promise.all(paths.map(async (path) => {
            const response = await fetch(path)
            if (!response.ok) throw new Error(`Offline asset: ${path}`)
            const bitmap = await createImageBitmap(await response.blob())
            const size = [bitmap.width, bitmap.height]
            bitmap.close()
            return size
          }))
        }, illustrationCopies.flatMap(({ copies }) => copies.map(({ path }) => root + path)))
        assert.equal(offlineImages.length, 52)
        assert.ok(offlineImages.every(([w, h]) => w > 0 && h > 0))
        await page.goto(root + 'en/codex')
        await expect(
          page.getByRole('heading', { name: /Codex/, level: 1 })
        ).toBeVisible()
        await page.goto(root + 'en/play')
        await expect(page.locator('[data-game-action="play"]')).toBeVisible()
        assert.deepEqual(
          (await readSave(page, classicKey)).snapshot,
          durable.snapshot
        )
        await page.screenshot({
          path: resolve(artifacts, `${label}-resumed.png`),
        })
        assert.deepEqual(errors, [])
        console.log(
          JSON.stringify({
            label,
            passed: true,
            savedAcrossUpgrade: true,
            deferredDuringPlay: true,
            otherTabsBlocked: true,
            offlineResume: true,
            offlineIllustrations: offlineImages.length,
          })
        )
      } catch (error) {
        // Capture request/console evidence without evaluating a possibly
        // stalled renderer or changing any interaction/assertion deadlines.
        await writeFile(
          resolve(artifacts, `${label}-diagnostics.json`),
          JSON.stringify({
            label,
            errors,
            url: page.url(),
            failure: String(error),
            pendingRequests: [...pendingRequests.values()],
            events: diagnostics,
          }, null, 2)
        )
        console.error(
          JSON.stringify({
            label,
            errors,
            url: page.url(),
            failure: String(error),
          })
        )
        await page
          .screenshot({ path: resolve(artifacts, `${label}-failure.png`) })
          .catch(() => {})
        throw error
      } finally {
        await context.tracing.stop({
          path: resolve(artifacts, `${label}.zip`),
        })
        await context.close()
      }
    }
  }
  assert.ok(matchedCases > 0, `No cases match ${caseFilter}`)
  console.log(
    JSON.stringify({
      caseFilter: caseFilter || null,
      passedCases: matchedCases,
      completeSuite: !caseFilter,
    })
  )
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}
