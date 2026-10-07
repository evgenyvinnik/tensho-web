import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Replay mode loads native captured legacy envelopes; production has no source imports.
const fixtureDir = process.env.BAMBOO_REPLAY_DIR
for (const language of ['en', 'es'])
  for (const shape of ['quad', 'complete'])
    test(`Bamboo shelters Summer through ${shape}, reload and next round (${language})`, async ({
      page,
      isMobile,
      baseURL,
    }, testInfo) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      const fixture = fixtureDir
        ? readFileSync(`${fixtureDir}/${shape}.json`, 'utf8')
        : null
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript((fixture) => {
        localStorage.setItem('tensho_tutorial_completed', 'true')
        localStorage.setItem('tensho_hints_disabled', 'true')
        if (fixture && !localStorage.getItem('tensho-classic-run-v1'))
          localStorage.setItem('tensho-classic-run-v1', fixture)
      }, fixture)
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
      if (!fixture) {
        await page.evaluate(async (shape) => {
          const loadedModule = (path: string) => {
            const url = performance
              .getEntriesByType('resource')
              .map((e) => e.name)
              .reverse()
              .find((url) => new URL(url).pathname === path)
            if (!url) throw Error(`App did not load ${path}`)
            return url
          }
          const { gameOrchestrator: game } = await import(
            loadedModule('/src/game/GameOrchestrator.ts')
          )
          const { Tile, TileSuit, SeasonType, FlowerType } = await import(
            loadedModule('/src/core/Tile.ts')
          )
          const { initializeClassicPersistence } = await import(
            loadedModule('/src/game/classicPersistenceApp.ts')
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
          state.bambooSummerProtection = false
          state.summerReserve = []
          state.handTiles =
            shape === 'quad'
              ? [
                  ...Array.from(
                    { length: 4 },
                    (_, i) => new Tile(TileSuit.Manzu, 1, `terminal-${i}`)
                  ),
                  ...Array.from(
                    { length: 10 },
                    (_, i) => new Tile(TileSuit.Pinzu, (i % 7) + 2, `hand-${i}`)
                  ),
                ]
              : [
                  ...[1, 1, 1, 9, 9, 9].map(
                    (rank, i) => new Tile(TileSuit.Manzu, rank, `terminal-${i}`)
                  ),
                  ...[2, 3, 4, 6, 7, 8].map(
                    (rank, i) => new Tile(TileSuit.Pinzu, rank, `sequence-${i}`)
                  ),
                  new Tile(TileSuit.Wind, 1, 'eye-0'),
                  new Tile(TileSuit.Wind, 1, 'hand-9'),
                ]
          state.wall = [
            Tile.createSeason(SeasonType.Summer, 'summer'),
            ...Array.from(
              { length: 40 },
              (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `wall-${i}`)
            ),
          ]
          state.wall.splice(
            1 + (shape === 'quad' ? 4 : 14),
            0,
            Tile.createSeason(SeasonType.Summer, 'later-summer')
          )
          state.deadWall = [
            Tile.createFlower(FlowerType.Bamboo, 'bamboo'),
            new Tile(TileSuit.Wind, 1, 'dead'),
          ]
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
          // A real legacy checkpoint, not a fabricated current save missing progress.
          const old = JSON.parse(localStorage.getItem('tensho-classic-run-v1')!)
          old.snapshot.version = 1
          delete old.snapshot.state.bambooSummerProtection
          localStorage.setItem('tensho-classic-run-v1', JSON.stringify(old))
        }, shape)
        await testInfo.attach(`legacy-${shape}`, {
          body: await page.evaluate(
            () => localStorage.getItem('tensho-classic-run-v1')!
          ),
          contentType: 'application/json',
        })
        await page.reload()
      }
      const legacy = await saved()
      expect(legacy.state.bambooSummerProtection ?? false).toBe(false)
      // Discard replaces from the live wall without shuffling its remainder;
      // redraw would intentionally shuffle away the later Summer's position.
      const tile = page.locator(
        '[data-play-zone="hand"] [data-play-tile="hand-9"]'
      )
      const zone = page.locator('[data-play-zone="discard"]')
      await tile.scrollIntoViewIfNeeded()
      await expect(tile).toBeInViewport()
      await expect(zone).toBeInViewport()
      if (isMobile) {
        const touch = await page.context().newCDPSession(page)
        const a = (await tile.boundingBox())!,
          b = (await zone.boundingBox())!
        const from = { x: a.x + a.width / 2, y: a.y + a.height / 2 }
        const to = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ ...from, id: 1 }],
        })
        for (let step = 1; step <= 8; step++)
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [
              {
                x: from.x + ((to.x - from.x) * step) / 8,
                y: from.y + ((to.y - from.y) * step) / 8,
                id: 1,
              },
            ],
          })
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [],
        })
        await touch.detach()
      } else await tile.dragTo(zone)
      await expect
        .poll(async () => (await saved()).state.summerReserve.length)
        .toBe(9)
      const drawn = await saved()
      expect(drawn.state.discardsRemaining).toBe(
        legacy.state.discardsRemaining - 1
      )
      expect(drawn.version).toBe(2)
      expect(drawn.state.bambooSummerProtection).toBe(false)
      expect(drawn.state.flowerSystem.flowers).toHaveLength(1)
      const reserved = drawn.state.summerReserve.map(
        (t: { id: string }) => t.id
      )
      const liveBefore = drawn.state.wall.length - drawn.state.drawIndex
      await activate(page.getByTestId('flora-details-trigger'))
      const dialog = page.getByRole('dialog')
      await expect(
        dialog.getByText(copy.flora.details.summer, { exact: true })
      ).toBeVisible()
      const art = dialog.locator('img[src*="summer-fan.webp"]').first()
      await art.scrollIntoViewIfNeeded()
      await expect
        .poll(() =>
          art.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth === 512
          )
        )
        .toBe(true)
      expect(await saved()).toEqual(drawn)
      await activate(
        dialog.getByRole('button', { name: copy.common.close, exact: true })
      )
      const play = page.locator('[data-game-action="play"]')
      if (shape === 'complete') {
        await activate(play)
        await expect(play).toContainText(copy.gameplay.confirmHand)
      } else
        for (let i = 0; i < 4; i++)
          await activate(
            page.locator(
              `[data-play-zone="hand"] [data-play-tile="terminal-${i}"]`
            )
          )
      const forecast = Number(
        (await page
          .getByTestId('score-preview-total')
          .getAttribute('aria-label'))!.replace(/\D/g, '')
      )
      const staged = await saved()
      expect(staged.state.bambooSummerProtection).toBe(false)
      expect(staged.state.summerReserve).toEqual(drawn.state.summerReserve)
      expect(staged.state.handsRemaining).toBe(drawn.state.handsRemaining)
      await activate(play)
      await expect
        .poll(async () => (await saved()).state.bambooSummerProtection)
        .toBe(true)
      const paid = await saved()
      expect(paid.state.summerReserve).toEqual([])
      expect(paid.state.score - drawn.state.score).toBe(forecast)
      expect(paid.state.handsRemaining).toBe(drawn.state.handsRemaining - 1)
      expect(paid.state.wall.length - paid.state.drawIndex).toBe(
        liveBefore + 9 - (shape === 'quad' ? 4 : 14)
      )
      for (const id of reserved)
        expect(paid.state.wall.some((t: { id: string }) => t.id === id)).toBe(
          true
        )
      await page.reload()
      expect(await saved()).toEqual(paid)
      // The next Summer is deliberately in the live draw path, not invoked by test code.
      await activate(
        page.locator('[data-play-zone="hand"] [data-play-tile]').first()
      )
      await activate(page.locator('[data-game-action="redraw"]'))
      await expect
        .poll(async () => (await saved()).state.seasonSystem.seasonStack.length)
        .toBe(2)
      const later = await saved()
      expect(later.state.summerReserve).toEqual([])
      expect(later.state.bambooSummerProtection).toBe(true)
      await activate(page.getByTestId('flora-details-trigger'))
      await expect(dialog.locator('[data-summer-sheltered]')).toHaveCount(2)
      await expect(
        dialog.locator('[data-summer-sheltered]').first()
      ).toHaveText(copy.flora.details.summerSheltered)
      await dialog
        .locator('[data-summer-sheltered]')
        .first()
        .scrollIntoViewIfNeeded()
      await page.screenshot({
        path: testInfo.outputPath('summer-sheltered.png'),
      })
      expect(await saved()).toEqual(later)
      await activate(
        dialog.getByRole('button', { name: copy.common.close, exact: true })
      )
      await page.reload()
      expect(await saved()).toEqual(later)
      await activate(page.locator('[data-game-action="skip"]'))
      await expect.poll(async () => (await saved()).state.currentRound).toBe(2)
      const next = await saved()
      expect(next.state.bambooSummerProtection).toBe(false)
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
