import { expect, test } from '@playwright/test'
import { clearReveals, openTable } from './helpers/table'

// The table no longer shows a Tenpai readout; the rack's Hand Hints mark the
// groups the scorer would pay for. They must find overlapping groups and must
// never place a face-down tile by its hidden identity.
test('hand hints recognize overlapping groups without revealing hidden tiles', async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize(
    isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openTable(page)

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
  // startNewRun queues its starting Decrees for a reveal over the table.
  await clearReveals(page)

  const rack = page.locator('[data-play-zone="hand"]')
  const group = (kind: string) => rack.locator(`[data-hand-group="${kind}"]`)
  const inGroup = (id: string) =>
    rack.locator(`[data-hand-group] [data-play-tile="${id}"]`)
  // 1-1-1-2-3-4 overlaps: the scorer pays most for 1-1-1 and 2-3-4.
  const triplet = group('triplet')
  await expect(triplet).toHaveCount(1)
  for (const id of ['overlap-0', 'overlap-1', 'overlap-2'])
    await expect(triplet.locator(`[data-play-tile="${id}"]`)).toHaveCount(1)
  for (const id of ['overlap-3', 'overlap-4', 'overlap-5'])
    await expect(inGroup(id)).toHaveCount(1)
  await expect(group('pair')).toHaveCount(2)
  await expect(group('sequence')).toHaveCount(2)

  // A tile picked onto the felt leaves the other groups in place.
  const tile = rack.locator('[data-play-tile="pair-0"]')
  if (isMobile) await tile.tap()
  else await tile.click()
  await expect(
    page.locator('[data-play-zone="felt"] [data-play-tile="pair-0"]')
  ).toBeVisible()
  await expect(triplet).toHaveCount(1)

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
    if (hidden) {
      // Face-down, the 1 is never grouped, so the triplet it would complete
      // cannot give it away.
      await expect(
        rack.locator('[data-play-tile="overlap-0"]')
      ).toHaveAccessibleName('Face-down tile')
      await expect(inGroup('overlap-0')).toHaveCount(0)
      await expect(triplet).toHaveCount(0)
    } else {
      await expect(triplet).toHaveCount(1)
      await expect(inGroup('overlap-0')).toHaveCount(1)
    }
  }
})
