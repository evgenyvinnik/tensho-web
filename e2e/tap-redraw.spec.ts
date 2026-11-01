import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { ClassicRunSnapshot } from '../src/game/ClassicRunSnapshot'
import { settleReveals } from './helpers/table'

// Single-tile Discard is gone: REDRAW sends any number of picked tiles to the
// river. This keeps its old guarantees for one tile, by touch and keyboard,
// in every language: labelled grouped rack, a still rack, a ≥44px action.
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
  test(`grouped rack and a deliberate tap/keyboard REDRAW of one tile (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    // A new run seeds itself from the clock: this pins the same run each time.
    await page.clock.setFixedTime(new Date(1791731727055))
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem('tensho_tutorial_completed', 'true')
      localStorage.setItem('tensho_hints_disabled', 'true')
    })
    await page.goto(new URL(`${language}/play`, baseURL).href)
    await settleReveals(page, 2_000)
    const saved = async (): Promise<ClassicRunSnapshot> => {
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      return page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
      )
    }
    const before = await saved()
    const rack = page.locator('[data-hand-rack]')
    const groups = page.locator('[data-rack-group]')
    await expect(groups.first()).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    for (const group of await groups.all()) {
      expect(
        await group.evaluate((node) => {
          const label = node.querySelector<HTMLElement>(
            '[data-hand-group-label]'
          )!
          const tiles = node.firstElementChild!.getBoundingClientRect()
          return (
            label.scrollWidth <= label.clientWidth + 1 &&
            label.scrollHeight <= label.clientHeight + 1 &&
            node.getBoundingClientRect().width <= tiles.width + 1
          )
        })
      ).toBe(true)
    }
    const positions = () =>
      rack.evaluate((node) => {
        const r = node.getBoundingClientRect()
        return [...node.children].map((child) => {
          const b = child.getBoundingClientRect()
          return {
            x: b.x - r.x,
            y: b.y - r.y,
            width: b.width,
            height: b.height,
          }
        })
      })
    const originalPositions = await positions()
    const tile = groups.first().locator('[data-play-tile]').first()
    const id = (await tile.getAttribute('data-play-tile'))!
    await tile.scrollIntoViewIfNeeded()
    if (isMobile) await tile.tap()
    else {
      await tile.focus()
      await page.keyboard.press('Enter')
    }
    await expect(
      page.locator(`[data-play-zone="felt"] [data-play-tile="${id}"]`)
    ).toHaveAttribute('aria-pressed', 'true')
    const redraw = page.locator('[data-game-action="redraw"]')
    await expect(redraw).toContainText(copy.gameplay.redraw)
    await expect(redraw).toBeEnabled()
    await expect(redraw).toBeInViewport()
    expect((await redraw.boundingBox())!.width).toBeGreaterThanOrEqual(44)
    expect((await redraw.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    // The picked tile's slot waits for it: nothing in the rack moves.
    expect(await positions()).toEqual(originalPositions)
    // Picking is saved with the run, but spends nothing.
    await expect
      .poll(async () => (await saved()).state.selectedTileIds)
      .toEqual([id])
    const staged = await saved()
    expect({ ...staged.state, selectedTileIds: [] }).toEqual({
      ...before.state,
      selectedTileIds: [],
    })
    await page.screenshot({ path: info.outputPath('picked-for-redraw.png') })
    if (isMobile) await redraw.tap()
    else {
      await redraw.focus()
      await page.keyboard.press('Space')
    }
    await expect
      .poll(
        async () =>
          (await saved()).state.discards.filter((tile) => tile.id === id).length
      )
      .toBe(1)
    await settleReveals(page)
    const after = await saved()
    // A free redraw is spent before a Turn; never both.
    const free = before.state.redrawsRemaining > 0
    expect(after.state.redrawsRemaining).toBe(
      before.state.redrawsRemaining - (free ? 1 : 0)
    )
    expect(after.state.handsRemaining).toBe(
      before.state.handsRemaining - (free ? 0 : 1)
    )
    expect(after.state.score).toBe(before.state.score)
    expect(after.state.handTiles.some((tile) => tile.id === id)).toBe(false)
    await expect(redraw).toBeDisabled()
    await expect(
      page.locator('[data-play-zone="felt"] [data-play-tile]')
    ).toHaveCount(0)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.reload()
    expect((await saved()).state).toEqual(after.state)
    expect(errors).toEqual([])
  })
}
