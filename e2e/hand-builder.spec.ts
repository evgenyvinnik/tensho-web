import { expect, test, type Locator } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'

test.use({ serviceWorkers: 'block' })
for (const language of ['en', 'es', 'ru']) {
  test(`hand workshop stages without spending, then exchanges and reloads (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const replay = process.env.HAND_BUILDER_REPLAY_FILE
      ? JSON.parse(readFileSync(process.env.HAND_BUILDER_REPLAY_FILE, 'utf8'))
      : null
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
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
    const snapshot = async () => {
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      return page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
      )
    }
    await page.goto(`${baseURL!.replace(/\/$/, '')}/${language}/play`)
    await snapshot()
    if (!replay) {
      await page.evaluate(async () => {
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
        state.targetScore = 1e9
        state.roundManager.getCurrentRound().scoreTarget = 1e9
        state.selectedTileIds.clear()
        state.faceDownTileIds.clear()
        state.handTiles = [
          ...[1, 2, 3].map((r, i) => new Tile(TileSuit.Manzu, r, `m-${i}`)),
          ...[4, 5, 6].map((r, i) => new Tile(TileSuit.Souzu, r, `s-${i}`)),
          ...[2, 3, 5, 6].map((r, i) => new Tile(TileSuit.Pinzu, r, `p-${i}`)),
          ...[1, 1].map((r, i) => new Tile(TileSuit.Wind, r, `w-${i}`)),
          ...[1, 3].map((r, i) => new Tile(TileSuit.Dragon, r, `spare-${i}`)),
        ]
        state.wall = Array.from(
          { length: 40 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
        )
        state.deadWall = []
        state.summerReserve = []
        state.drawIndex = 0
        state.redrawsRemaining = 2
        state.wallTemplate = [...state.handTiles, ...state.wall]
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
      })
      writeFileSync(
        info.outputPath('hand-builder-replay.json'),
        JSON.stringify({
          savedRun: await page.evaluate(() =>
            localStorage.getItem('tensho-classic-run-v1')
          ),
        })
      )
      await page.reload()
    }
    const before = await snapshot()
    const open = page.locator('[data-open-hand-builder]')
    await expect(open).toHaveAccessibleName(copy.handBuilder.title)
    const start = Date.now()
    await activate(open)
    const dialog = page.getByRole('dialog', { name: copy.handBuilder.title })
    await expect(dialog).toBeVisible()
    const latency = Date.now() - start
    await info.attach('open-latency-ms', {
      body: String(latency),
      contentType: 'text/plain',
    })
    await expect(dialog.locator('[data-plan-keep] img')).toHaveCount(12)
    await expect(dialog.locator('[data-plan-exchange] img')).toHaveCount(2)
    // Assert semantic image identity, not only that some PNG loaded.
    await expect(
      dialog
        .locator('[data-plan-exchange]')
        .getByRole('img', { name: copy.tiles.white, exact: true })
    ).toHaveAttribute('src', /Dragons \(3\)\.png$/)
    await expect(
      dialog
        .locator('[data-plan-exchange]')
        .getByRole('img', { name: copy.tiles.red, exact: true })
    ).toHaveAttribute('src', /Dragons \(1\)\.png$/)
    await expect(dialog.locator('[data-plan-cost]')).toHaveText(
      copy.handBuilder.cost
        .replace('{{remaining}}', '2')
        .replace('{{tiles}}', '2')
    )
    expect(await snapshot()).toEqual(before)
    const scroll = dialog.locator('[data-popup-scroll]')
    expect(
      await scroll.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    await page.screenshot({ path: info.outputPath('workshop-top.png') })
    await dialog.locator('summary').click()
    await expect(dialog).toContainText(copy.handBuilder.possibilities)
    const select = dialog.locator('[data-plan-stage]')
    await select.scrollIntoViewIfNeeded()
    await expect
      .poll(() =>
        dialog
          .locator('img')
          .evaluateAll((imgs) =>
            imgs.every(
              (img) =>
                (img as HTMLImageElement).complete &&
                (img as HTMLImageElement).naturalWidth > 0
            )
          )
      )
      .toBe(true)
    expect((await select.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await page.screenshot({ path: info.outputPath('workshop-exchange.png') })
    await activate(dialog.getByRole('button', { name: copy.common.close }))
    await expect(open).toBeFocused()
    expect(await snapshot()).toEqual(before)
    await activate(open)
    await activate(select)
    await expect(dialog).not.toBeVisible()
    const staged = page.locator('[data-play-zone="staging"] [data-play-tile]')
    await expect(staged).toHaveCount(2)
    expect(
      await staged.evaluateAll((tiles) =>
        tiles.map((t) => t.getAttribute('data-play-tile')).sort()
      )
    ).toEqual(['spare-0', 'spare-1'])
    expect(await snapshot()).toEqual(before)
    const redraw = page.locator('[data-game-action="redraw"]')
    await expect(redraw).toBeEnabled()
    await expect(redraw).toHaveText(copy.gameplay.redraw)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await activate(redraw)
    await expect(staged).toHaveCount(0)
    await expect
      .poll(async () => (await snapshot()).state.redrawsRemaining)
      .toBe(1)
    const after = await snapshot()
    expect(after.state.handTiles).toHaveLength(14)
    for (const key of ['score', 'gold', 'handsRemaining', 'discardsRemaining'])
      expect(after.state[key]).toEqual(before.state[key])
    await page.reload()
    expect(await snapshot()).toEqual(after)
    expect(errors).toEqual([])
  })
}
