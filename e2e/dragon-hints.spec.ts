import { expect, test, type Locator } from '@playwright/test'
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
  test(`Dragon hints teach all three faces and respect the setting (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    test.setTimeout(60_000)
    page.setDefaultTimeout(5_000)
    page.setDefaultNavigationTimeout(30_000)
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.clock.setFixedTime(new Date(1791731727055))
    await page.addInitScript(() =>
      localStorage.setItem('tensho_tutorial_completed', 'true')
    )
    const activate = (node: Locator) => (isMobile ? node.tap() : node.click())
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const playURL = new URL(`${language}/play`, baseURL).href
    const snapshot = () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
      )
    const openGuide = async () => {
      const button = page.locator('[data-open-beginner-guide]')
      await button.scrollIntoViewIfNeeded()
      await activate(button)
      await expect(page.locator('[data-guide-dragons]')).toBeVisible()
    }
    await page.goto(playURL)
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    const before = await snapshot()
    await openGuide()
    const legend = page.locator('[data-guide-dragons]')
    await legend.scrollIntoViewIfNeeded()
    await page.evaluate(() => document.fonts.ready)
    await expect(legend.locator('img')).toHaveCount(3)
    if (['en', 'es', 'fr', 'it', 'ru', 'tr', 'id', 'tl'].includes(language)) {
      const brokenWords = await legend.locator('span').evaluateAll((names) =>
        names.flatMap((name) => {
          const text = name.textContent ?? ''
          const node = name.firstChild
          if (!node || node.nodeType !== Node.TEXT_NODE) return []
          return [...text.matchAll(/\S+/gu)].flatMap((word) => {
            const range = document.createRange()
            range.setStart(node, word.index!)
            range.setEnd(node, word.index! + word[0].length)
            const boxes = [...range.getClientRects()]
            return boxes.some((box) => Math.abs(box.top - boxes[0].top) > 1)
              ? [word[0]]
              : []
          })
        })
      )
      expect(
        brokenWords,
        'Dragon names must wrap between words, not inside them'
      ).toEqual([])
    }
    for (const tone of ['white', 'green', 'red']) {
      const face = legend.getByRole('img', {
        name: copy.tiles[tone],
        exact: true,
      })
      await expect(face).toBeInViewport({ ratio: 1 })
      expect(
        await face.evaluate(
          (img) =>
            (img as HTMLImageElement).complete &&
            (img as HTMLImageElement).naturalWidth > 0
        )
      ).toBe(true)
      const badge = legend.locator(`[data-tile-index-tone="${tone}"]`)
      await expect(badge).toHaveAttribute(
        'data-tile-index',
        copy.tileDetails[`${tone}Index`]
      )
      await expect(badge).toHaveAttribute('aria-hidden', 'true')
      const geometry = await badge.evaluate((node) => {
        const box = node.getBoundingClientRect()
        const tile = node.parentElement!.getBoundingClientRect()
        const style = getComputedStyle(node)
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        context.font = style.font
        return {
          contained:
            box.left >= tile.left &&
            box.right <= tile.right &&
            box.bottom <= tile.bottom,
          textWidth: context.measureText(node.getAttribute('data-tile-index')!)
            .width,
          innerWidth:
            box.width -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight),
        }
      })
      expect(geometry.contained).toBe(true)
      expect(geometry.textWidth).toBeLessThanOrEqual(geometry.innerWidth + 0.5)
    }
    await page.screenshot({ path: info.outputPath('dragon-legend.png') })
    expect(await snapshot()).toEqual(before)

    // Change the actual preference, not a test-only store mutation. The run is
    // preserved while leaving play to visit Settings and reloading it afterward.
    await page.goto(new URL(`${language}/settings`, baseURL).href)
    const hints = page.getByRole('switch', {
      name: copy.settings.tileHints,
      exact: true,
    })
    await expect(hints).toBeChecked()
    await activate(hints)
    await expect(hints).not.toBeChecked()
    await page.goto(playURL)
    await openGuide()
    await expect(legend.locator('[data-tile-index]')).toHaveCount(0)
    await expect(legend.locator('img')).toHaveCount(3)
    expect(await snapshot()).toEqual(before)
    await page.goto(new URL(`${language}/settings`, baseURL).href)
    await expect(hints).not.toBeChecked()
    await activate(hints)
    await page.goto(playURL)
    await openGuide()
    await expect(legend.locator('[data-tile-index]')).toHaveCount(3)
    expect(await snapshot()).toEqual(before)
    expect(errors).toEqual([])
  })
}
