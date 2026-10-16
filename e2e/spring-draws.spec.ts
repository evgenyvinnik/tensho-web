import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { clearReveals, handScoreTotal, settleReveals } from './helpers/table'

for (const language of ['en', 'es'])
  for (const springs of [1, 2])
    test(`Spring ${springs} expands the rack through redraw, play and reload (${language})`, async ({
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
      await page.evaluate(async (springs) => {
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
        for (const d of state.decreeSystem.getOwnedDecrees())
          state.decreeSystem.removeDecree(d.id)
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        state.seasonSystem.setAct(1)
        state.handTiles = Array.from(
          { length: 14 },
          (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `hand-${i}`)
        )
        state.wall = [
          Tile.createSeason(SeasonType.Spring, 'spring-1'),
          ...Array.from(
            { length: 60 },
            (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
          ),
        ]
        state.deadWall = [
          ...(springs === 2
            ? [Tile.createSeason(SeasonType.Spring, 'spring-2')]
            : []),
          new Tile(TileSuit.Wind, 1, 'dead-1'),
        ]
        state.drawIndex = 0
        state.targetScore = 1e9
        state.roundManager.getCurrentRound().scoreTarget = 1e9
        state.selectedTileIds.clear()
        state.faceDownTileIds.clear()
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
      }, springs)
      // startNewRun queues its starting Decrees for a reveal over the table.
      await clearReveals(page)
      const before = await saved()
      await testInfo.attach('before-spring', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      await activate(
        page.locator('[data-play-zone="hand"] [data-play-tile="hand-0"]')
      )
      await activate(page.locator('[data-game-action="redraw"]'))
      // Each Spring drawn is announced with a reveal over the table.
      await settleReveals(page, 2_000)
      const count = 14 + springs * 2
      await expect(
        page.locator('[data-play-zone="hand"] [data-play-tile]')
      ).toHaveCount(count)
      const expanded = await saved()
      expect(expanded.state.handTiles).toHaveLength(count)
      expect(
        expanded.state.handTiles.some((t: { id: string }) => t.id === 'hand-0')
      ).toBe(false)
      // No free redraws: the REDRAW spent a Turn.
      expect(expanded.state.redrawsRemaining).toBe(
        before.state.redrawsRemaining
      )
      expect(expanded.state.handsRemaining).toBe(
        before.state.handsRemaining - 1
      )
      expect(expanded.state.seasonSystem.seasonStack).toHaveLength(springs)
      // Each Spring is its own token on the item rail, with its own details.
      const springTokens = page.locator('[data-flora-season]')
      await expect(springTokens).toHaveCount(springs)
      for (const token of await springTokens.all())
        await expect(token).toHaveAttribute('aria-label', copy.flora.spring)
      await activate(springTokens.first())
      const dialog = page.getByRole('dialog', { name: copy.flora.spring })
      await expect(
        dialog.getByText(copy.flora.details.spring, { exact: true })
      ).toBeVisible()
      const artwork = springTokens
        .first()
        .locator('img[src*="spring-blossom.webp"]')
      await expect
        .poll(() =>
          artwork.evaluate(
            (node: HTMLImageElement) =>
              node.complete && node.naturalWidth === 512
          )
        )
        .toBe(true)
      await page.screenshot({
        path: testInfo.outputPath('spring-inspector.png'),
      })
      expect(await saved()).toEqual(expanded)
      await activate(
        dialog.getByRole('button', { name: copy.common.close, exact: true })
      )
      await page.reload()
      expect(await saved()).toEqual(expanded)
      for (let i = 0; i < 2; i++)
        await activate(
          page.locator('[data-play-zone="hand"] [data-play-tile]').first()
        )
      const preview = handScoreTotal(page, 'preview')
      await expect(preview).toBeVisible()
      const forecast = Number(
        (await preview.getAttribute('title'))!.replace(/\D/g, '')
      )
      await activate(page.locator('[data-game-action="play"]'))
      await expect(
        page.locator('[data-play-zone="hand"] [data-play-tile]')
      ).toHaveCount(count)
      const paid = await saved()
      expect(paid.state.score - expanded.state.score).toBe(forecast)
      expect(paid.state.handsRemaining).toBe(expanded.state.handsRemaining - 1)
      await page.reload()
      expect(await saved()).toEqual(paid)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
