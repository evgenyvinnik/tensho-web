import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

for (const language of ['en', 'es'])
  for (const autumns of [1, 2])
    test(`Autumn ${autumns} grants usable discards, expires, and reloads (${language})`, async ({
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
      await page.evaluate(async (autumns) => {
        const gamePath = '/src/game/GameOrchestrator.ts',
          tilePath = '/src/core/Tile.ts',
          savePath = '/src/game/classicPersistenceApp.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { Tile, TileSuit, SeasonType } = await import(tilePath)
        const { initializeClassicPersistence } = await import(savePath)
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        const state = game.getState()
        for (const decree of state.decreeSystem.getOwnedDecrees())
          state.decreeSystem.removeDecree(decree.id)
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        state.seasonSystem.setAct(1)
        state.handTiles = Array.from(
          { length: 14 },
          (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `hand-${i}`)
        )
        state.wall = [
          Tile.createSeason(SeasonType.Autumn, 'autumn-1'),
          ...Array.from(
            { length: 60 },
            (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
          ),
        ]
        state.deadWall = [
          ...(autumns === 2
            ? [Tile.createSeason(SeasonType.Autumn, 'autumn-2')]
            : []),
          new Tile(TileSuit.Wind, 1, 'dead-1'),
        ]
        state.drawIndex = 0
        state.discardsRemaining = 0
        state.wallTemplate = state.wallTemplate.filter(
          (t: { isBonus: boolean }) => !t.isBonus
        )
        state.targetScore = 1e9
        state.roundManager.getCurrentRound().scoreTarget = 1e9
        state.selectedTileIds.clear()
        state.faceDownTileIds.clear()
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
      }, autumns)
      const before = await saved()
      await testInfo.attach('before-autumn', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      const counter = page.locator(
        '[data-play-zone="discard"] [data-tutorial="discards-remaining"]'
      )
      await expect(counter).toHaveText('0')
      await activate(
        page.locator('[data-play-zone="hand"] [data-play-tile="hand-0"]')
      )
      await activate(page.locator('[data-game-action="redraw"]'))
      await expect(counter).toHaveText(String(autumns))
      const drawn = await saved()
      expect(drawn.state.discardsRemaining).toBe(autumns)
      expect(drawn.state.handsRemaining).toBe(before.state.handsRemaining)
      expect(drawn.state.redrawsRemaining).toBe(
        before.state.redrawsRemaining - 1
      )
      expect(drawn.state.seasonSystem.seasonStack).toHaveLength(autumns)
      await activate(page.getByTestId('flora-details-trigger'))
      const dialog = page.getByRole('dialog')
      await expect(
        dialog.getByText(copy.flora.details.autumn, { exact: true })
      ).toHaveCount(autumns)
      const art = dialog.locator('img[src*="autumn-maple.webp"]').first()
      await art.scrollIntoViewIfNeeded()
      await expect
        .poll(() =>
          art.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth === 512
          )
        )
        .toBe(true)
      await page.screenshot({
        path: testInfo.outputPath('autumn-inspector.png'),
      })
      expect(await saved()).toEqual(drawn)
      await activate(
        dialog.getByRole('button', { name: copy.common.close, exact: true })
      )
      await page.reload()
      expect(await saved()).toEqual(drawn)
      const touch = isMobile ? await page.context().newCDPSession(page) : null
      const discardTile = async () => {
        const tile = page
          .locator('[data-play-zone="hand"] [data-play-tile]')
          .first()
        const zone = page.locator('[data-play-zone="discard"]')
        await tile.scrollIntoViewIfNeeded()
        await expect(tile).toBeInViewport()
        await expect(zone).toBeInViewport()
        if (!touch) return tile.dragTo(zone)
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
      }
      for (let remaining = autumns - 1; remaining >= 0; remaining--) {
        await discardTile()
        await expect(counter).toHaveText(String(remaining))
        expect((await saved()).state.discardsRemaining).toBe(remaining)
        await expect(page.getByRole('dialog')).toHaveCount(0)
      }
      const spent = await saved()
      await discardTile()
      expect(await saved()).toEqual(spent)
      if (touch) await touch.detach()
      for (let i = 0; i < 2; i++)
        await activate(
          page.locator('[data-play-zone="hand"] [data-play-tile]').first()
        )
      const preview = page.getByTestId('score-preview-total')
      const forecast = Number(
        (await preview.getAttribute('aria-label'))!.replace(/\D/g, '')
      )
      await activate(page.locator('[data-game-action="play"]'))
      const paid = await saved()
      expect(paid.state.score - spent.state.score).toBe(forecast)
      expect(paid.state.discardsRemaining).toBe(0)
      await page.reload()
      expect(await saved()).toEqual(paid)
      await activate(page.locator('[data-game-action="skip"]'))
      await expect(counter).not.toHaveText('0')
      const next = await saved()
      expect(next.state.currentRound).toBe(2)
      expect(next.state.seasonSystem.seasonStack).toEqual([])
      expect(next.state.discardsRemaining).toBe(3 + next.state.omenDiscardBonus)
      await page.reload()
      expect(await saved()).toEqual(next)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
