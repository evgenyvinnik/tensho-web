import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { clearReveals, handScoreTotal, settleReveals } from './helpers/table'

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
      // startNewRun queues its starting Decrees for a reveal over the table.
      await clearReveals(page)
      const before = await saved()
      await testInfo.attach('before-ledger', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      // On the table every upgrade is its own rail token; the full ledger
      // lives in the Tea House.
      const upgradeTokens = page.locator(
        '[data-collectible-rail] [data-yaku-upgrade]'
      )
      const pairToken = page.locator(
        '[data-collectible-rail] [data-yaku-upgrade="SevenPairs"]'
      )
      await expect(upgradeTokens).toHaveCount(0)
      expect(await saved()).toEqual(before)
      const orbId = before.state.celestialOrbs[0].instanceId
      await activate(page.locator(`[data-consumable-instance="${orbId}"]`))
      await activate(page.locator(`[data-use-item="${orbId}"]`))
      await expect(
        page.locator(`[data-consumable-instance="${orbId}"]`)
      ).toHaveCount(0)
      const used = await saved()
      expect(used.state.celestialOrbs).toHaveLength(0)
      expect(
        used.state.celestialOrbSystem.orbLevels.find(
          (x: [string, number]) => x[0] === 'SevenPairs'
        )[1]
      ).toBe(2)
      await expect(upgradeTokens).toHaveCount(kind === 'all' ? 12 : 1)
      await expect(pairToken).toHaveAccessibleName(
        copy.upgradeFamilies.tokenLabel
          .replace('{{family}}', copy.upgradeFamilies.SevenPairs.name)
          .replace('{{level}}', (2).toLocaleString(language))
      )
      const pairPanel = page
        .getByRole('dialog')
        .filter({ hasText: copy.upgradeFamilies.SevenPairs.covers })
      await activate(pairToken)
      await expect(pairPanel).toContainText(
        copy.yakuUpgrades.bonus
          .replace('{{chips}}', '35')
          .replace('{{mult}}', '3')
      )
      await expect(pairPanel).toContainText(
        copy.yakuUpgrades.triggers.replace('{{total}}', '0')
      )
      expect(
        await pairPanel.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
      ).toBe(true)
      await page.screenshot({ path: testInfo.outputPath('ledger-play.png') })
      await page.keyboard.press('Escape')
      await expect(pairPanel).toHaveCount(0)
      expect(await saved()).toEqual(used)
      // Pick the whole Seven Pairs hand onto the felt.
      for (const tile of used.state.handTiles)
        await activate(
          page.locator(`[data-play-zone="hand"] [data-play-tile="${tile.id}"]`)
        )
      await expect(
        page.locator('[data-play-zone="felt"] [data-play-tile]')
      ).toHaveCount(14)
      const forecast = await handScoreTotal(page, 'preview').getAttribute(
        'title'
      )
      const play = page.locator('[data-game-action="play"]')
      await activate(play)
      await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
      const shop = await saved()
      expect(
        new Intl.NumberFormat(language, { maximumFractionDigits: 20 }).format(
          shop.state.lastHandScore
        )
      ).toBe(forecast)
      // The Tea House lists every upgrade inline in the build panel: one
      // token per family with its level, no popup and no empty-state prose.
      await expect(page.getByTestId('yaku-upgrades-trigger')).toHaveCount(0)
      const row = page.locator('[data-shop-build] [data-yaku-upgrades]')
      await expect(row).toBeVisible()
      await expect(row).toHaveAccessibleName(copy.yakuUpgrades.title)
      const shopTokens = row.locator('[data-yaku-upgrade]')
      await expect(shopTokens).toHaveCount(kind === 'all' ? 12 : 1)
      const shopPair = row.locator('[data-yaku-upgrade="SevenPairs"]')
      await expect(shopPair).toHaveAccessibleName(
        copy.upgradeFamilies.tokenLabel
          .replace('{{family}}', copy.upgradeFamilies.SevenPairs.name)
          .replace('{{level}}', (2).toLocaleString(language))
      )
      await activate(shopPair)
      await expect(pairPanel).toContainText(
        copy.yakuUpgrades.bonus
          .replace('{{chips}}', '35')
          .replace('{{mult}}', '3')
      )
      await expect(pairPanel).toContainText(
        copy.yakuUpgrades.triggers.replace('{{total}}', '1')
      )
      expect(
        await pairPanel.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
      ).toBe(true)
      await page.screenshot({ path: testInfo.outputPath('ledger-shop.png') })
      await page.keyboard.press('Escape')
      await expect(pairPanel).toHaveCount(0)
      expect(await saved()).toEqual(shop)
      await page.reload()
      expect(await saved()).toEqual(shop)
      await expect(shopTokens).toHaveCount(kind === 'all' ? 12 : 1)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      await activate(
        page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      )
      await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
      // The new round can open on Flower and Season reveals.
      await settleReveals(page, 2_000)
      await saved()
      await activate(pairToken)
      await expect(pairPanel).toContainText(
        copy.yakuUpgrades.triggers.replace('{{total}}', '1')
      )
      await page.keyboard.press('Escape')
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
