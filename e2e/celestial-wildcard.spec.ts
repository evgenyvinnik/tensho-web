import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import {
  clearReveals,
  closeOmenReveal,
  expectTeaHouse,
  handScoreTotal,
  selectCompleteHand,
} from './helpers/table'

for (const language of ['en', 'es'])
  for (const shape of ['ordinary', 'pairs', 'orphans', 'tactical'])
    test(`wildcard ${shape} picks then pays consistently (${language})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      // Three complete hands the Wildcard finishes, and a small play it reads
      // as a Quad.
      const complete = shape !== 'tactical'
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
          editionPath = '/src/core/TileModifier.ts',
          decreePath = '/src/systems/DecreeSystem.ts',
          orbPath = '/src/systems/CelestialOrbSystem.ts',
          savePath = '/src/game/classicPersistenceApp.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { Tile, TileSuit, FlowerType } = await import(tilePath)
        const { EnhancementType } = await import(editionPath)
        const { CELESTIAL_WILDCARD } = await import(decreePath)
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
            : shape === 'pairs'
              ? [
                  ['Manzu', [1, 1, 4, 4, 7, 7]],
                  ['Pinzu', [2, 2, 5, 5]],
                  ['Souzu', [8, 8]],
                  ['Wind', [1]],
                  ['Dragon', [1]],
                ]
              : shape === 'orphans'
                ? [
                    ['Manzu', [1, 9, 5]],
                    ['Pinzu', [1, 9]],
                    ['Souzu', [1, 9]],
                    ['Wind', [1, 2, 3, 4]],
                    ['Dragon', [1, 2, 2]],
                  ]
                : [
                    ['Pinzu', [5, 5, 5]],
                    ['Souzu', [9]],
                  ]
        state.handTiles = groups.flatMap(([suit, ranks]) =>
          ranks.map((rank, i) => new Tile(TileSuit[suit], rank, `${suit}-${i}`))
        )
        // The stand-in keeps its tile's Edition.
        if (shape === 'tactical')
          state.handTiles[3] = state.handTiles[3].withEnhancement(
            EnhancementType.Mult
          )
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
        // A complete hand scores only the tile families of the hand it
        // declares, with the Wildcard's stand-in in place of its own face.
        const families: Record<string, { family: string; scored: string[] }> = {
          // The Manzu 5 stands in for a circle, so the hand is one suit: it
          // shows no tile family and a Mixed Suits Orb leaves it unpaid.
          ordinary: { family: 'MixedSuits', scored: [] },
          // The East stands in for the White Dragon's pair: no Wind shows.
          pairs: { family: 'Dragons', scored: ['Dragons', 'MixedSuits'] },
          orphans: {
            family: 'Winds',
            scored: ['Winds', 'Dragons', 'MixedSuits'],
          },
          // The 9 of Bamboo stands in for a fourth 5 of Circles: the small
          // play scores as a Quad, its only family.
          tactical: { family: 'Quads', scored: ['Quads'] },
        }
        const { family, scored } = families[shape]
        const base = game.previewScore(ids).finalScore
        const orb = CelestialOrbSystem.createCelestialOrbInstance(
          getCelestialOrbByYaku(family)
        )
        // This journey tests the effect of an already-earned Orb, not its gate.
        game.setConsumableUnlockResolver(() => true)
        if (
          !game.addCelestialOrb(orb) ||
          !game.processAction({ type: 'useOrb', orbId: orb.instanceId }).success
        )
          throw new Error('Orb use failed')
        const score = game.previewScore(ids).finalScore
        if (scored.includes(family) ? score <= base : score !== base)
          throw new Error('Orb forecast does not follow the scored families')
        game.restoreRun(game.captureRun())
        if (!(await service.saveNewRun(raw)))
          throw new Error('Fixture save failed')
        return { score, scored }
      }, shape)
      // startNewRun queues its starting Decrees for a reveal over the table.
      await clearReveals(page)
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
      // Every rack tile goes to the felt: the Wildcard completes the hand,
      // or turns the small play's odd tile into a fourth of a kind.
      if (complete) await selectCompleteHand(page, isMobile)
      else
        for (const tile of before.state.handTiles)
          await activate(
            page.locator(
              `[data-play-zone="hand"] [data-play-tile="${tile.id}"]`
            )
          )
      await expect(
        page.locator('[data-play-zone="felt"] [data-play-tile]')
      ).toHaveCount(before.state.handTiles.length)
      const staged = await saved()
      expect(staged.state.score).toBe(before.state.score)
      expect(staged.state.handsRemaining).toBe(before.state.handsRemaining)
      // The hand score reads the picked tiles at the engine's value.
      const handScore = page.locator('[data-hand-score]')
      await expect(handScore.locator('[data-hand-score-pattern]')).toHaveText(
        complete ? copy.patterns.mahjong.name : copy.patterns.quad.name
      )
      await expect(handScoreTotal(page, 'preview')).toHaveAttribute(
        'title',
        new Intl.NumberFormat(language, { maximumFractionDigits: 3 }).format(
          expected.score
        )
      )
      expect(
        await handScore.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      expect(await saved()).toEqual(staged)
      await handScore.screenshot({
        path: testInfo.outputPath('interpretation.png'),
      })
      await page.screenshot({ path: testInfo.outputPath('staged.png') })
      await activate(play)
      if (complete) {
        // Mahjong clears the round at once, far below its target.
        await expectTeaHouse(page)
        await closeOmenReveal(page)
      }
      await expect
        .poll(async () => (await saved()).state.score)
        .toBe(before.state.score + expected.score)
      const after = await saved()
      expect(after.state.phase).toBe(complete ? 'shop' : 'gameplay')
      if (complete)
        expect(after.state.lastRoundSummary).toMatchObject({
          clearedByCompleteHand: true,
          score: expected.score,
          target: 1e9,
        })
      else await expect(page).toHaveURL(/\/play$/)
      expect(after.state.handsRemaining).toBe(before.state.handsRemaining - 1)
      // The stand-in is only a reading: the river keeps the physical tiles.
      const ids = before.state.handTiles.map((t: { id: string }) => t.id)
      expect(
        after.state.discards.filter((t: { id: string }) => ids.includes(t.id))
      ).toEqual(before.state.handTiles)
      expect(after.state.wallTemplate).toEqual(before.state.wallTemplate)
      expect(
        after.state.celestialOrbSystem.yakuTriggerCounts.filter(
          ([, count]: [string, number]) => count > 0
        )
      ).toEqual(expected.scored.map((family: string) => [family, 1]))
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
