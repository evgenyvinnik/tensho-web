import { expect, test, type Locator } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'

test.use({ serviceWorkers: 'block' })
for (const language of ['en', 'es'])
  test(`threshold qualification, portrait and payment (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const text = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const replay = process.env.THRESHOLD_REPLAY_FILE
      ? readFileSync(process.env.THRESHOLD_REPLAY_FILE, 'utf8')
      : null
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
    const activate = (locator: Locator) =>
      isMobile ? locator.tap() : locator.click()
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
            .find((url) => new URL(url).pathname === path)
          if (!url) throw Error(`Missing native module ${path}`)
          return url
        }
        const { gameOrchestrator: game } = await import(
          loaded('/src/game/GameOrchestrator.ts')
        )
        const { Tile, TileSuit } = await import(loaded('/src/core/Tile.ts'))
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
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        state.mandateEffectSystem.deactivateMandate()
        state.faceDownTileIds.clear()
        state.selectedTileIds.clear()
        state.decreeSystem = new DecreeSystem()
        for (const id of ['decree-supernova', 'decree-perfectionist'])
          state.decreeSystem.acquireDecree(
            ALL_DECREES.find((d: { id: string }) => d.id === id)
          )
        state.handTiles = [
          ...[2, 3, 4].map(
            (rank) => new Tile(TileSuit.Souzu, rank, `threshold-${rank}`)
          ),
          ...Array.from(
            { length: 11 },
            (_, i) => new Tile(TileSuit.Manzu, 1, `filler-${i}`)
          ),
        ]
        state.wall = Array.from(
          { length: 40 },
          (_, i) => new Tile(TileSuit.Pinzu, 1, `tail-${i}`)
        )
        state.wallTemplate = [...state.handTiles, ...state.wall]
        state.drawIndex = 0
        state.summerReserve = []
        state.targetScore = 22
        state.roundManager.getCurrentRound().scoreTarget = 22
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
      })
      writeFileSync(
        info.outputPath('fixture.json'),
        await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        )
      )
      await page.reload()
    }
    const before = await saved()
    for (const id of ['supernova', 'perfectionist']) {
      await activate(
        page
          .locator('[data-tutorial="decrees"]')
          .getByRole('button', {
            name: text.decrees.items[`decree-${id}`].name,
            exact: true,
          })
      )
      const dialog = page.getByRole('dialog')
      await expect(dialog).toContainText(text.scoreThresholds[id])
      if (id === 'supernova') {
        const img = dialog.locator('img[src$="supernova.webp"]')
        expect(
          await img.evaluate(async (img: HTMLImageElement) => {
            await img.decode()
            return img.naturalWidth
          })
        ).toBe(512)
        await dialog.screenshot({ path: info.outputPath('supernova.png') })
      }
      expect(
        await dialog.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      await page.keyboard.press('Escape')
    }
    for (const rank of [2, 3])
      await activate(
        page.locator(
          `[data-play-zone="hand"] [data-play-tile="threshold-${rank}"]`
        )
      )
    await expect(page.getByTestId('score-preview-total')).toHaveText('+4')
    await activate(
      page.locator('[data-play-zone="hand"] [data-play-tile="threshold-4"]')
    )
    await expect(page.getByTestId('score-preview-total')).toHaveText('+337')
    expect((await saved()).random).toEqual(before.random)
    await activate(page.locator('[data-game-action="play"]'))
    await expect(page).toHaveURL(/\/shop\/?$/)
    await expect.poll(async () => (await saved()).shop.opened).toBe(true)
    const shop = await saved()
    expect(shop.state.score).toBe(337)
    await page.reload()
    expect(await saved()).toEqual(shop)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    ).toBe(true)
    expect(errors).toEqual([])
  })
