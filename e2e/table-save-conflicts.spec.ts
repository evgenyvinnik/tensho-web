import { test, expect, type Page, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

const key = 'tensho-table-loop-v1'
const readSave = (page: Page) =>
  page.evaluate((key) => localStorage.getItem(key), key)
const act = (node: Locator, touch: boolean) =>
  touch ? node.tap() : node.click()
async function holdSaveLock(page: Page) {
  await page.evaluate(async () => {
    const state = window as unknown as { releaseTableSave?: () => void }
    let entered!: () => void
    const ready = new Promise<void>((resolve) => {
      entered = resolve
    })
    void navigator.locks.request(
      'tensho-table-loop-write',
      { mode: 'exclusive' },
      () => {
        entered()
        return new Promise<void>((resolve) => {
          state.releaseTableSave = resolve
        })
      }
    )
    await ready
  })
}
const releaseSaveLock = (page: Page) =>
  page.evaluate(() => {
    ;(window as unknown as { releaseTableSave: () => void }).releaseTableSave()
  })

for (const language of ['en', 'es']) {
  const copy = JSON.parse(
    readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
  )
  for (const scenario of [
    'continue',
    'race',
    'reset',
    'empty-reset',
  ] as const) {
    test(`Table Loop cross-window ${scenario} (${language})`, async ({
      page: a,
      context,
      baseURL,
      isMobile,
    }, info) => {
      const errors: string[] = []
      const prepare = async (page: Page) => {
        page.on('pageerror', (error) => errors.push(error.message))
        await page.setViewportSize(
          isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
        )
        await page.emulateMedia({ reducedMotion: 'reduce' })
      }
      await prepare(a)
      await a.goto(
        new URL(
          `${language}/table-loop${scenario === 'empty-reset' ? '' : '?seed=7'}`,
          baseURL
        ).href
      )
      if (scenario !== 'empty-reset') {
        await act(a.getByTestId('table-decree-echoing_bamboo'), isMobile)
        await expect
          .poll(
            async () => JSON.parse((await readSave(a)) ?? '{}').actions?.length
          )
          .toBe(1)
      } else {
        await expect(a.getByTestId('table-decree-echoing_bamboo')).toBeVisible()
        expect(await readSave(a)).toBeNull()
      }
      const b = await context.newPage()
      await prepare(b)
      const exchange = async (page: Page, index = 0) => {
        await act(
          page.locator('[data-testid^="rack-tile-"]').nth(index),
          isMobile
        )
        await act(page.getByTestId('table-loop-exchange'), isMobile)
      }
      const paused = (page: Page) =>
        page.getByRole('heading', {
          name: copy.tableLoop.save.conflictTitle,
          exact: true,
        })
      const load = async (page: Page) => {
        await act(
          page.getByRole('button', {
            name: copy.tableLoop.save.loadLatest,
            exact: true,
          }),
          isMobile
        )
        const dialog = page.getByRole('dialog', {
          name: copy.tableLoop.save.loadLatest,
          exact: true,
        })
        await expect(dialog).toContainText(copy.tableLoop.save.loadConfirm)
        await expect(
          dialog.getByRole('button', { name: copy.common.cancel, exact: true })
        ).toBeFocused()
        return dialog
      }
      if (scenario === 'reset' || scenario === 'empty-reset') {
        await holdSaveLock(a)
        await b.goto(new URL(`${language}/settings`, baseURL).href)
        await act(
          b.getByRole('button', {
            name: copy.settings.resetProgress,
            exact: true,
          }),
          isMobile
        )
        await act(
          b
            .getByRole('dialog')
            .getByRole('button', { name: copy.common.confirm, exact: true }),
          isMobile
        )
        await expect
          .poll(() =>
            a.evaluate(
              async () =>
                (await navigator.locks.query()).pending?.filter(
                  (lock) => lock.name === 'tensho-table-loop-write'
                ).length
            )
          )
          .toBe(1)
        if (scenario === 'empty-reset')
          await act(a.getByTestId('table-decree-echoing_bamboo'), isMobile)
        else await exchange(a)
        await expect
          .poll(() =>
            a.evaluate(
              async () =>
                (await navigator.locks.query()).pending?.filter(
                  (lock) => lock.name === 'tensho-table-loop-write'
                ).length
            )
          )
          .toBe(2)
        await releaseSaveLock(a)
        await expect(b.getByRole('dialog')).toContainText(
          copy.settings.resetProgressSuccess
        )
        await expect(paused(a)).toBeVisible()
        expect(await readSave(a)).toBeNull()
        const dialog = await load(a)
        await act(
          dialog.getByRole('button', {
            name: copy.common.confirm,
            exact: true,
          }),
          isMobile
        )
        await expect(a.getByTestId('table-decree-patient_pair')).toBeVisible()
        expect(await readSave(a)).toBeNull()
        await act(a.getByTestId('table-decree-patient_pair'), isMobile)
        await expect
          .poll(async () => JSON.parse((await readSave(a)) ?? '{}').actions)
          .toEqual([{ type: 'chooseStarter', decree: 'patient_pair' }])
      } else {
        await b.goto(new URL(`${language}/table-loop`, baseURL).href)
        await expect(b.getByTestId('table-loop-rack')).toBeVisible()
        const before = await readSave(a)
        if (scenario === 'race') {
          await holdSaveLock(a)
          await exchange(a)
          await exchange(b, 1)
          await expect
            .poll(() =>
              a.evaluate(
                async () =>
                  (await navigator.locks.query()).pending?.filter(
                    (lock) => lock.name === 'tensho-table-loop-write'
                  ).length
              )
            )
            .toBe(2)
          expect(await readSave(a)).toBe(before)
          await releaseSaveLock(a)
        } else await exchange(a)
        await expect(paused(b)).toBeVisible()
        await expect(a.getByTestId('table-loop-rack')).toBeVisible()
        const latest = await readSave(a)
        expect(JSON.parse(latest!).actions).toHaveLength(2)
        expect(await b.getByTestId('table-loop-exchange').count()).toBe(0)
        const image = b.locator('main img')
        await expect
          .poll(() =>
            image.evaluate(
              (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
            )
          )
          .toBe(true)
        expect(
          await b.evaluate(() => document.documentElement.scrollWidth)
        ).toBeLessThanOrEqual(isMobile ? 320 : 1280)
        await b.screenshot({ path: info.outputPath('paused.png') })
        let dialog = await load(b)
        await act(
          dialog.getByRole('button', { name: copy.common.cancel, exact: true }),
          isMobile
        )
        await expect(paused(b)).toBeVisible()
        expect(await readSave(b)).toBe(latest)
        dialog = await load(b)
        await act(
          dialog.getByRole('button', {
            name: copy.common.confirm,
            exact: true,
          }),
          isMobile
        )
        await expect(b.getByTestId('table-loop-rack')).toBeVisible()
        expect(await readSave(b)).toBe(latest)
        await exchange(b, 2)
        await expect(paused(a)).toBeVisible()
        const continued = await readSave(b)
        expect(JSON.parse(continued!).actions).toHaveLength(3)
        await b.reload()
        await expect(b.getByTestId('table-loop-rack')).toBeVisible()
        expect(await readSave(b)).toBe(continued)
      }
      expect(errors).toEqual([])
      await a.screenshot({ path: info.outputPath('final.png') })
      await b.close()
    })
  }
}
