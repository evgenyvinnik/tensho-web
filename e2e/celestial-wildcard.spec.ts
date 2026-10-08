import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

for (const language of ['en', 'es'])
  for (const shape of ['ordinary', 'pairs', 'orphans', 'clemency'])
    test(`wildcard ${shape} stages then pays consistently (${language})`, async ({
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
      // Controlled deal and flower eligibility, not evidence of organic acquisition.
      const expected = await page.evaluate(async (shape) => {
        const gamePath = '/src/game/GameOrchestrator.ts',
          tilePath = '/src/core/Tile.ts',
          decreePath = '/src/systems/DecreeSystem.ts',
          orbPath = '/src/systems/CelestialOrbSystem.ts',
          savePath = '/src/game/classicPersistenceApp.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { Tile, TileSuit, FlowerType } = await import(tilePath)
        const { CELESTIAL_WILDCARD, SHANTEN_CLEMENCY } = await import(
          decreePath
        )
        const { CelestialOrbSystem, getCelestialOrbByYaku } = await import(
          orbPath
        )
        const { initializeClassicPersistence } = await import(savePath)
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        const state = game.getState()
        state.decreeSystem
          .getOwnedDecrees()
          .forEach((d: { id: string }) => state.decreeSystem.removeDecree(d.id))
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        for (const type of [FlowerType.Plum, FlowerType.Orchid])
          state.flowerSystem.addFlower(
            new Tile(TileSuit.Flower, type, `flower-${type}`)
          )
        if (!game.addDecree(CELESTIAL_WILDCARD))
          throw new Error('Wildcard acquisition failed')
        const groups: [string, number[]][] =
          shape === 'ordinary'
            ? [
                ['Manzu', [5]],
                ['Pinzu', [2, 3, 4, 3, 4, 5, 6, 7, 8, 6, 6, 6, 5]],
              ]
            : shape === 'pairs' || shape === 'clemency'
              ? [
                  ['Manzu', [1, 1, 4, 4, 7, 7]],
                  ['Pinzu', [2, 2, 5, 5]],
                  ['Souzu', [8, 8]],
                  ['Wind', [1]],
                  ['Dragon', [1]],
                ]
              : [
                  ['Manzu', [1, 9, 5]],
                  ['Pinzu', [1, 9]],
                  ['Souzu', [1, 9]],
                  ['Wind', [1, 2, 3, 4]],
                  ['Dragon', [1, 2, 2]],
                ]
        state.handTiles = groups.flatMap(([suit, ranks]) =>
          ranks.map((rank, i) => new Tile(TileSuit[suit], rank, `${suit}-${i}`))
        )
        if (shape === 'clemency') {
          state.handTiles.pop()
          state.handTiles[0] = new Tile(
            TileSuit.Manzu,
            3,
            state.handTiles[0].id
          )
          if (!game.addDecree(SHANTEN_CLEMENCY))
            throw new Error('Clemency acquisition failed')
        }
        state.wall = Array.from(
          { length: 60 },
          (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `wall-${i}`)
        )
        state.drawIndex = 0
        state.selectedTileIds.clear()
        state.faceDownTileIds.clear()
        state.targetScore = 1e9
        state.roundManager.getCurrentRound().scoreTarget = 1e9
        const ids = state.handTiles.map((t: { id: string }) => t.id)
        const category =
          shape === 'ordinary'
            ? 'Chinitsu'
            : shape === 'pairs' || shape === 'clemency'
              ? 'SevenPairs'
              : 'Kokushi'
        const base = game.previewScore(ids).finalScore
        const orb = CelestialOrbSystem.createCelestialOrbInstance(
          getCelestialOrbByYaku(category)
        )
        // This journey tests the effect of an already-earned Orb, not its gate.
        game.setConsumableUnlockResolver(() => true)
        if (
          !game.addCelestialOrb(orb) ||
          !game.processAction({ type: 'useOrb', orbId: orb.instanceId }).success
        )
          throw new Error('Orb use failed')
        const score = game.previewScore(ids).finalScore
        if (score <= base) throw new Error('Orb did not boost forecast')
        game.restoreRun(game.captureRun())
        if (!(await service.saveNewRun(raw)))
          throw new Error('Fixture save failed')
        return { score, category }
      }, shape)
      const before = await saved()
      await testInfo.attach('before-play', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      await testInfo.attach('expected', {
        body: JSON.stringify(expected),
        contentType: 'application/json',
      })
      const play = page.locator('[data-game-action="play"]')
      await expect(page.locator('[data-play-zone="hand"]')).toContainText(
        copy.handInterpretation.ready
      )
      const art = page
        .locator('img[src$="/decrees/celestial-wildcard.webp"]')
        .first()
      await expect(art).toBeVisible()
      await expect
        .poll(() =>
          art.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
          )
        )
        .toBe(true)
      if (shape === 'clemency') {
        const clemencyArt = page
          .locator('img[src$="/decrees/shanten-clemency.webp"]')
          .first()
        await expect(clemencyArt).toBeVisible()
        await expect
          .poll(() =>
            clemencyArt.evaluate(
              (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
            )
          )
          .toBe(true)
      }
      await expect(play).toContainText(copy.gameplay.stageHand)
      await activate(play)
      await expect(play).toContainText(copy.gameplay.confirmHand)
      await expect(
        page.locator('[data-play-zone="staging"] [data-play-tile]')
      ).toHaveCount(before.state.handTiles.length)
      const staged = await saved()
      expect(staged.state.score).toBe(before.state.score)
      expect(staged.state.handsRemaining).toBe(before.state.handsRemaining)
      await expect(page.getByTestId('score-preview-total')).toHaveAttribute(
        'aria-label',
        new Intl.NumberFormat(language, { maximumFractionDigits: 20 }).format(
          expected.score
        )
      )
      const explanation = page.locator('[data-hand-interpretation]')
      await expect(explanation).not.toHaveAttribute('open', '')
      await expect(explanation.locator('summary')).toHaveText(
        copy.handInterpretation.why
      )
      if (isMobile) await explanation.locator('summary').tap()
      else {
        await explanation.locator('summary').focus()
        await page.keyboard.press('Enter')
      }
      await expect(explanation).toHaveAttribute('open', '')
      await expect(explanation.locator('[data-interpreted-tile]')).toHaveCount(
        1
      )
      await expect(explanation).toContainText(copy.handInterpretation.unchanged)
      if (shape === 'clemency')
        await expect(explanation).toContainText(copy.handInterpretation.penalty)
      expect(
        await explanation.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      expect(await saved()).toEqual(staged)
      await explanation.screenshot({
        path: testInfo.outputPath('interpretation.png'),
      })
      await activate(explanation.locator('summary'))
      await page.screenshot({ path: testInfo.outputPath('staged.png') })
      await activate(play)
      await expect
        .poll(async () => (await saved()).state.score)
        .toBe(before.state.score + expected.score)
      const after = await saved()
      expect(after.state.handsRemaining).toBe(before.state.handsRemaining - 1)
      const ids = before.state.handTiles.map((t: { id: string }) => t.id)
      expect(
        after.state.discards.filter((t: { id: string }) => ids.includes(t.id))
      ).toEqual(before.state.handTiles)
      expect(after.state.wallTemplate).toEqual(before.state.wallTemplate)
      expect(after.state.celestialOrbSystem.yakuTriggerCounts).toContainEqual([
        expected.category,
        1,
      ])
      await testInfo.attach('after-play', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      await page.reload()
      expect(await saved()).toEqual(after)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
