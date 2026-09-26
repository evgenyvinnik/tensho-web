import { expect, test } from '@playwright/test'

test('readiness recognizes overlapping groups without revealing hidden tiles', async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize(
    isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/en/play')
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  await page
    .getByRole('button', { name: "Don't show tips", exact: true })
    .click()

  // Deliberate shape fixture, not evidence of organically reaching a full hand.
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit } = await import(tilePath)
    const { eventBus } = await import(eventPath)
    game.startNewRun(7)
    const state = game.getState()
    state.handTiles = [
      ...[1, 1, 1, 2, 3, 4].map(
        (rank, i) => new Tile(TileSuit.Manzu, rank, `overlap-${i}`)
      ),
      ...[5, 5].map((rank, i) => new Tile(TileSuit.Pinzu, rank, `pair-${i}`)),
      ...[6, 7, 8].map(
        (rank, i) => new Tile(TileSuit.Souzu, rank, `sequence-${i}`)
      ),
      ...[1, 1].map((rank, i) => new Tile(TileSuit.Wind, rank, `wait-${i}`)),
    ]
    state.faceDownTileIds.clear()
    eventBus.emit('tileSelected', { tileId: '', selectedCount: 0 })
  })

  const area = page.locator('[data-play-zone="hand"]')
  await expect(area.getByText('Tenpai', { exact: true })).toBeVisible()
  const tile = page.locator('[data-play-zone="hand"] [data-play-tile="pair-0"]')
  if (isMobile) await tile.tap()
  else await tile.click()
  await expect(
    page.locator('[data-play-zone="staging"] [data-play-tile="pair-0"]')
  ).toBeVisible()
  await expect(area.getByText('Tenpai', { exact: true })).toBeVisible()

  for (const hidden of [true, false]) {
    await page.evaluate(async (hidden) => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { eventBus } = await import(eventPath)
      const state = game.getState()
      if (hidden) state.faceDownTileIds.add('overlap-0')
      else state.faceDownTileIds.clear()
      eventBus.emit('tileSelected', { tileId: '', selectedCount: 0 })
    }, hidden)
    await expect(
      area.getByText(hidden ? '???' : 'Tenpai', { exact: true })
    ).toBeVisible()
    if (hidden)
      await expect(area.getByText('Tenpai', { exact: true })).toHaveCount(0)
  }
})
