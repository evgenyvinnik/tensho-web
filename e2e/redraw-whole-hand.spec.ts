import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { ClassicRunSnapshot } from '../src/game/ClassicRunSnapshot'
import { settleReveals, turnBudget } from './helpers/table'

// REDRAW takes any number of tiles: Select all picks the whole rack in one
// tap, and the reason line says REDRAW still takes them all.
for (const language of ['en', 'ja'])
  test(`Select all sends the whole rack to REDRAW for one Turn (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }) => {
    test.setTimeout(60_000)
    page.setDefaultTimeout(10_000)
    page.setDefaultNavigationTimeout(30_000)
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.clock.setFixedTime(new Date(1791731727055))
    await page.addInitScript(() => {
      localStorage.setItem('tensho_tutorial_completed', 'true')
      localStorage.setItem('tensho_hints_disabled', 'true')
    })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const activate = async (node: Locator) => {
      if (isMobile) await node.tap()
      else await node.click()
    }
    const saved = async (): Promise<ClassicRunSnapshot> => {
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      return page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
      )
    }
    const ids = (run: ClassicRunSnapshot) =>
      run.state.handTiles.map((tile) => tile.id).sort()
    // Picked tiles are pressed wherever the table shows them.
    const picked = page.locator('[data-play-tile][aria-pressed="true"]')
    const unpicked = page.locator('[data-play-tile][aria-pressed="false"]')
    const selectAll = page.locator('[data-select-all]')
    const redraw = page.locator('[data-game-action="redraw"]')
    const play = page.locator('[data-game-action="play"]')

    await page.goto(new URL(`${language}/play`, baseURL).href)
    await expect(play).toBeVisible()
    await settleReveals(page, 2_000)
    const start = await saved()
    const hand = ids(start)
    expect(hand.length).toBeGreaterThan(6)

    // One tap picks every tile; a second puts them all back.
    await expect(selectAll).toHaveText(copy.gameplay.selectAll)
    await activate(selectAll)
    await expect(picked).toHaveCount(hand.length)
    await expect(unpicked).toHaveCount(0)
    await expect(selectAll).toHaveText(copy.gameplay.clearAll)
    await activate(selectAll)
    await expect(picked).toHaveCount(0)
    await expect(unpicked).toHaveCount(hand.length)

    // Too many to play is not too many to REDRAW, and the reason says so.
    await activate(selectAll)
    await expect(play).toBeDisabled()
    await expect(redraw).toBeEnabled()
    await expect(page.locator('[data-action-reason]')).toHaveText(
      copy.gameplay.reasonMaximumRedraw.replace('{{count}}', '6')
    )

    const before = await turnBudget(page)
    await activate(redraw)
    await expect
      .poll(async () => (await saved()).state.handsRemaining)
      .toBe(start.state.handsRemaining - (before.free > 0 ? 0 : 1))
    await settleReveals(page)
    const after = await saved()
    // Every tile went to the river; none of the old rack is left.
    expect(ids(after).filter((id) => hand.includes(id))).toEqual([])
    expect(after.state.discards.map((tile) => tile.id).sort()).toEqual(
      expect.arrayContaining(hand)
    )
    expect(after.state.handTiles.length).toBeGreaterThanOrEqual(hand.length)
    await expect(picked).toHaveCount(0)
    await expect(selectAll).toHaveText(copy.gameplay.selectAll)
    expect(errors).toEqual([])
  })
