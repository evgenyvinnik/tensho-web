import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

const fixtureDir = process.env.ORCHID_REPLAY_DIR
for (const language of ['en', 'es'])
  for (const action of ['play', 'redraw'])
    test(`Orchid blooms after ${action}, preserves extras on reload and expires with Spring (${language})`, async ({
      page,
      isMobile,
      baseURL,
    }, testInfo) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      const replay = fixtureDir
        ? readFileSync(`${fixtureDir}/${action}.json`, 'utf8')
        : null
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript((replay) => {
        localStorage.setItem('tensho_tutorial_completed', 'true')
        localStorage.setItem('tensho_hints_disabled', 'true')
        if (replay && !localStorage.getItem('tensho-classic-run-v1'))
          localStorage.setItem('tensho-classic-run-v1', replay)
      }, replay)
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
      await page.goto(`${baseURL!.replace(/\/$/, '')}/${language}/play`)
      await saved()
      if (!replay) {
        await page.evaluate(async () => {
          const loaded = (path: string) => {
            const url = performance
              .getEntriesByType('resource')
              .map((e) => e.name)
              .reverse()
              .find((url) => new URL(url).pathname === path)
            if (!url) throw Error(`App did not load ${path}`)
            return url
          }
          const { gameOrchestrator: game } = await import(
            loaded('/src/game/GameOrchestrator.ts')
          )
          const { Tile, TileSuit, FlowerType } = await import(
            loaded('/src/core/Tile.ts')
          )
          const { initializeClassicPersistence } = await import(
            loaded('/src/game/classicPersistenceApp.ts')
          )
          const service = initializeClassicPersistence(),
            raw = service.getSnapshot().disk.raw
          game.startNewRun(7)
          const state = game.getState()
          for (const decree of state.decreeSystem.getOwnedDecrees())
            state.decreeSystem.removeDecree(decree.id)
          state.flowerSystem.clear()
          state.flowerSystem.addFlower(
            Tile.createFlower(FlowerType.Orchid, 'orchid')
          )
          state.seasonSystem.clear()
          state.seasonSystem.setAct(1)
          state.seasonSystem.forceSetSeason('Spring')
          state.handTiles = Array.from(
            { length: 16 },
            (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `hand-${i}`)
          )
          state.wall = [
            new Tile(TileSuit.Wind, 1, 'honor-1'),
            new Tile(TileSuit.Dragon, 1, 'honor-2'),
            ...Array.from(
              { length: 50 },
              (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
            ),
          ]
          state.deadWall = [
            new Tile(TileSuit.Manzu, 1, 'gift-1'),
            new Tile(TileSuit.Manzu, 2, 'gift-2'),
          ]
          state.drawIndex = 0
          state.wallTemplate = state.wallTemplate.filter(
            (t: { isBonus: boolean }) => !t.isBonus
          )
          state.summerReserve = []
          state.bambooSummerProtection = false
          state.faceDownTileIds.clear()
          state.selectedTileIds.clear()
          state.targetScore = 1e9
          state.roundManager.getCurrentRound().scoreTarget = 1e9
          if (!(await service.saveNewRun(raw)))
            throw Error('Fixture save failed')
        })
        await testInfo.attach(`orchid-${action}`, {
          body: await page.evaluate(
            () => localStorage.getItem('tensho-classic-run-v1')!
          ),
          contentType: 'application/json',
        })
        await page.reload()
      }
      const before = await saved()
      for (const id of ['hand-0', 'hand-1', 'hand-2'])
        await activate(
          page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
        )
      const forecast =
        action === 'play'
          ? Number(
              await page
                .locator('[data-game-action-score]')
                .textContent()
                .then((s) => s!.replace(/\D/g, ''))
            )
          : null
      await activate(page.locator(`[data-game-action="${action}"]`))
      await expect
        .poll(async () => (await saved()).state.handTiles.length)
        .toBe(18)
      const bloomed = await saved()
      expect(bloomed.state.handTiles.map((t: { id: string }) => t.id)).toEqual(
        expect.arrayContaining(['gift-1', 'gift-2'])
      )
      expect(bloomed.state.handsRemaining).toBe(
        before.state.handsRemaining - (action === 'play' ? 1 : 0)
      )
      expect(bloomed.state.redrawsRemaining).toBe(
        before.state.redrawsRemaining - (action === 'redraw' ? 1 : 0)
      )
      expect(bloomed.state.discardsRemaining).toBe(
        before.state.discardsRemaining
      )
      if (forecast !== null)
        expect(bloomed.state.score - before.state.score).toBe(forecast)
      const flora = page.getByTestId('flora-details-trigger')
      await activate(flora)
      const dialog = page.getByRole('dialog')
      await expect(dialog.locator('[data-orchid-bloom]')).toHaveText(
        copy.flora.details.orchidBloom.replace('{{count}}', '2')
      )
      expect(
        await dialog
          .locator('img[src*="orchid-bloom.webp"]')
          .evaluate(async (img: HTMLImageElement) => {
            await img.decode()
            return img.naturalWidth
          })
      ).toBe(512)
      await dialog.locator('[data-orchid-bloom]').scrollIntoViewIfNeeded()
      expect(
        await dialog
          .locator('[data-orchid-bloom]')
          .evaluate((p) => p.scrollWidth <= p.clientWidth + 1)
      ).toBe(true)
      await page.screenshot({ path: testInfo.outputPath('orchid-bloom.png') })
      expect(await saved()).toEqual(bloomed)
      await activate(
        dialog.getByRole('button', { name: copy.common.close, exact: true })
      )
      await page.reload()
      expect(await saved()).toEqual(bloomed)
      await activate(flora)
      await expect(page.locator('[data-orchid-bloom]')).toHaveCount(0)
      await activate(
        page
          .getByRole('dialog')
          .getByRole('button', { name: copy.common.close, exact: true })
      )
      for (const id of ['hand-3', 'hand-4', 'hand-5'])
        await activate(
          page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
        )
      await activate(page.locator('[data-game-action="play"]'))
      await expect
        .poll(async () => (await saved()).state.handTiles.length)
        .toBe(16)
      await activate(page.locator('[data-game-action="skip"]'))
      await expect.poll(async () => (await saved()).state.currentRound).toBe(2)
      const next = await saved()
      expect(next.state.handTiles).toHaveLength(14)
      expect(next.state.seasonSystem.seasonStack).toEqual([])
      await page.reload()
      expect(await saved()).toEqual(next)
      expect(errors).toEqual([])
    })
