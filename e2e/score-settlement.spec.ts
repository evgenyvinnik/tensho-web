import { test, expect } from '@playwright/test'
import {
  clearReveals,
  handScoreTotal,
  openTable,
  selectCompleteHand,
} from './helpers/table'

for (const { language, motion } of [
  { language: 'en', motion: 'reduce' },
  { language: 'es', motion: 'reduce' },
  { language: 'en', motion: 'no-preference' },
  { language: 'es', motion: 'no-preference' },
] as const) {
  test(`complete and tactical payments stay exact across effects and reset (${language}, ${motion})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: motion })
    await openTable(page, `/${language}/play`)
    const play = page.locator('[data-game-action="play"]')
    if (motion === 'no-preference') {
      expect(
        await page.evaluate(async () => {
          const path = '/src/stores/settingsStore.ts'
          const { useSettingsStore } = await import(path)
          return (
            useSettingsStore.getState().reducedMotion ||
            matchMedia('(prefers-reduced-motion: reduce)').matches
          )
        })
      ).toBe(false)
    }
    const expected = await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const tilePath = '/src/core/Tile.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { Tile, TileSuit } = await import(tilePath)
      const { eventBus } = await import(eventPath)
      game.startNewRun(7)
      const state = game.getState()
      state.flowerSystem.clear()
      state.seasonSystem.clear()
      state.decreeSystem
        .getOwnedDecrees()
        .forEach((d: { id: string }) => state.decreeSystem.removeDecree(d.id))
      state.handTiles = [
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
          (rank, i) => new Tile(TileSuit.Souzu, rank, `sequence-${i}`)
        ),
        ...[6, 6, 6].map(
          (rank, i) => new Tile(TileSuit.Manzu, rank, `triplet-${i}`)
        ),
        ...[5, 5].map((rank, i) => new Tile(TileSuit.Pinzu, rank, `pair-${i}`)),
      ]
      state.wall = Array.from(
        { length: 50 },
        (_, i) => new Tile(TileSuit.Manzu, (i % 9) + 1, `wall-${i}`)
      )
      state.drawIndex = 0
      state.handsRemaining = 10
      state.targetScore = 1e9
      state.roundManager.getCurrentRound().scoreTarget = 1e9
      eventBus.emit('tileSelected', { tileId: '', selectedCount: 0 })
      const preview = game.previewScore(
        state.handTiles.map((t: { id: string }) => t.id)
      )
      return { score: preview.finalScore, yaku: preview.detectedYaku.length }
    })
    // startNewRun queues its starting Decrees for a reveal over the table.
    await clearReveals(page)
    expect(expected.yaku).toBeGreaterThanOrEqual(2)
    await selectCompleteHand(page)
    await expect(
      page.locator('[data-play-zone="felt"] [data-play-tile]')
    ).toHaveCount(14)
    await play.click()
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const path = '/src/game/GameOrchestrator.ts'
          const { gameOrchestrator: game } = await import(path)
          return game.getState().score
        })
      )
      .toBe(expected.score)
    await expect(handScoreTotal(page, 'last')).toHaveText(
      expected.score.toLocaleString(language)
    )
    let cumulative = expected.score
    for (const effect of ['plain', 'bonus', 'decay']) {
      const score = await page.evaluate(async (effect) => {
        const gamePath = '/src/game/GameOrchestrator.ts'
        const tilePath = '/src/core/Tile.ts'
        const eventPath = '/src/game/EventBus.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { Tile, TileSuit } = await import(tilePath)
        const { eventBus } = await import(eventPath)
        const state = game.getState()
        // Controlled deal to exercise real stage/confirm/payment UI, not a balance simulation.
        state.handTiles = [
          ...[4, 5, 6].map(
            (rank) => new Tile(TileSuit.Souzu, rank, `partial-${rank}`)
          ),
          ...Array.from(
            { length: 11 },
            (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `filler-${i}`)
          ),
        ]
        if (effect === 'bonus') {
          const storePath = '/src/stores/omenStore.ts'
          const omenPath = '/src/config/omenDefinitions.ts'
          const { useOmenStore } = await import(storePath)
          const { SCORE_SURGE_OMEN, MULTIPLICATION_OMEN } = await import(
            omenPath
          )
          useOmenStore.getState().addOmen(SCORE_SURGE_OMEN)
          useOmenStore.getState().addOmen(MULTIPLICATION_OMEN)
        }
        if (effect === 'decay') {
          state.seasonSystem.forceSetSeason('Autumn', true)
          for (let i = 0; i < 5; i++) state.seasonSystem.onDiscard()
        }
        eventBus.emit('tileSelected', { tileId: '', selectedCount: 0 })
        return game.previewScore(['partial-4', 'partial-5', 'partial-6'])
          .finalScore
      }, effect)
      expect(score).toBe(effect === 'plain' ? 45 : effect === 'bonus' ? 217 : 0)
      for (const rank of [4, 5, 6]) {
        const tile = page.locator(
          `[data-play-zone="hand"] [data-play-tile="partial-${rank}"]`
        )
        if (isMobile) await tile.tap()
        else await tile.click()
      }
      await expect(
        page.locator('[data-play-zone="felt"] [data-play-tile]')
      ).toHaveCount(3)
      await play.click()
      cumulative += score
      // The settled play stays in the hand score; the run total is in the
      // header.
      const panel = page.locator('[data-hand-score]')
      await expect(handScoreTotal(page, 'last')).toHaveText(
        score.toLocaleString(language)
      )
      await expect(panel.locator('[data-hand-score-points]')).toHaveText('45')
      await expect(panel.locator('[data-hand-score-mult]')).toHaveText(
        (1).toLocaleString(language)
      )
      await expect(
        page.locator('[data-run-header] [data-tutorial="current-score"]')
      ).toHaveText(cumulative.toLocaleString(language))
      if (effect !== 'plain') {
        await expect(
          panel.locator('[data-hand-score-adjustment]')
        ).toContainText(effect === 'bonus' ? '+172' : '−45')
        await panel.scrollIntoViewIfNeeded()
        const result = handScoreTotal(page, 'last')
        await expect(result).toBeInViewport()
        expect(
          await result.evaluate((node) => {
            const bounds = node.getBoundingClientRect()
            return node.contains(
              document.elementFromPoint(
                bounds.x + bounds.width / 2,
                bounds.y + bounds.height / 2
              )
            )
          })
        ).toBe(true)
        expect(
          await panel.evaluate((node) => {
            const bounds = node.getBoundingClientRect()
            return Array.from(
              node.querySelectorAll<HTMLElement>(
                '[data-hand-score-points], [data-hand-score-mult], [data-hand-score-adjustment], [data-hand-score-total]'
              )
            ).every((el) => {
              const rect = el.getBoundingClientRect()
              return (
                el.scrollWidth <= el.clientWidth + 1 &&
                rect.left >= bounds.left &&
                rect.right <= bounds.right &&
                rect.bottom <= bounds.bottom
              )
            })
          })
        ).toBe(true)
        await panel.screenshot({ path: testInfo.outputPath(`${effect}.png`) })
      }
    }
    await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      game.startNewRun(12)
    })
    await clearReveals(page)
    // A new run clears the last play: the hand score is empty again.
    const reset = page.locator('[data-hand-score]')
    await expect(reset).toHaveAttribute('data-hand-score-state', 'empty')
    await expect(reset.locator('[data-hand-score-total]')).toHaveText('—')
    await expect(reset.locator('[data-hand-score-points]')).toHaveText('—')
    await expect(reset.locator('[data-hand-score-mult]')).toHaveText('—')
    await expect(reset.locator('[data-hand-score-adjustment]')).toHaveCount(0)
  })
}
