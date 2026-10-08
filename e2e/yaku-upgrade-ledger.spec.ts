import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

for (const language of ['en', 'es', 'ru'])
  for (const kind of ['single', 'all'])
    test(`Yaku ledger ${kind} follows use, scoring, shop and reload (${language})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(() => {
        localStorage.setItem('tensho_tutorial_completed', 'true')
        localStorage.setItem('tensho_hints_disabled', 'true')
      })
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
      await page.goto(`/${language}/play`)
      await saved()
      await page.evaluate(async (kind) => {
        const gamePath = '/src/game/GameOrchestrator.ts',
          tilePath = '/src/core/Tile.ts',
          orbPath = '/src/systems/CelestialOrbSystem.ts',
          savePath = '/src/game/classicPersistenceApp.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { Tile, TileSuit } = await import(tilePath)
        const { CelestialOrbSystem, getCelestialOrbByYaku } = await import(
          orbPath
        )
        const { initializeClassicPersistence } = await import(savePath)
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        const state = game.getState()
        for (const decree of state.decreeSystem.getOwnedDecrees())
          state.decreeSystem.removeDecree(decree.id)
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        state.handTiles = [
          ['Manzu', [1, 1, 4, 4, 7, 7]],
          ['Pinzu', [2, 2, 5, 5]],
          ['Souzu', [8, 8]],
          ['Wind', [1, 1]],
        ].flatMap(([suit, ranks]) =>
          (ranks as number[]).map(
            (rank, i) =>
              new Tile(TileSuit[suit as string], rank, `${suit}-${i}`)
          )
        )
        state.selectedTileIds.clear()
        state.faceDownTileIds.clear()
        state.wallTemplate = state.wallTemplate.filter(
          (t: { isBonus: boolean }) => !t.isBonus
        )
        state.targetScore = 1
        state.roundManager.getCurrentRound().scoreTarget = 1
        const orb = CelestialOrbSystem.createCelestialOrbInstance(
          getCelestialOrbByYaku(kind === 'all' ? 'All' : 'SevenPairs')
        )
        // Controlled already-earned item fixture; earning is tested separately.
        game.setConsumableUnlockResolver(() => true)
        if (!game.addCelestialOrb(orb)) throw new Error('Orb grant failed')
        if (!(await service.saveNewRun(raw)))
          throw new Error('Fixture save failed')
      }, kind)
      const before = await saved()
      await testInfo.attach('before-ledger', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      const trigger = page.getByTestId('yaku-upgrades-trigger')
      const open = async () => {
        await activate(trigger)
        const dialog = page.getByRole('dialog', {
          name: copy.yakuUpgrades.title,
        })
        await expect(dialog).toBeVisible()
        return dialog
      }
      const close = async () => {
        if (isMobile)
          await activate(
            page
              .getByRole('dialog')
              .getByRole('button', { name: copy.common.close, exact: true })
          )
        else await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).toHaveCount(0)
        await expect(trigger).toBeFocused()
      }
      let dialog = await open()
      await expect(dialog).toContainText(copy.yakuUpgrades.empty)
      expect(await saved()).toEqual(before)
      await close()
      await activate(
        page.getByRole('button', {
          name: new RegExp(copy.consumableUse.celestialOrbs),
        })
      )
      const consumable = page.getByRole('dialog')
      await activate(consumable.locator('[data-consumable-item]'))
      await activate(consumable.locator('[data-consumable-confirm]'))
      await expect(consumable).toHaveCount(0)
      const used = await saved()
      expect(used.state.celestialOrbs).toHaveLength(0)
      expect(
        used.state.celestialOrbSystem.orbLevels.find(
          (x: [string, number]) => x[0] === 'SevenPairs'
        )[1]
      ).toBe(2)
      const play = page.locator('[data-game-action="play"]')
      await activate(play)
      await expect(play).toContainText(copy.gameplay.confirmHand)
      const staging = await saved()
      dialog = await open()
      await expect(dialog.locator('[data-yaku-upgrade]')).toHaveCount(
        kind === 'all' ? 12 : 1
      )
      // The first actual upgrade must fit without scrolling past explanatory prose.
      expect(
        await dialog
          .locator('[data-yaku-upgrade]')
          .first()
          .evaluate((node) => {
            const card = node.getBoundingClientRect()
            const viewport = node
              .closest('[data-popup-scroll]')!
              .getBoundingClientRect()
            return (
              card.top >= viewport.top && card.bottom <= viewport.bottom + 1
            )
          })
      ).toBe(true)
      const pair = dialog.locator('[data-yaku-upgrade="SevenPairs"]')
      await expect(pair).toContainText(copy.yaku.chiitoitsu)
      await expect(pair).toContainText(
        copy.yakuUpgrades.bonus
          .replace('{{chips}}', '35')
          .replace('{{mult}}', '3')
      )
      await expect(pair).toContainText(
        copy.yakuUpgrades.triggers.replace('{{total}}', '0')
      )
      await pair.scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath('ledger-play.png') })
      const ledger = page.getByTestId('yaku-upgrades-ledger')
      expect(
        await ledger.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
      ).toBe(true)
      expect(await saved()).toEqual(staging)
      const explanation = dialog.locator('details')
      await expect(explanation).not.toHaveAttribute('open')
      await activate(explanation.locator('summary'))
      await expect(explanation).toHaveAttribute('open')
      await expect(explanation).toContainText(copy.yakuUpgrades.note)
      expect(await saved()).toEqual(staging)
      await close()
      await expect(
        page.locator('[data-play-zone="staging"] [data-play-tile]')
      ).toHaveCount(14)
      const forecast = await page
        .getByTestId('score-preview-total')
        .getAttribute('aria-label')
      await activate(play)
      await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
      const shop = await saved()
      expect(
        new Intl.NumberFormat(language, { maximumFractionDigits: 20 }).format(
          shop.state.lastHandScore
        )
      ).toBe(forecast)
      dialog = await open()
      await expect(
        dialog.locator('[data-yaku-upgrade="SevenPairs"]')
      ).toContainText(copy.yakuUpgrades.triggers.replace('{{total}}', '1'))
      await page.screenshot({ path: testInfo.outputPath('ledger-shop.png') })
      await close()
      expect(await saved()).toEqual(shop)
      await page.reload()
      expect(await saved()).toEqual(shop)
      dialog = await open()
      await expect(dialog.locator('[data-yaku-upgrade]')).toHaveCount(
        kind === 'all' ? 12 : 1
      )
      await close()
      await activate(
        page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      )
      await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
      await saved()
      dialog = await open()
      await expect(
        dialog.locator('[data-yaku-upgrade="SevenPairs"]')
      ).toContainText(copy.yakuUpgrades.triggers.replace('{{total}}', '1'))
      await close()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
