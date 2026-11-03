import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import { clearReveals, handScoreTotal, openTable } from './helpers/table'

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  test(`group Decrees respect Frostbite and Crimson Heart through forecast and payment (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openTable(page, `/${language}/play`)
    const play = page.locator('[data-game-action="play"]')
    for (const mode of ['frostbite', 'crimson'] as const) {
      const result = await page.evaluate(async (mode) => {
        const gamePath = '/src/game/GameOrchestrator.ts',
          tilePath = '/src/core/Tile.ts',
          decreePath = '/src/systems/DecreeSystem.ts',
          eventPath = '/src/game/EventBus.ts',
          mandatePath = '/src/config/mandateDefinitions.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { Tile, TileSuit } = await import(tilePath)
        const { ALL_DECREES } = await import(decreePath)
        const { eventBus } = await import(eventPath)
        const { CRIMSON_HEART } = await import(mandatePath)
        if (mode === 'frostbite') game.startNewRun(7)
        const state = game.getState()
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        state.decreeSystem
          .getOwnedDecrees()
          .forEach((d: { id: string }) => state.decreeSystem.removeDecree(d.id))
        // Controlled builds/deals isolate the scoring integration; all staging/payment is UI-driven.
        // A Full House (6-6-6 of Characters and 5-5 of Circles) and spares.
        state.handTiles = [
          ...[6, 6, 6].map(
            (n, i) => new Tile(TileSuit.Manzu, n, `triplet-${mode}-${i}`)
          ),
          ...[5, 5].map(
            (n, i) => new Tile(TileSuit.Pinzu, n, `pair-${mode}-${i}`)
          ),
          ...[1, 4, 8].map(
            (n, i) => new Tile(TileSuit.Souzu, n, `spare-${mode}-${i}`)
          ),
        ]
        state.wall = Array.from(
          { length: 50 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${mode}-${i}`)
        )
        state.drawIndex = 0
        state.targetScore = 1e9
        state.roundManager.getCurrentRound().scoreTarget = 1e9
        const ids = state.handTiles.slice(0, 5).map((t: { id: string }) => t.id)
        const base = game.previewScore(ids)
        for (const id of mode === 'frostbite'
          ? ['decree-yaku-amplifier', 'decree-yaku-nexus']
          : ['decree-yaku-amplifier']) {
          if (
            !state.decreeSystem.acquireDecree(
              ALL_DECREES.find((d: { id: string }) => d.id === id)
            )
          )
            throw Error('Decree fixture failed')
        }
        const boosted = game.previewScore(ids)
        if (mode === 'frostbite')
          state.seasonSystem.forceSetSeason('Winter', true)
        else
          state.mandateEffectSystem.activateMandate(
            CRIMSON_HEART,
            state.handTiles,
            state.decreeSystem.getOwnedDecrees()
          )
        eventBus.emit('tileSelected', { tileId: '', selectedCount: 0 })
        return {
          ids,
          base: base.finalScore,
          boosted: boosted.finalScore,
          forecast: game.previewScore(ids),
          before: state.score,
          disabled: state.mandateEffectSystem.getDisabledDecreeIds(),
          amplifierInstanceId: state.decreeSystem.getOwnedDecree(
            'decree-yaku-amplifier'
          ).instanceId,
        }
      }, mode)
      // startNewRun queues its starting Decrees for a reveal over the table.
      await clearReveals(page)
      // 80 Points (25 for the tiles, Triplet +40, Pair +15) × 3 Mult (1 and
      // a Full House's 2) = 240 before any Decree.
      expect(result.base).toBe(240)
      if (mode === 'frostbite') {
        // Pair Amplifier ×2 for the pair, Group Nexus ×2.5 for each of the
        // two groups: ×12.5 in all.
        expect(result.boosted).toBe(3000)
        // Frostbite halves the Decrees' combined factor, never the play's own
        // Mult: 240 × (1 + 11.5 / 2) = 1620.
        expect(result.forecast.finalScore).toBe(1620)
      } else {
        expect(result.boosted).toBe(480)
        expect(result.disabled).toEqual([result.amplifierInstanceId])
        // The disabled Amplifier adds nothing.
        expect(result.forecast.finalScore).toBe(240)
        const decree = page.getByRole('button', {
          name: copy.decrees.items['decree-yaku-amplifier'].name,
          exact: true,
        })
        if (isMobile) await decree.tap()
        else await decree.focus()
        await expect(page.getByRole('dialog')).toContainText(
          copy.gameplay.decreeDisabledByMandate
        )
        await page
          .getByRole('dialog')
          .screenshot({ path: testInfo.outputPath('crimson-disabled.png') })
        await page.keyboard.press('Escape')
      }
      for (const id of result.ids) {
        const tile = page.locator(
          `[data-play-zone="hand"] [data-play-tile="${id}"]`
        )
        if (isMobile) await tile.tap()
        else await tile.click()
      }
      await expect(
        page.locator('[data-play-zone="felt"] [data-play-tile]')
      ).toHaveCount(5)
      await expect(
        page.locator('[data-hand-score] [data-hand-score-pattern]')
      ).toHaveText(copy.patterns.triplet_pair.name)
      await expect(handScoreTotal(page, 'preview')).toHaveText(
        result.forecast.finalScore.toLocaleString(language)
      )
      await play.click()
      await expect(handScoreTotal(page, 'last')).toHaveText(
        result.forecast.finalScore.toLocaleString(language)
      )
      expect(
        await page.evaluate(async () => {
          const path = '/src/game/GameOrchestrator.ts'
          const { gameOrchestrator: game } = await import(path)
          return game.getState().score
        })
      ).toBe(result.before + result.forecast.finalScore)
      await page
        .locator('[data-hand-score]')
        .screenshot({ path: testInfo.outputPath(`${mode}-paid.png`) })
    }
  })
}
