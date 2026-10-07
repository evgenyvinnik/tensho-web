import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

for (const language of ['en', 'es'])
  for (const shape of ['standard', 'pairs', 'orphans', 'wildcard', 'clemency'])
    test(`expanded rack ${shape} stages a declaration without its spares (${language})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
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
      const expected = await page.evaluate(async (shape) => {
        const gamePath = '/src/game/GameOrchestrator.ts',
          tilePath = '/src/core/Tile.ts',
          decreePath = '/src/systems/DecreeSystem.ts',
          charterPath = '/src/systems/TeaHouseSystem.ts',
          savePath = '/src/game/classicPersistenceApp.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { Tile, TileSuit, FlowerType } = await import(tilePath)
        const { ALL_DECREES } = await import(decreePath)
        const {
          TEA_HOUSE_BASE_CHARTERS: bases,
          TEA_HOUSE_UPGRADED_CHARTERS: upgrades,
        } = await import(charterPath)
        const { initializeClassicPersistence } = await import(savePath)
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        game.setCharterUnlockResolver(() => true)
        for (const id of ['brush_stroke', 'full_palette'])
          if (
            !game.addImperialCharter(
              [...bases, ...upgrades].find((c: { id: string }) => c.id === id)
            )
          )
            throw new Error('Charter fixture failed')
        const state = game.getState()
        for (const decree of state.decreeSystem.getOwnedDecrees())
          state.decreeSystem.removeDecree(decree.id)
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        for (const type of [FlowerType.Plum, FlowerType.Orchid])
          state.flowerSystem.addFlower(
            new Tile(TileSuit.Flower, type, `flower-${type}`)
          )
        if (shape === 'wildcard' || shape === 'clemency')
          if (
            !game.addDecree(
              ALL_DECREES.find(
                (d: { id: string }) =>
                  d.id ===
                  (shape === 'wildcard'
                    ? 'celestial_wildcard'
                    : 'shanten_clemency')
              )
            )
          )
            throw new Error('Decree fixture failed')
        const groups: [string, number[]][] =
          shape === 'orphans'
            ? [
                ['Manzu', [1, 9]],
                ['Pinzu', [1, 9]],
                ['Souzu', [1, 9]],
                ['Wind', [1, 2, 3, 4]],
                ['Dragon', [1, 2, 3, 3]],
              ]
            : shape === 'pairs' || shape === 'wildcard'
              ? [
                  ['Manzu', [1, 1, 4, 4, 7, 7]],
                  ['Pinzu', [2, 2, 5, 5]],
                  ['Souzu', [8, 8]],
                  ['Wind', [1, 1]],
                ]
              : [
                  ['Manzu', [1, 2, 3, 4, 5, 6]],
                  ['Pinzu', [2, 3, 4]],
                  ['Souzu', [6, 7, 8]],
                  ['Wind', [1, 1]],
                ]
        const tiles = groups.flatMap(([suit, ranks]) =>
          ranks.map((rank, i) => new Tile(TileSuit[suit], rank, `${suit}-${i}`))
        )
        if (shape === 'wildcard')
          tiles[0] = new Tile(TileSuit.Souzu, 3, tiles[0].id)
        if (shape === 'clemency') tiles.pop()
        const spareSuit = shape === 'orphans' ? TileSuit.Pinzu : TileSuit.Dragon
        tiles.unshift(
          new Tile(spareSuit, 2, 'spare-a'),
          new Tile(spareSuit, 1, 'spare-b')
        )
        if (shape === 'clemency')
          tiles.unshift(new Tile(TileSuit.Dragon, 3, 'spare-c'))
        state.handTiles = tiles
        state.wallTemplate = state.wallTemplate.filter(
          (t: { isBonus: boolean }) => !t.isBonus
        )
        state.wall = Array.from(
          { length: 80 },
          (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `wall-${i}`)
        )
        state.drawIndex = 0
        state.selectedTileIds.clear()
        state.faceDownTileIds.clear()
        state.targetScore = 1e9
        state.roundManager.getCurrentRound().scoreTarget = 1e9
        const ids = game.findCompleteHandSelection()
        if (!ids || ids.length !== (shape === 'clemency' ? 13 : 14))
          throw new Error('Missing subset')
        const score = game.previewScore(ids).finalScore
        if (!(await service.saveNewRun(raw)))
          throw new Error('Fixture save failed')
        return { ids, score }
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
      await expect(play).toContainText(copy.gameplay.stageHand)
      await expect(page.locator('[data-play-zone="hand"]')).toContainText(
        shape === 'wildcard' || shape === 'clemency'
          ? copy.handInterpretation.ready
          : copy.gameplay.completeHand
      )
      await expect(
        page.locator('[data-play-zone="hand"] [data-play-tile]')
      ).toHaveCount(16)
      await activate(play)
      await expect(play).toContainText(copy.gameplay.confirmHand)
      const staged = page.locator('[data-play-zone="staging"] [data-play-tile]')
      await expect(staged).toHaveCount(expected.ids.length)
      expect(
        await staged.evaluateAll((nodes) =>
          nodes.map((n) => n.getAttribute('data-play-tile'))
        )
      ).toEqual(expected.ids)
      await expect(
        page.locator('[data-play-zone="hand"] [data-play-tile]')
      ).toHaveCount(16 - expected.ids.length)
      const staging = await saved()
      expect(staging.state.score).toBe(before.state.score)
      expect(staging.state.handsRemaining).toBe(before.state.handsRemaining)
      await expect(page.getByTestId('score-preview-total')).toHaveAttribute(
        'aria-label',
        new Intl.NumberFormat(language, { maximumFractionDigits: 20 }).format(
          expected.score
        )
      )
      await page.screenshot({ path: testInfo.outputPath('staged.png') })
      const spare = page
        .locator('[data-play-zone="hand"] [data-play-tile]')
        .last()
      await spare.evaluate((node) => node.scrollIntoView({ block: 'center' }))
      await expect(spare).toBeInViewport()
      expect(
        await spare.evaluate((node) => {
          const bounds = node.getBoundingClientRect()
          return node.contains(
            document.elementFromPoint(
              bounds.left + bounds.width / 2,
              bounds.top + bounds.height / 2
            )
          )
        })
      ).toBe(true)
      await expect(play).toBeInViewport()
      await page.screenshot({ path: testInfo.outputPath('spares.png') })
      await activate(play)
      await expect
        .poll(async () => (await saved()).state.handsRemaining)
        .toBe(before.state.handsRemaining - 1)
      const played = await saved()
      expect(played.state.score).toBe(expected.score)
      expect(played.state.handTiles).toHaveLength(16)
      for (const spare of before.state.handTiles.filter(
        (t: { id: string }) => !expected.ids.includes(t.id)
      ))
        expect(played.state.handTiles).toContainEqual(spare)
      expect(
        played.state.discards.filter((t: { id: string }) =>
          expected.ids.includes(t.id)
        )
      ).toEqual(
        before.state.handTiles.filter((t: { id: string }) =>
          expected.ids.includes(t.id)
        )
      )
      await page.reload()
      expect(await saved()).toEqual(played)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
