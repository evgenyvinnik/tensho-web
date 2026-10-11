import { test, expect, type Locator } from '@playwright/test'
import type { ClassicRunSnapshot } from '../src/game/ClassicRunSnapshot'

test.use({ trace: 'retain-on-failure' })

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
  test(`every physical tile remains reachable with the first lesson open (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    // This deliberately exercises every tile twice, not just one smoke click.
    // Keep each interaction bounded while allowing the full rack journey.
    test.setTimeout(60_000)
    page.setDefaultTimeout(5_000)
    page.setDefaultNavigationTimeout(30_000)
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.clock.setFixedTime(new Date(1791731727055))
    await page.addInitScript(() =>
      localStorage.setItem('tensho_tutorial_completed', 'true')
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(new URL(`${language}/play`, baseURL).href)
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    const raw = () =>
      page.evaluate(() => localStorage.getItem('tensho-classic-run-v1')!)
    const before: ClassicRunSnapshot = JSON.parse(await raw()).snapshot
    await page.evaluate(() => document.fonts.ready)
    await info.attach('initial-save', {
      body: await raw(),
      contentType: 'application/json',
    })
    const hint = page.locator('[data-progressive-hint="guided-first-move-v2"]')
    await expect(hint.locator('details')).toHaveAttribute('open')
    const activate = async (tile: Locator) => {
      await tile.scrollIntoViewIfNeeded()
      await expect(tile).toBeInViewport()
      expect(
        await tile.evaluate((node) => {
          const box = node.getBoundingClientRect()
          return node.contains(
            document.elementFromPoint(
              box.left + box.width / 2,
              box.top + box.height / 2
            )
          )
        })
      ).toBe(true)
      if (isMobile) await tile.tap()
      else await tile.click()
    }
    const hand = page.locator('[data-play-zone="hand"] [data-play-tile]')
    const ids = before.state.handTiles.map((tile) => tile.id)
    for (const [index, id] of ids.entries()) {
      await expect(page.locator(`[data-play-tile="${id}"]`)).toHaveCount(1)
      await activate(
        page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
      )
      const staged = page.locator(
        `[data-play-zone="staging"] [data-play-tile="${id}"]`
      )
      await expect(staged).toHaveCount(1)
      await expect(
        page.locator('[data-play-zone="staging"] [data-play-tile]')
      ).toHaveCount(1)
      await expect(hint.locator('details')).toHaveAttribute('open')
      await expect(page.locator('[data-game-action="play"]')).toBeInViewport({
        ratio: 1,
      })
      await expect(staged.locator('.ring-golden-yellow')).toHaveCount(0)
      await staged.scrollIntoViewIfNeeded()
      if (index === 0)
        await page.screenshot({
          path: info.outputPath('staged-with-open-guidance.png'),
        })
      await activate(staged)
      await expect(hand).toHaveCount(ids.length)
      await expect(
        page.locator('[data-play-zone="staging"] [data-play-tile]')
      ).toHaveCount(0)
    }
    // None of these stage/return gestures plays, discards, pays or hides guidance.
    expect(JSON.parse(await raw()).snapshot).toEqual(before)
    await expect(hint.locator('details')).toHaveAttribute('open')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    expect(errors).toEqual([])
  })
}
