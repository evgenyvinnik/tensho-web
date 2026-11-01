import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { settleReveals } from './helpers/table'

for (const language of [
  'en',
  'es',
  'fr',
  'it',
  'ru',
  'ja',
  'ko',
  'zh-Hans',
  'zh-Hant',
  'tr',
  'id',
  'th',
  'tl',
]) {
  test(`readable wall contents without spending resources (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem('tensho_tutorial_completed', 'true')
      localStorage.setItem('tensho_hints_disabled', 'true')
    })
    await page.goto(new URL(`${language}/play`, baseURL).href)
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    // A new run opens on its starting Decrees' reveal.
    await settleReveals(page, 2_000)
    const save = () =>
      page.evaluate(() => localStorage.getItem('tensho-classic-run-v1'))
    const before = await save()
    const trigger = page.locator('[data-wall-chip]')
    await trigger.scrollIntoViewIfNeeded()
    if (isMobile) await trigger.tap()
    else {
      await trigger.focus()
      await page.keyboard.press('Enter')
    }
    const dialog = page.getByRole('dialog', { name: copy.gameplay.tilesInWall })
    await expect(dialog).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await expect(
      dialog.getByRole('heading', { name: new RegExp(copy.tiles.manzu) })
    ).toBeVisible()
    const images = dialog.locator('[data-wall-tile] img')
    await expect
      .poll(() =>
        images.evaluateAll((nodes) =>
          nodes.every(
            (node) =>
              (node as HTMLImageElement).complete &&
              (node as HTMLImageElement).naturalWidth > 0
          )
        )
      )
      .toBe(true)
    const count = await dialog
      .locator('[data-wall-count]')
      .evaluateAll((nodes) =>
        nodes.reduce(
          (sum, node) => sum + Number(node.getAttribute('data-wall-count')),
          0
        )
      )
    await expect(trigger).toHaveAccessibleName(
      `${copy.gameplay.tilesInWall}: ${count.toLocaleString(language)}`
    )
    for (const image of await images.all()) {
      expect((await image.boundingBox())!.width).toBeGreaterThanOrEqual(44)
      const caption = image.locator('..').locator('figcaption')
      const name = await image.getAttribute('alt')
      expect(name).toBeTruthy()
      await expect(caption).toContainText(name!)
    }
    expect(
      await dialog
        .locator('[data-wall-breakdown]')
        .evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({ path: info.outputPath('wall.png') })
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
    expect(await save()).toBe(before)
  })
}
