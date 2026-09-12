import { expect, test } from '@playwright/test'

test('real skips earn a Rare+ Omen and defer its fee until the Boss reward shop', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/en/play')
  await expect(page.locator('[data-game-action="skip"]')).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    game.startNewRun(16)
    const state = game.getState()
    state.wallTemplate = state.wallTemplate.filter(
      (tile: { isSeason: boolean }) => !tile.isSeason
    )
    state.roundManager.getCurrentAct().rounds[2].bossMandate = undefined
  })
  const skip = page.locator('[data-game-action="skip"]')
  await skip.click()
  await skip.click()
  await expect(skip).toBeDisabled()
  const earned = await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const storePath = '/src/stores/omenStore.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { useOmenStore } = await import(storePath)
    return {
      round: game.getState().currentRound,
      pending: useOmenStore
        .getState()
        .activeTags.filter(
          (tag: { definitionId: string }) => tag.definitionId === 'decree_omen'
        ).length,
      consumed: useOmenStore
        .getState()
        .consumedTags.filter(
          (tag: { definitionId: string }) => tag.definitionId === 'decree_omen'
        ).length,
      shop: game.shop.isOpen,
      canSkip: game.canPerformAction({ type: 'skip' }),
    }
  })
  expect(earned).toEqual({
    round: 3,
    pending: 1,
    consumed: 0,
    shop: false,
    canSkip: false,
  })
  // A deliberate winning-hand fixture isolates payout from reaching the Boss.
  const ids = await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit } = await import(tilePath)
    const { eventBus } = await import(eventPath)
    const state = game.getState()
    state.targetScore = 1
    state.roundManager.getCurrentRound().scoreTarget = 1
    state.handTiles = [
      new Tile(TileSuit.Pinzu, 2, 'omen-win-a'),
      new Tile(TileSuit.Pinzu, 2, 'omen-win-b'),
    ]
    state.selectedTileIds.clear()
    state.faceDownTileIds.clear()
    eventBus.emit('tileDrawn', {
      tileId: 'omen-win-a',
      tilesRemaining: state.wall.length - state.drawIndex,
    })
    return state.handTiles.map((tile: { id: string }) => tile.id)
  })
  for (const id of ids) {
    const tile = page.locator(
      `[data-play-zone="hand"] [data-play-tile="${id}"]`
    )
    if (isMobile) await tile.tap()
    else await tile.click()
  }
  await page.locator('[data-game-action="play"]').click()
  await expect(page).toHaveURL(/\/en\/shop$/)
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

test('skip clears old Seasons and an earned lock preserves the next draw stack through redraw', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/en/play')
  await expect(page.locator('[data-game-action="skip"]')).toBeVisible()
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
  await expect(
    page.locator('[data-flora-season][aria-label="Decay"]')
  ).toBeVisible()
  await page.locator('[data-game-action="skip"]').click()
  await expect(
    page.locator('[data-flora-season][aria-label="Decay"]')
  ).toHaveCount(0)
  await page.locator('[data-game-action="skip"]').click()
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
  for (const id of fixture.ids) {
    const tile = page.locator(
      `[data-play-zone="hand"] [data-play-tile="${id}"]`
    )
    if (isMobile) await tile.tap()
    else await tile.click()
  }
  await page.locator('[data-game-action="redraw"]').click()
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
    discards: 2,
    lock: null,
    protection: true,
    replacements: ['replacement-a', 'replacement-b'],
  })
  await expect(
    page.locator('[data-flora-season][aria-label="Decay"]')
  ).toBeVisible()
  // Keep the post-action screenshot inspectable using the real tutorial control.
  const disableTips = page.getByRole('button', {
    name: "Don't show tips",
    exact: true,
  })
  if (await disableTips.isVisible()) {
    await disableTips.click()
    await expect(disableTips).toHaveCount(0)
  }
  await page.screenshot({
    path: testInfo.outputPath('omen-season-redraw-320.png'),
  })
})
