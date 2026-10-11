import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

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
  test(`rack tools are reachable, localized and read-only (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem('tensho_tutorial_completed', 'true')
      localStorage.setItem('tensho_hints_disabled', 'true')
    })
    if (language === 'ru')
      await page.route(/\.ttf(?:\?|$)/, (route) => route.abort())
    await page.goto(new URL(`${language}/play`, baseURL).href)
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    const save = () =>
      page.evaluate(() => localStorage.getItem('tensho-classic-run-v1'))
    const before = await save()
    const more = page.locator('[data-open-rack-tools]')
    const builder = page.locator('[data-open-hand-builder]')
    const riichi = page.locator('[data-open-riichi]')
    const guide = page.locator('[data-open-beginner-guide]')
    const header = page.locator('[data-rack-header]')
    if (isMobile) {
      await expect(more).toHaveAccessibleName(copy.gameplay.moreTools)
      await expect(more).toHaveAttribute('aria-expanded', 'false')
      await expect(builder).not.toBeVisible()
      await expect(riichi).not.toBeVisible()
      await more.scrollIntoViewIfNeeded()
      for (const control of [more, guide]) {
        await expect(control).toBeInViewport()
        const rect = (await control.boundingBox())!
        expect(rect.width).toBeGreaterThanOrEqual(44)
        expect(rect.height).toBeGreaterThanOrEqual(44)
      }
      await more.tap()
      await expect(more).toHaveAttribute('aria-expanded', 'true')
      const art = page.locator('[data-rack-tools] > img')
      await expect(art).toHaveAttribute('src', /table-tools.webp$/)
      await expect
        .poll(() =>
          art.evaluate(
            (node: HTMLImageElement) =>
              node.complete && node.naturalWidth === 512
          )
        )
        .toBe(true)
    } else await expect(more).not.toBeVisible()
    for (const [trigger, title] of [
      [builder, copy.handBuilder.title],
      [riichi, copy.riichiPledge.title],
    ] as const) {
      await expect(trigger).toBeVisible()
      const rect = (await trigger.boundingBox())!
      expect(rect.height).toBeGreaterThanOrEqual(44)
      expect(rect.width).toBeGreaterThanOrEqual(44)
      expect(
        await trigger.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      if (isMobile) await trigger.tap()
      else {
        await trigger.focus()
        await page.keyboard.press('Enter')
      }
      const dialog = page.getByRole('dialog', { name: title })
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(trigger).toBeFocused()
      expect(await save()).toBe(before)
    }
    await header.scrollIntoViewIfNeeded()
    expect(
      await header.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({ path: info.outputPath('rack-tools.png') })
    if (isMobile) {
      await more.tap()
      await expect(builder).not.toBeVisible()
      await more.focus()
      await page.keyboard.press('Enter')
      await expect(builder).toBeVisible()
      await more.focus()
      await page.keyboard.press('Space')
      await expect(builder).not.toBeVisible()
      // CSS breakpoint alone reveals the same controls; resizing never resets
      // an open tool or mounts a second Riichi controller.
      await page.setViewportSize({ width: 640, height: 800 })
      await expect(more).not.toBeVisible()
      await expect(builder).toBeVisible()
      await expect(riichi).toBeVisible()
      await page.setViewportSize({ width: 639, height: 800 })
      await expect(more).toBeVisible()
      await expect(builder).not.toBeVisible()
    } else {
      await builder.click()
      const dialog = page.getByRole('dialog', { name: copy.handBuilder.title })
      await expect(dialog).toBeVisible()
      await page.setViewportSize({ width: 390, height: 664 })
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(builder).toBeVisible()
      await expect(builder).toBeFocused()
      await expect(more).toHaveAttribute('aria-expanded', 'true')
    }
    expect(await save()).toBe(before)
    await page.reload()
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    // Reload claims a new save lease; compare the entire engine snapshot,
    // not the deliberately changed owner, revision and updated timestamp.
    expect(JSON.parse((await save())!).snapshot).toEqual(
      JSON.parse(before!).snapshot
    )
    expect(errors).toEqual([])
  })
}
