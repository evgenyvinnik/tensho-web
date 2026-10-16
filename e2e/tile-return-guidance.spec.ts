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
  test(`every physical tile flies to the felt and back to its own slot without spending anything (${language})`, async ({
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
    const felt = page.locator('[data-play-zone="felt"] [data-play-tile]')
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
      // A tap flies the tile onto the felt; its rack slot waits, empty, so
      // nothing in the rack shifts under the next tap.
      await activate(tile)
      const onFelt = page.locator(
        `[data-play-zone="felt"] [data-play-tile="${id}"]`
      )
      await expect(onFelt).toHaveAttribute('aria-pressed', 'true')
      await expect(felt).toHaveCount(1)
      await expect(tile).toHaveCount(0)
      await expect(page.locator(`[data-rack-slot="${id}"]`)).toHaveCount(1)
      await expect(page.locator('[data-game-action="play"]')).toBeInViewport({
        ratio: 1,
      })
      if (index === 0)
        await page.screenshot({
          path: info.outputPath('tile-on-the-felt.png'),
        })
      // A tap on the felt flies it back.
      await activate(onFelt)
      await expect(tile).toHaveAttribute('aria-pressed', 'false')
      await expect(felt).toHaveCount(0)
      await expect(hand).toHaveCount(ids.length)
    }
    await expect(hand).toHaveCount(ids.length)
    expect(await order()).toEqual(shown)
    // The rack is back in its order, and no flight played, redrew or paid.
    expect(JSON.parse(await raw()).snapshot).toEqual(before)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    expect(errors).toEqual([])
  })
}
