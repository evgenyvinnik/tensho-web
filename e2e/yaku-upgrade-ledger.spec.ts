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
      // The table reserves its collectible space for Flowers, Seasons and
      // held items. Applied upgrades are inspected in the Tea House.
      const upgradeTokens = page.locator('[data-yaku-upgrade]')
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
      await expect(upgradeTokens).toHaveCount(0)
      const pairPanel = page
        .getByRole('dialog')
        .filter({ hasText: copy.upgradeFamilies.SevenPairs.covers })
      await page.screenshot({ path: testInfo.outputPath('ledger-play.png') })
      await page.reload()
      await settleReveals(page, 2_000)
      expect(await saved()).toEqual(used)
      await expect(upgradeTokens).toHaveCount(0)
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
      // The Tea House lists the upgrades inline in the build panel: one
      // token per family with its level counted from 0, no popup and no
      // empty-state prose. The nine families any run can find always show;
      // the secret Seven Pairs family joins them once upgraded.
      await expect(page.getByTestId('yaku-upgrades-trigger')).toHaveCount(0)
      const row = page.locator('[data-shop-build] [data-yaku-upgrades]')
      await expect(row).toBeVisible()
      await expect(row).toHaveAccessibleName(copy.yakuUpgrades.title)
      const families = kind === 'all' ? 12 : 10
      const shopTokens = row.locator('[data-yaku-upgrade]')
      await expect(shopTokens).toHaveCount(families)
      await expect(row.locator('[data-yaku-upgrade-level="0"]')).toHaveCount(
        kind === 'all' ? 0 : 9
      )
      const portraits = row.locator('[data-upgrade-art] img')
      await expect(portraits).toHaveCount(families)
      const imageSources = await portraits.evaluateAll(async (images) => {
        await Promise.all(
          images.map(async (image) => {
            const img = image as HTMLImageElement
            await img.decode()
            if (img.naturalWidth === 0) throw new Error('Missing upgrade art')
          })
        )
        return images.map((image) => image.getAttribute('src')!)
      })
      expect(new Set(imageSources).size).toBe(imageSources.length)
      for (const source of imageSources)
        expect(source).toMatch(/\/(?:generated\/yaku|upgrades)\/[^/]+\.webp$/)
      await expect(row.locator('[data-upgrade-art] svg')).toHaveCount(0)
      const shopPair = row.locator('[data-yaku-upgrade="SevenPairs"]')
      await expect(shopPair).toHaveAccessibleName(
        copy.upgradeFamilies.tokenLabel
          .replace('{{family}}', copy.upgradeFamilies.SevenPairs.name)
          .replace('{{level}}', (1).toLocaleString(language))
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
      await page.mouse.move(1, 1)
      await expect(page.locator('[data-cash-out-toasts]')).toHaveCount(0)
      await page.locator('[data-shop-build]').screenshot({
        path: testInfo.outputPath('build-upgrades.png'),
      })
      expect(await saved()).toEqual(shop)
      await page.reload()
      expect(await saved()).toEqual(shop)
      await expect(shopTokens).toHaveCount(families)
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
      const nextRound = await saved()
      expect(nextRound.state.celestialOrbSystem).toEqual(
        shop.state.celestialOrbSystem
      )
      await expect(upgradeTokens).toHaveCount(0)
      await page.reload()
      await settleReveals(page, 2_000)
      expect(await saved()).toEqual(nextRound)
      await expect(upgradeTokens).toHaveCount(0)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
