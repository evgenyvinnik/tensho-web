import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { settleReveals } from './helpers/table'

/** What each play pays with all four Flowers awakened. */
const PAYMENT: Record<string, number> = {
  'complete-': 10210,
  'tactical-': 415,
}

const replayPath = process.env.MUTATIONS_REPLAY_PATH
for (const language of ['en', 'es'])
  test(`real rebloom draws, illustrated rules, complete/tactical payment and round persistence (${language})`, async ({
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
    const stage = async (ids: string[]) => {
      for (const id of ids)
        await activate(
          page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
        )
    }
    await page.goto(`${baseURL!.replace(/\/$/, '')}/${language}/play`)
    await saved()
    if (!replay) {
      await page.evaluate(async (target) => {
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
        state.seasonSystem.clear()
        state.mandateEffectSystem.deactivateMandate()
        const types = [
          FlowerType.Plum,
          FlowerType.Orchid,
          FlowerType.Chrysanthemum,
          FlowerType.Bamboo,
        ]
        for (const type of types)
          state.flowerSystem.addFlower(Tile.createFlower(type, `owned-${type}`))
        state.handTiles = [
          ...[1, 2, 3, 4, 5].map(
            (rank, i) => new Tile(TileSuit.Manzu, rank, `complete-m-${i}`)
          ),
          ...[2, 3, 4].map(
            (rank, i) => new Tile(TileSuit.Pinzu, rank, `complete-p-${i}`)
          ),
          ...[6, 7, 8].map(
            (rank, i) => new Tile(TileSuit.Souzu, rank, `complete-s-${i}`)
          ),
          ...[1, 1].map(
            (rank, i) => new Tile(TileSuit.Wind, rank, `complete-w-${i}`)
          ),
          new Tile(TileSuit.Wind, 4, 'redraw-initial'),
        ]
        state.wall = [
          ...types.map((type) => Tile.createFlower(type, `duplicate-${type}`)),
          ...[1, 2, 3, 4, 5].map(
            (rank, i) => new Tile(TileSuit.Manzu, rank, `tactical-${i}`)
          ),
          ...Array.from(
            { length: 70 },
            (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `tail-${i}`)
          ),
        ]
        state.deadWall = Array.from(
          { length: 20 },
          (_, i) => new Tile(TileSuit.Wind, 4, `replacement-${i}`)
        )
        state.drawIndex = 0
        state.discards = []
        // Four free redraws (an item's reward) draw the four duplicates
        // without spending the round's Turns.
        state.redrawsRemaining = 4
        state.wallTemplate = state.wallTemplate.filter(
          (t: { isBonus: boolean }) => !t.isBonus
        )
        state.summerReserve = []
        state.bambooSummerProtection = false
        state.faceDownTileIds.clear()
        state.selectedTileIds.clear()
        // The complete hand leaves the round open; the tactical play clears it.
        state.targetScore = target
        state.roundManager.getCurrentRound().scoreTarget = target
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
      }, PAYMENT['complete-'] + 1)
      await testInfo.attach('mutations-fixture', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      await page.reload()
    }
    // Starting reveals of the fixture's fresh run may still be queued.
    await settleReveals(page)
    const before = await saved()
    expect(before.state.flowerSystem.unlockedMutations).toEqual([])
    expect(before.state.flowerSystem.rebloomUnlocked).toBe(true)
    for (let i = 0; i < 4; i++) {
      const old = await saved()
      const redrawn = old.state.handTiles.find(
        (t: { id: string }) => !t.id.startsWith('complete-')
      )
      // REDRAW refills from the live wall in order: the next duplicate Flower.
      await stage([redrawn.id])
      await activate(page.locator('[data-game-action="redraw"]'))
      await expect
        .poll(
          async () =>
            (await saved()).state.flowerSystem.unlockedMutations.length
        )
        .toBe(i + 1)
      await settleReveals(page)
      const after = await saved()
      expect(after.state.redrawsRemaining).toBe(old.state.redrawsRemaining - 1)
      expect(after.state.handsRemaining).toBe(old.state.handsRemaining)
      expect(after.state.handTiles).toHaveLength(14)
      expect(
        after.state.flowerSystem.flowers.map((f: { id: string }) => f.id)
      ).toEqual(
        before.state.flowerSystem.flowers.map((f: { id: string }) => f.id)
      )
    }
    const awakened = await saved()
    // Each Flower's own token pictures it and states its awakened rule.
    const dialog = page.getByRole('dialog')
    for (const type of ['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo']) {
      const token = page.locator(`[data-flora-flower="${type}"]`)
      expect(
        await token.locator('img').evaluate(async (img: HTMLImageElement) => {
          await img.decode()
          return img.naturalWidth
        })
      ).toBe(512)
      await activate(token)
      const rule = dialog.locator(`[data-flora-mutation="${type}"]`)
      await expect(rule).toContainText(copy.flora.mutations.awakened)
      expect(
        await rule.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
      ).toBe(true)
      if (type === 'Orchid')
        await page.screenshot({
          path: testInfo.outputPath('awakened-inspector.png'),
        })
      await activate(
        dialog.getByRole('button', { name: copy.common.close, exact: true })
      )
      await expect(dialog).toHaveCount(0)
    }
    expect(await saved()).toEqual(awakened)
    await page.reload()
    expect(await saved()).toEqual(awakened)
    for (const prefix of ['complete-', 'tactical-']) {
      const old = await saved()
      const ids = old.state.handTiles
        .filter((t: { id: string }) => t.id.startsWith(prefix))
        .map((t: { id: string }) => t.id)
      expect(ids).toHaveLength(prefix === 'complete-' ? 13 : 5)
      await stage(ids)
      await expect(page.locator('[data-game-action="play"]')).toBeEnabled()
      const forecast = Number(
        (await page.locator('[data-hand-score-total]').textContent())!.replace(
          /\D/g,
          ''
        )
      )
      expect(forecast).toBe(PAYMENT[prefix])
      await page.screenshot({
        path: testInfo.outputPath(`${prefix}forecast.png`),
      })
      await activate(page.locator('[data-game-action="play"]'))
      await expect
        .poll(async () => (await saved()).state.handsRemaining)
        .toBe(old.state.handsRemaining - 1)
      const after = await saved()
      expect(after.state.score - old.state.score).toBe(forecast)
      expect(
        after.state.discards.filter((t: { id: string }) => ids.includes(t.id))
      ).toHaveLength(ids.length)
      expect(after.state.flowerSystem).toEqual(awakened.state.flowerSystem)
      if (prefix === 'complete-') {
        expect(after.state.phase).toBe('gameplay')
        await page.reload()
        expect(await saved()).toEqual(after)
      } else {
        // The tactical play reaches the target: the round is won.
        await expect(page).toHaveURL(new RegExp(`/${language}/shop/?$`))
      }
    }
    await activate(
      page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
    )
    await expect(page).toHaveURL(new RegExp(`/${language}/play/?$`))
    await expect.poll(async () => (await saved()).state.currentRound).toBe(2)
    const next = await saved()
    expect(next.state.flowerSystem).toEqual(awakened.state.flowerSystem)
    await page.reload()
    expect(await saved()).toEqual(next)
    expect(errors).toEqual([])
  })
