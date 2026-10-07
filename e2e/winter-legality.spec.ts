import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Production/hosted verification reuses the exact persisted fixture captured by
// the native run. No engine imports or test-only production endpoint is needed.
const replay = process.env.WINTER_REPLAY_FIXTURE
  ? readFileSync(process.env.WINTER_REPLAY_FIXTURE, 'utf8')
  : null

for (const language of ['en', 'es'])
  for (const shape of ['tactical', 'complete'])
    test(`Winter drawn, explained, paid and expired: ${shape} (${language})`, async ({
      page,
      isMobile,
      baseURL,
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
      if (!replay)
        await page.evaluate(async () => {
          const gamePath = '/src/game/GameOrchestrator.ts',
            tilePath = '/src/core/Tile.ts',
            savePath = '/src/game/classicPersistenceApp.ts'
          // Reuse the app's exact module URLs, including Vite's HMR timestamp.
          // Importing an unversioned singleton after an edit creates a second
          // engine that is not the one backing the UI/persistence service.
          const loadedModule = (path: string) => {
            const url = performance
              .getEntriesByType('resource')
              .map((entry) => entry.name)
              .reverse()
              .find((url) => new URL(url).pathname === path)
            if (!url) throw Error(`App did not load ${path}`)
            return url
          }
          const { gameOrchestrator: game } = await import(
            loadedModule(gamePath)
          )
          const { Tile, TileSuit, SeasonType } = await import(
            loadedModule(tilePath)
          )
          const { initializeClassicPersistence } = await import(
            loadedModule(savePath)
          )
          const service = initializeClassicPersistence(),
            raw = service.getSnapshot().disk.raw
          game.startNewRun(7)
          const state = game.getState()
          for (const decree of state.decreeSystem.getOwnedDecrees())
            state.decreeSystem.removeDecree(decree.id)
          state.flowerSystem.clear()
          state.seasonSystem.clear()
          state.seasonSystem.setAct(1)
          state.handTiles = [
            ...[1, 2, 4].map(
              (rank, i) => new Tile(TileSuit.Manzu, rank, `gap-${i}`)
            ),
            ...[2, 3, 4, 5, 6, 7].map(
              (rank, i) => new Tile(TileSuit.Pinzu, rank, `pin-${i}`)
            ),
            ...[6, 7, 8].map(
              (rank, i) => new Tile(TileSuit.Souzu, rank, `sou-${i}`)
            ),
            new Tile(TileSuit.Wind, 1, 'pair'),
            new Tile(TileSuit.Wind, 1, 'redraw'),
          ]
          state.wall = [
            Tile.createSeason(SeasonType.Winter, 'winter'),
            ...Array.from(
              { length: 60 },
              (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
            ),
          ]
          state.deadWall = [new Tile(TileSuit.Wind, 1, 'replacement')]
          state.drawIndex = 0
          state.wallTemplate = state.wallTemplate.filter(
            (t: { isBonus: boolean }) => !t.isBonus
          )
          state.targetScore = 1e9
          state.roundManager.getCurrentRound().scoreTarget = 1e9
          state.selectedTileIds.clear()
          state.faceDownTileIds.clear()
          if (!(await service.saveNewRun(raw)))
            throw Error('Fixture save failed')
        })
      const before = await saved()
      await testInfo.attach('before-winter', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      const play = page.locator('[data-game-action="play"]')
      await expect(play).not.toContainText(copy.gameplay.stageHand)
      await activate(
        page.locator('[data-play-zone="hand"] [data-play-tile="redraw"]')
      )
      await activate(page.locator('[data-game-action="redraw"]'))
      await expect(play).toContainText(copy.gameplay.stageHand)
      const drawn = await saved()
      expect(drawn.state.seasonSystem.seasonStack).toHaveLength(1)
      expect(drawn.state.handsRemaining).toBe(before.state.handsRemaining)
      expect(drawn.state.redrawsRemaining).toBe(
        before.state.redrawsRemaining - 1
      )
      await activate(page.getByTestId('flora-details-trigger'))
      const dialog = page.getByRole('dialog')
      await expect(
        dialog.getByText(copy.flora.details.winter, { exact: true })
      ).toBeVisible()
      const art = dialog.locator('img[src*="winter-pine.webp"]')
      await art.scrollIntoViewIfNeeded()
      await expect
        .poll(() =>
          art.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth === 512
          )
        )
        .toBe(true)
      await page.screenshot({
        path: testInfo.outputPath('winter-inspector.png'),
      })
      expect(await saved()).toEqual(drawn)
      await activate(
        dialog.getByRole('button', { name: copy.common.close, exact: true })
      )
      await page.reload()
      expect(await saved()).toEqual(drawn)
      if (shape === 'complete') {
        await activate(play)
        await expect(play).toContainText(copy.gameplay.confirmHand)
        await expect(
          page.locator('[data-play-zone="staging"] [data-play-tile]')
        ).toHaveCount(14)
      } else {
        for (const id of ['gap-0', 'gap-1', 'gap-2'])
          await activate(
            page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
          )
        await expect(
          page.locator('[data-play-zone="staging"] [data-play-tile]')
        ).toHaveCount(3)
      }
      const forecast = Number(
        (await page
          .getByTestId('score-preview-total')
          .getAttribute('aria-label'))!.replace(/\D/g, '')
      )
      if (shape === 'tactical') expect(forecast).toBe(37)
      else expect(forecast).toBeGreaterThan(37)
      const staged = await saved()
      expect(staged.state.score).toBe(drawn.state.score)
      expect(staged.state.handsRemaining).toBe(drawn.state.handsRemaining)
      const details = page.locator('[data-hand-interpretation]')
      await expect(details).not.toHaveAttribute('open', '')
      if (isMobile) await details.locator('summary').tap()
      else {
        await details.locator('summary').focus()
        await page.keyboard.press('Enter')
      }
      await expect(details.locator('[data-skipped-sequences]')).toContainText(
        copy.handInterpretation.sequenceSkip
      )
      await expect(details.locator('[data-skipped-sequences] img')).toHaveCount(
        3
      )
      expect(await saved()).toEqual(staged)
      expect(
        await details.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      await details.screenshot({
        path: testInfo.outputPath('winter-interpretation.png'),
      })
      await activate(details.locator('summary'))
      await activate(play)
      await expect
        .poll(async () => (await saved()).state.score)
        .toBe(drawn.state.score + forecast)
      const paid = await saved()
      expect(paid.state.handsRemaining).toBe(drawn.state.handsRemaining - 1)
      const playedIds =
        shape === 'complete'
          ? drawn.state.handTiles.map((t: { id: string }) => t.id)
          : ['gap-0', 'gap-1', 'gap-2']
      expect(
        paid.state.discards.filter((t: { id: string }) =>
          playedIds.includes(t.id)
        )
      ).toEqual(
        drawn.state.handTiles.filter((t: { id: string }) =>
          playedIds.includes(t.id)
        )
      )
      await page.reload()
      expect(await saved()).toEqual(paid)
      await activate(page.locator('[data-game-action="skip"]'))
      await expect.poll(async () => (await saved()).state.currentRound).toBe(2)
      const next = await saved()
      expect(next.state.seasonSystem.seasonStack).toEqual([])
      await page.reload()
      expect(await saved()).toEqual(next)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
