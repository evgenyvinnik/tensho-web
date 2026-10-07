import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

for (const language of ['en', 'es'])
  for (const protectedFlowers of [false, true])
    test(`Drought empowerment protection=${protectedFlowers} forecasts, pays and reloads (${language})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(() => {
        localStorage.setItem('tensho_tutorial_completed', 'true')
        localStorage.setItem('tensho_hints_disabled', 'true')
      })
      const activate = (node: Locator) => (isMobile ? node.tap() : node.click())
      const saved = async () => {
        await expect(
          page.locator('[data-classic-save-status="saved"]')
        ).toBeVisible()
        return page.evaluate(
          () =>
            JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
        )
      }
      await page.goto(`/${language}/play`)
      await saved()
      await page.evaluate(async (protectedFlowers) => {
        const gamePath = '/src/game/GameOrchestrator.ts',
          tilePath = '/src/core/Tile.ts',
          decreePath = '/src/systems/DecreeSystem.ts',
          savePath = '/src/game/classicPersistenceApp.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { Tile, TileSuit, FlowerType } = await import(tilePath)
        const { ALL_DECREES } = await import(decreePath)
        const { initializeClassicPersistence } = await import(savePath)
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        const state = game.getState()
        for (const d of state.decreeSystem.getOwnedDecrees())
          state.decreeSystem.removeDecree(d.id)
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        for (const type of [
          FlowerType.Plum,
          FlowerType.Orchid,
          FlowerType.Bamboo,
        ])
          state.flowerSystem.addFlower(
            Tile.createFlower(type, `flower-${type}`)
          )
        state.seasonSystem.forceSetSeason('Summer', true)
        state.handTiles = [
          ...[4, 5, 6].map(
            (rank) => new Tile(TileSuit.Souzu, rank, `drought-${rank}`)
          ),
          ...Array.from(
            { length: 11 },
            (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `spare-${i}`)
          ),
        ]
        state.wall = Array.from(
          { length: 60 },
          (_, i) => new Tile(TileSuit.Manzu, (i % 9) + 1, `wall-${i}`)
        )
        state.drawIndex = 0
        state.targetScore = 1e9
        state.roundManager.getCurrentRound().scoreTarget = 1e9
        state.selectedTileIds.clear()
        state.faceDownTileIds.clear()
        for (const id of [
          'decree-half-suited',
          'decree-gentle-breeze',
          ...(protectedFlowers ? ['decree-eternal-garden'] : []),
        ])
          if (
            !game.addDecree(
              ALL_DECREES.find((d: { id: string }) => d.id === id)
            )
          )
            throw Error('Decree grant failed')
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
      }, protectedFlowers)
      const before = await saved()
      await testInfo.attach('before-drought', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      for (const rank of [4, 5, 6])
        await activate(
          page.locator(
            `[data-play-zone="hand"] [data-play-tile="drought-${rank}"]`
          )
        )
      // Three Flowers satisfy Eternal Garden's real acquisition gate.
      // Protected: (45 + 20 * 1.3) * (1 + (2 + 30) * 1.3) * 1.05 = 3175.83.
      const expected = protectedFlowers ? 3175 : 195
      await expect(page.getByTestId('score-preview-total')).toHaveText(
        `+${expected.toLocaleString(language)}`
      )
      const staged = await saved()
      await activate(page.getByTestId('flora-details-trigger'))
      const dialog = page.getByRole('dialog')
      await expect(dialog).toContainText(copy.flora.details.drought)
      await expect(dialog).toContainText(
        protectedFlowers
          ? copy.flora.details.protected
          : copy.flora.details.suppressed
      )
      expect(await saved()).toEqual(staged)
      await page.screenshot({
        path: testInfo.outputPath('drought-inspector.png'),
      })
      await activate(
        dialog.getByRole('button', { name: copy.common.close, exact: true })
      )
      await expect(
        page.locator('[data-play-zone="staging"] [data-play-tile]')
      ).toHaveCount(3)
      await activate(page.locator('[data-game-action="play"]'))
      await expect(page.locator('[data-score-result]')).toHaveText(
        expected.toLocaleString(language)
      )
      const after = await saved()
      expect(after.state.score - before.state.score).toBe(expected)
      expect(after.state.handsRemaining).toBe(before.state.handsRemaining - 1)
      expect(after.state.flowerSystem).toEqual(before.state.flowerSystem)
      expect(after.state.seasonSystem).toEqual(before.state.seasonSystem)
      await page.reload()
      expect(await saved()).toEqual(after)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
