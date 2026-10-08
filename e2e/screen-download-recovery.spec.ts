import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

test.skip(process.env.TEST_PRODUCTION !== '1', 'Requires emitted screen chunks')
test.use({ serviceWorkers: 'block' })
const chunk = /\/CodexScreen-[^/]+\.js(?:\?|$)/
const saveKey = 'tensho-table-loop-v1'

for (const language of ['en', 'es']) {
  for (const failure of ['once', 'persistent', 'redirected', 'save-blocked']) {
    test(`${language} ${failure}: recover downloads without losing the run`, async ({
      page,
      isMobile,
      baseURL,
    }, info) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      const root = `${baseURL!.replace(/\/$/, '')}/${language}`
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const activate = (locator: Locator) =>
        isMobile ? locator.tap() : locator.click()
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
      await page.goto(`${root}/table-loop?seed=7`)
      await activate(page.locator('[data-testid^="table-decree-"]').first())
      await expect(page.getByTestId('table-loop-rack')).toBeVisible()
      const before = await page.evaluate(
        (key) => localStorage.getItem(key),
        saveKey
      )
      expect(JSON.parse(before!).actions).toHaveLength(1)

      if (failure === 'save-blocked') {
        await page.evaluate((key) => {
          const original = Storage.prototype.setItem
          Object.assign(window, {
            restoreDownloadTestStorage: () => {
              Storage.prototype.setItem = original
            },
          })
          Storage.prototype.setItem = function (name, value) {
            if (name === key)
              throw new DOMException('Test quota failure', 'QuotaExceededError')
            return original.call(this, name, value)
          }
        }, saveKey)
        await activate(page.locator('[data-testid^="rack-tile-"]').first())
        await activate(page.getByTestId('table-loop-exchange'))
        expect(
          await page.evaluate((key) => localStorage.getItem(key), saveKey)
        ).toBe(before)
      }

      // Stay in the same document so already-loaded modes retain their real
      // save guards; this is not a synthetic prepareForReload replacement.
      await activate(
        page.getByRole('button', { name: copy.common.mainMenu, exact: true })
      )
      await expect(
        page.getByRole('heading', { name: 'TENSHO', exact: true })
      ).toBeVisible()
      if (failure === 'redirected') {
        // Reproduce Pages' canonical redirect even on the local preview server.
        await page.route(`${root}/codex`, async (route) => {
          if (!route.request().isNavigationRequest()) return route.continue()
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
      await activate(page.getByRole('button', { name: /Codex|Códice/ }))
      if (failure === 'once') {
        await expect(
          page.getByRole('heading', { name: /Codex|Códice/, level: 1 })
        ).toBeVisible()
        expect(attempts).toBe(2)
        expect(documents).toBe(2)
      } else {
        const fallback = page.locator('[data-screen-download-error]')
        await expect(fallback).toBeVisible()
        await expect(fallback.getByRole('heading')).toHaveText(
          copy.screenDownload.title
        )
        expect(attempts).toBe(failure === 'save-blocked' ? 1 : 2)
        expect(documents).toBe(failure === 'save-blocked' ? 1 : 2)
        expect(
          await page.evaluate((key) => localStorage.getItem(key), saveKey)
        ).toBe(before)
        if (failure === 'save-blocked') {
          await expect(fallback.getByRole('status')).toHaveText(
            copy.screenDownload.saveFailed
          )
          await activate(
            fallback.getByRole('button', {
              name: copy.screenDownload.retry,
              exact: true,
            })
          )
          await expect(fallback.getByRole('status')).toHaveText(
            copy.screenDownload.saveFailed
          )
          expect(documents).toBe(1)
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
        if (failure === 'save-blocked')
          await page.evaluate(() =>
            (
              window as unknown as { restoreDownloadTestStorage: () => void }
            ).restoreDownloadTestStorage()
          )
        await activate(
          fallback.getByRole('button', {
            name: copy.screenDownload.retry,
            exact: true,
          })
        )
        await expect(
          page.getByRole('heading', { name: /Codex|Códice/, level: 1 })
        ).toBeVisible()
      }
      const after = await page.evaluate(
        (key) => localStorage.getItem(key),
        saveKey
      )
      if (failure === 'save-blocked')
        expect(JSON.parse(after!).actions).toHaveLength(2)
      else expect(after).toBe(before)
      await page.goto(`${root}/table-loop?seed=7`)
      await expect(page.getByTestId('table-loop-rack')).toBeVisible()
      expect(
        await page.evaluate((key) => localStorage.getItem(key), saveKey)
      ).toBe(after)
      await info.attach('download-recovery', {
        body: JSON.stringify({
          attempts,
          documents,
          documentRequests,
          failedRequests,
          actions: JSON.parse(after!).actions.length,
        }),
        contentType: 'application/json',
      })
    })
  }
}
