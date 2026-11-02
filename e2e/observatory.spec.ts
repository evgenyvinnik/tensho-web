import { expect, test, type Locator } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'

test.use({ serviceWorkers: 'block' })
for (const language of ['en', 'es'])
  for (const mode of ['hold', 'use']) {
    test(`Observatory ${mode} matches forecast and reloads (${language})`, async ({
      page,
      isMobile,
      baseURL,
    }, info) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      let replay = process.env.OBSERVATORY_REPLAY_FILE
        ? JSON.parse(readFileSync(process.env.OBSERVATORY_REPLAY_FILE, 'utf8'))
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
          const { CelestialOrbSystem, CELESTIAL_ORBS } = await import(
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
          game.setCharterUnlockResolver(() => true)
          // Controlled earned Charter fixture; actual availability/payment has its own suite.
          state.charterSystem.purchaseCharter('star_chart')
          state.charterSystem.purchaseCharter('observatory')
          state.handTiles = [
            ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
              (r, i) => new Tile(TileSuit.Manzu, r, `straight-${i}`)
            ),
            ...[5, 5, 5].map(
              (r, i) => new Tile(TileSuit.Souzu, r, `triplet-${i}`)
            ),
            ...[6, 6].map((r, i) => new Tile(TileSuit.Pinzu, r, `pair-${i}`)),
          ]
          state.selectedTileIds.clear()
          state.faceDownTileIds.clear()
          state.wall = Array.from(
            { length: 60 },
            (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
          )
          state.drawIndex = 0
          state.deadWall = []
          state.summerReserve = []
          state.wallTemplate = [...state.handTiles, ...state.wall]
          state.targetScore = 1e9
          state.roundManager.getCurrentRound().scoreTarget = 1e9
          const ids = state.handTiles.map((t: { id: string }) => t.id)
          const base = game.previewScore(ids).finalScore
          // A complete hand scores only its tile families: numbered tiles from
          // three suits make it Mixed Suits (Neptune). Its sequences score no
          // pattern family, so the held Mercury (Two Sequences) does not match.
          for (const id of ['neptune_orb', 'mercury_orb']) {
            if (
              !game.addCelestialOrb(
                CelestialOrbSystem.createCelestialOrbInstance(
                  CELESTIAL_ORBS[id]
                )
              )
            )
              throw Error('Orb grant failed')
          }
          const hold = game.previewScore(ids).finalScore
          if (hold !== Math.floor(base * 1.5))
            throw Error('Wrong matching-Orb factor')
          const before = game.captureRun()
          if (
            !game.processAction({
              type: 'useOrb',
              orbId: game.getCelestialOrbs()[0].instanceId,
            }).success
          )
            throw Error('Fixture use failed')
          const use = game.previewScore(ids).finalScore
          game.restoreRun(before)
          if (!(await service.saveNewRun(raw)))
            throw Error('Fixture save failed')
          return { hold, use }
        })
        replay = {
          ...expected,
          savedRun: await page.evaluate(() =>
            localStorage.getItem('tensho-classic-run-v1')
          ),
        }
        writeFileSync(
          info.outputPath('observatory-replay.json'),
          JSON.stringify(replay)
        )
        await page.reload()
      }
      const before = await saved()
      // Each Orb waits on the item rail; its panel explains what using it
      // gives up and holds the Use step.
      const orbId = before.state.celestialOrbs[0].instanceId
      const trigger = page.locator(`[data-consumable-instance="${orbId}"]`)
      await activate(trigger)
      const explanation = page.locator('[data-observatory-holding]')
      const dialog = page.getByRole('dialog').filter({ has: explanation })
      await expect(explanation).toContainText(copy.observatory.description)
      const cost = dialog.locator('[data-observatory-cost]')
      await expect(cost).toHaveText(copy.observatory.holdingNote)
      // A long Orb rule can push it below the fold of a phone's sheet; it
      // must still be reachable there.
      await cost.scrollIntoViewIfNeeded()
      await expect(cost).toBeInViewport()
      const portrait = explanation.locator('img')
      await expect(portrait).toHaveAttribute(
        'src',
        /charters\/observatory.webp$/
      )
      await portrait.scrollIntoViewIfNeeded()
      await expect
        .poll(() =>
          portrait.evaluate(
            (el: HTMLImageElement) => el.complete && el.naturalWidth > 0
          )
        )
        .toBe(true)
      expect(
        await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
      ).toBe(true)
      await page.screenshot({ path: info.outputPath('observatory.png') })
      expect(await saved()).toEqual(before)
      // Closing the panel uses nothing and returns to its token.
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(trigger).toBeFocused()
      expect(await saved()).toEqual(before)
      if (mode === 'use') {
        await activate(trigger)
        await activate(page.locator(`[data-use-item="${orbId}"]`))
        await expect(trigger).toHaveCount(0)
        const used = await saved()
        expect(
          used.state.celestialOrbs.map((o: { id: string }) => o.id)
        ).toEqual(['mercury_orb'])
        expect(
          used.state.celestialOrbSystem.orbLevels.find(
            (x: [string, number]) => x[0] === 'MixedSuits'
          )[1]
        ).toBe(2)
        expect(used.state.handsRemaining).toBe(before.state.handsRemaining)
      }
      const prePlay = await saved()
      // Pick the whole complete hand onto the felt; picking spends nothing.
      const ids = prePlay.state.handTiles.map((tile: { id: string }) => tile.id)
      for (const id of ids)
        await activate(
          page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
        )
      await expect
        .poll(async () => (await saved()).state.selectedTileIds)
        .toEqual(ids)
      expect(await saved()).toEqual({
        ...prePlay,
        state: { ...prePlay.state, selectedTileIds: ids },
      })
      const play = page.locator('[data-game-action="play"]')
      await activate(play)
      await expect
        .poll(async () => (await saved()).state.score)
        .toBe(replay[mode])
      const after = await saved()
      expect(after.state.handsRemaining).toBe(before.state.handsRemaining - 1)
      expect(after.state.celestialOrbs).toHaveLength(mode === 'use' ? 1 : 2)
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
