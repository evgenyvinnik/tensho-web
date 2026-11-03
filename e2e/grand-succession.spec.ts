import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import {
  continueToNextRound,
  handScoreTotal,
  swiftClear,
} from './helpers/table'

const replayPath = process.env.SUCCESSION_REPLAY_PATH
for (const language of ['en', 'es'])
  test(`illustrated Grand Succession, ×4 Straight forecast, exact payment and persistence (${language})`, async ({
    page,
    isMobile,
    baseURL,
  }, testInfo) => {
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
        const { DecreeSystem, YAKUMAN_SUCCESSION } = await import(
          loaded('/src/systems/DecreeSystem.ts')
        )
        const { FlowerSystem } = await import(
          loaded('/src/systems/FlowerSystem.ts')
        )
        const { initializeClassicPersistence } = await import(
          loaded('/src/game/classicPersistenceApp.ts')
        )
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        const state = game.getState()
        state.decreeSystem = new DecreeSystem()
        state.decreeSystem.acquireDecree(YAKUMAN_SUCCESSION)
        state.flowerSystem = new FlowerSystem()
        state.flowerSystem.addFlower(Tile.createFlower(1, 'plum'))
        state.flowerSystem.addFlower(Tile.createFlower(2, 'orchid'))
        state.decreeSystem.addSlot()
        state.seasonSystem.clear()
        state.mandateEffectSystem.deactivateMandate()
        state.faceDownTileIds.clear()
        state.selectedTileIds.clear()
        // A Straight of four (3-4-5-6 of Characters) and spares.
        state.handTiles = [
          ...[3, 4, 5, 6].map(
            (rank, i) => new Tile(TileSuit.Manzu, rank, `succession-${i}`)
          ),
          ...[1, 9].map(
            (rank, i) => new Tile(TileSuit.Pinzu, rank, `spare-p-${i}`)
          ),
          ...[2, 8].map(
            (rank, i) => new Tile(TileSuit.Souzu, rank, `spare-s-${i}`)
          ),
        ]
        state.wall = Array.from(
          { length: 70 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `tail-${i}`)
        )
        state.drawIndex = 0
        state.summerReserve = []
        state.bambooSummerProtection = false
        state.targetScore = 1e9
        state.roundManager.getCurrentRound().scoreTarget = 1e9
        state.wallTemplate = state.wallTemplate.filter(
          (t: { isBonus: boolean }) => !t.isBonus
        )
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
      })
      await testInfo.attach('succession-fixture', {
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
      copy.decrees.items.yakuman_succession.description
    )
    const portrait = dialog.locator('img[src$="yakuman-succession.webp"]')
    expect(
      await portrait.evaluate(async (img: HTMLImageElement) => {
        await img.decode()
        return img.naturalWidth
      })
    ).toBe(512)
    expect(
      await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('succession-rule.png') })
    expect(await saved()).toEqual(before)
    // This is an outside-dismissed inventory popover, not a modal with Close.
    // On a phone it covers the hand score, so press the round title above it.
    // Dispatched: touch adjustment moves a real tap there onto the Stake button.
    await page.locator('[data-run-header-round]').dispatchEvent('pointerdown')
    await expect(dialog).toHaveCount(0)
    const straight = before.state.handTiles
      .slice(0, 4)
      .map((tile: { id: string }) => tile.id)
    for (const id of straight)
      await activate(
        page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
      )
    // The table's forecast is the engine's: with two Flowers held, the
    // Straight's Mult is ×4. A plain sequence is no Straight and gains
    // nothing.
    const engine = await page.evaluate(async (ids) => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      const decree = game.getState().decreeSystem.getOwnedDecrees()[0]
      const run = ids.slice(0, 3)
      decree.isDebuffed = true
      const neutral = game.previewScore(ids)
      const neutralRun = game.previewScore(run).finalScore
      decree.isDebuffed = false
      const preview = game.previewScore(ids)
      return {
        pattern: preview.pattern.id,
        score: preview.finalScore,
        quadrupled: Math.floor(
          neutral.equation.points * neutral.equation.multiplier * 4
        ),
        run: game.previewScore(run).finalScore,
        neutralRun,
      }
    }, straight)
    expect(engine.pattern).toBe('straight4')
    expect(engine.score).toBe(engine.quadrupled)
    expect(engine.neutralRun).toBeGreaterThan(0)
    expect(engine.run).toBe(engine.neutralRun)
    await expect(
      page.locator('[data-hand-score] [data-hand-score-pattern]')
    ).toHaveText(copy.patterns.straight4.name)
    expect(await saved()).toEqual({
      ...before,
      state: { ...before.state, selectedTileIds: straight },
    })
    const forecast = Number(
      (await handScoreTotal(page, 'preview').getAttribute('title'))!.replace(
        /\D/g,
        ''
      )
    )
    expect(forecast).toBeGreaterThan(0)
    expect(forecast).toBe(engine.score)
    await page.screenshot({
      path: testInfo.outputPath('succession-forecast.png'),
    })
    await activate(page.locator('[data-game-action="play"]'))
    await expect
      .poll(async () => (await saved()).state.handsRemaining)
      .toBe(before.state.handsRemaining - 1)
    const paid = await saved()
    expect(paid.state.score - before.state.score).toBe(forecast)
    expect(
      paid.state.discards.filter((t: { id: string }) =>
        t.id.startsWith('succession-')
      )
    ).toEqual(before.state.handTiles.slice(0, 4))
    await page.reload()
    expect(await saved()).toEqual(paid)
    // Skip is gone: clear the round to reach the next one.
    await swiftClear(page)
    await continueToNextRound(page)
    await expect.poll(async () => (await saved()).state.currentRound).toBe(2)
    expect((await saved()).state.flowerSystem).toEqual(paid.state.flowerSystem)
    expect((await saved()).state.decreeSystem.ownedDecrees[0].id).toBe(
      'yakuman_succession'
    )
    expect(errors).toEqual([])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    ).toBe(true)
  })
