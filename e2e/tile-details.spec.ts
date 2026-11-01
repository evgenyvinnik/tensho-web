import { test, expect, type Locator, type Page } from '@playwright/test'
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import fr from '../src/i18n/locales/fr.json' with { type: 'json' }
import ja from '../src/i18n/locales/ja.json' with { type: 'json' }
import ru from '../src/i18n/locales/ru.json' with { type: 'json' }
import th from '../src/i18n/locales/th.json' with { type: 'json' }
import { openTable, rackTiles } from './helpers/table'

const savedRun = (page: Page) =>
  page.evaluate(() => localStorage.getItem('tensho-classic-run-v1'))

/** Open a short phone's Classic table once the new run is saved. */
async function openShortTable(page: Page, language: string) {
  await page.setViewportSize({ width: 320, height: 568 })
  await openTable(page, `${language}/play`)
  await expect(page.locator('[data-classic-save-status="saved"]')).toBeVisible()
}

/**
 * Show a rack tile's details: a mouse hovers it; a finger rests on it until
 * the details appear, then lifts (they stay up to be read).
 */
async function showDetails(page: Page, tile: Locator, isMobile: boolean) {
  await tile.scrollIntoViewIfNeeded()
  if (!isMobile) {
    await page.mouse.move(0, 0)
    await tile.hover()
    return
  }
  const box = (await tile.boundingBox())!
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }
  const touch = await page.context().newCDPSession(page)
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [point],
  })
  await expect(page.getByRole('tooltip')).toBeVisible()
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  })
  await touch.detach()
}

for (const [language, copy] of [
  ['es', es],
  ['fr', fr],
  ['ja', ja],
] as const) {
  test(`localized tile details fit a short phone without spending a Turn (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await openShortTable(page, language)
    const before = await savedRun(page)
    const tile = rackTiles(page).first()
    const id = await tile.getAttribute('data-play-tile')
    const name = await tile.locator('img').getAttribute('alt')
    await expect(tile).toHaveAccessibleName(name!)
    await showDetails(page, tile, isMobile)
    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText(name!)
    const text = await tooltip.innerText()
    expect(
      text.includes(copy.tileDetails.numberedRule) ||
        text.includes(copy.tileDetails.honorRule)
    ).toBe(true)
    expect(text).not.toMatch(/base points|of Bamboo|of Characters|of Circles/)
    const geometry = await tooltip.evaluate((node) => {
      const box = node.getBoundingClientRect()
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        content: node.scrollWidth,
        width: node.clientWidth,
      }
    })
    expect(geometry.left).toBeGreaterThanOrEqual(11)
    expect(geometry.right).toBeLessThanOrEqual(309)
    expect(geometry.top).toBeGreaterThanOrEqual(11)
    expect(geometry.bottom).toBeLessThanOrEqual(557)
    expect(geometry.content).toBeLessThanOrEqual(geometry.width)
    await page.screenshot({
      path: testInfo.outputPath(`${language}-tile-details.png`),
    })
    // Looking spends nothing: the tile stays in the rack, the run unchanged.
    await expect(tile).toHaveAttribute('aria-pressed', 'false')
    expect(await savedRun(page)).toBe(before)
    // Escape puts the details away; on a phone the next touch does, and
    // still picks the tile it touched.
    if (isMobile) await tile.tap()
    else {
      await page.keyboard.press('Escape')
      await expect(tooltip).toHaveCount(0)
      await tile.click()
    }
    await expect(tooltip).toHaveCount(0)
    // The felt names the picked tile exactly as the rack did.
    const picked = page.locator(
      `[data-play-zone="felt"] [data-play-tile="${id}"]`
    )
    await expect(picked).toHaveAttribute('aria-pressed', 'true')
    await expect(picked).toHaveAccessibleName(name!)
  })
}

for (const [language, copy] of [
  ['ru', ru],
  ['th', th],
] as const) {
  test(`stacked modifier rules remain fully readable in the tile popup (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await openShortTable(page, language)
    const tile = rackTiles(page).first()
    const id = await tile.getAttribute('data-play-tile')
    // Presentation-only fixture: a Purple Stamp on the first rack tile.
    await page.evaluate(async (id) => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const modifiersPath = '/src/core/TileModifier.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { SealType } = await import(modifiersPath)
      const { eventBus } = await import(eventPath)
      const state = game.getState()
      const index = state.handTiles.findIndex(
        (tile: { id: string }) => tile.id === id
      )
      state.handTiles[index] = state.handTiles[index].withSeal(SealType.Purple)
      eventBus.emit('tileDrawn', {
        tileId: id,
        tilesRemaining: state.wall.length - state.drawIndex,
      })
    }, id)
    await showDetails(page, tile, isMobile)
    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText(
      copy.archiveSeals.items.purple.description
    )
    const bounds = await tooltip.evaluate((node) => ({
      width: node.clientWidth,
      contentWidth: node.scrollWidth,
      height: node.clientHeight,
      contentHeight: node.scrollHeight,
    }))
    expect(bounds.contentWidth).toBeLessThanOrEqual(bounds.width)
    expect(bounds.contentHeight).toBeLessThanOrEqual(bounds.height)
    await page.screenshot({
      path: testInfo.outputPath(`${language}-modified-details.png`),
    })
    await page.keyboard.press('Escape')
    await expect(tooltip).toHaveCount(0)
  })
}
