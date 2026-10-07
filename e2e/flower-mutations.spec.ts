import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

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
        state.discardsRemaining = 4
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
      await testInfo.attach('mutations-fixture', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      await page.reload()
    }
    const before = await saved()
    expect(before.state.flowerSystem.unlockedMutations).toEqual([])
    expect(before.state.flowerSystem.rebloomUnlocked).toBe(true)
    for (let i = 0; i < 4; i++) {
      const old = await saved()
      const discard = old.state.handTiles.find(
        (t: { id: string }) => !t.id.startsWith('complete-')
      )
      // Discard preserves wall order; redraw intentionally reshuffles returns.
      const tile = page.locator(
        `[data-play-zone="hand"] [data-play-tile="${discard.id}"]`
      )
      const zone = page.locator('[data-play-zone="discard"]')
      await tile.scrollIntoViewIfNeeded()
      await expect(zone).toBeInViewport()
      if (isMobile) {
        const touch = await page.context().newCDPSession(page)
        const a = (await tile.boundingBox())!,
          b = (await zone.boundingBox())!
        const from = { x: a.x + a.width / 2, y: a.y + a.height / 2 }
        const to = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ ...from, id: 1 }],
        })
        for (let step = 1; step <= 8; step++)
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [
              {
                x: from.x + ((to.x - from.x) * step) / 8,
                y: from.y + ((to.y - from.y) * step) / 8,
                id: 1,
              },
            ],
          })
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [],
        })
        await touch.detach()
      } else await tile.dragTo(zone)
      await expect
        .poll(
          async () =>
            (await saved()).state.flowerSystem.unlockedMutations.length
        )
        .toBe(i + 1)
      const after = await saved()
      expect(after.state.discardsRemaining).toBe(
        old.state.discardsRemaining - 1
      )
      expect(after.state.redrawsRemaining).toBe(old.state.redrawsRemaining)
      expect(after.state.handsRemaining).toBe(old.state.handsRemaining)
      expect(after.state.handTiles).toHaveLength(14)
      expect(
        after.state.flowerSystem.flowers.map((f: { id: string }) => f.id)
      ).toEqual(
        before.state.flowerSystem.flowers.map((f: { id: string }) => f.id)
      )
    }
    const awakened = await saved()
    const flora = page.getByTestId('flora-details-trigger')
    await activate(flora)
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('[data-flora-awakened]')).toHaveCount(4)
    await expect(
      dialog.locator('[data-testid="flora-rebloom-guide"]')
    ).toHaveText(copy.flora.mutations.ready)
    for (const type of ['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo']) {
      const rule = dialog.locator(`[data-flora-mutation="${type}"]`)
      await rule.scrollIntoViewIfNeeded()
      expect(
        await rule.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
      ).toBe(true)
      expect(
        await dialog
          .locator(`[data-flora-flower="${type}"] img`)
          .evaluate(async (img: HTMLImageElement) => {
            await img.decode()
            return img.naturalWidth
          })
      ).toBe(512)
    }
    await page.screenshot({
      path: testInfo.outputPath('awakened-inspector.png'),
    })
    expect(await saved()).toEqual(awakened)
    await activate(
      dialog.getByRole('button', { name: copy.common.close, exact: true })
    )
    await page.reload()
    expect(await saved()).toEqual(awakened)
    for (const prefix of ['complete-', 'tactical-']) {
      const old = await saved()
      const ids = old.state.handTiles
        .filter((t: { id: string }) => t.id.startsWith(prefix))
        .map((t: { id: string }) => t.id)
      expect(ids).toHaveLength(prefix === 'complete-' ? 13 : 5)
      await stage(ids)
      const details = page.locator('[data-hand-interpretation]')
      await activate(details.locator('summary'))
      await expect(
        details.locator('[data-overlapping-sequences]')
      ).toBeVisible()
      await expect(details.locator('[data-shared-tile="true"]')).toHaveCount(2)
      expect(
        await details.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`${prefix}explanation.png`),
      })
      const forecast = Number(
        (await page.locator('[data-game-action-score]').textContent())!.replace(
          /\D/g,
          ''
        )
      )
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
      await page.reload()
      expect(await saved()).toEqual(after)
    }
    await activate(page.locator('[data-game-action="skip"]'))
    await expect.poll(async () => (await saved()).state.currentRound).toBe(2)
    const next = await saved()
    expect(next.state.flowerSystem).toEqual(awakened.state.flowerSystem)
    await page.reload()
    expect(await saved()).toEqual(next)
    expect(errors).toEqual([])
  })
