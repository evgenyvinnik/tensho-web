import { expect, test, type Locator } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'

test.use({ serviceWorkers: 'block' })
for (const language of ['en', 'es'])
  for (const mode of ['complete', 'abandon']) {
    test(`Riichi ${mode}: explicit payment, real play, and reload (${language})`, async ({
      page,
      isMobile,
      baseURL,
    }, info) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      let replay = process.env.RIICHI_REPLAY_FILE
        ? JSON.parse(readFileSync(process.env.RIICHI_REPLAY_FILE, 'utf8'))
        : null
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript((replay) => {
        localStorage.setItem('tensho_tutorial_completed', 'true')
        localStorage.setItem('tensho_hints_disabled', 'true')
        if (replay && !localStorage.getItem('tensho-classic-run-v1'))
          localStorage.setItem('tensho-classic-run-v1', replay.savedRun)
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
        const expected = await page.evaluate(async () => {
          const loaded = (path: string) => {
            const url = performance
              .getEntriesByType('resource')
              .map((e) => e.name)
              .find((url) => new URL(url).pathname === path)
            if (!url) throw Error(`Missing module ${path}`)
            return url
          }
          const { gameOrchestrator: game } = await import(
            loaded('/src/game/GameOrchestrator.ts')
          )
          const { Tile, TileSuit } = await import(loaded('/src/core/Tile.ts'))
          const { ALL_DECREES } = await import(
            loaded('/src/systems/DecreeSystem.ts')
          )
          const { CELESTIAL_ORBS, CelestialOrbSystem } = await import(
            loaded('/src/systems/CelestialOrbSystem.ts')
          )
          const { initializeClassicPersistence } = await import(
            loaded('/src/game/classicPersistenceApp.ts')
          )
          const service = initializeClassicPersistence(),
            raw = service.getSnapshot().disk.raw
          game.startNewRun(7)
          const state = game.getState()
          state.flowerSystem.clear()
          state.seasonSystem.clear()
          state.mandateEffectSystem.deactivateMandate()
          for (const d of state.decreeSystem.getOwnedDecrees())
            state.decreeSystem.removeDecree(d.id)
          state.decreeSystem.acquireDecree(
            ALL_DECREES.find(
              (d: { id: string }) => d.id === 'decree-riichi-devotee'
            )
          )
          game.setConsumableUnlockResolver(() => true)
          game.addCelestialOrb(
            CelestialOrbSystem.createCelestialOrbInstance(
              CELESTIAL_ORBS.pluto_orb
            )
          )
          if (
            !game.processAction({
              type: 'useOrb',
              orbId: game.getCelestialOrbs()[0].instanceId,
            }).success
          )
            throw Error('Pluto setup failed')
          state.handTiles = [
            ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
              (r, i) => new Tile(TileSuit.Manzu, r, `m-${i}`)
            ),
            ...[5, 5, 5].map((r, i) => new Tile(TileSuit.Souzu, r, `s-${i}`)),
            new Tile(TileSuit.Dragon, 1, 'spare-0'),
            new Tile(TileSuit.Dragon, 3, 'spare-1'),
          ]
          state.selectedTileIds.clear()
          state.faceDownTileIds.clear()
          state.wall = [
            new Tile(TileSuit.Pinzu, 6, 'pair-0'),
            new Tile(TileSuit.Pinzu, 6, 'pair-1'),
            ...Array.from(
              { length: 60 },
              (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
            ),
          ]
          state.gold = 8
          state.drawIndex = 0
          state.deadWall = []
          state.summerReserve = []
          state.wallTemplate = [...state.handTiles, ...state.wall]
          state.targetScore =
            state.roundManager.getCurrentRound().scoreTarget = 1e9
          const start = game.captureRun()
          const abandon = game.previewScore(['m-0', 'm-1', 'm-2']).finalScore
          if (!game.processAction({ type: 'declareRiichi' }).success)
            throw Error('Declaration failed')
          if (
            !game.processAction({
              type: 'redraw',
              tileIds: ['spare-0', 'spare-1'],
            }).success
          )
            throw Error('Redraw failed')
          const result = game.previewScore(
            game.getHandTiles().map((t: { id: string }) => t.id)
          )
          if (
            !result.detectedYaku.some(
              (y: { definition: { id: string } }) =>
                y.definition.id === 'riichi'
            )
          )
            throw Error('Riichi did not score')
          const complete = result.finalScore
          game.restoreRun(start)
          if (!(await service.saveNewRun(raw)))
            throw Error('Fixture save failed')
          return { complete, abandon }
        })
        replay = {
          ...expected,
          savedRun: await page.evaluate(() =>
            localStorage.getItem('tensho-classic-run-v1')
          ),
        }
        writeFileSync(
          info.outputPath('riichi-replay.json'),
          JSON.stringify(replay)
        )
        await page.reload()
      }
      const before = await saved(),
        trigger = page.locator('[data-open-riichi]'),
        dialog = page.getByRole('dialog')
      await expect(trigger).toHaveAttribute('data-riichi-status', 'available')
      await activate(trigger)
      await expect(
        dialog.getByRole('heading', { name: copy.riichiPledge.title })
      ).toBeVisible()
      await expect(dialog.locator('[data-riichi-cost]')).toHaveText(
        copy.riichiPledge.abandonNote
      )
      await expect(dialog.locator('[data-riichi-cost]')).toBeInViewport()
      await expect(dialog.locator('[data-riichi-confirm]')).toBeInViewport()
      const portrait = dialog.locator('img')
      await expect(portrait).toHaveAttribute('src', /riichi-devotee.webp$/)
      await expect
        .poll(() =>
          portrait.evaluate(
            (e: HTMLImageElement) => e.complete && e.naturalWidth > 0
          )
        )
        .toBe(true)
      expect(
        await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
      ).toBe(true)
      expect(await saved()).toEqual(before)
      await page.screenshot({ path: info.outputPath('pledge.png') })
      await activate(
        dialog.getByRole('button', { name: copy.common.close, exact: true })
      )
      await expect(trigger).toBeFocused()
      expect(await saved()).toEqual(before)
      await activate(trigger)
      await activate(dialog.locator('[data-riichi-confirm]'))
      await expect(dialog).toHaveCount(0)
      await expect(trigger).toHaveAttribute('data-riichi-status', 'active')
      const pledged = await saved()
      expect(pledged.state.gold).toBe(before.state.gold - 1)
      expect(pledged.state.handsRemaining).toBe(before.state.handsRemaining)
      await page.reload()
      expect(await saved()).toEqual(pledged)
      await expect(trigger).toHaveText(copy.riichiPledge.active)
      const play = page.locator('[data-game-action="play"]')
      if (mode === 'abandon') {
        await activate(trigger)
        await expect(dialog.locator('[data-riichi-confirm]')).toHaveText(
          copy.riichiPledge.abandon
        )
        await activate(dialog.locator('[data-riichi-confirm]'))
        await expect(trigger).toHaveAttribute('data-riichi-status', 'spent')
        const abandoned = await saved()
        expect(abandoned.state.gold).toBe(pledged.state.gold)
        await page.reload()
        expect(await saved()).toEqual(abandoned)
        await activate(trigger)
        await expect(dialog.locator('[data-riichi-reason="spent"]')).toHaveText(
          copy.riichiPledge.spent
        )
        await expect(dialog.locator('[data-riichi-confirm]')).toHaveCount(0)
        await activate(
          dialog.getByRole('button', { name: copy.common.close, exact: true })
        )
        for (const id of ['m-0', 'm-1', 'm-2'])
          await activate(
            page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
          )
      } else {
        for (const id of ['spare-0', 'spare-1'])
          await activate(
            page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
          )
        await expect(play).toBeDisabled()
        await expect(play).toHaveText(copy.riichiPledge.restriction)
        await activate(page.locator('[data-game-action="redraw"]'))
        await expect
          .poll(async () => (await saved()).state.redrawsRemaining)
          .toBe(before.state.redrawsRemaining - 1)
        await expect(play).toBeEnabled()
        const ready = await saved()
        await activate(play)
        await expect(play).toContainText(copy.gameplay.confirmHand)
        const staged = await saved()
        expect(staged.state.score).toBe(ready.state.score)
        expect(staged.state.riichiStatus).toBe('active')
        expect(staged.state.handsRemaining).toBe(ready.state.handsRemaining)
      }
      await activate(play)
      await expect
        .poll(async () => (await saved()).state.score)
        .toBe(replay[mode])
      await expect(trigger).toHaveAttribute('data-riichi-status', 'spent')
      const after = await saved()
      expect(after.state.gold).toBe(before.state.gold - 1)
      expect(after.state.handsRemaining).toBe(before.state.handsRemaining - 1)
      await page.reload()
      expect(await saved()).toEqual(after)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
  }
