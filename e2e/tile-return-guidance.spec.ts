import { test, expect, type Locator } from '@playwright/test'
import type { ClassicRunSnapshot } from '../src/game/ClassicRunSnapshot'
import { settleReveals } from './helpers/table'

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
  test(`every physical tile selects and returns in place without spending anything (${language})`, async ({
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
    // A new run reveals its starting Decrees once the table is up.
    await settleReveals(page, 2_000)
    const raw = () =>
      page.evaluate(() => localStorage.getItem('tensho-classic-run-v1')!)
    const before: ClassicRunSnapshot = JSON.parse(await raw()).snapshot
    await page.evaluate(() => document.fonts.ready)
    await info.attach('initial-save', {
      body: await raw(),
      contentType: 'application/json',
    })
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
    const selected = page.locator(
      '[data-play-zone="hand"] [data-play-tile][aria-pressed="true"]'
    )
    const ids = before.state.handTiles.map((tile) => tile.id)
    await expect(hand).toHaveCount(ids.length)
    const order = () =>
      hand.evaluateAll((tiles) =>
        tiles.map((tile) => tile.getAttribute('data-play-tile'))
      )
    const shown = await order()
    expect([...shown].sort()).toEqual([...ids].sort())
    for (const [index, id] of ids.entries()) {
      const tile = page.locator(
        `[data-play-zone="hand"] [data-play-tile="${id}"]`
      )
      await expect(tile).toHaveCount(1)
      // A tap selects the tile where it sits; the rack never reorders.
      await activate(tile)
      await expect(tile).toHaveAttribute('aria-pressed', 'true')
      await expect(selected).toHaveCount(1)
      await expect(page.locator('[data-game-action="play"]')).toBeInViewport({
        ratio: 1,
      })
      if (index === 0)
        await page.screenshot({
          path: info.outputPath('selected-in-place.png'),
        })
      await activate(tile)
      await expect(tile).toHaveAttribute('aria-pressed', 'false')
      await expect(selected).toHaveCount(0)
      await expect(hand).toHaveCount(ids.length)
    }
    await expect(hand).toHaveCount(ids.length)
    expect(await order()).toEqual(shown)
    // None of these select/return gestures plays, redraws or pays.
    expect(JSON.parse(await raw()).snapshot).toEqual(before)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    expect(errors).toEqual([])
  })
}
