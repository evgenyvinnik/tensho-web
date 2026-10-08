import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

const replayPath = process.env.ECHO_REPLAY_PATH
for (const language of ['en', 'es'])
  test(`Echo portrait, fractional reward, Treasure settlement and restore (${language})`, async ({
    page,
    isMobile,
    baseURL,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const replay = replayPath ? readFileSync(replayPath, 'utf8') : null
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
    if (!replay) {
      await page.evaluate(async () => {
        const loaded = (path: string) => {
          const url = performance
            .getEntriesByType('resource')
            .map((e) => e.name)
            .reverse()
            .find((url) => new URL(url).pathname === path)
          if (!url) throw Error(`App did not load ${path}`)
          return url
        }
        const { gameOrchestrator: game } = await import(
          loaded('/src/game/GameOrchestrator.ts')
        )
        const { Tile, TileSuit } = await import(loaded('/src/core/Tile.ts'))
        const { EditionType, EnhancementType, SealType } = await import(
          loaded('/src/core/TileModifier.ts')
        )
        const { ALL_DECREES, DecreeSystem } = await import(
          loaded('/src/systems/DecreeSystem.ts')
        )
        const { initializeClassicPersistence } = await import(
          loaded('/src/game/classicPersistenceApp.ts')
        )
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        const state = game.getState()
        state.decreeSystem = new DecreeSystem()
        for (const id of ['decree-echo-stone', 'decree-treasure-hunter'])
          state.decreeSystem.acquireDecree(
            ALL_DECREES.find((d: { id: string }) => d.id === id)
          )
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        state.seasonSystem.forceSetSeason('Winter', true)
        state.mandateEffectSystem.deactivateMandate()
        state.faceDownTileIds.clear()
        state.selectedTileIds.clear()
        state.handTiles = [4, 5, 6].map(
          (rank) => new Tile(TileSuit.Souzu, rank, `echo-${rank}`)
        )
        state.handTiles[0] = state.handTiles[0]
          .withEnhancement(EnhancementType.Bonus)
          .withEdition(EditionType.Polychrome)
          .withSeal(SealType.Gold)
        state.handTiles.push(
          ...[
            TileSuit.Manzu,
            TileSuit.Pinzu,
            TileSuit.Souzu,
            TileSuit.Wind,
            TileSuit.Dragon,
          ].map((suit, i) => new Tile(suit, 1, `held-${i}`))
        )
        state.wall = Array.from(
          { length: 70 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `tail-${i}`)
        )
        state.drawIndex = 0
        state.summerReserve = []
        state.bambooSummerProtection = false
        state.targetScore = 173
        state.roundManager.getCurrentRound().scoreTarget = 173
        state.wallTemplate = state.wallTemplate.filter(
          (t: { isBonus: boolean }) => !t.isBonus
        )
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
      })
      await info.attach('echo-fixture', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      await page.reload()
    }
    const before = await saved()
    await activate(page.locator('[data-decree-instance]').first())
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText(
      copy.decrees.items['decree-echo-stone'].description
    )
    const portrait = dialog.locator('img[src$="echo-stone.webp"]')
    expect(
      await portrait.evaluate(async (img: HTMLImageElement) => {
        await img.decode()
        return img.naturalWidth
      })
    ).toBe(512)
    await page.screenshot({ path: info.outputPath('echo-portrait.png') })
    await activate(page.locator('[data-tutorial="yaku-display"]'))
    await expect(dialog).toHaveCount(0)
    await activate(page.locator('[data-decree-instance]').nth(1))
    await expect(dialog).toContainText(
      copy.decrees.items['decree-treasure-hunter'].description
    )
    await activate(page.locator('[data-tutorial="yaku-display"]'))
    await activate(page.getByTestId('flora-details-trigger'))
    await expect(dialog).toContainText(copy.flora.details.frostbite)
    await expect(dialog).not.toContainText(copy.flora.details.partial)
    await dialog
      .getByText(copy.flora.details.frostbite, { exact: true })
      .scrollIntoViewIfNeeded()
    expect(
      await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    await page.screenshot({ path: info.outputPath('frostbite-rule.png') })
    await activate(
      dialog.getByRole('button', { name: copy.common.close, exact: true })
    )
    expect(await saved()).toEqual(before)
    for (const id of ['echo-4', 'echo-5', 'echo-6'])
      await activate(
        page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
      )
    await expect(page.getByTestId('score-preview-total')).toHaveText('+173')
    await page.screenshot({ path: info.outputPath('fractional-forecast.png') })
    await activate(page.locator('[data-game-action="play"]'))
    await expect.poll(async () => (await saved()).state.phase).toBe('shop')
    await expect(page).toHaveURL(/\/shop\/?$/)
    const paid = await saved()
    expect(paid.state.score - before.state.score).toBe(173)
    expect(paid.state.lastRoundSummary.decreeGold).toBe(2.5)
    expect(
      paid.state.gold -
        before.state.gold -
        paid.state.lastRoundSummary.netGoldChange
    ).toBe(4)
    expect(paid.state.handTiles.map((t: { id: string }) => t.id)).toEqual([
      'held-0',
      'held-1',
      'held-2',
      'held-3',
      'held-4',
    ])
    await page.reload()
    expect(await saved()).toEqual(paid)
    expect(errors).toEqual([])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    ).toBe(true)
  })
