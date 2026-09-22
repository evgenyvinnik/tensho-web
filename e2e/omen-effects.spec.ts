import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  for (const kind of ['restriction', 'boost'] as const) {
    test(`earned interest ${kind} is visible and ages through a skip (${language})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.goto(`/${language}/play`)
      const skip = page.locator('[data-game-action="skip"]')
      await expect(skip).toBeVisible()
      await page
        .getByRole('button', { name: "Don't show tips", exact: true })
        .click()
      await page.evaluate(
        async (seed) => {
          const path = '/src/game/GameOrchestrator.ts'
          const { gameOrchestrator: game } = await import(path)
          game.startNewRun(seed)
          const state = game.getState()
          state.gold = 100
          state.wallTemplate = state.wallTemplate.filter(
            (tile: { isSeason: boolean }) => !tile.isSeason
          )
          state.roundManager.getCurrentAct().rounds[2].bossMandate = undefined
        },
        kind === 'restriction' ? 19 : 1
      )
      await skip.click()
      const effects = page.getByTestId('pending-omens')
      await expect(effects).not.toHaveAttribute('open')
      // Native summary is operable with keyboard as well as touch.
      if (isMobile) await effects.locator('summary').tap()
      else {
        await effects.locator('summary').focus()
        await page.keyboard.press('Enter')
      }
      const label =
        kind === 'restriction'
          ? copy.omens.effects.noInterest.replace('{{rounds}}', '1')
          : copy.omens.effects.interestBoost
              .replace('{{amount}}', '2')
              .replace('{{rounds}}', '3')
      await expect(effects.getByText(label, { exact: true })).toBeVisible()
      await expect(effects.locator('[data-omen-id]')).toHaveCount(0)
      expect(
        await effects.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
      ).toBe(true)
      await effects.screenshot({ path: testInfo.outputPath('live-effect.png') })
      await effects.locator('summary').click()
      await skip.click()
      if (kind === 'restriction') await expect(effects).toHaveCount(0)
      else {
        await effects.locator('summary').click()
        await expect(
          effects.locator('[data-omen-effect="interest-boost"]')
        ).toHaveText(
          copy.omens.effects.interestBoost
            .replace('{{amount}}', '2')
            .replace('{{rounds}}', '2')
        )
        await effects.locator('summary').click()
      }
      // Controlled Boss-winning deal, after real seeded Omen acquisition.
      await page.evaluate(async () => {
        const gamePath = '/src/game/GameOrchestrator.ts',
          tilePath = '/src/core/Tile.ts',
          eventPath = '/src/game/EventBus.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { Tile, TileSuit } = await import(tilePath)
        const { eventBus } = await import(eventPath)
        const state = game.getState()
        state.targetScore = 1
        state.roundManager.getCurrentRound().scoreTarget = 1
        state.handTiles = [
          new Tile(TileSuit.Pinzu, 2, 'duration-win-a'),
          new Tile(TileSuit.Pinzu, 2, 'duration-win-b'),
        ]
        state.faceDownTileIds.clear()
        state.selectedTileIds.clear()
        eventBus.emit('tileDrawn', {
          tileId: 'duration-win-a',
          tilesRemaining: state.wall.length - state.drawIndex,
        })
      })
      for (const id of ['duration-win-a', 'duration-win-b']) {
        const tile = page.locator(
          `[data-play-zone="hand"] [data-play-tile="${id}"]`
        )
        if (isMobile) await tile.tap()
        else await tile.click()
      }
      await page.locator('[data-game-action="play"]').click()
      await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
      expect(
        await page.evaluate(async () => {
          const path = '/src/game/GameOrchestrator.ts'
          const { gameOrchestrator: game } = await import(path)
          return game.getState().lastRoundSummary.interest
        })
      ).toBe(kind === 'restriction' ? 5 : 7)
    })
  }
}
