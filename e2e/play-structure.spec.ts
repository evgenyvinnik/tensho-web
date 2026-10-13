import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import { openTable } from './helpers/table'

// Controlled deals isolate the hand score; payment is through Play hand.
const DEALS = [
  { pattern: 'sequence', ranks: [4, 5, 6], points: 45, mult: 1, total: 45 },
  { pattern: 'two_pairs', ranks: [3, 3, 7, 7], points: 50, mult: 2, total: 100 },
  { pattern: 'loose', ranks: [1, 4, 8], points: 9, mult: 1, total: 9 },
  {
    pattern: 'straight5',
    ranks: [3, 4, 5, 6, 7],
    points: 85,
    mult: 3,
    total: 255,
  },
] as const

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  test(`names the actual pattern, shows points × Mult and hides face-down tiles (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openTable(page, `/${language}/play`)
    const play = page.locator('[data-game-action="play"]')
    const score = page.locator('[data-hand-score]')
    for (const deal of DEALS) {
      const ids = await page.evaluate(
        async ({ ranks, pattern }) => {
          const { gameOrchestrator: game } = await import(
            '/src/game/GameOrchestrator.ts'
          )
          const { Tile, TileSuit } = await import('/src/core/Tile.ts')
          const { eventBus } = await import('/src/game/EventBus.ts')
          const { useDecreeRevealQueue } = await import(
            '/src/game/decreeRevealQueue.ts'
          )
          const { useFloraRevealQueue } = await import(
            '/src/game/floraRevealQueue.ts'
          )
          game.startNewRun(7)
          const state = game.getState()
          state.flowerSystem.clear()
          state.seasonSystem.clear()
          state.decreeSystem
            .getOwnedDecrees()
            .forEach((d: { id: string }) =>
              state.decreeSystem.removeDecree(d.id)
            )
          useDecreeRevealQueue.setState({ queue: [] })
          useFloraRevealQueue.setState({ queue: [] })
          const tiles = ranks.map(
            (rank: number, i: number) =>
              new Tile(TileSuit.Souzu, rank, `${pattern}-${i}`)
          )
          state.handTiles = [
            ...tiles,
            ...Array.from(
              { length: 14 - tiles.length },
              (_, i) =>
                new Tile(TileSuit.Pinzu, (i % 9) + 1, `other-${pattern}-${i}`)
            ),
          ]
          state.wall = Array.from(
            { length: 40 },
            (_, i) =>
              new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${pattern}-${i}`)
          )
          state.drawIndex = 0
          state.targetScore = 1e9
          state.roundManager.getCurrentRound().scoreTarget = 1e9
          eventBus.emit('tileSelected', { tileId: '', selectedCount: 0 })
          return tiles.map((t: { id: string }) => t.id)
        },
        { ranks: [...deal.ranks], pattern: deal.pattern }
      )
      for (const id of ids) {
        const tile = page.locator(`[data-play-tile="${id}"]`)
        if (isMobile) await tile.tap()
        else await tile.click()
      }
      const name = copy.patterns[deal.pattern].name
      await expect(score).toHaveAttribute('data-hand-score-state', 'preview')
      await expect(score.locator('[data-hand-score-pattern]')).toHaveText(name)
      await expect(score.locator('[data-hand-score-points]')).toHaveText(
        String(deal.points)
      )
      await expect(score.locator('[data-hand-score-mult]')).toHaveText(
        String(deal.mult)
      )
      await expect(score.locator('[data-hand-score-total]')).toHaveText(
        String(deal.total)
      )
      // The button never repeats the score or changes its label.
      await expect(play).toHaveText(copy.gameplay.playHand)
      await score.screenshot({
        path: testInfo.outputPath(`${deal.pattern}.png`),
      })

      if (deal.pattern === 'sequence') {
        for (const hide of [true, false]) {
          await page.evaluate(
            async ({ id, hide }) => {
              const { gameOrchestrator: game } = await import(
                '/src/game/GameOrchestrator.ts'
              )
              const { eventBus } = await import('/src/game/EventBus.ts')
              const hidden = game.getState().faceDownTileIds
              if (hide) hidden.add(id)
              else hidden.delete(id)
              eventBus.emit('tileSelected', { tileId: id, selectedCount: 3 })
            },
            { id: ids[0], hide }
          )
          if (hide) {
            await expect(score).toHaveAttribute(
              'data-hand-score-state',
              'hidden'
            )
            await expect(score).not.toContainText(String(deal.total))
          } else
            await expect(score.locator('[data-hand-score-total]')).toHaveText(
              String(deal.total)
            )
        }
      }

      await play.click()
      const toast = page.locator(`[data-play-toast="${deal.pattern}"]`)
      await expect(toast).toBeVisible()
      await expect(toast).toContainText(name)
      await expect(toast).toContainText(`+${deal.total}`)
      expect(
        await page.evaluate(async () => {
          const { gameOrchestrator: game } = await import(
            '/src/game/GameOrchestrator.ts'
          )
          return game.getState().score
        })
      ).toBe(deal.total)
      await expect(toast).toBeHidden({ timeout: 5_000 })
    }
  })
}
