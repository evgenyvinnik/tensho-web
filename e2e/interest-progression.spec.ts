import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  for (const unlock of [false, true]) {
    test(`interest progression uses actual paid caps (${language}, unlock=${unlock})`, async ({
      page,
      isMobile,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize(
        isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
      )
      await page.goto(`/${language}/play`)
      await expect(page.locator('[data-game-action="skip"]')).toBeVisible()
      await page
        .getByRole('button', { name: "Don't show tips", exact: true })
        .click()
      // Isolate the achievement boundary and grant the base Charter. Round
      // payouts, transitions and progression notifications remain real UI work.
      await page.evaluate(async () => {
        const gamePath = '/src/game/GameOrchestrator.ts'
        const charterPath = '/src/systems/TeaHouseSystem.ts'
        const progressionPath = '/src/stores/progressionStore.ts'
        const archivePath = '/src/stores/archiveStore.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { TEA_HOUSE_BASE_CHARTERS } = await import(charterPath)
        const { useProgressionStore } = await import(progressionPath)
        const { useArchiveStore } = await import(archivePath)
        useProgressionStore.getState().resetProgression()
        useArchiveStore.getState().resetArchive()
        game.startNewRun(7)
        game.addImperialCharter(
          TEA_HOUSE_BASE_CHARTERS.find(
            (charter: { id: string }) => charter.id === 'seed_pouch'
          )
        )
        const state = game.getState()
        state.wallTemplate = state.wallTemplate.filter(
          (tile: { isSeason: boolean }) => !tile.isSeason
        )
        state.roundManager
          .getCurrentAct()
          .rounds.forEach((round: { bossMandate?: unknown }) => {
            round.bossMandate = undefined
          })
        useProgressionStore.getState().updateStats({
          currentMaxInterestRounds: 9,
          maxConsecutiveInterestRounds: 9,
        })
      })

      const payouts = unlock
        ? [[100, 10, 10]]
        : [
            [25, 5, 0],
            [100, 10, 1],
            [0, 0, 0],
          ]
      for (const [gold, interest, streak] of payouts) {
        await page.evaluate(async (balance) => {
          const gamePath = '/src/game/GameOrchestrator.ts'
          const tilePath = '/src/core/Tile.ts'
          const eventPath = '/src/game/EventBus.ts'
          const { gameOrchestrator: game } = await import(gamePath)
          const { Tile, TileSuit } = await import(tilePath)
          const { eventBus } = await import(eventPath)
          const state = game.getState()
          state.gold = balance
          state.targetScore = 1
          state.roundManager.getCurrentRound().scoreTarget = 1
          state.handTiles = [
            new Tile(TileSuit.Pinzu, 2, 'interest-a'),
            new Tile(TileSuit.Pinzu, 2, 'interest-b'),
          ]
          state.selectedTileIds.clear()
          state.faceDownTileIds.clear()
          eventBus.emit('tileDrawn', {
            tileId: 'interest-a',
            tilesRemaining: state.wall.length - state.drawIndex,
          })
        }, gold)
        for (const id of ['interest-a', 'interest-b']) {
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
            const gamePath = '/src/game/GameOrchestrator.ts'
            const progressionPath = '/src/stores/progressionStore.ts'
            const archivePath = '/src/stores/archiveStore.ts'
            const { gameOrchestrator: game } = await import(gamePath)
            const { useProgressionStore } = await import(progressionPath)
            const { useArchiveStore } = await import(archivePath)
            const progression = useProgressionStore.getState()
            return {
              interest: game.getState().lastRoundSummary.interest,
              streak: progression.stats.currentMaxInterestRounds,
              best: progression.stats.maxConsecutiveInterestRounds,
              unlocked: progression.isItemUnlocked('money_tree'),
              archiveUnlocked: useArchiveStore
                .getState()
                .getEntry('charters', 'money_tree').isUnlocked,
            }
          })
        ).toEqual({
          interest,
          streak,
          best: unlock ? 10 : 9,
          unlocked: unlock,
          archiveUnlocked: unlock,
        })
        await page
          .getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
          .click()
        await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
      }
      // Classic starts a new run on reload today. Lifetime progress and earned
      // unlocks must survive, but its old run's current streak must not.
      await page.reload()
      await expect(page.locator('[data-game-action="skip"]')).toBeVisible()
      expect(
        await page.evaluate(async () => {
          const progressionPath = '/src/stores/progressionStore.ts'
          const archivePath = '/src/stores/archiveStore.ts'
          const { useProgressionStore } = await import(progressionPath)
          const { useArchiveStore } = await import(archivePath)
          const progression = useProgressionStore.getState()
          return {
            current: progression.stats.currentMaxInterestRounds,
            best: progression.stats.maxConsecutiveInterestRounds,
            unlocked: progression.isItemUnlocked('money_tree'),
            archiveUnlocked: useArchiveStore
              .getState()
              .getEntry('charters', 'money_tree').isUnlocked,
          }
        })
      ).toEqual({
        current: 0,
        best: unlock ? 10 : 9,
        unlocked: unlock,
        archiveUnlocked: unlock,
      })
    })
  }
}
