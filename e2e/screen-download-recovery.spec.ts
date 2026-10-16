import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

test.skip(
  process.env.TEST_PRODUCTION !== '1',
  'Requires the emitted routed-screens chunk'
)
test.use({ serviceWorkers: 'block' })
// Every routed screen ships in this one chunk (see routedScreens.ts), so a
// document downloads it at most once: only its first screen can fail.
const chunk = /\/routedScreens-[^/]+\.js(?:\?|$)/
const saveKey = 'tensho-classic-run-v1'
const replay = readFileSync('e2e/fixtures/interactions/quad.json', 'utf8')

for (const language of ['en', 'es']) {
  for (const failure of ['once', 'persistent', 'redirected', 'save-blocked']) {
    test(`${language} ${failure}: recover downloads without losing the run`, async ({
      page,
      isMobile,
      baseURL,
    }, info) => {
      test.setTimeout(60_000)
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      const root = `${baseURL!.replace(/\/$/, '')}/${language}`
      const blocked = failure === 'save-blocked'
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(
        ({ key, replay, blocked }) => {
          localStorage.setItem('tensho_hints_disabled', 'true')
          if (!blocked) {
            if (!localStorage.getItem(key)) localStorage.setItem(key, replay)
            return
          }
          // The tab cannot save its run until the test restores storage.
          if (sessionStorage.getItem('download-test:restored')) return
          const original = Storage.prototype.setItem
          Object.assign(window, {
            restoreDownloadTestStorage: () => {
              Storage.prototype.setItem = original
              sessionStorage.setItem('download-test:restored', 'true')
            },
          })
          Storage.prototype.setItem = function (name, value) {
            if (name === key)
              throw new DOMException('Test quota failure', 'QuotaExceededError')
            return original.call(this, name, value)
          }
        },
        { key: saveKey, replay, blocked }
      )
      const activate = (locator: Locator) =>
        isMobile ? locator.tap() : locator.click()
      const table = page.locator('[data-game-action="play"]')
      const savedStatus = page.locator('[data-classic-save-status="saved"]')
      const save = () =>
        page.evaluate((key) => localStorage.getItem(key), saveKey)

      // A Classic run in progress, as this release stores the replayed save.
      // With storage blocked there is none: opening the table starts a run
      // that this tab cannot save.
      let before: { snapshot: unknown } | null = null
      if (!blocked) {
        await page.goto(`${root}/play`)
        await expect(savedStatus).toBeVisible()
        before = JSON.parse((await save())!)
      }

      let documents = 0,
        attempts = 0
      const documentRequests: { url: string; redirectedFrom: string | null }[] =
        []
      const failedRequests: string[] = []
      page.on('request', (request) => {
        if (request.resourceType() !== 'document') return
        const redirectedFrom = request.redirectedFrom()?.url() ?? null
        documentRequests.push({ url: request.url(), redirectedFrom })
        // Pages canonicalizes extensionless paths with a trailing-slash 301.
        // A server redirect is part of one navigation, not another app reload.
        if (!redirectedFrom) documents++
      })
      page.on('requestfailed', (request) =>
        failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`)
      )
      if (failure === 'redirected') {
        // Reproduce Pages' canonical redirect even on the local preview server:
        // the recovery reload of the extensionless URL lands on its slash form.
        let codexDocuments = 0
        await page.route(`${root}/codex`, async (route) => {
          if (!route.request().isNavigationRequest() || codexDocuments++ === 0)
            return route.continue()
          await route.fulfill({
            status: 301,
            headers: { location: `${root}/codex/` },
            body: '',
          })
        })
      }
      await page.route(chunk, async (route) => {
        attempts++
        if (failure === 'once' && attempts > 1) await route.continue()
        else await route.abort('failed')
      })
      const codex = failure === 'redirected'
      const screen = codex
        ? page.getByRole('heading', { name: /Codex|Códice/, level: 1 })
        : table
      await page.goto(`${root}/${codex ? 'codex' : 'play'}`)

      if (failure === 'once') {
        // One automatic save-and-reload fetches the chunk again.
        await expect(screen).toBeVisible()
        expect(attempts).toBe(2)
        expect(documents).toBe(2)
      } else {
        const fallback = page.locator('[data-screen-download-error]')
        const retry = fallback.getByRole('button', {
          name: copy.screenDownload.retry,
          exact: true,
        })
        await expect(fallback).toBeVisible()
        await expect(fallback.getByRole('heading')).toHaveText(
          copy.screenDownload.title
        )
        // A run that cannot be saved is never reloaded away.
        expect(attempts).toBe(blocked ? 1 : 2)
        expect(documents).toBe(blocked ? 1 : 2)
        if (blocked) {
          await expect(fallback.getByRole('status')).toHaveText(
            copy.screenDownload.saveFailed
          )
          await activate(retry)
          await expect(fallback.getByRole('status')).toHaveText(
            copy.screenDownload.saveFailed
          )
          expect(documents).toBe(1)
          expect(await save()).toBeNull()
        } else {
          await expect(fallback.getByRole('status')).toHaveText('')
          expect(JSON.parse((await save())!).snapshot).toEqual(before!.snapshot)
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1
          )
        ).toBe(true)
        await page.screenshot({
          path: info.outputPath('recovery.png'),
          fullPage: true,
        })
        await page.unroute(chunk)
        if (blocked)
          await page.evaluate(() =>
            (
              window as unknown as { restoreDownloadTestStorage: () => void }
            ).restoreDownloadTestStorage()
          )
        await activate(retry)
        await expect(screen).toBeVisible()
      }

      if (codex) await page.goto(`${root}/play`)
      await expect(table).toBeVisible()
      await expect(savedStatus).toBeVisible()
      const after = JSON.parse((await save())!)
      if (blocked) {
        // Saved by the tab that started it, before its reload, rather than
        // replaced by a new run once the table could load.
        expect(after.createdAt).toBeLessThan(
          await page.evaluate(() => performance.timeOrigin)
        )
      } else expect(after.snapshot).toEqual(before!.snapshot)
      await info.attach('download-recovery', {
        body: JSON.stringify({
          attempts,
          documents,
          documentRequests,
          failedRequests,
          revision: after.revision,
        }),
        contentType: 'application/json',
      })
    })
  }
}
