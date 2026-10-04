import { expect, test, type Locator } from '@playwright/test'

for (const lang of ['en', 'es'])
  for (const purchases of [1, 2])
    test(`reroll replenishes ${purchases} purchased slots and resumes exactly (${lang})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(() =>
        localStorage.setItem('tensho_tutorial_completed', 'true')
      )
      const activate = (control: Locator) =>
        isMobile ? control.tap() : control.click()
      const saved = async () => {
        await expect(
          page.locator('[data-classic-save-status="saved"]')
        ).toBeVisible()
        return page.evaluate(
          () =>
            JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
        )
      }
      await page.goto(`/${lang}/play`)
      await saved()
      const copy = await page.evaluate(async (lang) => {
        const gamePath = '/src/game/GameOrchestrator.ts',
          savePath = '/src/game/classicPersistenceApp.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { initializeClassicPersistence } = await import(savePath)
        const locale = await (
          await fetch(`/src/i18n/locales/${lang}.json`)
        ).json()
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        const state = game.getState()
        // Controlled budget/target; actual play, shop entry and generated offers.
        Object.assign(state, { targetScore: 1, gold: 100 })
        state.roundManager.getCurrentRound().scoreTarget = 1
        if (
          !game.processAction({
            type: 'play',
            tileIds: state.handTiles
              .slice(0, 2)
              .map((t: { id: string }) => t.id),
          }).success
        )
          throw new Error('Fixture play failed')
        if (!game.shop.open()) throw new Error('Shop failed')
        if (!(await service.saveNewRun(raw)))
          throw new Error('Fixture save failed')
        return locale
      }, lang)
      await expect(page).toHaveURL(new RegExp(`/${lang}/shop$`))
      const initial = await saved()
      for (const offer of initial.shop.teaHouse.itemOfferings.slice(
        0,
        purchases
      )) {
        await activate(page.locator(`[data-shop-item="${offer.id}"] button`))
        await expect(
          page.locator(`[data-shop-item="${offer.id}"]`)
        ).toHaveCount(0)
      }
      await expect(page.locator('[data-shop-item]')).toHaveCount(2 - purchases)
      const before = await saved()
      await testInfo.attach('reroll-before', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      await page.reload()
      expect(await saved()).toEqual(before)
      const reroll = page.getByRole('button', {
        name: copy.shop.reroll,
        exact: true,
      })
      await activate(reroll)
      await expect(page.locator('[data-shop-item]')).toHaveCount(2)
      const after = await saved()
      expect(after.state).toEqual({
        ...before.state,
        gold: before.state.gold - 5,
      })
      expect(after.shop.packs).toEqual(before.shop.packs)
      expect(after.shop.teaHouse.packOfferings).toEqual(
        before.shop.teaHouse.packOfferings
      )
      expect(after.shop.teaHouse.charterOffering).toEqual(
        before.shop.teaHouse.charterOffering
      )
      expect(after.shop.purchases).toBe(before.shop.purchases)
      expect(after.shop.spent).toBe(
        before.shop.spent + 5
      )
      for (const offer of initial.shop.teaHouse.itemOfferings)
        await expect(
          page.locator(`[data-shop-item="${offer.id}"]`)
        ).toHaveCount(0)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await page.screenshot({ path: testInfo.outputPath('refilled-shop.png') })
      await page.reload()
      expect(await saved()).toEqual(after)
      // A second reroll must still refill both slots and charge the raised cost.
      await activate(reroll)
      await expect
        .poll(async () => (await saved()).shop.teaHouse.rerollsThisVisit)
        .toBe(2)
      await expect(page.locator('[data-shop-item]')).toHaveCount(2)
      const twice = await saved()
      expect(twice.state.gold).toBe(
        after.state.gold - 6
      )
      const buy = page.locator('[data-shop-item] button:enabled').first()
      await expect(buy).toBeVisible()
      await activate(buy)
      await expect(page.locator('[data-shop-item]')).toHaveCount(1)
      expect((await saved()).shop.purchases).toBe(purchases + 1)
      await activate(
        page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      )
      await expect(page.locator('[data-game-action="play"]')).toBeVisible()
      const round = await saved()
      for (const tile of round.state.handTiles.slice(0, 2))
        await activate(
          page.locator(`[data-play-zone="hand"] [data-play-tile="${tile.id}"]`)
        )
      await activate(page.locator('[data-game-action="play"]'))
      await expect
        .poll(async () => (await saved()).state.handsRemaining)
        .toBe(round.state.handsRemaining - 1)
      const played = await saved()
      await page.reload()
      expect(await saved()).toEqual(played)
      expect(errors).toEqual([])
    })
