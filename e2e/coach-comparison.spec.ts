import { test, expect, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { ClassicRunSnapshot } from '../src/game/classicRunSnapshot'

test.use({ trace: 'retain-on-failure' })
const languages = [
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
]
for (const [index, language] of languages.entries()) {
  test(`coach compares real tiles, selects freely and pays only on play (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.clock.setFixedTime(new Date(1791731727055))
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() =>
      localStorage.setItem('tensho_tutorial_completed', 'true')
    )
    if (language === 'ru')
      await page.route('**/*.ttf', (route) => route.abort())
    await page.goto(new URL(`${language}/play`, baseURL).href)
    const raw = () =>
      page.evaluate(() => localStorage.getItem('tensho-classic-run-v1')!)
    const saved = async (): Promise<ClassicRunSnapshot> => {
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      return JSON.parse(await raw()).snapshot
    }
    const before = await saved(),
      untouched = await raw()
    const activate = async (control: Locator) => {
      if (isMobile) await control.tap()
      else {
        await control.focus()
        await page.keyboard.press(index % 2 === 0 ? 'Enter' : 'Space')
      }
    }
    const choices = page.locator('[data-coach-choice]')
    await expect(choices).toHaveCount(2)
    for (const choice of await choices.all()) {
      const bounds = (await choice.boundingBox())!
      expect(bounds.width).toBeGreaterThanOrEqual(44)
      expect(bounds.height).toBeGreaterThanOrEqual(44)
      expect(
        await choice.locator('[data-coach-label]').evaluate((node) => {
          const css = getComputedStyle(node)
          return (
            css.textOverflow !== 'ellipsis' &&
            node.scrollWidth <= node.clientWidth + 1 &&
            node.scrollHeight <= node.clientHeight + 1
          )
        })
      ).toBe(true)
    }
    const explain = page.locator('[data-coach-explain]')
    await expect(explain).toHaveAccessibleName(copy.gameplay.coach.explain)
    await expect(explain).toBeInViewport()
    await activate(explain)
    const dialog = page.getByRole('dialog', {
      name: copy.gameplay.coach.explain,
    })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(copy.gameplay.coach.tradeoff)
    const choiceKey = index % 2 === 0 ? 'shape' : 'now'
    const option = dialog.locator(`[data-coach-option="${choiceKey}"]`)
    const expectedIds = await option
      .locator('[data-coach-tile]')
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('data-coach-tile')!)
      )
    const expectedScore = Number(await option.getAttribute('data-coach-score'))
    expect(expectedIds.length).toBeGreaterThanOrEqual(2)
    expect(expectedIds.length).toBeLessThanOrEqual(5)
    for (const tile of await option.locator('[data-coach-tile]').all()) {
      const id = await tile.getAttribute('data-coach-tile')
      expect(before.state.handTiles.some((entry) => entry.id === id)).toBe(true)
      const image = tile.locator('img')
      await expect
        .poll(() =>
          image.evaluate(
            (node: HTMLImageElement) => node.complete && node.naturalWidth > 0
          )
        )
        .toBe(true)
    }
    expect(await raw()).toBe(untouched)
    expect(
      await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    await page.screenshot({ path: info.outputPath('comparison.png') })
    for (const card of await dialog.locator('[data-coach-option]').all()) {
      const preview = card.locator('[data-coach-select]')
      await preview.scrollIntoViewIfNeeded()
      await expect(preview).toBeInViewport()
      const bounds = (await preview.boundingBox())!
      expect(bounds.width).toBeGreaterThanOrEqual(44)
      expect(bounds.height).toBeGreaterThanOrEqual(44)
      expect(
        await card.evaluate((node) =>
          Array.from(
            node.querySelectorAll<HTMLElement>('h3,p,button,img')
          ).every((child) => child.scrollWidth <= child.clientWidth + 1)
        )
      ).toBe(true)
    }
    await option.locator('[data-coach-exact]').scrollIntoViewIfNeeded()
    await page.screenshot({ path: info.outputPath('comparison-choice.png') })
    expect(await raw()).toBe(untouched)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(explain).toBeFocused()
    expect(await raw()).toBe(untouched)
    await activate(explain)
    await activate(dialog.locator('[data-coach-dismiss]'))
    await expect(page.locator('[data-testid="coach-panel"]')).toHaveCount(0)
    await expect(page.locator('[data-wall-chip]')).toBeFocused()
    await expect(page.locator('[data-wall-chip]')).toBeInViewport()
    expect(await raw()).toBe(untouched)
    await page.reload()
    expect(await saved()).toEqual(before)
    await expect(choices).toHaveCount(2)
    await activate(explain)
    await activate(dialog.locator(`[data-coach-select="${choiceKey}"]`))
    await expect(dialog).toHaveCount(0)
    const play = page.locator('[data-game-action="play"]')
    await expect(play).toBeEnabled()
    await expect(play).toBeFocused()
    await expect(play).toBeInViewport()
    const selected = await saved()
    expect(selected).toEqual({
      ...before,
      state: { ...before.state, selectedTileIds: expectedIds },
    })
    await activate(play)
    await expect
      .poll(async () => (await saved()).state.score)
      .toBe(before.state.score + expectedScore)
    const after = await saved()
    expect(after.state.handsRemaining).toBe(
      before.state.handsRemaining -
        1 +
        after.state.handsAllowance -
        before.state.handsAllowance
    )
    await page.reload()
    expect(await saved()).toEqual(after)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    expect(errors).toEqual([])
  })
}
