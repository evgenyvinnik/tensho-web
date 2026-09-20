import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  test(`explains the actual staged group and preserves hidden information (${language})`, async ({
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
    for (const [kind, ranks, score] of [
      ['grouped', [4, 5, 6], 45],
      ['mixed', [4, 5, 6, 9], 50],
      ['looseTiles', [1, 4, 8], 9],
    ] as const) {
      const ids = await page.evaluate(
        async ({ ranks, kind }) => {
          const gamePath = '/src/game/GameOrchestrator.ts',
            tilePath = '/src/core/Tile.ts',
            eventPath = '/src/game/EventBus.ts'
          const { gameOrchestrator: game } = await import(gamePath)
          const { Tile, TileSuit } = await import(tilePath)
          const { eventBus } = await import(eventPath)
          game.startNewRun(7)
          const state = game.getState()
          state.flowerSystem.clear()
          state.seasonSystem.clear()
          state.decreeSystem
            .getOwnedDecrees()
            .forEach((d: { id: string }) =>
              state.decreeSystem.removeDecree(d.id)
            )
          // Controlled deals isolate explanation and staging; payment is through Play.
          const tiles = ranks.map(
            (rank, i) => new Tile(TileSuit.Souzu, rank, `${kind}-${i}`)
          )
          state.handTiles = [
            ...tiles,
            ...Array.from(
              { length: 14 - tiles.length },
              (_, i) =>
                new Tile(TileSuit.Pinzu, (i % 9) + 1, `other-${kind}-${i}`)
            ),
          ]
          state.wall = Array.from(
            { length: 40 },
            (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${kind}-${i}`)
          )
          state.drawIndex = 0
          state.targetScore = 1e9
          state.roundManager.getCurrentRound().scoreTarget = 1e9
          eventBus.emit('tileSelected', { tileId: '', selectedCount: 0 })
          return tiles.map((t: { id: string }) => t.id)
        },
        { ranks, kind }
      )
      for (const id of ids) {
        const tile = page.locator(
          `[data-play-zone="hand"] [data-play-tile="${id}"]`
        )
        if (isMobile) await tile.tap()
        else await tile.click()
      }
      const hint = page.getByTestId('forecast-structure-hint')
      await expect(page.getByTestId('forecast-heading')).toHaveText(
        kind === 'grouped'
          ? copy.melds.sequence
          : copy.gameplay.forecast.selectionCount.replace(
              '{{count}}',
              String(ranks.length)
            )
      )
      await expect(hint).toHaveText(
        copy.gameplay.forecast[kind]
          .replace('{{points}}', '30')
          .replace('{{count}}', '1')
      )
      await expect(page.getByTestId('score-preview-total')).toHaveText(
        `+${score}`
      )
      const area = page.locator('.game-play-area')
      await area.scrollIntoViewIfNeeded()
      expect(
        await area.evaluate((node) => ({
          x: node.scrollWidth <= node.clientWidth + 1,
          y: node.scrollHeight <= node.clientHeight + 1,
        }))
      ).toEqual({ x: true, y: true })
      await area.screenshot({ path: testInfo.outputPath(`${kind}.png`) })
      if (kind === 'grouped') {
        for (const hide of [true, false]) {
          await page.evaluate(
            async ({ id, hide }) => {
              const gamePath = '/src/game/GameOrchestrator.ts',
                eventPath = '/src/game/EventBus.ts'
              const { gameOrchestrator: game } = await import(gamePath)
              const { eventBus } = await import(eventPath)
              const hidden = game.getState().faceDownTileIds
              if (hide) hidden.add(id)
              else hidden.delete(id)
              eventBus.emit('tileSelected', { tileId: id, selectedCount: 3 })
            },
            { id: ids[0], hide }
          )
          if (hide) {
            await expect(hint).toHaveCount(0)
            await expect(page.getByTestId('score-preview-total')).toHaveCount(0)
            await expect(
              page.getByText(copy.gameplay.hiddenHand, { exact: true })
            ).toBeVisible()
          } else
            await expect(hint).toHaveText(
              copy.gameplay.forecast.grouped.replace('{{points}}', '30')
            )
        }
      }
      await play.click()
      await expect(page.locator('[data-score-result]')).toHaveText(
        String(score)
      )
      expect(
        await page.evaluate(async () => {
          const path = '/src/game/GameOrchestrator.ts'
          const { gameOrchestrator: game } = await import(path)
          return game.getState().score
        })
      ).toBe(score)
    }
  })
}
