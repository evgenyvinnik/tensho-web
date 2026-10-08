import { expect, test, type Locator } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { RunRandom } from '../src/game/RunRandom'

test.use({ serviceWorkers: 'block' })
for (const language of ['en', 'es'])
  test(`Doppelganger target, payment and next-round recovery (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const text = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const replay = process.env.DOPPEL_REPLAY_FILE
      ? readFileSync(process.env.DOPPEL_REPLAY_FILE, 'utf8')
      : null
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
        // This seed's next copy draw changes Ancient Scroll to Wide Grip,
        // exercising a visible target change and 11-to-14 rack transition.
        game.startNewRun(2)
        const state = game.getState()
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        state.mandateEffectSystem.deactivateMandate()
        state.faceDownTileIds.clear()
        state.selectedTileIds.clear()
        state.decreeSystem = new DecreeSystem()
        for (const id of [
          'decree-ancient-scroll',
          'decree-doppelganger',
          'decree-wide-grip',
        ]) {
          state.decreeSystem.acquireDecree(
            ALL_DECREES.find((d: { id: string }) => d.id === id)
          )
        }
        state.handTiles = [
          ...[4, 5, 6].map(
            (rank) => new Tile(TileSuit.Souzu, rank, `doppel-${rank}`)
          ),
          ...Array.from(
            { length: 8 },
            (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `filler-${i}`)
          ),
        ]
        state.wall = Array.from(
          { length: 40 },
          (_, i) => new Tile(TileSuit.Manzu, (i % 9) + 1, `tail-${i}`)
        )
        state.wallTemplate = [...state.handTiles, ...state.wall]
        state.drawIndex = 0
        state.summerReserve = []
        state.targetScore = 1
        state.roundManager.getCurrentRound().scoreTarget = 1
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
    const decrees = before.state.decreeSystem.ownedDecrees
    expect(decrees[1].randomCopyTargetId).toBe(decrees[0].instanceId)
    const inspect = async (
      target: { id: string; instanceId: string },
      slot: number
    ) => {
      await activate(
        page
          .locator('[data-tutorial="decrees"]')
          .getByRole('button', {
            name: text.decrees.items['decree-doppelganger'].name,
            exact: true,
          })
      )
      const dialog = page.getByRole('dialog')
      await expect(dialog.locator('[data-random-copy-details]')).toContainText(
        text.randomCopy.target
          .replace('{{name}}', text.decrees.items[target.id].name)
          .replace('{{slot}}', String(slot))
      )
      const art = dialog.locator('img[src$="doppelganger.webp"]')
      expect(
        await art.evaluate(async (img: HTMLImageElement) => {
          await img.decode()
          return img.naturalWidth
        })
      ).toBe(512)
      expect(
        await dialog.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      await dialog.screenshot({ path: info.outputPath(`target-${slot}.png`) })
      await page.keyboard.press('Escape')
    }
    await inspect(decrees[0], 1)
    for (const rank of [4, 5, 6])
      await activate(
        page.locator(
          `[data-play-zone="hand"] [data-play-tile="doppel-${rank}"]`
        )
      )
    await expect(page.getByTestId('score-preview-total')).toHaveText('+345')
    expect((await saved()).random).toEqual(before.random)
    await activate(page.locator('[data-game-action="play"]'))
    await expect(page).toHaveURL(/\/shop\/?$/)
    const shop = await saved()
    expect(shop.state.score).toBe(345)
    expect(shop.state.decreeSystem.ownedDecrees[1].randomCopyTargetId).toBe(
      decrees[0].instanceId
    )
    await page.reload()
    expect(await saved()).toEqual(shop)
    const random = RunRandom.fromState(shop.random)
      const target = random.pick('decreeCopies', [decrees[0], decrees[2]])!
      expect(target.instanceId).not.toBe(decrees[0].instanceId)
    await activate(
      page.getByRole('button', { name: text.shop.ui.nextRound, exact: true })
    )
    await expect(page).toHaveURL(/\/play\/?$/)
    const next = await saved()
    expect(next.state.decreeSystem.ownedDecrees[1].randomCopyTargetId).toBe(
      target.instanceId
    )
    expect(next.state.handTiles).toHaveLength(
      target.id === 'decree-wide-grip' ? 14 : 11
    )
    await inspect(target, target.id === 'decree-wide-grip' ? 3 : 1)
    await page.reload()
    expect(await saved()).toEqual(next)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    ).toBe(true)
    expect(errors).toEqual([])
  })
