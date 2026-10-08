import { expect, test, type Locator } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'

test.use({ serviceWorkers: 'block' })
for (const language of ['en', 'es', 'ru'])
  test(`repetition streak, artwork, staged play and reload (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const replay = process.env.REPETITION_REPLAY_FILE
      ? JSON.parse(readFileSync(process.env.REPETITION_REPLAY_FILE, 'utf8'))
      : null
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
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
    let expected = replay?.expected
    if (!replay) {
      expected = await page.evaluate(async () => {
        const loaded = (path: string) => {
          const url = performance
            .getEntriesByType('resource')
            .map((e) => e.name)
            .find((url) => new URL(url).pathname === path)
          if (!url) throw Error(`Missing native module ${path}`)
          return url
        }
        const { gameOrchestrator: game } = await import(
          loaded('/src/game/GameOrchestrator.ts')
        )
        const { Tile, TileSuit } = await import(loaded('/src/core/Tile.ts'))
        const { ALL_DECREES } = await import(
          loaded('/src/systems/DecreeSystem.ts')
        )
        const { initializeClassicPersistence } = await import(
          loaded('/src/game/classicPersistenceApp.ts')
        )
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        for (const d of game.getState().decreeSystem.getOwnedDecrees())
          game.getState().decreeSystem.removeDecree(d.id)
        game.addDecree(
          ALL_DECREES.find(
            (d: { id: string }) => d.id === 'yaku_repetition_charter'
          )
        )
        const deal = () => {
          const state = game.getState()
          state.flowerSystem.clear()
          state.seasonSystem.clear()
          state.mandateEffectSystem.deactivateMandate()
          state.selectedTileIds.clear()
          state.faceDownTileIds.clear()
          state.handTiles = [
            ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
              (rank, i) => new Tile(TileSuit.Souzu, rank, `run-${i}`)
            ),
            ...[6, 6, 6].map(
              (rank, i) => new Tile(TileSuit.Manzu, rank, `triplet-${i}`)
            ),
            ...[5, 5].map(
              (rank, i) => new Tile(TileSuit.Pinzu, rank, `pair-${i}`)
            ),
          ]
          state.wall = Array.from(
            { length: 60 },
            (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
          )
          state.wallTemplate = [...state.handTiles, ...state.wall]
          state.drawIndex = 0
          state.summerReserve = []
          state.targetScore = 1
          state.roundManager.getCurrentRound().scoreTarget = 1
          return state.handTiles.map((t: { id: string }) => t.id)
        }
        // Controlled deals, but actual paid plays and round transitions earn the streak.
        for (let i = 0; i < 2; i++) {
          if (!game.processAction({ type: 'play', tileIds: deal() }).success)
            throw Error('Prior play failed')
          game.exitShop()
        }
        const ids = deal(),
          state = game.getState(),
          decree = state.decreeSystem.getOwnedDecrees()[0]
        decree.isDebuffed = true
        const neutral = game.previewScore(ids)
        decree.isDebuffed = false
        const expected = Math.floor(
          neutral.equation.points *
            neutral.equation.multiplier *
            Math.min(4, 1.2 ** 4)
        )
        if (game.previewScore(ids).finalScore !== expected)
          throw Error('Streak forecast does not match compounded formula')
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
        return expected
      })
      writeFileSync(
        info.outputPath('repetition-replay.json'),
        JSON.stringify({
          expected,
          savedRun: await page.evaluate(() =>
            localStorage.getItem('tensho-classic-run-v1')
          ),
        })
      )
      await page.reload()
    }
    const before = await saved()
    expect(before.state.previousRoundYakuStreaks.ittsu).toBe(2)
    const scroll = page
      .locator('[data-decree-instance]')
      .filter({ has: page.locator('img[src$="yaku-repetition.webp"]') })
    await expect(scroll).toBeVisible()
    await expect
      .poll(() =>
        scroll
          .locator('img')
          .first()
          .evaluate(
            (node: HTMLImageElement) => node.complete && node.naturalWidth > 0
          )
      )
      .toBe(true)
    await activate(scroll)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText(copy.yakuRepetition.description)
    await expect(dialog.locator('[data-yaku-streak="ittsu"]')).toContainText(
      copy.yaku.ittsu
    )
    const box = await dialog.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    await page.screenshot({ path: info.outputPath('repetition-inspector.png') })
    await page.keyboard.press('Escape')
    expect((await saved()).state.previousRoundYakuStreaks).toEqual(
      before.state.previousRoundYakuStreaks
    )
    await activate(page.locator('[data-game-action="play"]'))
    await expect(
      page.locator('[data-play-zone="staging"] [data-play-tile]')
    ).toHaveCount(14)
    expect((await saved()).state.score).toBe(0)
    await activate(page.locator('[data-game-action="play"]'))
    await expect.poll(async () => (await saved()).state.phase).toBe('shop')
    const paid = await saved()
    expect(paid.state.score).toBe(expected)
    expect(paid.state.previousRoundYakuStreaks.ittsu).toBe(3)
    await page.reload()
    expect((await saved()).state.previousRoundYakuStreaks).toEqual(
      paid.state.previousRoundYakuStreaks
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    expect(errors).toEqual([])
  })
