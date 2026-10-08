import { expect, test } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'

for (const language of ['en', 'es']) {
  test(`paid Yakuman unlocks survive reload without preview awards (${language})`, async ({
    page,
    isMobile,
  }, info) => {
    const replay = process.env.DECREE_UNLOCK_REPLAY_FILE
      ? JSON.parse(readFileSync(process.env.DECREE_UNLOCK_REPLAY_FILE, 'utf8'))
      : null
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(
      isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
    )
    await page.addInitScript((replay) => {
      localStorage.setItem('tensho_tutorial_completed', 'true')
      localStorage.setItem('tensho_hints_disabled', 'true')
      if (replay && !localStorage.getItem('tensho-classic-run-v1')) {
        for (const [key, value] of Object.entries(replay))
          localStorage.setItem(key, value as string)
      }
    }, replay)
    await page.goto(`/${language}/play`)
    const saved = () =>
      expect(page.locator('[data-classic-save-status="saved"]')).toBeVisible()
    const profile = () =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('tensho-progression')!).state
      )
    await saved()
    for (let play = replay ? 2 : 0; play < 3; play++) {
      const ids: string[] = replay
        ? await page.evaluate(() =>
            JSON.parse(
              localStorage.getItem('tensho-classic-run-v1')!
            ).snapshot.state.handTiles.map((tile: { id: string }) => tile.id)
          )
        : await page.evaluate(async (play) => {
            const loaded = (path: string) => {
              const url = performance
                .getEntriesByType('resource')
                .map((entry) => entry.name)
                .reverse()
                .find((url) => new URL(url).pathname === path)
              if (!url) throw Error(`App did not load ${path}`)
              return url
            }
            const { gameOrchestrator: game } = await import(
              loaded('/src/game/GameOrchestrator.ts')
            )
            const { Tile, TileSuit } = await import(loaded('/src/core/Tile.ts'))
            const { useProgressionStore } = await import(
              loaded('/src/stores/progressionStore.ts')
            )
            const { initializeClassicPersistence } = await import(
              loaded('/src/game/classicPersistenceApp.ts')
            )
            const service = initializeClassicPersistence()
            const raw = service.getSnapshot().disk.raw
            if (play === 0) {
              useProgressionStore.getState().resetProgression()
              game.startNewRun(7)
            }
            const state = game.getState()
            state.seasonSystem.clear()
            state.mandateEffectSystem.deactivateMandate()
            state.faceDownTileIds.clear()
            state.selectedTileIds.clear()
            state.targetScore = 1e12
            state.roundManager.getCurrentRound().scoreTarget = 1e12
            state.wallTemplate = state.wallTemplate.filter(
              (tile: { isBonus: boolean }) => !tile.isBonus
            )
            state.handTiles = [
              [TileSuit.Manzu, [1, 9, 1]],
              [TileSuit.Pinzu, [1, 9]],
              [TileSuit.Souzu, [1, 9]],
              [TileSuit.Wind, [1, 2, 3, 4]],
              [TileSuit.Dragon, [1, 2, 3]],
            ].flatMap(([suit, ranks], group) =>
              (ranks as number[]).map(
                (rank, i) =>
                  new Tile(suit, rank, `yakuman-${play}-${group}-${i}`)
              )
            )
            if (!(await service.saveNewRun(raw)))
              throw Error('Fixture save failed')
            return state.handTiles.map((tile: { id: string }) => tile.id)
          }, play)
      if (!replay && play === 2) {
        const records = await page.evaluate(() =>
          Object.fromEntries(
            ['tensho-classic-run-v1', 'tensho-progression'].map((key) => [
              key,
              localStorage.getItem(key),
            ])
          )
        )
        writeFileSync(
          info.outputPath('unlock-replay.json'),
          JSON.stringify(records)
        )
      }
      await page.reload()
      await saved()
      // Use the player's two-step complete-hand declaration. Staging remains
      // non-scoring; confirmation below is the only committed play.
      const playButton = page.locator('[data-game-action="play"]')
      if (isMobile) await playButton.tap()
      else await playButton.click()
      const staged = page.locator('[data-play-zone="staging"] [data-play-tile]')
      await expect(staged).toHaveCount(ids.length)
      expect(
        await staged.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('data-play-tile')).sort()
        )
      ).toEqual([...ids].sort())
      expect((await profile()).stats.currentRunYakumanScored).toBe(play)
      await page.locator('[data-game-action="play"]').click()
      await expect
        .poll(async () => (await profile()).stats.currentRunYakumanScored)
        .toBe(play + 1)
      const earned = await profile()
      expect(earned.unlocks.unlock_heavenly_ordinance).toBeTruthy()
      expect(Boolean(earned.unlocks.unlock_yakuman_blessing)).toBe(play === 2)
      await saved()
      await page.reload()
      await saved()
      expect((await profile()).stats.currentRunYakumanScored).toBe(play + 1)
    }
  })
}
