import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { ClassicRunSnapshot } from '../src/game/classicRunSnapshot'

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
  test(`grouped rack and deliberate tap/keyboard discard (${language})`, async ({
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
    await page.addInitScript(() => {
      localStorage.setItem('tensho_tutorial_completed', 'true')
      localStorage.setItem('tensho_hints_disabled', 'true')
    })
    await page.goto(new URL(`${language}/play`, baseURL).href)
    const raw = () =>
      page.evaluate(() => localStorage.getItem('tensho-classic-run-v1')!)
    const saved = async (): Promise<ClassicRunSnapshot> => {
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      return JSON.parse(await raw()).snapshot
    }
    const before = await saved()
    const rack = page.locator('[data-hand-rack]')
    const groups = page.locator('[data-rack-group]')
    await expect(groups).toHaveCount(4)
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
    const id = await tile.getAttribute('data-play-tile')
    await tile.scrollIntoViewIfNeeded()
    if (isMobile) await tile.tap()
    else {
      await tile.focus()
      await page.keyboard.press('Enter')
    }
    const discard = page.locator('[data-game-action="discard"]')
    await expect(discard).toHaveAccessibleName(copy.gameplay.discard)
    await expect(discard).toBeEnabled()
    await expect(discard).toBeInViewport()
    expect((await discard.boundingBox())!.width).toBeGreaterThanOrEqual(44)
    expect((await discard.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    expect(await positions()).toEqual(originalPositions)
    await expect(
      page.locator('[data-play-zone="staging"] .ring-golden-yellow')
    ).toHaveCount(0)
    const staged = await saved()
    // Selection itself is saved, but cannot spend resources or change the wall.
    expect({
      ...staged.state,
      selectedTileIds: before.state.selectedTileIds,
    }).toEqual(before.state)
    await page.screenshot({ path: info.outputPath('staged-discard.png') })
    if (isMobile) await discard.tap()
    else {
      await discard.focus()
      await page.keyboard.press('Space')
    }
    await expect
      .poll(
        async () =>
          (await saved()).state.discards.filter((tile) => tile.id === id).length
      )
      .toBe(1)
    const after = await saved()
    const autumns = (snapshot: ClassicRunSnapshot) =>
      snapshot.state.seasonSystem.seasonStack.filter(
        (season) => season.type === 'Autumn' && !season.isCorrupted
      ).length
    expect(after.state.discardsRemaining).toBe(
      before.state.discardsRemaining - 1 + autumns(after) - autumns(before)
    )
    expect(after.state.seasonSystem.discardCount).toBe(
      before.state.seasonSystem.discardCount + 1
    )
    expect(after.state.handsRemaining).toBe(before.state.handsRemaining)
    expect(after.state.handTiles.some((tile) => tile.id === id)).toBe(false)
    await expect(discard).toBeDisabled()
    await expect(
      page.locator('[data-play-zone="staging"] [data-play-tile]')
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
