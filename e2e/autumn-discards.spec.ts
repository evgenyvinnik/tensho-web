import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import {
  clearReveals,
  continueToNextRound,
  handScoreTotal,
  settleReveals,
  swiftClear,
} from './helpers/table'

for (const language of ['en', 'es'])
  for (const autumns of [1, 2])
    test(`Autumn ${autumns} grants usable free redraws, expires, and reloads (${language})`, async ({
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
      // startNewRun queues its starting Decrees for a reveal over the table.
      await clearReveals(page)
      const before = await saved()
      await testInfo.attach('before-autumn', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      // Autumn's extra discard is a free REDRAW now, shown on the button.
      const free = page.locator(
        '[data-game-action="redraw"] [data-free-redraws]'
      )
      await expect(free).toHaveCount(0)
      expect(before.state.redrawsRemaining).toBe(0)
      const redrawFirstTile = async () => {
        await activate(
          page.locator('[data-play-zone="hand"] [data-play-tile]').first()
        )
        await activate(page.locator('[data-game-action="redraw"]'))
      }
      await activate(
        page.locator('[data-play-zone="hand"] [data-play-tile="hand-0"]')
      )
      await activate(page.locator('[data-game-action="redraw"]'))
      // Each Autumn drawn is announced with a reveal over the table.
      await settleReveals(page, 2_000)
      await expect(free).toHaveAttribute('data-free-redraws', String(autumns))
      const drawn = await saved()
      expect(drawn.state.redrawsRemaining).toBe(autumns)
      expect(drawn.state.discardsRemaining).toBe(0)
      // The REDRAW that drew the Autumn had no free redraw to spend.
      expect(drawn.state.handsRemaining).toBe(before.state.handsRemaining - 1)
      expect(drawn.state.seasonSystem.seasonStack).toHaveLength(autumns)
      // Each Autumn is its own token on the item rail, with its own details.
      const autumnTokens = page.locator('[data-flora-season]')
      await expect(autumnTokens).toHaveCount(autumns)
      for (const token of await autumnTokens.all())
        await expect(token).toHaveAttribute('aria-label', copy.flora.autumn)
      await activate(autumnTokens.first())
      const dialog = page.getByRole('dialog', { name: copy.flora.autumn })
      await expect(
        dialog.getByText(copy.flora.details.autumn, { exact: true })
      ).toBeVisible()
      const art = autumnTokens.first().locator('img[src*="autumn-maple.webp"]')
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
      await expect(dialog).toHaveCount(0)
      await page.reload()
      expect(await saved()).toEqual(drawn)
      // Each free redraw is spent before a Turn.
      for (let remaining = autumns - 1; remaining >= 0; remaining--) {
        await redrawFirstTile()
        if (remaining)
          await expect(free).toHaveText(new RegExp(String(remaining)))
        else await expect(free).toHaveCount(0)
        const state = (await saved()).state
        expect(state.redrawsRemaining).toBe(remaining)
        expect(state.handsRemaining).toBe(drawn.state.handsRemaining)
        await expect(page.getByRole('dialog')).toHaveCount(0)
      }
      const spent = await saved()
      // With none left, a REDRAW costs a Turn again.
      await redrawFirstTile()
      await expect
        .poll(async () => (await saved()).state.handsRemaining)
        .toBe(spent.state.handsRemaining - 1)
      const redrawn = await saved()
      expect(redrawn.state.redrawsRemaining).toBe(0)
      for (let i = 0; i < 2; i++)
        await activate(
          page.locator('[data-play-zone="hand"] [data-play-tile]').first()
        )
      const forecast = Number(
        (await handScoreTotal(page, 'preview').getAttribute('title'))!.replace(
          /\D/g,
          ''
        )
      )
      await activate(page.locator('[data-game-action="play"]'))
      await expect
        .poll(async () => (await saved()).state.score - redrawn.state.score)
        .toBe(forecast)
      const paid = await saved()
      expect(paid.state.redrawsRemaining).toBe(0)
      await page.reload()
      expect(await saved()).toEqual(paid)
      // Skip is gone: clear the round to reach the next one.
      await swiftClear(page)
      await continueToNextRound(page)
      const next = await saved()
      expect(next.state.currentRound).toBe(2)
      expect(next.state.seasonSystem.seasonStack).toEqual([])
      // Autumn's free redraws end with its round.
      expect(next.state.redrawsRemaining).toBe(
        next.state.omenRedrawBonus + next.state.omenDiscardBonus
      )
      await page.reload()
      expect(await saved()).toEqual(next)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
