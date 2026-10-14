import { expect, test, type Locator } from '@playwright/test'
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
  test(`the guide teaches every tile family, Dragons included, and rank numbers follow the setting (${language})`, async ({
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
    const openTable = async () => {
      await page.goto(playURL)
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      // A new run reveals its starting Decrees once the table is up.
      await settleReveals(page, 2_000)
    }
    const guide = page.locator('[data-beginner-guide]')
    const families = guide.locator('[data-guide-tile-family]')
    const openGuide = async () => {
      await activate(
        page.getByRole('button', { name: copy.gameplay.help, exact: true })
      )
      await expect(guide).toBeVisible()
      await expect(families).toHaveCount(5)
    }
    const closeGuide = async () => {
      await activate(
        page.getByRole('button', { name: copy.guide.close, exact: true })
      )
      await expect(guide).toHaveCount(0)
    }
    // A badge must sit inside its tile and fit its text.
    const fits = (badge: Locator) =>
      badge.evaluate((node) => {
        const box = node.getBoundingClientRect()
        const tile = node.parentElement!.getBoundingClientRect()
        const style = getComputedStyle(node)
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        context.font = style.font
        return (
          box.left >= tile.left &&
          box.right <= tile.right &&
          box.bottom <= tile.bottom &&
          context.measureText(node.getAttribute('data-tile-index')!).width <=
            box.width -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight) +
              0.5
        )
      })
    const rackBadges = page.locator('[data-play-zone="hand"] [data-tile-index]')

    await openTable()
    const before = await snapshot()
    await openGuide()
    await families.first().scrollIntoViewIfNeeded()
    await page.evaluate(() => document.fonts.ready)
    if (['en', 'es', 'fr', 'it', 'ru', 'tr', 'id', 'tl'].includes(language)) {
      const brokenWords = await families
        .locator('span')
        .evaluateAll((names) =>
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
        'Family names must wrap between words, not inside them'
      ).toEqual([])
    }
    // Every family shows a real face; the guide always numbers its examples
    // (numbered tiles by rank, the Dragon by its localized initial).
    for (const family of await families.all()) {
      const face = family.locator('img')
      await face.scrollIntoViewIfNeeded()
      await expect(face).toBeInViewport({ ratio: 0.95 })
      expect(
        await face.evaluate(
          (img) =>
            (img as HTMLImageElement).complete &&
            (img as HTMLImageElement).naturalWidth > 0
        )
      ).toBe(true)
    }
    const badges = families.locator('[data-tile-index]')
    await expect(badges).toHaveCount(4)
    for (const badge of await badges.all()) {
      await expect(badge).toHaveAttribute('aria-hidden', 'true')
      expect(await fits(badge)).toBe(true)
    }
    const dragon = families.locator('[data-tile-index-tone]')
    await expect(dragon).toHaveAttribute('data-tile-index-tone', 'red')
    await expect(dragon).toHaveAttribute(
      'data-tile-index',
      copy.tileDetails.redIndex
    )
    await expect(
      families.getByRole('img', { name: copy.tiles.red, exact: true })
    ).toBeVisible()
    await page.screenshot({ path: info.outputPath('tile-families.png') })
    await closeGuide()
    // The table's own tiles stay unnumbered until the player asks for it.
    await expect(rackBadges).toHaveCount(0)
    expect(await snapshot()).toEqual(before)

    // Change the actual preference, not a test-only store mutation. The run is
    // preserved while leaving play to visit Settings and reloading it afterward.
    const setRankNumbers = async (on: boolean) => {
      await page.goto(new URL(`${language}/settings`, baseURL).href)
      const numbers = page.getByRole('switch', {
        name: copy.settings.rankNumbers,
        exact: true,
      })
      await expect(numbers).toBeChecked({ checked: !on })
      await activate(numbers)
      await expect(numbers).toBeChecked({ checked: on })
      await openTable()
    }
    await setRankNumbers(true)
    expect(await rackBadges.count()).toBeGreaterThan(0)
    for (const badge of await rackBadges.all()) expect(await fits(badge)).toBe(true)
    await openGuide()
    await expect(badges).toHaveCount(4)
    await closeGuide()
    expect(await snapshot()).toEqual(before)

    await setRankNumbers(false)
    await expect(rackBadges).toHaveCount(0)
    await openGuide()
    await expect(badges).toHaveCount(4)
    expect(await snapshot()).toEqual(before)
    expect(errors).toEqual([])
  })
}
