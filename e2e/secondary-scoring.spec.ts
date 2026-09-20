import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  test(`Yaku Decrees respect Frostbite and Crimson Heart through staged payment (${language})`, async ({
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
        state.handTiles = [
          ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
            (n, i) => new Tile(TileSuit.Souzu, n, `run-${mode}-${i}`)
          ),
          ...[6, 6, 6].map(
            (n, i) => new Tile(TileSuit.Manzu, n, `triplet-${mode}-${i}`)
          ),
          ...[5, 5].map(
            (n, i) => new Tile(TileSuit.Pinzu, n, `pair-${mode}-${i}`)
          ),
        ]
        state.wall = Array.from(
          { length: 50 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${mode}-${i}`)
        )
        state.drawIndex = 0
        state.targetScore = 1e9
        state.roundManager.getCurrentRound().scoreTarget = 1e9
        const ids = state.handTiles.map((t: { id: string }) => t.id)
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
          base: base.yakuMultiplier,
          boosted: boosted.yakuMultiplier,
          forecast: game.previewScore(ids),
          before: state.score,
          disabled: state.mandateEffectSystem.getDisabledDecreeIds(),
        }
      }, mode)
      if (mode === 'frostbite') {
        expect(result.forecast.yakuMultiplier).toBeCloseTo(
          result.base + (result.boosted - result.base) / 2
        )
        expect(result.forecast.finalScore).toBe(967)
      } else {
        expect(result.disabled).toEqual(['decree-yaku-amplifier'])
        expect(result.forecast.finalScore).toBe(585)
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
      await play.click()
      await expect(
        page.locator('[data-play-zone="staging"] [data-play-tile]')
      ).toHaveCount(14)
      await expect(page.getByTestId('forecast-heading')).toHaveText(
        copy.gameplay.forecast.stagedDeclaration.replace('{{count}}', '14')
      )
      await expect(page.getByTestId('score-preview-total')).toHaveText(
        `+${result.forecast.finalScore.toLocaleString(language)}`
      )
      await play.click()
      await expect(page.locator('[data-score-result]')).toHaveText(
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
        .locator('.game-score-panel')
        .screenshot({ path: testInfo.outputPath(`${mode}-paid.png`) })
    }
  })
}
