import { test, expect } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  test(`Frostbite halves Decree points without cutting tile bonuses (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/${language}/play`)
    const play = page.locator('[data-game-action="play"]')
    await expect(play).toBeVisible()
    await page
      .getByRole('button', { name: "Don't show tips", exact: true })
      .click()
    const forecast = await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const tilePath = '/src/core/Tile.ts'
      const modifierPath = '/src/core/TileModifier.ts'
      const decreePath = '/src/systems/DecreeSystem.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { Tile, TileSuit } = await import(tilePath)
      const { EditionType } = await import(modifierPath)
      const { ALL_DECREES } = await import(decreePath)
      const { eventBus } = await import(eventPath)
      game.startNewRun(7)
      const state = game.getState()
      state.flowerSystem.clear()
      state.seasonSystem.clear()
      state.decreeSystem
        .getOwnedDecrees()
        .forEach((d: { id: string }) => state.decreeSystem.removeDecree(d.id))
      // Explicit scoring fixture, not an organic acquisition/balance claim.
      state.handTiles = [
        ...[4, 5, 6].map(
          (rank) => new Tile(TileSuit.Souzu, rank, `frost-${rank}`)
        ),
        ...Array.from(
          { length: 11 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `hand-${i}`)
        ),
      ]
      state.handTiles[0] = state.handTiles[0].withEdition(EditionType.Foil)
      state.wall = Array.from(
        { length: 40 },
        (_, i) => new Tile(TileSuit.Manzu, (i % 9) + 1, `wall-${i}`)
      )
      state.drawIndex = 0
      state.targetScore = 1e9
      state.roundManager.getCurrentRound().scoreTarget = 1e9
      for (const id of ['decree-half-suited', 'decree-gentle-breeze']) {
        if (
          !game.addDecree(ALL_DECREES.find((d: { id: string }) => d.id === id))
        )
          throw Error('Fixture Decree rejected')
      }
      state.decreeSystem.applyEdition('decree-half-suited', 'Foil')
      state.seasonSystem.forceSetSeason('Winter', true)
      eventBus.emit('seasonActivated', {
        seasonType: 'Winter',
        effect: 'Frostbite fixture',
      })
      return game.previewScore(['frost-4', 'frost-5', 'frost-6']).equation
    })
    // 45 shape/tile base + 50 tile Foil + half of (20 Decree + 50 Decree Foil).
    expect(forecast).toEqual({
      points: 130,
      multiplier: 2,
      adjustment: 0,
      total: 260,
    })
    for (const rank of [4, 5, 6]) {
      const tile = page.locator(
        `[data-play-zone="hand"] [data-play-tile="frost-${rank}"]`
      )
      if (isMobile) await tile.tap()
      else await tile.click()
    }
    await expect(page.getByTestId('score-preview-total')).toHaveText('+260')
    const flora = page.getByTestId('flora-details-trigger')
    if (isMobile) await flora.tap()
    else await flora.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText(copy.flora.details.frostbite)
    const rule = dialog.getByText(copy.flora.details.frostbite, { exact: true })
    await rule.scrollIntoViewIfNeeded()
    await expect(rule).toBeInViewport()
    await page.screenshot({
      path: testInfo.outputPath('frostbite-details.png'),
    })
    await dialog
      .getByRole('button', { name: copy.common.close, exact: true })
      .click()
    await expect(
      page.locator('[data-play-zone="staging"] [data-play-tile]')
    ).toHaveCount(3)
    if (isMobile) await play.tap()
    else await play.click()
    const panel = page.locator('.game-score-panel')
    await expect(panel.locator('[data-score-result]')).toHaveText('260')
    await expect(panel.locator('[data-score-points]')).toHaveText('130')
    await expect(panel.locator('[data-score-mult]')).toHaveText(
      (2).toLocaleString(language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
    await expect(panel.locator('[data-tutorial="current-score"]')).toHaveText(
      '260'
    )
    await panel.scrollIntoViewIfNeeded()
    await page.screenshot({ path: testInfo.outputPath('frostbite-paid.png') })
    const stacked = await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const tilePath = '/src/core/Tile.ts'
      const modifierPath = '/src/core/TileModifier.ts'
      const seasonPath = '/src/systems/SeasonSystem.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { Tile, TileSuit } = await import(tilePath)
      const { EditionType } = await import(modifierPath)
      const { SeasonSystem } = await import(seasonPath)
      const { eventBus } = await import(eventPath)
      const state = game.getState()
      state.handTiles = [
        ...[4, 5, 6].map(
          (rank) => new Tile(TileSuit.Souzu, rank, `stack-${rank}`)
        ),
        ...Array.from(
          { length: 11 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `next-${i}`)
        ),
      ]
      state.handTiles[0] = state.handTiles[0].withEdition(EditionType.Foil)
      const saved = state.seasonSystem.toState()
      state.seasonSystem = SeasonSystem.fromState({
        ...saved,
        seasonStack: [
          ...saved.seasonStack,
          { ...saved.seasonStack[0], id: 'second-frostbite' },
        ],
      })
      eventBus.emit('seasonActivated', {
        seasonType: 'Winter',
        effect: 'Second Frostbite fixture',
      })
      return game.previewScore(['stack-4', 'stack-5', 'stack-6']).equation
    })
    expect(stacked).toEqual({
      points: 112.5,
      multiplier: 1.5,
      adjustment: 0,
      total: 168,
    })
    for (const rank of [4, 5, 6]) {
      const tile = page.locator(
        `[data-play-zone="hand"] [data-play-tile="stack-${rank}"]`
      )
      if (isMobile) await tile.tap()
      else await tile.click()
    }
    await expect(page.getByTestId('score-preview-total')).toHaveText('+168')
    if (isMobile) await play.tap()
    else await play.click()
    await expect(panel.locator('[data-score-result]')).toHaveText('168')
    await expect(panel.locator('[data-score-points]')).toHaveText(
      (112.5).toLocaleString(language)
    )
    await expect(panel.locator('[data-score-mult]')).toHaveText(
      (1.5).toLocaleString(language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
    await expect(panel.locator('[data-tutorial="current-score"]')).toHaveText(
      '428'
    )
    await panel.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: testInfo.outputPath('stacked-frostbite-paid.png'),
    })
  })
}
