import { expect, test } from '@playwright/test'
import {
  clearReveals,
  openTable,
  settleReveals,
  swiftClear,
} from './helpers/table'

test('swift clears earn a Rare+ Omen and charge its fee in the next shop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 568 })
  await openTable(page)
  await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    game.startNewRun(73)
    const state = game.getState()
    state.wallTemplate = state.wallTemplate.filter(
      (tile: { isSeason: boolean }) => !tile.isSeason
    )
    state.roundManager.getCurrentAct().rounds[2].bossMandate = undefined
  })
  // startNewRun queues its starting Decrees for a reveal over the table.
  await clearReveals(page)
  // Skip is gone: clearing the Small and Large rounds with Turns to spare
  // earns their Omens, drawn in the same seeded order.
  await swiftClear(page)
  await page.getByRole('button', { name: 'Continue to Next Round' }).click()
  await expect(page).toHaveURL(/\/en\/play$/)
  await settleReveals(page, 2_000)
  await swiftClear(page)
  expect(
    await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const storePath = '/src/stores/omenStore.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { useOmenStore } = await import(storePath)
      const state = game.getState()
      const rarity = game.shop.state.itemOfferings[0].item.rarity
      return {
        fee: state.lastRoundSummary.goldAfter - state.gold,
        rare: ['ImperialDecree', 'HeavenlyOrdinance'].includes(rarity),
        pending: useOmenStore
          .getState()
          .activeTags.filter(
            (tag: { definitionId: string }) =>
              tag.definitionId === 'decree_omen'
          ).length,
        consumed: useOmenStore
          .getState()
          .consumedTags.filter(
            (tag: { definitionId: string }) =>
              tag.definitionId === 'decree_omen'
          ).length,
      }
    })
  ).toEqual({ fee: 5, rare: true, pending: 0, consumed: 1 })
})

test('a new round clears old Seasons and an earned lock preserves the next draw stack through redraw', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 568 })
  await openTable(page)
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { eventBus } = await import(eventPath)
    game.startNewRun(13)
    const state = game.getState()
    state.wallTemplate = state.wallTemplate.filter(
      (tile: { isSeason: boolean }) => !tile.isSeason
    )
    state.seasonSystem.forceSetSeason('Autumn', true)
    state.seasonSystem.onDiscard()
    eventBus.emit('seasonActivated', {
      seasonType: 'Autumn',
      effect: 'Fixture Decay',
    })
  })
  // The fixture's Season is announced with a reveal over the table.
  await settleReveals(page, 2_000)
  await expect(
    page.locator('[data-flora-season][aria-label="Decay"]')
  ).toBeVisible()
  // Skip is gone: swift clears of the Small and Large rounds earn their
  // Omens, drawn in the same seeded order.
  await swiftClear(page)
  await page.getByRole('button', { name: 'Continue to Next Round' }).click()
  await expect(page).toHaveURL(/\/en\/play$/)
  await settleReveals(page, 2_000)
  await expect(
    page.locator('[data-flora-season][aria-label="Decay"]')
  ).toHaveCount(0)
  await swiftClear(page)
  await page.getByRole('button', { name: 'Continue to Next Round' }).click()
  await expect(page).toHaveURL(/\/en\/play$/)
  await settleReveals(page, 2_000)
  const rail = page.locator('[data-collectible-rail]')
  const lock = rail.locator('[data-omen-effect="season-lock"]')
  await expect(lock).toHaveAttribute('aria-label', 'Next Season: Winter')
  await lock.click()
  await expect(
    page.getByRole('dialog', { name: 'Next Season: Winter' })
  ).toContainText('Next Season drawn: Winter')
  await page.keyboard.press('Escape')
  const fixture = await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit, SeasonType } = await import(tilePath)
    const { eventBus } = await import(eventPath)
    const state = game.getState()
    if (state.omenSystem.getLockedSeason() !== 'Winter')
      throw new Error('Expected earned Winter lock')
    // Draw fixtures only; no Omen is injected and no action handler is mocked.
    state.seasonSystem.forceSetSeason('Autumn', true)
    state.seasonSystem.onDiscard()
    state.seasonSystem.onDiscard()
    state.mandateEffectSystem.deactivateMandate()
    state.redrawsRemaining = 1
    state.wall = [
      Tile.createSeason(SeasonType.Spring, 'locked-draw'),
      Tile.createSeason(SeasonType.Summer, 'ordinary-draw'),
      new Tile(TileSuit.Pinzu, 4, 'replenishment'),
    ]
    state.drawIndex = 0
    state.deadWall = [
      new Tile(TileSuit.Pinzu, 1, 'replacement-a'),
      new Tile(TileSuit.Pinzu, 2, 'replacement-b'),
    ]
    eventBus.emit('seasonActivated', {
      seasonType: 'Autumn',
      effect: 'Fixture Decay',
    })
    return {
      oldSeason: state.seasonSystem.getSeasonStack()[0].id,
      ids: state.handTiles.slice(0, 2).map((tile: { id: string }) => tile.id),
    }
  })
  // The fixture's Season is announced with a reveal over the table.
  await settleReveals(page, 2_000)
  for (const id of fixture.ids) {
    const tile = page.locator(
      `[data-play-zone="hand"] [data-play-tile="${id}"]`
    )
    if (isMobile) await tile.tap()
    else await tile.click()
  }
  await page.locator('[data-game-action="redraw"]').click()
  await expect(lock).toHaveCount(0)
  await expect(rail.locator('[data-omen-id="omen_of_ash"]')).toHaveCount(1)
  await expect(page.locator('[data-game-action="redraw"]')).toBeDisabled()
  expect(
    await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      const state = game.getState()
      return {
        seasons: state.seasonSystem
          .getSeasonStack()
          .map((season: { id: string; type: string }) => ({
            id: season.id,
            type: season.type,
          })),
        active: state.seasonSystem.getActiveSeason().type,
        discards: state.seasonSystem.toState().discardCount,
        lock: state.omenSystem.getLockedSeason(),
        protection: state.omenSystem.hasVoidScriptDownsideProtection(),
        replacements: state.handTiles
          .filter((tile: { id: string }) => tile.id.startsWith('replacement-'))
          .map((tile: { id: string }) => tile.id)
          .sort(),
      }
    })
  ).toEqual({
    seasons: [
      { id: fixture.oldSeason, type: 'Autumn' },
      { id: 'locked-draw', type: 'Winter' },
      { id: 'ordinary-draw', type: 'Summer' },
    ],
    active: 'Autumn',
    // Decay counts the REDRAW itself, on top of the fixture's two discards.
    discards: 3,
    lock: null,
    protection: true,
    replacements: ['replacement-a', 'replacement-b'],
  })
  await expect(
    page.locator('[data-flora-season][aria-label="Decay"]')
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('omen-season-redraw-320.png'),
  })
})
