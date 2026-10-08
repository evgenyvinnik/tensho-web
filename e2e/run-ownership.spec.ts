import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Deliberate saved-run fixtures, not evidence of organic balance or rarity.
for (const operation of ['copy', 'destroy'] as const)
  for (const language of ['en', 'es'])
    test(`permanent tile ${operation}, capacity and save (${language})`, async ({
      page,
      isMobile,
      baseURL,
    }, info) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      const directory = process.env.OWNERSHIP_REPLAY_DIR
      const replay = directory
        ? readFileSync(`${directory}/${operation}.json`, 'utf8')
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
        await page.evaluate(async (operation) => {
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
          const { EditionType } = await import(
            loaded('/src/core/TileModifier.ts')
          )
          const { ALL_DECREES, DecreeSystem } = await import(
            loaded('/src/systems/DecreeSystem.ts')
          )
          const { FATE_SEALS, FateSealSystem } = await import(
            loaded('/src/systems/FateSealSystem.ts')
          )
          const { initializeClassicPersistence } = await import(
            loaded('/src/game/classicPersistenceApp.ts')
          )
          const service = initializeClassicPersistence(),
            raw = service.getSnapshot().disk.raw
          game.startNewRun(7)
          const state = game.getState()
          state.decreeSystem = new DecreeSystem()
          state.flowerSystem.clear()
          state.seasonSystem.clear()
          state.mandateEffectSystem.deactivateMandate()
          state.faceDownTileIds.clear()
          state.selectedTileIds.clear()
          state.fateSeals = []
          state.handTiles = [
            new Tile(TileSuit.Souzu, 4, 'play-a'),
            new Tile(TileSuit.Souzu, 4, 'play-b'),
            new Tile(TileSuit.Manzu, 5, 'copy-target'),
            new Tile(TileSuit.Pinzu, 3, 'negative-source').withEdition(
              EditionType.Negative
            ),
          ]
          state.wall = Array.from(
            { length: 40 },
            (_, i) => new Tile(TileSuit.Manzu, (i % 9) + 1, `tail-${i}`)
          )
          state.wallTemplate = [...state.handTiles, ...state.wall]
          state.decreeSystem.syncWallSlots(state.wallTemplate)
          const decree = ALL_DECREES.find(
            (d: { id: string }) => d.id === 'decree-wide-grip'
          )
          for (let i = 0; i < 6; i++) state.decreeSystem.acquireDecree(decree)
          const sealId =
            operation === 'copy' ? 'seal_of_transmutation' : 'seal_of_release'
          game.addFateSeal(
            FateSealSystem.createFateSealInstance(FATE_SEALS[sealId])
          )
          state.drawIndex = 0
          state.summerReserve = []
          state.bambooSummerProtection = false
          state.targetScore = 1
          state.roundManager.getCurrentRound().scoreTarget = 1
          if (!(await service.saveNewRun(raw)))
            throw Error('Fixture save failed')
        }, operation)
        await info.attach(`ownership-${operation}-fixture`, {
          body: await page.evaluate(
            () => localStorage.getItem('tensho-classic-run-v1')!
          ),
          contentType: 'application/json',
        })
        await page.reload()
      }
      const before = await saved()
      await activate(
        page.getByRole('button', {
          name: new RegExp(`^${copy.consumableUse.fateSeals} \\(`),
        })
      )
      const dialog = page.locator('[data-consumable-dialog]')
      await activate(dialog.locator('[data-consumable-item]'))
      await expect(dialog.locator('[data-seal-lifetime]')).toHaveText(
        copy.runOwnership.fateSeal
      )
      if (operation === 'copy') {
        const art = dialog.locator('img[src$="seal-transmutation.webp"]')
        expect(
          await art.evaluate(async (img: HTMLImageElement) => {
            await img.decode()
            return img.naturalWidth
          })
        ).toBe(512)
        await activate(dialog.locator('[data-consumable-target="copy-target"]'))
      }
      await activate(
        dialog.locator('[data-consumable-target="negative-source"]')
      )
      expect(await saved()).toEqual(before)
      expect(
        await dialog.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      await page.screenshot({ path: info.outputPath('seal-targets.png') })
      await activate(dialog.locator('[data-consumable-confirm]'))
      await expect(dialog).toHaveCount(0)
      const changed = await saved()
      expect(changed.state.fateSeals).toHaveLength(0)
      expect(
        changed.state.wallTemplate.filter(
          (t: { modifiers: { edition: string } }) =>
            t.modifiers.edition === 'negative'
        )
      ).toHaveLength(operation === 'copy' ? 2 : 0)
      expect(changed.state.decreeSystem.ownedDecrees).toHaveLength(6)
      expect(changed.state.decreeSystem.maxSlots).toBe(5)
      if (operation === 'destroy')
        await expect(page.locator('[data-decree-capacity-notice]')).toHaveText(
          copy.runOwnership.overCapacity
        )
      await page.reload()
      expect(await saved()).toEqual(changed)
      for (const id of ['play-a', 'play-b'])
        await activate(
          page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
        )
      await activate(page.locator('[data-game-action="play"]'))
      await expect(page).toHaveURL(/\/shop\/?$/)
      await saved()
      await expect(page.locator('[data-build-slots]')).toHaveText(
        copy.shop.build.slots
          .replace('{{used}}', '6')
          .replace('{{max}}', operation === 'copy' ? '7' : '5')
      )
      if (operation === 'destroy')
        await expect(page.locator('[data-decree-capacity-notice]')).toHaveText(
          copy.runOwnership.overCapacity
        )
      await page.locator('[data-shop-build]').scrollIntoViewIfNeeded()
      await page.screenshot({ path: info.outputPath('shop-capacity.png') })
      const shop = await saved()
      await page.reload()
      expect(await saved()).toEqual(shop)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
