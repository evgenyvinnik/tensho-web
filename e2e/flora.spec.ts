import { test, expect, type Page } from '@playwright/test'
import es from '../src/i18n/locales/es.json' with { type: 'json' }

async function setup(page: Page, lang: string, stacked: boolean) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/' + lang + '/play')
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  await page.evaluate(async (stacked) => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const seasonPath = '/src/systems/SeasonSystem.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit } = await import(tilePath)
    const { SeasonSystem } = await import(seasonPath)
    const { eventBus } = await import(eventPath)
    game.startNewRun(7)
    const state = game.getState()
    state.flowerSystem.clear()
    state.decreeSystem
      .getOwnedDecrees()
      .forEach((d: { id: string }) => state.decreeSystem.removeDecree(d.id))
    state.handTiles = Array.from(
      { length: 14 },
      (_, i) => new Tile(TileSuit.Souzu, i < 2 ? 1 : (i % 9) + 1, 'hand-' + i)
    )
    state.wall = Array.from(
      { length: 40 },
      (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, 'wall-' + i)
    )
    state.drawIndex = 0
    state.targetScore = 1e9
    state.roundManager.getCurrentRound().scoreTarget = 1e9
    state.wallTemplate = state.wallTemplate.filter(
      (tile: { isSeason: boolean }) => !tile.isSeason
    )
    // Deliberate presentation/transaction fixtures, not organic draw-frequency evidence.
    if (stacked) {
      for (const rank of [1, 2, 3, 4])
        state.flowerSystem.addFlower(
          new Tile(TileSuit.Flower, rank, 'flower-' + rank)
        )
      const source = new SeasonSystem()
      const stack = [
        ['Spring', false],
        ['Autumn', true],
        ['Summer', true],
        ['Winter', true],
        ['Spring', true],
        ['Summer', false],
        ['Autumn', false],
        ['Winter', false],
        ['Spring', false],
      ].map(([type, corrupt], index) => {
        source.forceSetSeason(type, corrupt)
        return { ...source.getSeasonStack()[0], id: 'season-' + index }
      })
      state.seasonSystem = SeasonSystem.fromState({
        activeSeason: stack[0],
        seasonStack: stack,
        currentAct: 3,
        discardCount: 0,
      })
    } else state.seasonSystem.forceSetSeason('Autumn', true)
    eventBus.emit('seasonActivated', {
      seasonType: 'Autumn',
      effect: 'Flora fixture',
    })
  }, stacked)
  const disableTips = page.getByRole('button', {
    name: "Don't show tips",
    exact: true,
  })
  // Tips remain optional; tests need unobstructed screenshots, not a tutorial bypass.
  if (await disableTips.isVisible()) await disableTips.click()
}

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    const state = game.getState()
    return {
      hand: state.handTiles.map((tile: { id: string }) => tile.id),
      staged: game.getSelectedTileIds(),
      gold: state.gold,
      score: state.score,
      hands: state.handsRemaining,
      discards: state.discardsRemaining,
      redraws: state.redrawsRemaining,
      flora: game.getFloraState(),
    }
  })
}

test('a Spanish Flora inspector keeps the full ordered stack readable and never spends the selection', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await setup(page, 'es', true)
  for (const id of ['hand-0', 'hand-1']) {
    const tile = page.locator(
      '[data-play-zone="hand"] [data-play-tile="' + id + '"]'
    )
    if (isMobile) await tile.tap()
    else await tile.click()
  }
  await expect(
    page.locator('[data-play-zone="staging"] [data-play-tile]')
  ).toHaveCount(2)
  const before = await snapshot(page)
  const trigger = page.getByTestId('flora-details-trigger')
  await expect(
    trigger.locator('[data-flora-season="season-0"]')
  ).toHaveAttribute('aria-label', es.flora.spring)
  await expect(
    trigger.locator('[data-flora-season="season-1"]')
  ).toHaveAttribute('aria-label', es.flora.details.decayName)
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', {
    name: es.flora.flowers + ' · ' + es.flora.seasons,
  })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('button', { name: es.common.close })
  ).toBeFocused()
  await expect(dialog.getByTestId('flora-suppression')).toHaveText(
    es.flora.details.suppressed
  )
  const rows = dialog.locator('[data-flora-detail-season]')
  await expect(rows).toHaveCount(9)
  expect(
    await rows.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-flora-detail-season'))
    )
  ).toEqual(Array.from({ length: 9 }, (_, i) => 'season-' + i))
  await expect(rows.nth(2)).toContainText(es.flora.details.drought)
  await expect(rows.nth(2)).not.toContainText(es.flora.details.summer)
  for (const size of [
    { width: 320, height: 568 },
    { width: 568, height: 320 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(size)
    // Mobile viewport changes settle asynchronously. Read all geometry in one
    // browser turn so a portrait frame cannot be compared with landscape text.
    await expect(async () => {
      const geometry = await dialog.evaluate((node) => {
        const rect = (selector: string) =>
          node.querySelector(selector)!.getBoundingClientRect().toJSON()
        return {
          viewport: { width: innerWidth, height: innerHeight },
          frame: rect('[data-popup-frame]'),
          scroll: rect('[data-popup-scroll]'),
          close: rect('button'),
        }
      })
      const { frame, scroll, close } = geometry
      expect(geometry.viewport).toEqual(size)
      // Text remains inside the paper even while scrolled, not underneath
      // either 64px decorative roller or the fixed close control.
      expect(scroll.y).toBeGreaterThanOrEqual(frame.y + 80)
      expect(scroll.bottom).toBeLessThanOrEqual(frame.bottom - 72)
      expect(scroll.y).toBeGreaterThanOrEqual(close.bottom)
      expect(scroll.height).toBeGreaterThanOrEqual(44)
    }).toPass({ timeout: 5000 })
    for (const row of await dialog
      .locator('[data-flora-flower], [data-flora-detail-season]')
      .all()) {
      await row.scrollIntoViewIfNeeded()
      await expect(row).toBeInViewport()
      expect(
        await row.evaluate((node) =>
          Array.from(node.querySelectorAll<HTMLElement>('h4,p')).every(
            (child) => child.scrollWidth <= child.clientWidth + 1
          )
        )
      ).toBe(true)
      const bounds = await row.boundingBox()
      expect(bounds!.x).toBeGreaterThanOrEqual(12)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(size.width - 12)
    }
    await rows.nth(2).scrollIntoViewIfNeeded()
    await page.screenshot({
      path: testInfo.outputPath('flora-stack-es-' + size.width + '.png'),
    })
  }
  await page.keyboard.press('Tab')
  await expect(
    dialog.getByRole('button', { name: es.common.close })
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await expect(
    page.locator('[data-play-zone="staging"] [data-play-tile]')
  ).toHaveCount(2)
  expect(await snapshot(page)).toEqual(before)
})

test('a pointer discard changes the visible Decay penalty and the real scored play, then Skip clears it', async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await setup(page, 'en', false)
  const baseline = await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    return game.previewScore(['hand-0', 'hand-1']).finalScore
  })
  await page
    .locator('[data-play-zone="hand"] [data-play-tile="hand-2"]')
    .dragTo(page.locator('[data-play-zone="discard"]'))
  await expect
    .poll(async () => (await snapshot(page)).flora.decayPenalty)
    .toBe(10)
  const trigger = page.getByTestId('flora-details-trigger')
  if (isMobile) await trigger.tap()
  else await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Flowers · Seasons' })
  const penalty = dialog.getByTestId('flora-decay-penalty')
  await penalty.scrollIntoViewIfNeeded()
  await expect(penalty).toHaveText('Decay penalty per play: −10 points.')
  await expect(penalty).toBeInViewport()
  await page.keyboard.press('Escape')
  for (const id of ['hand-0', 'hand-1']) {
    const tile = page.locator(
      '[data-play-zone="hand"] [data-play-tile="' + id + '"]'
    )
    if (isMobile) await tile.tap()
    else await tile.click()
  }
  const before = await snapshot(page)
  await page.locator('[data-game-action="play"]').click()
  await expect
    .poll(async () => (await snapshot(page)).score - before.score)
    .toBe(baseline - 10)
  expect((await snapshot(page)).flora.decayPenalty).toBe(10)
  await page.locator('[data-game-action="skip"]').click()
  await expect
    .poll(async () => (await snapshot(page)).flora.seasons.length)
    .toBe(0)
  await trigger.click()
  await expect(
    page.getByRole('dialog').getByText('No Seasons this round.')
  ).toBeVisible()
  await expect(page.getByTestId('flora-decay-penalty')).toHaveCount(0)
})
