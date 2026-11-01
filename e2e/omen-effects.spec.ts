import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import {
  clearReveals,
  continueToNextRound,
  openTable,
  swiftClear,
} from './helpers/table'

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  for (const kind of ['restriction', 'boost'] as const) {
    test(`earned interest ${kind} is visible and ages through a round (${language})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await openTable(page, `/${language}/play`)
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
      // startNewRun queues its starting Decrees for a reveal over the table.
      await clearReveals(page)
      // Skip is gone: a swift clear of the Small round earns its Omen, drawn
      // in the same seeded order.
      await swiftClear(page)
      await continueToNextRound(page)
      // The spent Omen keeps an icon on the rail, badged with rounds left.
      const rail = page.locator('[data-collectible-rail]')
      const effect = rail.locator(
        `[data-omen-effect="${kind === 'restriction' ? 'no-interest' : 'interest-boost'}"]`
      )
      await expect(effect).toHaveText(kind === 'restriction' ? '1' : '3')
      const name = (await effect.getAttribute('aria-label'))!
      // Its panel opens from the keyboard as well as by touch.
      if (isMobile) await effect.tap()
      else {
        await effect.focus()
        await page.keyboard.press('Enter')
      }
      const panel = page.getByRole('dialog', { name })
      const label =
        kind === 'restriction'
          ? copy.omens.effects.noInterest.replace('{{rounds}}', '1')
          : copy.omens.effects.interestBoost
              .replace('{{amount}}', '2')
              .replace('{{rounds}}', '3')
      await expect(panel.getByText(label, { exact: true })).toBeVisible()
      // Austerity and the Interest Omen are spent the moment they arrive.
      await expect(rail.locator('[data-omen-id]')).toHaveCount(0)
      expect(
        await panel.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
      ).toBe(true)
      await page.screenshot({ path: testInfo.outputPath('live-effect.png') })
      await page.keyboard.press('Escape')
      await expect(panel).toHaveCount(0)
      await swiftClear(page)
      await continueToNextRound(page)
      if (kind === 'restriction') await expect(effect).toHaveCount(0)
      else {
        await expect(effect).toHaveText('2')
        await effect.click()
        await expect(
          page.locator('[data-omen-effect-details="interest-boost"]')
        ).toHaveText(
          copy.omens.effects.interestBoost
            .replace('{{amount}}', '2')
            .replace('{{rounds}}', '2')
        )
        await page.keyboard.press('Escape')
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
