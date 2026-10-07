import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

const replayPath = process.env.PLUM_REPLAY_PATH
for (const language of ['en', 'es'])
  test(`Plum recovers a real river tile after paid play, reloads exactly and expires with Autumn (${language})`, async ({
    page,
    isMobile,
    baseURL,
  }, testInfo) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const replay = replayPath ? readFileSync(replayPath, 'utf8') : null
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
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
        const { Tile, TileSuit, FlowerType } = await import(
          loaded('/src/core/Tile.ts')
        )
        const { initializeClassicPersistence } = await import(
          loaded('/src/game/classicPersistenceApp.ts')
        )
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        const state = game.getState()
        for (const decree of state.decreeSystem.getOwnedDecrees())
          state.decreeSystem.removeDecree(decree.id)
        state.flowerSystem.clear()
        state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Plum, 'plum'))
        state.seasonSystem.clear()
        state.seasonSystem.setAct(1)
        state.seasonSystem.forceSetSeason('Autumn')
        state.handTiles = Array.from(
          { length: 14 },
          (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `hand-${i}`)
        )
        state.wall = Array.from(
          { length: 50 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
        )
        state.deadWall = []
        state.drawIndex = 0
        state.discards = [
          new Tile(TileSuit.Souzu, 1, 'older'),
          new Tile(TileSuit.Souzu, 3, 'recovered'),
        ]
        state.wallTemplate = state.wallTemplate.filter(
          (t: { isBonus: boolean }) => !t.isBonus
        )
        state.summerReserve = []
        state.bambooSummerProtection = false
        state.faceDownTileIds.clear()
        state.selectedTileIds.clear()
        state.targetScore = 1e9
        state.roundManager.getCurrentRound().scoreTarget = 1e9
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
      })
      await testInfo.attach('plum-fixture', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      await page.reload()
    }
    const before = await saved()
    for (const id of ['hand-0', 'hand-1', 'hand-2'])
      await activate(
        page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
      )
    const forecast = Number(
      (await page.locator('[data-game-action-score]').textContent())!.replace(
        /\D/g,
        ''
      )
    )
    await activate(page.locator('[data-game-action="play"]'))
    await expect
      .poll(async () => (await saved()).state.handTiles.length)
      .toBe(15)
    const after = await saved()
    expect(after.state.handTiles.map((t: { id: string }) => t.id)).toContain(
      'recovered'
    )
    expect(after.state.discards.map((t: { id: string }) => t.id)).toEqual([
      'older',
      'hand-0',
      'hand-1',
      'hand-2',
    ])
    expect(after.state.score - before.state.score).toBe(forecast)
    expect(after.state.handsRemaining).toBe(before.state.handsRemaining - 1)
    expect(after.state.discardsRemaining).toBe(before.state.discardsRemaining)
    expect(after.state.redrawsRemaining).toBe(before.state.redrawsRemaining)
    const flora = page.getByTestId('flora-details-trigger')
    await activate(flora)
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('[data-plum-recovery]')).toHaveText(
      copy.flora.details.plumRecovery.replace('{{count}}', '1')
    )
    expect(
      await dialog
        .locator('img[src*="plum-bloom.webp"]')
        .evaluate(async (img: HTMLImageElement) => {
          await img.decode()
          return img.naturalWidth
        })
    ).toBe(512)
    await dialog.locator('[data-plum-recovery]').scrollIntoViewIfNeeded()
    expect(
      await dialog
        .locator('[data-plum-recovery]')
        .evaluate((p) => p.scrollWidth <= p.clientWidth + 1)
    ).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('plum-recovery.png') })
    expect(await saved()).toEqual(after)
    await activate(
      dialog.getByRole('button', { name: copy.common.close, exact: true })
    )
    await page.reload()
    expect(await saved()).toEqual(after)
    await activate(flora)
    await expect(page.locator('[data-plum-recovery]')).toHaveCount(0)
    await activate(
      page
        .getByRole('dialog')
        .getByRole('button', { name: copy.common.close, exact: true })
    )
    for (const id of ['hand-3', 'hand-4', 'hand-5'])
      await activate(
        page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
      )
    await activate(page.locator('[data-game-action="play"]'))
    await expect
      .poll(async () => (await saved()).state.handTiles.length)
      .toBe(14)
    await activate(page.locator('[data-game-action="skip"]'))
    await expect.poll(async () => (await saved()).state.currentRound).toBe(2)
    const next = await saved()
    expect(next.state.seasonSystem.seasonStack).toEqual([])
    expect(next.state.handTiles).toHaveLength(14)
    await page.reload()
    expect(await saved()).toEqual(next)
    expect(errors).toEqual([])
  })
